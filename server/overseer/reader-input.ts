import { createHash } from 'node:crypto';
import { closeSync, constants, lstatSync, mkdirSync, openSync, readFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RunDirectories } from './run-directories';
import { VERDICT_SCHEMA, type FrozenInput } from './stages/triage';
import { snapshotPath } from './worker-sandbox-policy';

/**
 * The files a reader's run reads, created before its policy is prepared: the run's snapshot folder,
 * exclusively, holding the frozen evidence (checked against the input's identity) and the verdict
 * schema. The policy opens the snapshot for reading only. A Codex reader is pointed at these by fixed
 * paths relative to its working folder, `run.home`, so every allocation's arguments are identical.
 */

export const CODEX_SCHEMA_ARGUMENT = '../snapshot/provider-schema.json';
export const CODEX_LAST_MESSAGE_ARGUMENT = '../tmp/last-message.json';

export interface ReaderFiles { snapshot: string; evidence: string; schema: string; lastMessage: string }

const errorCode = (error: unknown) => (error as NodeJS.ErrnoException | undefined)?.code;

export function readerFiles(run: RunDirectories): ReaderFiles {
    const snapshot = snapshotPath(run);
    return { snapshot, evidence: resolve(snapshot, 'evidence.json'), schema: resolve(snapshot, 'provider-schema.json'), lastMessage: resolve(run.tmp, 'last-message.json') };
}

function writeExclusive(file: string, text: string): void {
    const fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try {
        const bytes = Buffer.from(text, 'utf8');
        let written = 0;
        while (written < bytes.length) written += writeSync(fd, bytes, written, bytes.length - written);
    } finally { closeSync(fd); }
}

/** Creates the snapshot and its two files, or throws; nothing here is reused from an earlier allocation. */
export function prepareReaderInput(run: RunDirectories, input: FrozenInput): ReaderFiles {
    const files = readerFiles(run);
    if (createHash('sha256').update(input.serialized).digest('hex') !== input.identity) throw new Error('The frozen evidence does not match its identity; refusing to stage it');
    try { mkdirSync(files.snapshot, { mode: 0o700 }); }
    catch (error) {
        if (errorCode(error) === 'EEXIST') throw new Error(`Run ${run.id} already has a snapshot; a reader's input is staged once`);
        throw error;
    }
    writeExclusive(files.evidence, input.serialized);
    // Read back what landed, so the reader is given exactly the identified evidence.
    if (createHash('sha256').update(readFileSync(files.evidence)).digest('hex') !== input.identity) throw new Error(`${files.evidence} does not hold the frozen evidence`);
    writeExclusive(files.schema, VERDICT_SCHEMA);
    try { lstatSync(files.lastMessage); }
    catch (error) {
        if (errorCode(error) === 'ENOENT') return files;
        throw new Error(`${files.lastMessage} cannot be checked (${errorCode(error) ?? 'unknown error'})`);
    }
    throw new Error(`${files.lastMessage} already exists; a reader's answer is never read from an earlier file`);
}
