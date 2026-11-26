import { currentGitHubOperation, currentGitHubProject, currentGitHubSource, githubCli, type Runner } from './call-scope';
import type { CallLedger } from './call-ledger';
import { failed, graphqlCounts, succeeded } from './call-outcome';
import { githubCall, graphqlFamily } from './endpoint-family';
import { graphqlAnswer, type GraphqlAnswer } from './graphql-answer';
import type { QuotaGovernor } from './quota-governor';
import { quotaRefusal } from './quota-refusal';
import { readRateLimitHeaders, type RateLimitSamples } from './rate-limit-samples';

const MAX_HEADER_LENGTH = 16_384;
/** As much of a GraphQL query's stdout as the spawn path itself keeps, so a failed call's body can still say its cost. */
const MAX_BODY_LENGTH = 16_000_000;

/**
 * The Office's runner. A `gh` call goes to the raw executor exactly once, with the caller's hooks, and the process it
 * spawned is counted once under the current source and operation. Any other program passes straight through, uncounted.
 * A direct GraphQL query also counts the points its body reported, failed or not, and its body's balance is kept
 * before its included headers. A stated rate-limit refusal, in the error or in a GraphQL body's `errors`, is told to
 * the quota governor once; any other answer as an answer. Accounting never changes what the caller receives.
 */
export function meteredRunner(raw: Runner, ledger: CallLedger, quota?: RateLimitSamples, governor?: Pick<QuotaGovernor, 'refused' | 'answered'>): Runner {
    return async (program, args, options = {}) => {
        if (!githubCli(program)) return raw(program, args, options);
        const source = currentGitHubSource(), project = currentGitHubProject(), operation = currentGitHubOperation(), call = githubCall(args, operation);
        let spawned = false;
        const account = (observe: () => void) => { try { observe(); } catch { /* Telemetry only. */ } };
        let headerPrefix = call.include ? '' : undefined, body = call.api && graphqlFamily(call.family) ? '' : undefined;
        let status: number | undefined, quotaReading: ReturnType<typeof readRateLimitHeaders>, headers: string | undefined;
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
            if (end !== -1 && match) headers = prefix.slice(0, end);
            if (headers && quota) quotaReading = readRateLimitHeaders(headers);
        };
        const onOutput: typeof options.onOutput = call.include || body !== undefined ? (stream, chunk) => {
            if (stream === 'stdout') account(() => {
                captureHeaders(chunk);
                if (body !== undefined && body.length < MAX_BODY_LENGTH) body += chunk;
            });
            options.onOutput?.(stream, chunk);
        } : options.onOutput;
        // A GraphQL body's balance first; an included header block only when the body gave none.
        const keepReading = (answer?: GraphqlAnswer) => answer?.reading ? quota?.headers(answer.reading, 'body') : quota?.headers(quotaReading);
        const refusalIn = (text: string | undefined, answer?: GraphqlAnswer) => text === undefined ? undefined : quotaRefusal(text, headers, answer?.reading ?? quotaReading);
        try {
            const stdout = await raw(program, args, { ...options, onOutput, onSpawn: pid => { spawned = true; options.onSpawn?.(pid); } });
            account(() => {
                if (headerPrefix === '') captureHeaders(stdout);
                const answer = body === undefined ? undefined : graphqlAnswer(stdout, call.include);
                const refusal = refusalIn(answer?.errors, answer);
                ledger.record(source, call.family, graphqlCounts(succeeded(call, stdout, status), answer, operation, !!refusal), project);
                keepReading(answer);
                // GitHub's 200 envelope can still state a refusal: that is a refusal, not an answer.
                if (refusal) governor?.refused(refusal, source !== 'quota');
                else if (source !== 'quota') governor?.answered();
            });
            return stdout;
        } catch (error) {
            // Refused before dispatch (cancelled, or a live provider under unit tests): no process, nothing counted.
            if (spawned) account(() => {
                const answer = body === undefined ? undefined : graphqlAnswer(body, call.include);
                const refusal = refusalIn(error instanceof Error ? error.message : String(error), answer) ?? refusalIn(answer?.errors, answer);
                ledger.record(source, call.family, graphqlCounts(failed(call, error, status), answer, operation, !!refusal), project);
                keepReading(answer);
                // The probe's own refusal still holds, and never starts another probe.
                if (refusal) governor?.refused(refusal, source !== 'quota');
            });
            throw error;
        }
    };
}
