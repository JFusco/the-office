/**
 * Reads the per-response usage that Codex records in its rollout file
 * (`$CODEX_HOME/sessions/YYYY/MM/DD/rollout-*-<thread>.jsonl`).
 *
 * `codex exec --json` only reports turn totals, but a request's price depends on its own
 * input size (long-context rates), so valuation needs each response. The rollout writes one
 * `token_usage_record` per API response with a unique `response_id`, and `turn_context`
 * carries the model and effort that actually ran.
 */
export interface CodexTokens {
    input: number;
    /** Subset of input. */
    cachedInput: number;
    cacheWrite: number;
    output: number;
    /** Subset of output. */
    reasoningOutput: number;
}
export interface CodexRequest extends CodexTokens { responseId: string; model: string | null; effort: string | null; turnId: string }
export interface CodexRollout {
    threadId: string | null;
    cliVersion: string | null;
    requests: CodexRequest[];
    models: string[];
    efforts: string[];
    /** Why the rollout cannot be treated as complete coverage of the invocation. */
    gaps: string[];
}

const FIELDS: Record<keyof CodexTokens, string> = { input: 'input_tokens', cachedInput: 'cached_input_tokens', cacheWrite: 'cache_write_input_tokens', output: 'output_tokens', reasoningOutput: 'reasoning_output_tokens' };

function tokens(value: unknown): CodexTokens | null {
    if (!value || typeof value !== 'object') return null;
    const out = {} as CodexTokens;
    for (const [key, field] of Object.entries(FIELDS) as [keyof CodexTokens, string][]) {
        const n = (value as Record<string, unknown>)[field];
        if (n === undefined && key === 'cacheWrite') { out[key] = 0; continue; }
        if (!Number.isSafeInteger(n) || (n as number) < 0) return null;
        out[key] = n as number;
    }
    return out.cachedInput <= out.input && out.reasoningOutput <= out.output ? out : null;
}

function add(a: CodexTokens, b: CodexTokens): CodexTokens {
    return { input: a.input + b.input, cachedInput: a.cachedInput + b.cachedInput, cacheWrite: a.cacheWrite + b.cacheWrite, output: a.output + b.output, reasoningOutput: a.reasoningOutput + b.reasoningOutput };
}
const ZERO: CodexTokens = { input: 0, cachedInput: 0, cacheWrite: 0, output: 0, reasoningOutput: 0 };
const same = (a: CodexTokens, b: CodexTokens) => (Object.keys(FIELDS) as (keyof CodexTokens)[]).every(key => a[key] === b[key]);

/** Pure parse of rollout JSONL text. Malformed lines are a coverage gap, never silently valid usage. */
export function parseCodexRollout(text: string, expectedThreadId: string): CodexRollout {
    const out: CodexRollout = { threadId: null, cliVersion: null, requests: [], models: [], efforts: [], gaps: [] };
    const seen = new Set<string>(), started = new Set<string>(), completed = new Set<string>();
    let model: string | null = null, effort: string | null = null, lastTotal: CodexTokens | null = null, lastThreadTotal: CodexTokens | null = null, malformed = 0;
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        let event: any;
        try { event = JSON.parse(line); } catch { malformed++; continue; }
        const payload = event?.payload || {};
        if (event.type === 'session_meta' && out.threadId === null) {
            out.threadId = typeof payload.id === 'string' ? payload.id : null;
            out.cliVersion = typeof payload.cli_version === 'string' ? payload.cli_version : null;
        }
        else if (event.type === 'turn_context') {
            model = typeof payload.model === 'string' && payload.model ? payload.model : null;
            effort = typeof payload.effort === 'string' && payload.effort ? payload.effort : null;
            if (model && !out.models.includes(model)) out.models.push(model);
            if (effort && !out.efforts.includes(effort)) out.efforts.push(effort);
        }
        else if (event.type === 'token_usage_record') {
            const id = payload.response_id, usage = tokens(payload.usage);
            if (typeof id !== 'string' || !id || !usage || (payload.thread_id && payload.thread_id !== expectedThreadId)) { out.gaps.push('malformed-usage-record'); continue; }
            if (seen.has(id)) continue; // a replayed record is the same response, counted once
            seen.add(id);
            if (payload.thread_token_usage) lastThreadTotal = tokens(payload.thread_token_usage);
            out.requests.push({ ...usage, responseId: id, model, effort, turnId: String(payload.turn_id || '') });
        }
        else if (event.type === 'event_msg' && payload.type === 'task_started' && payload.turn_id) started.add(payload.turn_id);
        else if (event.type === 'event_msg' && payload.type === 'task_complete' && payload.turn_id) completed.add(payload.turn_id);
        else if (event.type === 'event_msg' && payload.type === 'turn_aborted') out.gaps.push('turn-aborted');
        else if (event.type === 'event_msg' && payload.type === 'token_count' && payload.info?.total_token_usage) lastTotal = tokens(payload.info.total_token_usage);
    }
    if (malformed) out.gaps.push('malformed-lines');
    if (out.threadId !== expectedThreadId) out.gaps.push('thread-mismatch');
    if (!out.requests.length) out.gaps.push('no-usage-records');
    if (!started.size || [...started].some(turn => !completed.has(turn))) out.gaps.push('turn-not-completed');
    if (out.requests.some(request => !request.model)) out.gaps.push('model-unknown');
    // The thread's running total must equal the sum of its responses; anything else means usage
    // happened that no record covers (for example a resumed thread). The record's own
    // `thread_token_usage` includes compaction requests, which `token_count` totals leave out,
    // so it is preferred; older emitters without it fall back to `token_count`.
    const reference = lastThreadTotal ?? lastTotal;
    if (!reference) out.gaps.push('no-running-total');
    else if (!same(reference, out.requests.reduce(add, ZERO))) out.gaps.push('records-disagree-with-total');
    return out;
}
