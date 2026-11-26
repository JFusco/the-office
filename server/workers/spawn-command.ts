import { inactivityWatch } from './inactivity-watch';
import { probeProcessGroup } from './lifecycle/process-group';
import { lifecycleRecorder } from './lifecycle/recorder';
import type { LifecycleDiagnostic } from './lifecycle/contract';
import type { InventoryRunner } from './lifecycle/group-inventory';
import { liveReach } from './live-reach';
import { exitFailure } from './exit-failure';
import { CommandFailure, workerFailure } from './process';
import { spawn } from 'node:child_process';
export type CommandOptions = {
    cwd?: string;
    /** Per-child overrides only; never change the service's process.env. */
    env?: Record<string, string>;
    /**
     * The child's complete environment: nothing from `process.env`, not even a variable Node would
     * otherwise carry over (`NODE_V8_COVERAGE`). Only its own string entries are passed; a name must be
     * non-empty and contain no `=`. Cannot be combined with `env`, and is refused under Node's permission
     * model, which adds to `NODE_OPTIONS`. A bare program name is looked up on this record's `PATH`, so
     * callers pass absolute paths.
     */
    replaceEnv?: Readonly<Record<string, string>>;
    /** Zero disables the total deadline when a progress watchdog is supplied. */
    timeout?: number;
    inactivityTimeout?: number;
    /**
     * Stop a failing run with SIGINT to its leader first, so a CLI that ends its turn on interrupt
     * can record where it stopped; the group is terminated after `interruptGraceMs` (default 5s).
     */
    interruptFirst?: boolean;
    interruptGraceMs?: number;
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
    /**
     * Told the text of GitHub's stated rate-limit refusal of this `gh` call, once, after the Office's metered runner
     * has started the shared hold (`server/github/metered-runner.ts`). Never called by the spawn path itself.
     */
    onGitHubRefusal?: (message: string) => void;
};
/**
 * The environment a `replaceEnv` call gives its child, or a pre-dispatch refusal. Node's spawn enumerates
 * inherited keys and copies the parent's `NODE_V8_COVERAGE` into any map without its own entry, so the
 * child gets a fresh null-prototype map of the caller's own entries, with that key present (undefined,
 * which Node drops) unless the caller supplies it.
 */
function replacementEnvironment(options: CommandOptions): NodeJS.ProcessEnv {
    if (options.env !== undefined)
        throw new CommandFailure('A command cannot both merge and replace its environment', 'other', false);
    if (process.permission !== undefined)
        throw new CommandFailure("A replaced environment is refused under Node's permission model, which adds to NODE_OPTIONS", 'other', false);
    const environment: NodeJS.ProcessEnv = Object.create(null);
    environment.NODE_V8_COVERAGE = undefined;
    for (const [name, value] of Object.entries(options.replaceEnv!)) {
        if (!name || name.includes('='))
            throw new CommandFailure(`A replaced environment cannot hold the variable name ${JSON.stringify(name.slice(0, 100))}`, 'other', false);
        environment[name] = value;
    }
    return environment;
}
/**
 * The one place the Office spawns a subprocess: the pre-dispatch cancellation and live-provider guards, the
 * owned process group's lifecycle, the caller's hooks, stdout on success and a classified failure otherwise.
 * It never looks at the Office context; `command` (./process) chooses the runner a call goes to.
 */
