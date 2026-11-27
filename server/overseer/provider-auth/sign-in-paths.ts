import { closeSync, constants, fstatSync, openSync, readSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assertOwnedDirectory, preflightRoot, runnerUid, type DirectoryFacts } from '../run-directories';
import { within, type ValidatedRunnerPaths } from '../runner-root';

/**
 * Where the runner keeps the provider sign-ins Joe enrolls, and the one way trusted runner code reads
 * them or a run's own provider files. Nothing here returns sign-in bytes in a reason or a log line:
 * a refusal names the file and the fault only. A process of the same user can still change a folder
 * above the root after it was checked; the root itself is trusted, as for the run folders.
 */

export interface SignInPaths {
    providers: string;
    claude: string;
    /** `claude setup-token`'s token, one line, 0600. */
    claudeToken: string;
    /** The `CODEX_HOME` Joe signs in under with `codex login --device-auth`. */
    codex: string;
    codexAuth: string;
    /** Profile stops and the active Codex hand-off (`profile-status.ts`). */
    status: string;
}

export const TOKEN_MAX_BYTES = 4 * 1024, AUTH_MAX_BYTES = 64 * 1024;

export function signInPaths(paths: ValidatedRunnerPaths): SignInPaths {
    const providers = resolve(paths.root, 'providers'), claude = resolve(providers, 'claude'), codex = resolve(providers, 'codex');
    if (paths.providers !== providers) throw new Error(`The providers folder ${paths.providers} is not under the runner root ${paths.root}`);
    return { providers, claude, claudeToken: resolve(claude, 'oauth-token'), codex, codexAuth: resolve(codex, 'auth.json'), status: resolve(paths.state, 'providers.json') };
}

export type ReadFault = 'missing' | 'not-contained' | 'linked' | 'not-regular' | 'wrong-owner' | 'wrong-mode' | 'oversized' | 'unreadable';
export type ContainedRead = { ok: true; bytes: Buffer } | { ok: false; fault: ReadFault; reason: string };

/** The file calls a read makes; tests substitute them to present a stale size or a failing read. */
export interface ReadFiles { open: typeof openSync; fstat: typeof fstatSync; read: typeof readSync; close: typeof closeSync }
const NODE_FILES: ReadFiles = { open: openSync, fstat: fstatSync, read: readSync, close: closeSync };

const errorCode = (error: unknown) => (error as NodeJS.ErrnoException | undefined)?.code;
const refuse = (fault: ReadFault, reason: string): ContainedRead => ({ ok: false, fault, reason });

/**
 * One regular file, opened without following a link or waiting on a pipe, owned by the runner, with
 * a single link, an exact mode when one is required, and at most `limit` bytes actually read.
 */
export function readOwnedFile(file: string, limit: number, options: { uid: number; mode?: number; files?: ReadFiles }): ContainedRead {
    const files = options.files ?? NODE_FILES;
    let fd: number;
    try { fd = files.open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); }
    catch (error) {
        const code = errorCode(error);
        if (code === 'ENOENT') return refuse('missing', `${file} does not exist`);
        if (code === 'ELOOP') return refuse('linked', `${file} is a link`);
        return refuse('unreadable', `${file} cannot be opened (${code ?? 'unknown error'})`);
    }
    try {
        const stat = files.fstat(fd);
        if (!stat.isFile()) return refuse('not-regular', `${file} is not a regular file`);
        if (stat.nlink !== 1) return refuse('linked', `${file} has ${stat.nlink} links; it must have exactly one`);
        if (stat.uid !== options.uid) return refuse('wrong-owner', `${file} is owned by uid ${stat.uid}, not the runner's ${options.uid}`);
        if (options.mode !== undefined && (stat.mode & 0o7777) !== options.mode)
            return refuse('wrong-mode', `${file} has mode ${(stat.mode & 0o7777).toString(8)}; it must be ${options.mode.toString(8)}`);
        if (stat.size > limit) return refuse('oversized', `${file} is larger than ${limit} bytes`);
        // The reported size can be stale: read to end of file or one byte past the limit.
        const buffer = Buffer.alloc(limit + 1);
        let length = 0;
        while (length < buffer.length) {
            const count = files.read(fd, buffer, length, buffer.length - length, null);
            if (count === 0) break;
            length += count;
        }
        if (length > limit) return refuse('oversized', `${file} is larger than ${limit} bytes`);
        return { ok: true, bytes: buffer.subarray(0, length) };
    } catch (error) {
        return refuse('unreadable', `${file} cannot be read (${errorCode(error) ?? 'unknown error'})`);
    } finally {
        files.close(fd);
    }
}

/**
 * A canonical sign-in: the runner root as supplied, `providers/` and the provider's folder each a
 * real runner-owned 0700 directory at its own physical path, and the file itself runner-owned, 0600,
 * single-link and bounded.
 */
export function readSignIn(paths: ValidatedRunnerPaths, provider: 'claude' | 'codex', facts: DirectoryFacts & { files?: ReadFiles } = {}): ContainedRead {
    const where = signInPaths(paths), uid = runnerUid(facts);
    const folder = provider === 'claude' ? where.claude : where.codex, file = provider === 'claude' ? where.claudeToken : where.codexAuth;
    try {
        preflightRoot(paths);
        for (const directory of [where.providers, folder]) assertOwnedDirectory(directory, uid, '0700');
    } catch (error) {
        return refuse(errorCode(error) === 'ENOENT' || /cannot read .*ENOENT/i.test(String((error as Error).message)) ? 'missing' : 'not-contained', String((error as Error).message).slice(0, 300));
    }
    return readOwnedFile(file, provider === 'claude' ? TOKEN_MAX_BYTES : AUTH_MAX_BYTES, { uid, mode: 0o600, files: facts.files });
}

/**
 * A file a run's provider left (its own `auth.json`, last message or rollout), read after its group
 * has exited: physically inside `root`, through no link, runner-owned, single-link and bounded. The
 * run's folders are revalidated by the caller first (`checkRunDirectories`).
 */
export function readRunFile(file: string, root: string, limit: number, facts: DirectoryFacts & { files?: ReadFiles } = {}): ContainedRead {
    const uid = runnerUid(facts);
    let parent: string;
    try { parent = realpathSync(dirname(file)); }
    catch (error) {
        return errorCode(error) === 'ENOENT' ? refuse('missing', `${dirname(file)} does not exist`) : refuse('unreadable', `${dirname(file)} cannot be resolved (${errorCode(error) ?? 'unknown error'})`);
    }
    if (parent !== dirname(file) || !within(parent, root)) return refuse('not-contained', `${file} is not physically inside ${root}`);
    return readOwnedFile(file, limit, { uid, files: facts.files });
}
