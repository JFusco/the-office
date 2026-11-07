/** Synthetic Codex rollout lines shaped like codex-cli 0.163 `exec` output. */
export interface Usage { input: number; cached?: number; write?: number; output: number; reasoning?: number }
const wire = (u: Usage) => ({ input_tokens: u.input, cached_input_tokens: u.cached ?? 0, cache_write_input_tokens: u.write ?? 0, output_tokens: u.output, reasoning_output_tokens: u.reasoning ?? 0, total_tokens: u.input + u.output });

export function rollout(thread: string, responses: Usage[], opts: { model?: string; effort?: string; complete?: boolean; parent?: string; totalOverride?: Usage; duplicate?: boolean; compaction?: Usage } = {}): string {
    const turn = 'turn-1', lines: object[] = [
        { type: 'session_meta', payload: { id: thread, cli_version: '0.163.0', originator: 'codex_exec', ...(opts.parent ? { parent_thread_id: opts.parent } : {}) } },
        { type: 'event_msg', payload: { type: 'task_started', turn_id: turn } },
        { type: 'turn_context', payload: { model: opts.model ?? 'gpt-6-astra', effort: opts.effort ?? 'high', turn_id: turn } },
    ];
    const total = { input: 0, cached: 0, write: 0, output: 0, reasoning: 0 }, thread_ = { ...total };
    const bump = (t: typeof total, u: Usage) => { t.input += u.input; t.cached += u.cached ?? 0; t.write += u.write ?? 0; t.output += u.output; t.reasoning += u.reasoning ?? 0; };
    if (opts.compaction) {
        // A compaction request is recorded, and counted in thread_token_usage, but not in token_count totals.
        bump(thread_, opts.compaction);
        lines.push({ type: 'token_usage_record', payload: { thread_id: thread, turn_id: turn, response_id: 'resp_compact', usage: wire(opts.compaction), thread_token_usage: wire(thread_) } }, { type: 'compacted', payload: {} });
    }
    responses.forEach((usage, index) => {
        bump(thread_, usage);
        const record = { type: 'token_usage_record', payload: { thread_id: thread, turn_id: turn, response_id: `resp_${index}`, usage: wire(usage), ...(opts.compaction ? { thread_token_usage: wire(thread_) } : {}) } };
        lines.push(record);
        if (opts.duplicate && index === 0) lines.push(record);
        bump(total, usage);
        lines.push({ type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: wire(opts.totalOverride ?? total), last_token_usage: wire(usage) } } });
    });
    if (opts.complete !== false) lines.push({ type: 'event_msg', payload: { type: 'task_complete', turn_id: turn } });
    return lines.map(line => JSON.stringify(line)).join('\n') + '\n';
}
