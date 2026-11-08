import type { OfficeProject } from '../../src/shared';
import { retainSessionMessage, type SessionConversation } from './session-conversation';

export interface SessionScope {
    project: string;
    issues: number[];
    prs: number[];
    evidence: { at: string; reference: string; kind: 'command' | 'reference'; issue?: number; pr?: number }[];
}
export interface SessionContext {
    activity: 'active' | 'idle' | 'unknown';
    scopes: SessionScope[];
    userMessages: { at: string; text: string }[];
    conversation?: SessionConversation;
}
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Index explicit references; returned URLs provide context, never action ownership or permission. */
export function sessionScope(raw: string, sessionId: string, projects: Pick<OfficeProject, 'id' | 'repo' | 'repository'>[]): SessionContext {
    let identity = '', header = false, historyStart = 0, activity: SessionContext['activity'] = 'unknown';
    const scopes = new Map<string, SessionScope>(), userMessages: SessionContext['userMessages'] = [];
    let conversation: SessionConversation = { projects: [], messages: [], omittedMessages: 0 };
    const conversationProjects = new Set<string>();
    for (const [ordinal, line] of raw.split('\n').entries()) {
        if (!line.trim()) continue;
        let row: any;
        try { row = JSON.parse(line); }
        catch { throw new Error('Codex session context contains an incomplete record'); }
        const payload = row.payload;
        // Forks retain ancestor headers after their own canonical first header.
        if (row.type === 'session_meta' && !header) {
            identity = payload?.id; header = true;
            if (Number.isSafeInteger(payload?.subagent_history_start_ordinal) && payload.subagent_history_start_ordinal >= 0)
                historyStart = payload.subagent_history_start_ordinal;
        }
        if (ordinal < historyStart) continue;
        if (row.type === 'event_msg' && payload?.type === 'task_started') {
            scopes.clear(); userMessages.length = 0; activity = 'active';
        }
        if (row.type === 'event_msg' && ['task_complete', 'turn_aborted'].includes(payload?.type)) activity = 'idle';
        if (row.type !== 'response_item' || !payload) continue;
        const message = payload.type === 'message' && ['user', 'assistant'].includes(payload.role);
        const call = ['function_call', 'custom_tool_call'].includes(payload.type);
        const output = ['function_call_output', 'custom_tool_call_output'].includes(payload.type);
        if (!message && !call && !output) continue;
        const text = message
            ? (payload.content || []).filter((part: any) => ['input_text', 'output_text', 'text'].includes(part.type)).map((part: any) => part.text || '').join('\n')
            : output ? typeof payload.output === 'string' ? payload.output : JSON.stringify(payload.output || '') : String(payload.arguments || payload.input || '');
        if (message && text.trim()) conversation = retainSessionMessage(conversation, payload.role, text, row.timestamp || '');
        if (message && payload.role === 'user' && text.trim()) {
            userMessages.push({ at: row.timestamp || '', text: text.slice(0, 800) });
            if (userMessages.length > 4) userMessages.shift();
        }
        for (const project of projects) {
            const repo = escaped(project.repository), path = escaped(project.repo);
            if (!new RegExp(`(?:(?<![\\w.-])${repo}(?![\\w.-])|${path}(?=[/\\s'"\\\\]|$))`, 'i').test(text)) continue;
            conversationProjects.add(project.id);
            const scope = scopes.get(project.id) || { project: project.id, issues: [], prs: [], evidence: [] };
            // Canonical URLs and REST paths bind the number to this repository.
            const refs = new RegExp(`(?:(?<![\\w.-])github\\.com/|(?<![\\w/.-])repos/)${repo}/(issues|pulls?)/(\\d+)(?![a-z0-9])`, 'gi');
            for (const ref of text.matchAll(refs)) {
                const list = ref[1] === 'issues' ? scope.issues : scope.prs, number = Number(ref[2]);
                if (!list.includes(number)) list.push(number);
                scope.evidence.push({ at: row.timestamp || '', reference: ref[0], kind: call ? 'command' : 'reference', ...(ref[1] === 'issues' ? { issue: number } : { pr: number }) });
            }
            // A gh command scopes its numeric argument through --repo, including cross-repo commands.
            const commands = new RegExp(`gh\\s+(issue|pr)\\s+[a-z-]+\\s+(\\d+)\\b[^;\\n]*?--repo(?:=|\\s+)["']?${repo}(?![\\w.-])`, 'gi');
            for (const ref of call ? text.matchAll(commands) : []) {
                const list = ref[1] === 'issue' ? scope.issues : scope.prs, number = Number(ref[2]);
                if (!list.includes(number)) list.push(number);
                scope.evidence.push({ at: row.timestamp || '', reference: `gh ${ref[1]} ${number} --repo ${project.repository}`, kind: 'command', ...(ref[1] === 'issue' ? { issue: number } : { pr: number }) });
            }
            scope.evidence = scope.evidence.slice(-8);
            scopes.set(project.id, scope);
        }
    }
    if (identity !== sessionId) throw new Error('Codex rollout identity does not match the loaded session');
    conversation.projects = [...conversationProjects];
    return { activity, scopes: [...scopes.values()], userMessages, conversation };
}
