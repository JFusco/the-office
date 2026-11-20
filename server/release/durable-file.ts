import { randomUUID } from 'node:crypto';
import { closeSync, fsyncSync, linkSync, mkdirSync, openSync, renameSync, rmSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

/** Writes a whole file beside its target and renames it in, synced, so a reader sees the old file or the new one. */
export function writeDurable(path: string, content: string | Uint8Array, mode = 0o600): void {
    publishDurable(path, content, mode, draft => { renameSync(draft, path); return true; });
}

/** Publishes a complete file only if its destination is absent. */
export function writeDurableIfAbsent(path: string, content: string, mode = 0o600): boolean {
    return publishDurable(path, content, mode, draft => {
        try { linkSync(draft, path); return true; }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
            throw error;
        }
    });
}

function publishDurable(path: string, content: string | Uint8Array, mode: number, publish: (draft: string) => boolean): boolean {
    const parent = dirname(path);
    mkdirSync(parent, { recursive: true, mode: 0o700 });
    const draft = `${path}.${randomUUID()}.tmp`, bytes = typeof content === 'string' ? Buffer.from(content) : content;
    const fd = openSync(draft, 'wx', mode);
    let published: boolean;
    try {
        try {
            if (writeSync(fd, bytes) !== bytes.length) throw new Error(`${path} was cut short while writing`);
            fsyncSync(fd);
        } finally { closeSync(fd); }
        published = publish(draft);
    } finally { rmSync(draft, { force: true }); }
    if (published) {
        const directory = openSync(parent, 'r');
        try { fsyncSync(directory); } finally { closeSync(directory); }
    }
    return published;
}
