import { sessionScope, type SessionContext } from './session-scope';
import type { ContextProject } from './session-context-file';

/** Adapt native Claude messages/tools to the shared explicit-reference index; API-history blobs are excluded. */
export function claudeSessionScope(raw: string, id: string, projects: ContextProject[]): SessionContext {
    const rows: unknown[] = [{ type: 'session_meta', payload: { id } }];
    let bound = false;
    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        let record: any;
        try { record = JSON.parse(line); }
        catch { throw new Error('Claude session context contains an incomplete record'); }
        if (!['user', 'assistant'].includes(record.type) || record.isSidechain) continue;
        if (record.sessionId !== id) throw new Error('Claude transcript identity does not match the live session');
        bound = true;
        const content = record.message?.content;
        const parts = typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : [];
        const text = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('\n');
        if (record.type === 'user' && text && !record.isMeta) {
            rows.push({ type: 'event_msg', payload: { type: 'task_started' } });
            rows.push({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
        }
        if (record.type === 'assistant' && text)
            rows.push({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] } });
        for (const part of parts) {
            if (record.type === 'assistant' && part.type === 'tool_use')
                rows.push({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'function_call', name: part.name, arguments: JSON.stringify(part.input) } });
            if (record.type === 'user' && part.type === 'tool_result')
                rows.push({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'function_call_output', output: part.content } });
        }
    }
    if (!bound) throw new Error('Claude live session has no bound transcript records');
    return sessionScope(rows.map(row => JSON.stringify(row)).join('\n'), id, projects);
}