export async function spawnCommand(program: string, args: string[], options: CommandOptions = {}) {
    if (options.signal?.aborted)
        throw new CommandFailure('Worker cancelled before dispatch', 'cancelled', false);
    const replaced = options.replaceEnv === undefined ? undefined : replacementEnvironment(options);
    // Unit tests inject fake runners; a test that reaches this real runner must never touch live services.
    const live = process.env.VITEST ? liveReach(program, args, options.cwd) : '';
    if (live)
        throw new CommandFailure(`${live} is blocked under unit tests; inject a fake command runner`, 'cancelled', false);
    return new Promise<string>((resolve, reject) => {
        const child = spawn(program, args, { cwd: options.cwd, env: replaced ?? (options.env ? { ...process.env, ...options.env } : process.env), stdio: ['pipe', 'pipe', 'pipe'], detached: true });
        const lifecycle = child.pid && options.onLifecycle ? lifecycleRecorder(child.pid, options.lifecycleInventory) : undefined;
        let out = '', err = '', line = '', failure: Error | undefined, killTimer: ReturnType<typeof setTimeout> | undefined, interruptTimer: ReturnType<typeof setTimeout> | undefined;
        const alive = () => { if (!child.pid) return false; const probe = probeProcessGroup(child.pid); lifecycle?.probe(probe); return probe.state !== 'absent'; };
        const signalGroup = (phase: 'term' | 'kill', signal: 'SIGTERM' | 'SIGKILL') => {
            const send = () => { process.kill(-child.pid!, signal); };
            if (lifecycle) lifecycle.signal(phase, send); else try { send(); } catch {}
        };
        const terminate = (graceful = false) => {
            if (!child.pid || killTimer) return;
            // Only a leader that is still running can answer an interrupt; survivors of one that already exited are terminated at once.
            if (graceful && options.interruptFirst && !interruptTimer && child.exitCode === null && child.signalCode === null) {
                // Leader only: it stops its own commands and writes its record. Anything left gets the group signals below.
                try { process.kill(child.pid, 'SIGINT'); } catch {}
                if (failure instanceof CommandFailure) failure.interrupted = true;
                interruptTimer = setTimeout(() => terminate(), options.interruptGraceMs ?? 5000);
                return;
            }
            if (graceful && interruptTimer) return;
            clearTimeout(interruptTimer);
            signalGroup('term', 'SIGTERM');
            killTimer = setTimeout(() => signalGroup('kill', 'SIGKILL'), 3000);
        };
        const stop = (reason: Error) => {
            if (failure) return;
            failure = reason;
            terminate(true);
        };
        const timer = options.timeout === 0 && options.inactivityTimeout ? undefined : setTimeout(() => stop(new CommandFailure(options.readOnly ? `${program} read timed out; saved observations retained; safe to retry the read` : `${program} timed out; previous action outcome must be reconciled`, options.readOnly ? 'transient-read' : 'uncertain-effect', true)), options.timeout ?? 45000);
        const inactivity = inactivityWatch(options.inactivityTimeout, () => stop(new CommandFailure(options.readOnly ? `${program} read stopped producing output; saved observations retained; safe to retry the read` : `${program} stopped producing output; inspect the retained worker evidence`, options.readOnly ? 'transient-read' : 'uncertain-effect', true)));
        const abort = () => stop(new CommandFailure('Worker paused; reconcile any external effects before resuming', 'cancelled', true));
        options.signal?.addEventListener('abort', abort, { once: true });
        child.stdout.on('data', (data: Buffer) => {
            const s = data.toString();
            inactivity.progress();
            options.onOutput?.('stdout', s);
            out += s;
            line += s;
            const lines = line.split('\n');
            line = lines.pop()!;
            // Output after the runner began stopping the run is its answer to the stop, not a provider-reported end of the assignment.
            for (const l of lines) { if (!failure) lifecycle?.line(l); options.onLine?.(l); }
            if (out.length > 16000000)
                stop(new CommandFailure('Worker output limit exceeded', 'uncertain-effect', true));
        });
        child.stderr.on('data', (data: Buffer) => { const s = data.toString(); options.onOutput?.('stderr', s); err = (err + s).slice(-12000); });
        // A leader that exits on the interrupt may leave helpers holding its pipes; do not give them the rest of the grace period.
        child.on('exit', (code, signal) => { lifecycle?.exit(code, signal); if (failure && interruptTimer && !killTimer) terminate(); });
        child.on('error', stop);
        child.on('close', async (code, signal) => {
            lifecycle?.close(code, signal); if (line && !failure) lifecycle?.line(line);
            clearTimeout(timer);
            inactivity.clear();
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
            // has stopped. A cancelled, timed-out or failed run is never reported as success here;
            // the worker runtime may still use a result the worker saved before a time limit.
            while (alive())
                await new Promise(done => setTimeout(done, 50));
            clearTimeout(killTimer);
            clearTimeout(interruptTimer);
            options.signal?.removeEventListener('abort', abort);
            if (stragglersTerminated && !failure && child.pid)
                try { options.onStragglersTerminated?.(child.pid); } catch { }
            const finalFailure = failure || (code === 0 ? undefined : exitFailure(program, workerFailure(program, code, out, err), !!options.readOnly));
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
