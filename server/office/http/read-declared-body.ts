import { declaredWithin } from './declared-length';

export type DeclaredBody = { ok: true; text: string } | { ok: false; status: 400 | 411 | 413; error: string };

/**
 * A request body that is exactly as long as its declared Content-Length, at most `limit` bytes.
 * The stream is cut off as soon as it passes the declared length, so an understated length never
 * makes the reader take more than the limit; a body shorter or longer than declared is refused
 * before anything parses it.
 */
export async function readDeclaredBody(req: Request, limit: number): Promise<DeclaredBody> {
    if (!declaredWithin(req, limit)) return req.headers.get('content-length') === null
        ? { ok: false, status: 411, error: `A Content-Length of 1 to ${limit} bytes is required` }
        : { ok: false, status: 413, error: `The body must declare 1 to ${limit} bytes` };
    const declared = Number(req.headers.get('content-length'));
    const reader = req.body?.getReader();
    if (!reader) return { ok: false, status: 400, error: 'The body is empty' };
    const chunks: Uint8Array[] = [];
    let received = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (received > declared) {
                await reader.cancel().catch(() => {});
                return { ok: false, status: 400, error: 'The body is longer than its declared Content-Length' };
            }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    if (received !== declared) return { ok: false, status: 400, error: 'The body is shorter than its declared Content-Length' };
    try { return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)) }; }
    catch { return { ok: false, status: 400, error: 'The body is not UTF-8' }; }
}
