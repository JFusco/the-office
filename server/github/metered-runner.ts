import { currentGitHubSource, githubCli, type Runner } from './call-scope';
import type { CallLedger } from './call-ledger';
import { failed, succeeded } from './call-outcome';
import { githubCall } from './endpoint-family';
import type { RateLimitSamples } from './rate-limit-samples';

/**
 * The Office's runner. A `gh` call goes to the raw executor exactly once, with the caller's hooks, and the process it
 * spawned is counted once under the current source. Any other program passes straight through, uncounted.
 * Accounting never changes what the caller receives.
 */
export function meteredRunner(raw: Runner, ledger: CallLedger, quota?: RateLimitSamples): Runner {
    return async (program, args, options = {}) => {
        if (!githubCli(program)) return raw(program, args, options);
        const source = currentGitHubSource(), call = githubCall(args);
        let spawned = false;
        const account = (observe: () => void) => { try { observe(); } catch { /* Telemetry only. */ } };
        try {
            const stdout = await raw(program, args, { ...options, onSpawn: pid => { spawned = true; options.onSpawn?.(pid); } });
            account(() => { ledger.record(source, call.family, succeeded(call, stdout)); if (call.include) quota?.headers(stdout); });
            return stdout;
        } catch (error) {
            // Refused before dispatch (cancelled, or a live provider under unit tests): no process, nothing counted.
            if (spawned) account(() => ledger.record(source, call.family, failed(call, error)));
            throw error;
        }
    };
}
