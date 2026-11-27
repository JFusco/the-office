import { currentGitHubOperation, currentGitHubProject, currentGitHubSource, githubCli, type Runner } from './call-scope';
import type { CallLedger } from './call-ledger';
import { failed, graphqlCounts, succeeded } from './call-outcome';
import { githubCall, graphqlFamily } from './endpoint-family';
import { graphqlAnswer, type GraphqlAnswer } from './graphql-answer';
import type { QuotaGovernor } from './quota-governor';
import { quotaRefusal } from './quota-refusal';
import { readRateLimitHeaders, type RateLimitSamples } from './rate-limit-samples';
import { currentPrincipal } from './identity/write-credential-scope';
import { noteGitHubAnswer, noteGitHubFailure, type GitHubRefusalEvidence } from './refusal-capture';
import type { QuotaRefusal } from './quota-governor';

const MAX_HEADER_LENGTH = 16_384;
/** As much of a GraphQL query's stdout as the spawn path itself keeps, so a failed call's body can still say its cost. */
const MAX_BODY_LENGTH = 16_000_000;

/**
 * The Office's runner. A `gh` call goes to the raw executor exactly once, with the caller's hooks, and the process it
 * spawned is counted once under the current source and operation. Any other program passes straight through, uncounted.
 * A direct GraphQL query also counts the points its body reported, failed or not, and its body's balance is kept
 * before its included headers. A stated rate-limit refusal, in the error or in a GraphQL body's `errors`, is told to
 * the quota governor once, and then its text and structured evidence to the caller's `onGitHubRefusal`; any other
 * answer as an answer. Inside a capture (`refusal-capture.ts`) each failed call is also kept with its refusal, and a
 * later success of the same command discards it. Accounting never changes what the caller receives.
 */
export function meteredRunner(raw: Runner, ledger: CallLedger, quota?: RateLimitSamples, governor?: { refused: (...args: Parameters<QuotaGovernor['refused']>) => ReturnType<QuotaGovernor['refused']> | void; answered: QuotaGovernor['answered'] }): Runner {
    return async (program, args, options = {}) => {
        if (!githubCli(program)) return raw(program, args, options);
        const source = currentGitHubSource(), project = currentGitHubProject(), operation = currentGitHubOperation(), call = githubCall(args, operation), principal = currentPrincipal();
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
            if (headers) quotaReading = readRateLimitHeaders(headers);
        };
        const onOutput: typeof options.onOutput = call.include || body !== undefined ? (stream, chunk) => {
            if (stream === 'stdout') account(() => {
                captureHeaders(chunk);
                if (body !== undefined && body.length < MAX_BODY_LENGTH) body += chunk;
            });
            options.onOutput?.(stream, chunk);
        } : options.onOutput;
        // A GraphQL body's balance first; an included header block only when the body gave none.
        const keepReading = (answer?: GraphqlAnswer) => answer?.reading ? quota?.headers(answer.reading, 'body', principal) : quota?.headers(quotaReading, 'headers', principal);
        // A refusal and the text that stated it, for this invocation only.
        const refusalIn = (text: string | undefined, answer?: GraphqlAnswer) => {
            const refusal = text === undefined ? undefined : quotaRefusal(text, headers, answer?.reading ?? quotaReading);
            return refusal && { refusal, text: text! };
        };
        // The governor's deadline for this refusal and, for a primary refusal with none stated, its exhausted window's reset.
        const refuse = (matched: { refusal: QuotaRefusal; text: string }): GitHubRefusalEvidence => {
            const at = Date.now(), resource = matched.refusal.reading?.resource ?? (graphqlFamily(call.family) ? 'graphql' : 'core');
            const told = governor?.refused(matched.refusal, source !== 'quota', principal) || undefined;
            // Live windows are read on the samples' own clock; a spent one's reset is the deadline it states.
            const exhausted = () => Math.max(0, ...(quota?.liveWindows(resource, principal) ?? []).filter(window => window.remaining === 0).map(window => window.reset * 1000));
            const stated = matched.refusal.retryAfterMs !== undefined || matched.refusal.reading?.remaining === 0;
            const fromHeaders = matched.refusal.retryAfterMs !== undefined ? at + matched.refusal.retryAfterMs
                : matched.refusal.reading?.remaining === 0 ? matched.refusal.reading.reset * 1000 : 0;
            const until = Math.max(told?.until ?? fromHeaders, matched.refusal.secondary || stated ? 0 : exhausted());
            return { principal, resource, at: new Date(at).toISOString(), ...(until ? { deadline: new Date(until).toISOString() } : {}), secondary: matched.refusal.secondary,
                ...(matched.refusal.retryAfterMs !== undefined ? { retryAfterMs: matched.refusal.retryAfterMs } : {}), text: matched.text, readOnly: !!options.readOnly,
                ...(told?.probe && !matched.refusal.secondary && !stated ? { late: told.probe.then(() => { const reset = exhausted(); return reset ? new Date(reset).toISOString() : undefined; }) } : {}) };
        };
        const key = args.join(' ');
        try {
            const stdout = await raw(program, args, { ...options, onOutput, onSpawn: pid => { spawned = true; options.onSpawn?.(pid); } });
            account(() => {
                if (headerPrefix === '') captureHeaders(stdout);
                const answer = body === undefined ? undefined : graphqlAnswer(stdout, call.include);
                const matched = refusalIn(answer?.errors, answer);
                ledger.record(source, call.family, graphqlCounts(succeeded(call, stdout, status), answer, operation, !!matched), project, principal);
                keepReading(answer);
                // GitHub's 200 envelope can still state a refusal: that is a refusal, not an answer.
                if (matched) {
                    const evidence = refuse(matched);
                    noteGitHubFailure({ args: key, text: matched.text, readOnly: !!options.readOnly, at: evidence.at, refusal: evidence });
                    options.onGitHubRefusal?.(matched.text, evidence);
                }
                else { if (source !== 'quota') governor?.answered(principal); noteGitHubAnswer(key); }
            });
            return stdout;
        } catch (error) {
            // Refused before dispatch (cancelled, or a live provider under unit tests): no process, nothing counted.
            if (spawned) account(() => {
                const answer = body === undefined ? undefined : graphqlAnswer(body, call.include);
                const diagnostic = error instanceof Error ? error.message : String(error);
                let matched = refusalIn(diagnostic, answer) ?? refusalIn(answer?.errors, answer);
                if (!matched && options.readOnly && status === 429 && headers) {
                    // The included response supplies the refusal status even when gh omits the rate-limit wording.
                    const refusal = quotaRefusal('API rate limit exceeded (HTTP 429)', headers, quotaReading);
                    if (refusal && (Number.isFinite(refusal.retryAfterMs) || refusal.reading?.remaining === 0))
                        matched = { refusal, text: diagnostic };
                }
                ledger.record(source, call.family, graphqlCounts(failed(call, error, status, answer), answer, operation, !!matched), project, principal);
                keepReading(answer);
                // The probe's own refusal still holds, and never starts another probe.
                const evidence = matched ? refuse(matched) : undefined;
                noteGitHubFailure({ args: key, text: diagnostic, readOnly: !!options.readOnly, at: new Date().toISOString(), ...(evidence ? { refusal: evidence } : {}) });
                if (matched) options.onGitHubRefusal?.(matched.text, evidence);
            });
            throw error;
        }
    };
}
