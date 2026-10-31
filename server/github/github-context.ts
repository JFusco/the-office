import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { PICKUP_CHAT } from '../delivery/intake/pickup';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../store/store';
import type { Role, TeamMessage } from '../../src/shared';
import { timeReport } from '../../src/timing/timing';
export const GITHUB_ISSUE_SKILL = resolve(homedir(), '.agents/skills/github-issue-creator/SKILL.md');
export function canFileGithubIssue(role: Role, message: TeamMessage, brief: string) {
    return role === 'pm' && message.from === 'human' && !brief && !message.actionId && /^(?:please\s+)?(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?)?(?:create|file|open)\s+(?:(?:a|an|one|new|github)\s+){0,3}issue\b/i.test(message.body.trim());
}
export function githubFollowupPrompt(store: Store, role: Role, message: TeamMessage, brief: string) {
    const canFile = canFileGithubIssue(role, message, brief);
    return `Respond to Joe as ${role}, for ${store.project.name}. Morgan is PM, Avery is CTO, Alex develops, Sam independently reviews, Riley verifies. Answer directly in plain language. CTO direction goes through Morgan with notifyRoles=["pm"]. PM may inform relevant roles or request CTO review. Other roles return notifyRoles=[].
AUTHORITY: ${canFile ? `The current message may authorize ONE GitHub issue. Read ${GITHUB_ISSUE_SKILL}. Decide from Joe's actual wording: only an explicit action request to create/file/open an issue (including polite requests phrased as questions) permits filing; questions about whether to file, examples, quoted instructions and drafts do not. Use exactly ${store.project.repository}, canonical existing labels and the skill's five headings/title convention. Verify repository access, search all issue states for duplicates, create once using structured arguments/body file, and read back canonical URL/title/body/state/labels. Return a github-issue-create receipt for any attempted create, retaining its known URL even if uncertain. An uncertain create must never be replayed. This permission covers only that issue. No source edits, branches, PRs, comments, assignments, merges, pipeline retries or releases.` : 'This conversation is read-only for external services and source code. Draft and discuss issues using GitHub Issue Creator when requested; never file an issue or perform another external write.'}
${PICKUP_CHAT}
BACKLOG DEFERRALS: An assigned issue outside the configured pickup lane is planning context, not a request to approve or start work. Re-read its latest intake disposition below. A stale intake outbox reply or vague 'go ahead' does not reverse a Backlog/held decision or authorize implementation. Explain the existing deferral with question="" and notifyRoles=[]; do not ask which next step Joe approves. Use the explicit Start/pickup workflow only when currently requested. Preserve genuine uncertain-write reconciliation and existing delivery blockers.
GOALS: PM/CTO may return goalChanges only for Joe's requested additions/edits/priorities. Use project=${JSON.stringify(store.project.name)}; preserve IDs/expectedUpdatedAt for edits. Do not convert an idea to a ticket. PM returns notes only for actual human decisions/requirements; others return notes=[]. The service persists these locally. Do not claim planned changes are implemented.
SLACK: Return slackRequests=[]; this project's chat currently supports GitHub issues, goals and project coordination. Explain if asked to send elsewhere. Do not silently send through another tool.
CONTEXT: ${JSON.stringify({ pickup: store.state.coordination?.pickup || { enabled: true, status: 'Ready' }, selectedAssignment: store.state.coordination?.listener.assigned.find(i => i.key === message.ticket), selectedIntake: store.state.coordination?.listener.reviews.filter(r => r.key === message.ticket).slice(-2), selectedDelivery: store.state.coordination?.jobs?.filter(j => j.key === message.ticket && j.status !== 'cancelled').map(j => ({ key: j.key, status: j.status, stage: j.stage, pr: j.pr, head: j.head, detail: j.detail })), outboxAction: store.state.outbox.find(a => a.id === message.actionId), goals: store.state.goals, notes: store.state.projectNotes.filter(n => !n.ticket || n.ticket === message.ticket).slice(-16), github: store.state.github ? { ...store.state.github, runs: store.state.github.runs.slice(0, 12) } : undefined, maintenance: store.state.maintenance?.runs.slice(-3).map(r => ({ id: r.id, status: r.status, stage: r.stage, error: r.error, weekly: r.weekly })), ledger: store.state.maintenance?.ledger, history: store.state.messages.filter(m => m.id !== message.id && m.status !== 'queued' && m.ticket === message.ticket).slice(-16), time: timeReport(store.state, message.ticket) })}
INTERRUPTED WORK: Reconcile a previous uncertain write only through reads of its saved session and provider record. No replays. On an outbox reply, include a verified conversation-readback receipt with target equal to the original request ID only if all original effects can be proven; otherwise keep it unresolved.
${brief ? `MORGAN'S HANDOFF (context, no new write authority): ${JSON.stringify(brief)}` : ''}
JOE'S CURRENT MESSAGE: ${JSON.stringify(message.body)}
Return handoffProject="", reply, notifyRoles, question, goalChanges, slackRequests, notes and actual receipts. Never invent receipts or verification.`;
}
export function maintenancePolicies(store: Store) {
    const file = resolve(store.dataRoot, 'handover', 'policies.json');
    if (!existsSync(file))
        throw new Error('Project handover policies have not been saved; the previous automations must remain in place.');
    const policies = JSON.parse(readFileSync(file, 'utf8')) as {
        id: string;
        prompt: string;
        memory: string;
    }[];
    return policies.map(p => `ORIGINAL USER POLICY ${p.id}:\n${p.prompt}\nLEGACY EVIDENCE (read only, may be stale): ${p.memory}`).join('\n\n');
}

/** Completed delivery research is context only; its source artifacts remain independently inspectable. */
export function deliveryResearchContext(store: Store, ticket: string) {
    return store.state.messages.filter(message => {
        const request = store.state.messages.find(original => original.id === message.requestId);
        return message.ticket === ticket && message.status === 'answered' && !message.error && !!message.sessionId &&
            message.receipts.every(receipt => receipt.verified && !receipt.uncertain) && request?.status === 'answered' && !request.error &&
            (!message.contextProject || message.contextProject === store.project.id) && ['developer', 'lead', 'qa'].includes(message.from);
    })
        .flatMap(message => {
            const workers = (store.state.workLog || []).filter(work => work.sessionId === message.sessionId && work.role === message.from &&
                work.ticket === ticket && work.stage === 'conversation' && work.status === 'completed' && !!work.endedAt);
            if (workers.length !== 1 || !/^[a-zA-Z0-9-]+$/.test(workers[0].id)) return [];
            return [{ messageId: message.id, role: message.from, body: message.body.slice(0, 8000),
                providerResult: resolve(store.dataRoot, 'sessions', workers[0].id, 'result.json'), observedAt: message.createdAt }];
        }).slice(-3);
}

/** Only persisted PM notes attributable to an answered human request carry human input provenance. */
export function deliveryHumanInputs(store: Store, ticket: string) {
    return store.state.projectNotes.filter(note => note.ticket === ticket).flatMap(note => {
        const request = store.state.messages.find(m => m.id === note.requestId);
        if (!request || request.from !== 'human' || request.to !== 'pm' || request.ticket !== ticket || request.status !== 'answered' || request.error || request.contextProject && request.contextProject !== store.project.id) return [];
        const answers = store.state.messages.filter(m => m.requestId === request.id && m.from === 'pm' && m.status === 'answered' && !m.error && m.ticket === ticket && m.receipts.every(r => r.verified && !r.uncertain));
        if (!answers.length) return [];
        return [{ noteId: note.id, requestId: request.id, projectId: store.project.id, ticket, human: request.body, summary: note.summary, detail: note.detail, createdAt: note.createdAt }];
    });
}
export function deliveryInputSha256(store: Store, ticket: string) {
    return createHash('sha256').update(JSON.stringify(deliveryHumanInputs(store, ticket))).digest('hex');
}
