import { jiraBinding } from '../../office/project-bindings';
import type { Store } from '../../store/store';
import type { Ticket } from '../../../src/shared';
import { jiraResponse } from '../parking/jira-transport';
import { readIssue, type Execute } from '../parking/jira-issue';
import { moveWithComment, type MoveOutcome } from './jira-move';

const BY = 'Moved by the Office on Joe\'s behalf.';
/** The comment each move carries; Joe approved these words on 2026-11-19. */
export const STATUS_COMMENTS = {
    readyForProduction: (prUrl: string) => `Verified on staging. Promotion pull request: ${prUrl}. ${BY}`,
    subtaskDone: (parent: string) => `Parent ${parent} is in production. ${BY}`,
    parentDone: (pipeline: string, run: number) => `In production: ${pipeline} run ${run} passed with this change. ${BY}`,
};

function say(store: Store, t: Ticket, note: string): void {
    if (t.production?.statusNote === note) return;
    t.production = { ...t.production, statusNote: note };
    store.save();
    store.emit('production-status-waiting', `${t.key}: ${note}`, 'pm', t.key);
}

/** What to tell a person when a move did not happen; undefined when it did. */
function stopped(outcome: MoveOutcome, key: string, to: string): string | undefined {
    if (outcome === 'unavailable') return `Jira does not offer ${to} for ${key}.`;
    if (outcome === 'unconfirmed') return `The move of ${key} to ${to} was sent and did not read back. It is not sent again; set it in Jira and the Office carries on.`;
    if (outcome === 'reopened') return `The Office moved ${key} to ${to} before and someone has moved it since. It is left where it is.`;
    if (outcome === 'refused') return `The move of ${key} to ${to} was stopped before sending three times. The Office has stopped trying; set it in Jira and the Office carries on.`;
    return undefined;
}

/** Every sub-task of the ticket with its status; a list too long to read in one page is refused. */
async function subtasks(execute: Execute, store: Store, key: string): Promise<{ key: string; status: string }[]> {
    const response = await jiraResponse(execute, jiraBinding(store.project), ['query', '--jql', `parent = ${key} AND issuetype in subTaskIssueTypes() ORDER BY key ASC`, '--fields', 'status', '--first', '100'], true);
    const issues = response?.data?.issues;
    if (!Array.isArray(issues) || issues.length > 100 || response.pageInfo?.hasNextPage) throw new Error(`Jira did not return every sub-task of ${key}`);
    const read = issues.map((issue: any) => ({ key: String(issue?.key || ''), status: String(issue?.status?.name || '') }));
    // A sub-task read without its key or status is not a sub-task that can be skipped: the parent must not close past it.
    if (read.some(issue => !issue.key || !issue.status)) throw new Error(`Jira returned a sub-task of ${key} without its key or status`);
    return read;
}

/**
 * Keeps the Jira ticket in step with what the Office has seen:
 * staging verified and its promotion pull request open moves the parent from Ready for Staging to
 * Ready for Production; a recorded production deploy moves every sub-task to Done and then the
 * parent. A status a person set in between is left alone. A project without these statuses is skipped.
 */
export async function advanceJiraStatus(store: Store, execute: Execute, t: Ticket, pipeline: string): Promise<void> {
    const binding = jiraBinding(store.project), { readyForStaging, readyForProduction, done } = binding.statuses, p = t.production;
    if (!readyForProduction || !done || !p) return;
    const settled = (extra: object) => { const { statusNote: _, ...kept } = t.production!; t.production = { ...kept, ...extra }; store.save(); };
    if (p.deployedAt && !p.doneAt) {
        const parent = await readIssue(execute, binding, t.key);
        if (parent.status === done) return settled({ doneAt: store.clock.now().toISOString() });
        // Only a parent still where the Office left it, and still the Office's: any other status or owner is a person's choice.
        if (parent.assignee !== binding.account || ![readyForStaging, readyForProduction].includes(parent.status))
            return say(store, t, `${t.key} is in production, but in Jira it is ${parent.status}${parent.assignee !== binding.account ? ' and assigned to someone else' : ''}. The Office leaves it and its sub-tasks as they are.`);
        if (!p.buildId) throw new Error(`${t.key} is recorded in production without its run`);
        for (const sub of (await subtasks(execute, store, t.key)).filter(sub => sub.status !== done)) {
            const stop = stopped(await moveWithComment(store, execute, binding, t, sub.key, done, STATUS_COMMENTS.subtaskDone(t.key)), sub.key, done);
            if (stop) return say(store, t, `${stop} ${t.key} stays open until sub-task ${sub.key} is ${done}.`);
        }
        const stop = stopped(await moveWithComment(store, execute, binding, t, t.key, done, STATUS_COMMENTS.parentDone(pipeline, p.buildId)), t.key, done);
        if (stop) return say(store, t, `Every sub-task is ${done}. ${stop}`);
        settled({ doneAt: store.clock.now().toISOString() });
        store.emit('production-done', `${t.key} and its sub-tasks are ${done} in Jira: it is in production.`, 'pm', t.key);
        return;
    }
    if (p.pr && p.prUrl && !p.deployedAt && !p.readyAt) {
        // A promotion pull request someone abandoned is not one to announce.
        if (store.state.azure.prs.find(pr => pr.id === p.pr)?.status === 'abandoned') return;
        const live = await readIssue(execute, binding, t.key);
        if (live.status === readyForProduction) return settled({ readyAt: store.clock.now().toISOString() });
        // Only from Ready for Staging, and only the Office's own ticket: any other status or owner is a person's choice.
        if (live.status !== readyForStaging || live.assignee !== binding.account) return;
        const stop = stopped(await moveWithComment(store, execute, binding, t, t.key, readyForProduction, STATUS_COMMENTS.readyForProduction(p.prUrl)), t.key, readyForProduction);
        if (stop) return say(store, t, stop);
        settled({ readyAt: store.clock.now().toISOString() });
        store.emit('production-ready', `${t.key} is ${readyForProduction} in Jira: verified on staging, promotion pull request ${p.pr} open.`, 'pm', t.key);
    }
}
