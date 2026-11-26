// Checked I/O on the files the launcher owns: owned-file checks, bounded no-follow reads, private
// folders and atomic publication. The rules of server/overseer/runner-root.ts and
// server/release/durable-file.ts, on Node built-ins.
import { randomUUID } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, renameSync, rmSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { errorCode } from './field-checks.mjs';

export function assertDirectoryOrAbsent(path) {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) {
        if (errorCode(error) === 'ENOENT') return;
        throw new Error(`Cannot read ${path} (${errorCode(error) ?? 'unknown error'}); refusing it`);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${path} must be a directory, not a link or a file`);
}

/** The nearest part of a path that exists, without following a final link. */
function nearestExisting(path) {
    for (let existing = path; ; existing = dirname(existing)) {
        try { lstatSync(existing); return existing; }
        catch (error) {
            if (errorCode(error) !== 'ENOENT') throw new Error(`Cannot read ${existing} (${errorCode(error) ?? 'unknown error'}); refusing it`);
            if (dirname(existing) === existing) throw new Error(`No part of ${path} exists`);
        }
    }
}

/**
 * Creates a private folder (0700) if needed; what exists must be a real directory at its own
 * physical path. Nothing is created until the part that exists is shown to be its own physical
 * path, so a linked parent never gets a folder made through it.
 */
export function ensurePrivateDirectory(path) {
    assertDirectoryOrAbsent(path);
    const existing = nearestExisting(path);
    if (realpathSync(existing) !== existing) throw new Error(`${path} resolves elsewhere (${existing} is ${realpathSync(existing)}); refusing it`);
    mkdirSync(path, { recursive: true, mode: 0o700 });
    assertDirectoryOrAbsent(path);
    if (realpathSync(path) !== path) throw new Error(`${path} resolves elsewhere (${realpathSync(path)}); refusing it`);
}

/** Whether an owned file exists: if it does it must be a regular, single-link file at its own physical path. */
export function checkOwnedFile(path) {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) {
        if (errorCode(error) === 'ENOENT') return false;
        throw new Error(`Cannot tell whether ${path} exists (${errorCode(error) ?? 'unknown error'}); refusing it`);
    }
    if (!stat.isFile() || stat.nlink !== 1) throw new Error(`${path} must be a regular file with a single link`);
    if (realpathSync(path) !== path) throw new Error(`${path} resolves elsewhere; refusing it`);
    return true;
}

/** Reads an owned file without following a link, at most `max` bytes. Null when it is absent. */
export function readOwned(path, max) {
    if (!checkOwnedFile(path)) return null;
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const stat = fstatSync(fd);
        if (!stat.isFile() || stat.nlink !== 1) throw new Error(`${path} must be a regular file with a single link`);
        if (stat.size > max) throw new Error(`${path} is larger than ${max} bytes`);
        const bytes = Buffer.alloc(max + 1);
        let total = 0, read;
        while (total <= max && (read = readSync(fd, bytes, total, max + 1 - total, total)) > 0) total += read;
        if (total > max) throw new Error(`${path} is larger than ${max} bytes`);
        return bytes.subarray(0, total).toString('utf8');
    } finally { closeSync(fd); }
}

/** The file operations publication uses; tests replace them to make a write or a sync fail. */
const NODE_IO = { openSync, writeSync, fsyncSync, closeSync, renameSync, linkSync };

/**
 * Writes a whole file beside its target, synced, then renames it in (or links it, when the target
 * must not exist yet), and syncs the folder: a reader sees the old file or the new one. Returns
 * false only when an exclusive target already exists. A failure before the rename leaves the
 * target as it was and removes the draft; a failure syncing the folder comes after the new file
 * is complete in place.
 */
export function publishDurable(path, content, mode = 0o600, { exclusive = false, io = NODE_IO } = {}) {
    const parent = dirname(path), bytes = Buffer.from(content);
    ensurePrivateDirectory(parent);
    checkOwnedFile(path);
    const draft = `${path}.${randomUUID()}.tmp`, fd = io.openSync(draft, 'wx', mode);
    let published;
    try {
        try {
            if (io.writeSync(fd, bytes) !== bytes.length) throw new Error(`${path} was cut short while writing`);
            io.fsyncSync(fd);
        } finally { io.closeSync(fd); }
        if (exclusive) {
            try { io.linkSync(draft, path); published = true; }
            catch (error) { if (errorCode(error) === 'EEXIST') published = false; else throw error; }
        } else { io.renameSync(draft, path); published = true; }
    } finally { rmSync(draft, { force: true }); }
    if (published) {
        const directory = io.openSync(parent, 'r');
        try { io.fsyncSync(directory); } finally { io.closeSync(directory); }
    }
    return published;
}
