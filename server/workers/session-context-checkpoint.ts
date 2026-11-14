import { createHash, type Hash } from 'node:crypto';
import type { FileHandle } from 'node:fs/promises';
import type { SessionContextParser } from './session-context-lines';

/** Derived state only. No transcript bytes or live file handles survive a read. */
export interface SessionContextCheckpoint {
    bytes: number;
    digest: string;
    offset: number;
    parser: SessionContextParser;
}

export interface ContextFoldPrefix {
    parser: SessionContextParser;
    offset: number;
    hashedBytes: number;
    hash?: Hash;
}

/** A cached fold can continue only after every previously observed byte matches. */
export async function contextFoldPrefix(handle: FileHandle, size: number, parser: SessionContextParser,
    checkTime: () => void, previous?: SessionContextCheckpoint): Promise<ContextFoldPrefix> {
    const fresh = (): ContextFoldPrefix => ({ parser, offset: 0, hashedBytes: 0,
        ...(parser.fork ? { hash: createHash('sha256') } : {}) });
    if (!parser.fork || !previous?.parser.fork || previous.bytes > size || previous.offset > previous.bytes)
        return fresh();
    const hash = createHash('sha256'), buffer = Buffer.alloc(1024 * 1024);
    let position = 0;
    while (position < previous.bytes) {
        checkTime();
        const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, previous.bytes - position), position);
        if (!bytesRead) throw new Error('Session context file ended before complete coverage');
        hash.update(buffer.subarray(0, bytesRead)); position += bytesRead;
    }
    checkTime();
    if (hash.copy().digest('hex') !== previous.digest) return fresh();
    return { parser: previous.parser.fork(), offset: previous.offset, hashedBytes: previous.bytes, hash };
}
