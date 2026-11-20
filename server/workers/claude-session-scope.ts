import { sessionScopeParser, type SessionContext } from './session-scope';
import type { ContextProject } from './session-context-file';
import type { SessionContextParser } from './session-context-lines';

interface Bound { inner: SessionContextParser; bound: boolean; ancestor: boolean }

/**
 * Adapt native Claude messages/tools to the shared explicit-reference index, one transcript line at a time;
 * API-history blobs are excluded. Each line becomes the rows the shared parser reads, so a transcript is folded
 * in chunks from a captured snapshot like a Codex rollout, and the fold can be forked for a checkpoint.
 */
export function claudeScopeParser(id: string, projects: ContextProject[], from?: Bound): SessionContextParser {
    const inner = from?.inner ?? sessionScopeParser(id, projects);
    let bound = from?.bound ?? false, ancestor = from?.ancestor ?? false;
    const emit = (row: unknown) => inner.write(JSON.stringify(row));
    if (!from) emit({ type: 'session_meta', payload: { id } });
    return {
        write(line: string) {
            if (!line.trim()) return;
            let record: any;
            try { record = JSON.parse(line); }
            catch { throw new Error('Claude session context contains an incomplete record'); }
            if (record.isSidechain) return;
            // A fork may copy its parent's records, followed by native child metadata
            // before the child has sent its first message. Those records belong to
            // the parent: never import its conversation, commands or ownership.
            if (record.sessionId === id) bound = true;
            else if (record.sessionId) {
                if (bound) throw new Error('Claude transcript identity does not match the live session');
                ancestor = true;
                return;
            }
            if (!['user', 'assistant'].includes(record.type)) return;
            if (record.sessionId !== id) throw new Error('Claude transcript identity does not match the live session');
            const content = record.message?.content;
            const parts = typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : [];
            const text = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text || '').join('\n');
            if (record.type === 'user' && text && !record.isMeta) {
                emit({ type: 'event_msg', payload: { type: 'task_started' } });
                emit({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
            }
            if (record.type === 'assistant' && text)
                emit({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] } });
            for (const part of parts) {
                if (record.type === 'assistant' && part.type === 'tool_use')
                    emit({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'function_call', name: part.name, arguments: JSON.stringify(part.input) } });
                if (record.type === 'user' && part.type === 'tool_result')
                    emit({ type: 'response_item', timestamp: record.timestamp, payload: { type: 'function_call_output', output: part.content } });
            }
        },
        finish(): SessionContext {
            if (!bound) throw new Error(ancestor ? 'Claude transcript identity does not match the live session' : 'Claude live session has no bound transcript records');
            return inner.finish();
        },
        fork: () => claudeScopeParser(id, projects, { inner: inner.fork!(), bound, ancestor }),
    };
}

/** The same fold over a whole transcript text. */
export function claudeSessionScope(raw: string, id: string, projects: ContextProject[]): SessionContext {
    const parser = claudeScopeParser(id, projects);
    for (const line of raw.split('\n')) parser.write(line);
    return parser.finish();
}
