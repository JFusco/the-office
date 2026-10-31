import { spawn } from 'node:child_process';
import { sanitize } from './security';
export function workerFailure(program: string, code: number | null, stdout: string, stderr: string) {
    for (const line of stdout.trim().split('\n').reverse()) {
        try {
            const event = JSON.parse(line);
            if (!['error', 'turn.failed'].includes(event.type) && !(program === 'claude' && ['result', 'assistant'].includes(event.type)))
                continue;
            let message = event.error?.message || event.message;
            if (program === 'claude' && event.type === 'result' && (event.is_error || String(event.subtype || '').startsWith('error')))
                message = event.errors?.join('; ') || event.result || event.subtype;
            if (program === 'claude' && event.type === 'assistant' && (event.isApiErrorMessage || event.error))
                message = event.message?.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ') || event.error;
            if (typeof message !== 'string')
                continue;
            try {
                const nested = JSON.parse(message);
                message = nested.error?.message || nested.message || message;
            }
            catch { }
            return sanitize(`${program} exited ${code}: ${message.slice(0, 4000)}`);
        }
        catch { }
    }
    return sanitize(`${program} exited ${code}: ${stderr.trim().slice(-2000) || 'No provider diagnostic was returned. Read the saved session before another attempt.'}`);
}
export class CommandFailure extends Error {
    constructor(message: string, public category: import('../src/shared').FailureCategory, public dispatched: boolean) { super(message); }
}
/** Negative PID probes the entire owned group, not just the leader. */
export function processGroupAlive(pid: number): boolean {
    try { process.kill(-pid, 0); return true; }
    catch (error) { return (error as NodeJS.ErrnoException).code !== 'ESRCH'; }
}
export async function command(program: string, args: string[], options: {
    cwd?: string;
    timeout?: number;
    readOnly?: boolean;
    input?: string;
    onSpawn?: (pid: number) => void;
    onLine?: (line: string) => void;
    signal?: AbortSignal;
    /** Opt-in: after a clean zero exit, stop leftover helpers instead of treating them as an uncertain write. */
    terminateStragglers?: boolean;
    onStragglersTerminated?: (processGroup: number) => void;
} = {}) {
    if (options.signal?.aborted)
        throw new CommandFailure('Worker cancelled before dispatch', 'cancelled', false);
    return new Promise<string>((resolve, reject) => {
        const child = spawn(program, args, { cwd: options.cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
        let out = '', err = '', line = '', failure: Error | undefined, killTimer: ReturnType<typeof setTimeout> | undefined;
        const alive = () => !!child.pid && processGroupAlive(child.pid);
        const terminate = () => {
            if (!child.pid || killTimer) return;
            try { process.kill(-child.pid, 'SIGTERM'); } catch { }
            killTimer = setTimeout(() => { try { process.kill(-child.pid!, 'SIGKILL'); } catch { } }, 3000);
        };
        const stop = (reason: Error) => {
            if (failure) return;
            failure = reason;
            terminate();
        };
        const timer = setTimeout(() => stop(new CommandFailure(options.readOnly ? `${program} read timed out; saved observations retained; safe to retry the read` : `${program} timed out; previous action outcome must be reconciled`, options.readOnly ? 'transient-read' : 'uncertain-effect', true)), options.timeout ?? 45000);
        const abort = () => stop(new CommandFailure('Worker paused; reconcile any external effects before resuming', 'cancelled', true));
        options.signal?.addEventListener('abort', abort, { once: true });
        child.stdout.on('data', (data: Buffer) => {
            const s = data.toString();
            out += s;
            line += s;
            const lines = line.split('\n');
            line = lines.pop()!;
            for (const l of lines)
                options.onLine?.(l);
            if (out.length > 16000000)
                stop(new CommandFailure('Worker output limit exceeded', 'uncertain-effect', true));
        });
        child.stderr.on('data', (data: Buffer) => { err = (err + data.toString()).slice(-12000); });
        child.on('error', stop);
        child.on('close', async (code) => {
            clearTimeout(timer);
            // CLI helpers can finish just after their leader. Allow a bounded normal
            // shutdown before classifying a surviving writer as an uncertain effect.
            const grace = performance.now() + 1000;
            while (alive() && !failure && performance.now() < grace)
                await new Promise(done => setTimeout(done, 25));
            let stragglersTerminated = false;
            if (alive()) {
                if (!failure && options.readOnly)
                    terminate(); // Readers may clean up helpers without changing their exit disposition.
                else if (!failure && code === 0 && options.terminateStragglers) {
                    terminate(); // The leader finished cleanly; leftover helpers are not an unverified write.
                    stragglersTerminated = true;
                }
                else if (!failure)
                    stop(new CommandFailure('Worker exited with surviving subprocesses; effects require reconciliation', 'uncertain-effect', true));
                else terminate();
            }
            // Keep cancellation active and retain capacity until every owned process
            // has stopped. A cancelled, timed-out or failed run never becomes success.
            while (alive())
                await new Promise(done => setTimeout(done, 50));
            clearTimeout(killTimer);
            options.signal?.removeEventListener('abort', abort);
            if (stragglersTerminated && !failure && child.pid)
                try { options.onStragglersTerminated?.(child.pid); } catch { }
            if (failure)
                reject(failure);
            else if (code === 0)
                resolve(out);
            else
                reject(new CommandFailure(workerFailure(program, code, out, err), options.readOnly ? 'other' : 'uncertain-effect', true));
        });
        child.stdin.on('error', () => { });
        try {
            if (child.pid)
                options.onSpawn?.(child.pid);
        }
        catch (error) {
            stop(error instanceof Error ? error : new Error(String(error)));
        }
        child.stdin.end(options.input || '');
    });
}
