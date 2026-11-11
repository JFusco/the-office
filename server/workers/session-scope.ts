import type { OfficeProject } from '../../src/shared';
import { CEC } from '../office/config';
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
type ScopeProject = Pick<OfficeProject, 'id' | 'repo' | 'repository'> & Partial<Pick<OfficeProject, 'provider'>>;

/** The configured site may be written as its https URL or bare host, with an optional trailing slash. */
const siteHost = (value: string) => value.replace(/[\\"']/g, '').toLowerCase().replace(/^https:\/\//, '').replace(/\/+$/, '');

/** Exact CEC ticket keys named by native TWG work-item commands. A configured --site makes them commands;
 * a missing --site leaves the destination unproven, so they are references. Another site yields nothing. */
function jiraCommandIssues(text: string): { commands: number[]; references: number[] } {
    const commands: number[] = [], references: number[] = [], configured = siteHost(CEC.site);
    for (const command of text.matchAll(/(?<![\w.-])twg\s+jira\s+workitem\b[^;\n|&]*/gi)) {
        const site = command[0].match(/--site(?:=|\s+)[\\"']*([^\s;|&\\"',})\]]+)/i)?.[1];
        // An unexpanded shell value is as unproven as a missing site.
        const list = !site || site.includes('$') ? references : siteHost(site) === configured ? commands : undefined;
        if (!list) continue;
        for (const key of command[0].matchAll(/(?<![\w-])CEC-(\d+)(?![\w-])/g))
            if (!list.includes(Number(key[1]))) list.push(Number(key[1]));
    }
    return { commands, references: references.filter(number => !commands.includes(number)) };
}

/** Index explicit references; returned URLs provide context, never action ownership or permission. */
export function sessionScope(raw: string, sessionId: string, projects: ScopeProject[]): SessionContext {
    const parser = sessionScopeParser(sessionId, projects);
    for (const line of raw.split('\n')) parser.write(line);
    return parser.finish();
}

/** The same strict record fold supports bounded complete-file reads without retaining transcripts. */
export function sessionScopeParser(sessionId: string, projects: ScopeProject[]) {
    let ordinal = -1;
    let identity = '', header = false, historyStart = 0, activity: SessionContext['activity'] = 'unknown';
    const scopes = new Map<string, SessionScope>(), userMessages: SessionContext['userMessages'] = [];
    let conversation: SessionConversation = { projects: [], messages: [], omittedMessages: 0 };
    const conversationProjects = new Set<string>();
    return { write(line: string) {
        ordinal++;
        if (!line.trim()) return;
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
        if (ordinal < historyStart) return;
        if (row.type === 'event_msg' && payload?.type === 'task_started') {
            scopes.clear(); userMessages.length = 0; activity = 'active';
        }
        if (row.type === 'event_msg' && ['task_complete', 'turn_aborted'].includes(payload?.type)) activity = 'idle';
        if (row.type !== 'response_item' || !payload) return;
        const message = payload.type === 'message' && ['user', 'assistant'].includes(payload.role);
        const call = ['function_call', 'custom_tool_call'].includes(payload.type);
        const output = ['function_call_output', 'custom_tool_call_output'].includes(payload.type);
        if (!message && !call && !output) return;
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
            // A current-turn TWG command binds a CEC ticket to the Jira project even from a chat rooted elsewhere.
            const jira = call && project.provider === 'azure' ? jiraCommandIssues(text) : { commands: [], references: [] };
            const browse = project.provider === 'azure' ? [...text.matchAll(new RegExp(`${escaped(CEC.site)}/browse/CEC-(\\d+)(?![\\w-])`, 'gi'))] : [];
            if (!jira.commands.length && !jira.references.length && !browse.length &&!new RegExp(`(?:(?<![\\w.-])${repo}(?![\\w.-])|${path}(?=[/\\s'"\\\\]|$))`, 'i').test(text)) continue;
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
            // Jira browse URLs are references; only an exact configured-site TWG command is command evidence.
            for (const ref of browse) {
                const number = Number(ref[1]);
                if (!scope.issues.includes(number)) scope.issues.push(number);
                scope.evidence.push({ at: row.timestamp || '', reference: ref[0], kind: 'reference', issue: number });
            }
            for (const number of jira.references) {
                if (!scope.issues.includes(number)) scope.issues.push(number);
                scope.evidence.push({ at: row.timestamp || '', reference: `twg jira workitem CEC-${number} (no --site)`, kind: 'reference', issue: number });
            }
            for (const number of jira.commands) {
                if (!scope.issues.includes(number)) scope.issues.push(number);
                scope.evidence.push({ at: row.timestamp || '', reference: `twg jira workitem CEC-${number} --site ${CEC.site}`, kind: 'command', issue: number });
            }
            scope.evidence = scope.evidence.slice(-8);
            scopes.set(project.id, scope);
        }
    }, finish(): SessionContext {
    if (identity !== sessionId) throw new Error('Codex rollout identity does not match the loaded session');
    conversation.projects = [...conversationProjects];
    return { activity, scopes: [...scopes.values()], userMessages, conversation };
    } };
}
