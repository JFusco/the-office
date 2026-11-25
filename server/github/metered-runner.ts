import { currentGitHubProject, currentGitHubSource, githubCli, type Runner } from './call-scope';
import type { CallLedger } from './call-ledger';
import { failed, succeeded } from './call-outcome';
import { githubCall } from './endpoint-family';
import { readRateLimitHeaders, type RateLimitSamples } from './rate-limit-samples';

const MAX_HEADER_LENGTH = 16_384;

/**
 * The Office's runner. A `gh` call goes to the raw executor exactly once, with the caller's hooks, and the process it
 * spawned is counted once under the current source. Any other program passes straight through, uncounted.
 * Accounting never changes what the caller receives.
 */
export function meteredRunner(raw: Runner, ledger: CallLedger, quota?: RateLimitSamples): Runner {
    return async (program, args, options = {}) => {
        if (!githubCli(program)) return raw(program, args, options);
        const source = currentGitHubSource(), project = currentGitHubProject(), call = githubCall(args);
        let spawned = false;
        const account = (observe: () => void) => { try { observe(); } catch { /* Telemetry only. */ } };
        let headerPrefix = call.include ? '' : undefined;
        let status: number | undefined, quotaReading: ReturnType<typeof readRateLimitHeaders>;
        const captureHeaders = (chunk: string) => {
            if (headerPrefix === undefined) return;
            const prefix = headerPrefix + chunk.slice(0, MAX_HEADER_LENGTH - headerPrefix.length);
            const end = prefix.search(/\r?\n\r?\n/);
            const match = /^HTTP\/\d+(?:\.\d+)? ([1-5]\d\d)(?=[ \t\r\n])/.exec(prefix);
            if (match) status = Number(match[1]);
            if (end === -1 && prefix.length < MAX_HEADER_LENGTH && (prefix.startsWith('HTTP/') || 'HTTP/'.startsWith(prefix))) {
                headerPrefix = prefix;
                return;
            }
            headerPrefix = undefined;
            if (end !== -1 && match && quota) quotaReading = readRateLimitHeaders(prefix.slice(0, end));
        };
        const onOutput: typeof options.onOutput = call.include ? (stream, chunk) => {
            if (stream === 'stdout') account(() => captureHeaders(chunk));
            options.onOutput?.(stream, chunk);
        } : options.onOutput;
        try {
            const stdout = await raw(program, args, { ...options, onOutput, onSpawn: pid => { spawned = true; options.onSpawn?.(pid); } });
            account(() => {
                if (headerPrefix === '') captureHeaders(stdout);
                ledger.record(source, call.family, succeeded(call, stdout, status), project);
                quota?.headers(quotaReading);
            });
            return stdout;
        } catch (error) {
            // Refused before dispatch (cancelled, or a live provider under unit tests): no process, nothing counted.
            if (spawned) account(() => {
                ledger.record(source, call.family, failed(call, error, status), project);
                quota?.headers(quotaReading);
            });
            throw error;
        }
    };
}
