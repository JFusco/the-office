import { probeProcessGroup } from './lifecycle/process-group';
import { lifecycleRecorder } from './lifecycle/recorder';
import type { LifecycleDiagnostic } from './lifecycle/contract';
import type { InventoryRunner } from './lifecycle/group-inventory';
import { liveReach } from './live-reach';
import { spawn } from 'node:child_process';
import { sanitize } from '../office/security';
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
    constructor(message: string, public category: import('../../src/shared').FailureCategory, public dispatched: boolean, public code?: 'surviving-subprocesses') { super(message); }
}
/** Negative PID probes the entire owned group, not just the leader. */
export function processGroupAlive(pid: number): boolean {
    return probeProcessGroup(pid).state !== 'absent';
}
export async function command(program: string, args: string[], options: {
    cwd?: string;
    timeout?: number;
    readOnly?: boolean;
    input?: string;
    onSpawn?: (pid: number) => void;
    onLine?: (line: string) => void;
    /** Raw output chunks, for callers that retain complete transcripts. */
    onOutput?: (stream: 'stdout' | 'stderr', chunk: string) => void;
    signal?: AbortSignal;
    /** Opt-in: after a clean zero exit, stop leftover helpers instead of treating them as an uncertain write. */
    terminateStragglers?: boolean;
    onStragglersTerminated?: (processGroup: number) => void;
    onLifecycle?: (diagnostic: LifecycleDiagnostic) => void;
    lifecycleInventory?: InventoryRunner;
} = {}) {
    if (options.signal?.aborted)
        throw new CommandFailure('Worker cancelled before dispatch', 'cancelled', false);
    // Unit tests inject fake runners; a test that reaches this real runner must never touch live services.
    const live = process.env.VITEST ? liveReach(program, args, options.cwd) : '';
    if (live)
        throw new CommandFailure(`${live} is blocked under unit tests; inject a fake command runner`, 'cancelled', false);
    return new Promise<string>((resolve, reject) => {
        const child = spawn(program, args, { cwd: options.cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
        const lifecycle = child.pid && options.onLifecycle ? lifecycleRecorder(child.pid, options.lifecycleInventory) : undefined;
        let out = '', err = '', line = '', failure: Error | undefined, killTimer: ReturnType<typeof setTimeout> | undefined;
        const alive = () => { if (!child.pid) return false; const probe = probeProcessGroup(child.pid); lifecycle?.probe(probe); return probe.state !== 'absent'; };
        const signalGroup = (phase: 'term' | 'kill', signal: 'SIGTERM' | 'SIGKILL') => {
            const send = () => { process.kill(-child.pid!, signal); };
            if (lifecycle) lifecycle.signal(phase, send); else try { send(); } catch {}
        };
        const terminate = () => {
            if (!child.pid || killTimer) return;
            signalGroup('term', 'SIGTERM');
            killTimer = setTimeout(() => signalGroup('kill', 'SIGKILL'), 3000);
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
            options.onOutput?.('stdout', s);
            out += s;
            line += s;
            const lines = line.split('\n');
            line = lines.pop()!;
            for (const l of lines) { lifecycle?.line(l); options.onLine?.(l); }
            if (out.length > 16000000)
                stop(new CommandFailure('Worker output limit exceeded', 'uncertain-effect', true));
        });
        child.stderr.on('data', (data: Buffer) => { const s = data.toString(); options.onOutput?.('stderr', s); err = (err + s).slice(-12000); });
        child.on('exit', (code, signal) => lifecycle?.exit(code, signal));
        child.on('error', stop);
        child.on('close', async (code, signal) => {
            lifecycle?.close(code, signal); if (line) lifecycle?.line(line);
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
                    stop(new CommandFailure('Worker exited with surviving subprocesses; effects require reconciliation', 'uncertain-effect', true, 'surviving-subprocesses'));
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
            const finalFailure = failure || (code === 0 ? undefined : new CommandFailure(workerFailure(program, code, out, err), options.readOnly ? 'other' : 'uncertain-effect', true));
            try {
                const diagnostic = await lifecycle?.finish(finalFailure instanceof CommandFailure ? finalFailure.category : finalFailure ? 'other' : undefined);
                if (diagnostic) options.onLifecycle?.(diagnostic);
            } catch { /* Diagnostic capture/persistence never changes the frozen execution disposition. */ }
            if (finalFailure) reject(finalFailure); else resolve(out);
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
