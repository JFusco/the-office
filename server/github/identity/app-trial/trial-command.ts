import { readFileSync } from 'node:fs';

export interface AppTrialCommandIO {
    /** The Office's own address, such as `http://127.0.0.1:4318`. */
    base: string;
    request?: typeof fetch;
    log?: (line: string) => void;
    read?: (path: string) => string;
}

const USAGE = 'pnpm office app-trial check|run --project PROJECT --file PACKET.json';

/**
 * `pnpm office app-trial`: sends one approval packet to the running Office, which validates, binds and dispatches it
 * (`trial-comment.ts`). `check` creates and sends nothing. `run` sends the approved comment once, or reads back the
 * Effect already attempted; running it again with the same packet is the read-back. The project is never defaulted.
 * Returns the exit code: zero for a bound check or a qualified run.
 */
export async function appTrialCommand(args: string[], io: AppTrialCommandIO): Promise<number> {
    const log = io.log ?? console.log, request = io.request ?? fetch, read = io.read ?? (path => readFileSync(path, 'utf8'));
    const [mode] = args, value = (flag: string) => { const index = args.indexOf(flag), found = args[index + 1]; return index >= 0 && found && !found.startsWith('--') ? found : undefined; };
    const project = value('--project'), file = value('--file');
    if (mode !== 'check' && mode !== 'run' || !project || !file || args.length !== 5) { log(USAGE); return 1; }
    const text = JSON.stringify({ action: 'app-trial-comment', appTrial: { mode, packet: JSON.parse(read(file)) } });
    const response = await request(`${io.base}/api/commands?project=${encodeURIComponent(project)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(text)) }, body: text });
    const body = await response.json();
    log(JSON.stringify(body, null, 2));
    if (!response.ok) return 1;
    return mode === 'check' ? (body.status === 'none' || body.status === 'prepared' ? 0 : 1) : body.qualified === true ? 0 : 1;
}
