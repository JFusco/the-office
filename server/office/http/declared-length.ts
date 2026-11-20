/** True only when the request declares a whole-number Content-Length (bytes) from 1 up to the limit. */
export function declaredWithin(req: Request, limit: number): boolean {
    const header = req.headers.get('content-length');
    if (header === null || !/^\d+$/.test(header)) return false;
    const length = Number(header);
    return length > 0 && length <= limit;
}
