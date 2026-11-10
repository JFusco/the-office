import { constants, type Stats } from 'node:fs';
import { open } from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';
import type { SessionContext } from './session-scope';

export interface SessionContextParser {
    write(line: string): void;
    finish(): SessionContext;
}

// Preserve the old raw-buffer bound for each indivisible record; a large chat
// is folded a chunk at a time, never read into one larger transcript buffer.
const MAX_RECORD_BYTES = 64 * 1024 * 1024;
const CHUNK_BYTES = 64 * 1024;
const MAX_SCAN_MS = 5000;
export const sameContextFile = (a: Stats, b: Stats) =>
    a.ino === b.ino && a.dev === b.dev && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;

/** Complete strict JSONL coverage with bounded memory, work time and file identity. */
export async function sessionContextLines(file: string, snapshot: Stats, parser: SessionContextParser): Promise<SessionContext> {
    const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    const deadline = performance.now() + MAX_SCAN_MS;
    const checkTime = () => { if (performance.now() > deadline) throw new Error('Session context scan exceeded its read deadline'); };
    try {
        if (!sameContextFile(snapshot, await handle.stat())) throw new Error('Session context file changed before its read');
        const buffer = Buffer.alloc(CHUNK_BYTES), decoder = new StringDecoder('utf8');
        let position = 0, pieces: string[] = [], bytes = 0;
        const add = (text: string) => {
            bytes += Buffer.byteLength(text);
            if (bytes > MAX_RECORD_BYTES) throw new Error('Session context record coverage is unavailable');
            pieces.push(text);
        };
        const consume = (text: string) => {
            let start = 0, end: number;
            while ((end = text.indexOf('\n', start)) !== -1) {
                checkTime(); add(text.slice(start, end)); parser.write(pieces.join(''));
                pieces = []; bytes = 0; start = end + 1;
            }
            if (start < text.length) add(text.slice(start));
        };
        while (position < snapshot.size) {
            checkTime();
            const { bytesRead } = await handle.read(buffer, 0, Math.min(CHUNK_BYTES, snapshot.size - position), position);
            if (!bytesRead) throw new Error('Session context file ended before complete coverage');
            position += bytesRead; consume(decoder.write(buffer.subarray(0, bytesRead)));
        }
        consume(decoder.end()); checkTime();
        parser.write(pieces.join('')); // Includes the final blank line, just like raw.split('\n').
        if (!sameContextFile(snapshot, await handle.stat())) throw new Error('Session context file changed during its read');
        checkTime();
        return parser.finish();
    } finally { await handle.close(); }
}
