import { closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, readSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { parseEntry, type PlaybookEntry } from './entry';

/**
 * Loads the whole playbook from the runner's trusted installation, or refuses it whole: an entry is
 * never applied alone. A process of the same user can still replace a folder or file after it was
 * checked; reading installed bytes relies on the trusted installation root, as the run folders do.
 */

export const PLAYBOOK_FOLDER = ['docs', 'overseer', 'playbook'] as const;
export const ENTRY_MAX_BYTES = 8 * 1024, ENTRY_MAX_COUNT = 64;
const ENTRY_NAME = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

export type PlaybookLoad =
    | { ok: true; entries: PlaybookEntry[] }
    | { ok: false; code: 'missing' | 'containment' | 'malformed' | 'unreadable'; reason: string };
/** The file calls the loader makes; tests substitute them to observe the flags, a stale size, a moved folder and every close. */
export interface PlaybookFiles { realpath: (path: string) => string; open: typeof openSync; fstat: typeof fstatSync; read: typeof readSync; close: typeof closeSync }
const NODE_FILES: PlaybookFiles = { realpath: path => realpathSync(path), open: openSync, fstat: fstatSync, read: readSync, close: closeSync };

const errorCode = (error: unknown) => (error as NodeJS.ErrnoException | undefined)?.code;
class Refusal extends Error {
    constructor(readonly code: Exclude<PlaybookLoad, { ok: true }>['code'], reason: string) { super(reason); }
}

/** The physical playbook folder under `installRoot`, each of its folders a real directory and not a link. */
function playbookFolder(files: PlaybookFiles, installRoot: string): string {
    let root: string;
    try { root = files.realpath(installRoot); }
    catch (error) { throw new Refusal('unreadable', `the installation root cannot be read (${errorCode(error) ?? 'unknown error'})`); }
    let folder = root;
    for (const [index, part] of PLAYBOOK_FOLDER.entries()) {
        folder = join(folder, part);
        const component = PLAYBOOK_FOLDER.slice(0, index + 1).join('/');
        let stat;
        try { stat = lstatSync(folder); }
        catch (error) {
            if (errorCode(error) === 'ENOENT') throw new Refusal('missing', `${component} does not exist`);
            throw new Refusal('unreadable', `${component} cannot be read (${errorCode(error) ?? 'unknown error'})`);
        }
        // `lstat` does not follow a link, so a link is not a directory here.
        if (!stat.isDirectory()) throw new Refusal('containment', `${component} must be a directory inside the installation, not a link or a file`);
    }
    if (files.realpath(folder) !== join(root, ...PLAYBOOK_FOLDER)) throw new Refusal('containment', 'the playbook folder is not inside the installation');
    return folder;
}

/** Opens one name without following a link or waiting on a pipe, and hands back its bytes (an entry) or nothing (the README). */
function readRegular(files: PlaybookFiles, folder: string, name: string, keep: boolean): Buffer | null {
    let fd: number;
    try { fd = files.open(join(folder, name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); }
    catch (error) {
        if (errorCode(error) === 'ELOOP') throw new Refusal('containment', `${name} is a link`);
        throw new Refusal('unreadable', `${name} cannot be opened (${errorCode(error) ?? 'unknown error'})`);
    }
    try {
        const stat = files.fstat(fd);
        if (!stat.isFile()) throw new Refusal('malformed', `${name} is not a regular file`);
        if (!keep) return null;
        if (stat.size > ENTRY_MAX_BYTES) throw new Refusal('malformed', `${name} is larger than ${ENTRY_MAX_BYTES} bytes`);
        // The reported size can be stale: read until end of file or one byte past the limit.
        const buffer = Buffer.alloc(ENTRY_MAX_BYTES + 1);
        let length = 0;
        while (length < buffer.length) {
            const count = files.read(fd, buffer, length, buffer.length - length, null);
            if (count === 0) break;
            length += count;
        }
        if (length > ENTRY_MAX_BYTES) throw new Refusal('malformed', `${name} is larger than ${ENTRY_MAX_BYTES} bytes`);
        return buffer.subarray(0, length);
    } catch (error) {
        if (error instanceof Refusal) throw error;
        throw new Refusal('unreadable', `${name} cannot be read (${errorCode(error) ?? 'unknown error'})`);
    } finally {
        files.close(fd);
    }
}

export function loadPlaybook(installRoot: string, files: PlaybookFiles = NODE_FILES): PlaybookLoad {
    try {
        const folder = playbookFolder(files, installRoot);
        const names = readdirSync(folder).sort();
        if (!names.includes('README.md')) throw new Refusal('malformed', 'README.md is missing');
        const entryNames = names.filter(name => name !== 'README.md');
        const misnamed = entryNames.find(name => !ENTRY_NAME.test(name));
        if (misnamed !== undefined) throw new Refusal('malformed', `${JSON.stringify(misnamed)} is not an entry name (<id>.md)`);
        if (entryNames.length > ENTRY_MAX_COUNT) throw new Refusal('malformed', `the playbook has more than ${ENTRY_MAX_COUNT} entries`);
        readRegular(files, folder, 'README.md', false);
        const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
        const entries = entryNames.map(name => {
            let text: string;
            try { text = decoder.decode(readRegular(files, folder, name, true)!); }
            catch (error) {
                if (error instanceof Refusal) throw error;
                throw new Refusal('malformed', `${name} is not UTF-8`);
            }
            const read = parseEntry(name, text);
            if (!read.ok) throw new Refusal('malformed', read.reason);
            return read.entry;
        });
        return { ok: true, entries: entries.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) };
    } catch (error) {
        if (error instanceof Refusal) return { ok: false, code: error.code, reason: error.message };
        return { ok: false, code: 'unreadable', reason: `the playbook cannot be read (${errorCode(error) ?? 'unknown error'})` };
    }
}
