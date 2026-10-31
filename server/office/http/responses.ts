import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

export function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function fileResponse(path: string, headers: Record<string, string> = {}) {
    const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
    return new Response(new Uint8Array(readFileSync(path)), { headers: { 'Content-Type': types[extname(path)] || 'application/octet-stream', ...(extname(path) === '.html' ? { 'Cache-Control': 'no-store' } : {}), ...headers } });
}
