import { probeProcessGroup } from './lifecycle/process-group';
import { spawnCommand, type CommandOptions } from './spawn-command';
import { boundGitHubRunner } from '../github/call-scope';
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
    /** The runner interrupted the process to stop it; anything it reported afterwards answers that interrupt, not its assignment. */
    interrupted = false;
    /** Set for a `provider-limit` (`exit-failure.ts`). */
    retryAt?: string;
    constructor(message: string, public category: import('../../src/shared').FailureCategory, public dispatched: boolean, public code?: 'surviving-subprocesses') { super(message); }
}
/** Negative PID probes the entire owned group, not just the leader. */
export function processGroupAlive(pid: number): boolean {
    return probeProcessGroup(pid).state !== 'absent';
}
/**
 * Runs one subprocess. A `gh` call made inside a bound Office context goes to that Office's metered runner,
 * which spawns it once and counts it (server/github/call-scope.ts); every other call is spawned directly.
 */
export async function command(program: string, args: string[], options: CommandOptions = {}) {
    return (boundGitHubRunner(program) ?? spawnCommand)(program, args, options);
}
