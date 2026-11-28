import { reconcileGitHubWrite } from '../../github/identity/write-boundary';
import { savedAuthor } from '../../github/identity/office-authors';
import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { exactRemoteHead } from '../../delivery/publication/remote-head';
import { workKey } from '../../../src/shared';
import { allIssues } from './issue-search';
import { settlingIssue, type CreatePayload } from './create-issue';
import { matchingDraft } from './pr-lookup';
import { originalDraft, settledReceipt } from './create-draft';
import { PUBLICATION_OPERATIONS } from './publication-operations';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { EffectIntent, MaintenanceRun } from '../../../src/shared';

type Execute = typeof command;
type ReadBack = { verified: boolean; receipt: unknown };

/** Every Effect recorded under this run's maintenance work reference, in id order. */
export function runEffects(store: Store, runId: string): EffectIntent[] {
    return (store.db.prepare('SELECT body FROM effects WHERE work_key=? ORDER BY id').all(workKey({ projectId: store.project.id, kind: 'maintenance', id: runId })) as { body: string }[])
        .map(row => JSON.parse(row.body));
}
export const unsettled = (intent: EffectIntent) => intent.status === 'dispatching' || intent.status === 'uncertain';

/** The read-back of one attempted publication Effect from its saved payload and writer; nothing is sent. */
async function readBack(store: Store, execute: Execute, run: MaintenanceRun, intent: Readonly<EffectIntent>): Promise<ReadBack> {
    const payload = intent.payload as Record<string, any>, author = savedAuthor(intent);
    if (intent.operation === 'github-issue-create') {
        const issue = settlingIssue(store, await allIssues(store, execute), payload as CreatePayload, author, intent.receipt);
        return { verified: !!issue, receipt: issue };
    }
    if (intent.operation === 'git-push') {
        const tip = await exactRemoteHead(execute, { branch: payload.branch, worktree: store.project.repo });
        return { verified: tip === payload.head && intent.target === `${store.project.repository}:${payload.branch}`, receipt: { head: payload.head } };
    }
    if (intent.operation === 'github-pr-create') {
        // Settled only against what this create dispatched: the retained bytes must be the ones it digested, and the
        // draft it read must target the base it saved and close the issue it saved, whatever the project says now.
        const candidate = run.publication?.candidates.find(entry => entry.draft?.branch === payload.branch && entry.draft?.head === payload.head), draft = candidate?.draft;
        if (!draft || draft.issue === undefined || !originalDraft(intent, draft, candidate.issue?.url)) return { verified: false, receipt: null };
        let found: Awaited<ReturnType<typeof matchingDraft>>;
        try { found = await matchingDraft(store, execute, { branch: payload.branch, head: payload.head, issueUrl: payload.issue, title: draft.title, body: draft.body, base: payload.base }); }
        catch { return { verified: false, receipt: null }; }
        return found && found.author === author ? { verified: true, receipt: settledReceipt(intent.receipt, found) } : { verified: false, receipt: null };
    }
    if (intent.operation === 'github-issue-comment') {
        const comments = (await readRepo(store, execute, `issues/${payload.issue}/comments?per_page=100`, true) as any[]).filter(comment => String(comment?.body || '').includes(payload.marker));
        const [comment] = comments;
        const ok = comments.length === 1 && comment.body === payload.body && comment.user?.login === author && comment.html_url === `${intent.target}#issuecomment-${comment.id}`;
        return { verified: ok, receipt: ok ? { id: comment.id, url: comment.html_url } : null };
    }
    return { verified: false, receipt: null };
}

/**
 * Settles every attempted publication operation of a run by read-back under its saved writer, bound to that run
 * (#612, FIND-002). An unknown operation or an incomplete verification keeps the run stopped and is reported; nothing
 * is resent and nothing is cleared by a search miss. `authorize`, when given, runs after each read and before its
 * settlement is saved: a refusal leaves that Effect as it was.
 */
export async function reconcilePublication(store: Store, run: MaintenanceRun, execute: Execute, authorize: () => void = () => {}): Promise<{ settled: boolean; remaining: string[] }> {
    const remaining: string[] = [];
    for (const intent of runEffects(store, run.id).filter(unsettled)) {
        if (!(PUBLICATION_OPERATIONS as readonly string[]).includes(intent.operation)) { remaining.push(`${intent.operation} ${intent.target} (unknown to publication read-back)`); continue; }
        const verified = await reconcileGitHubWrite(store, intent.id, async saved => { const read = await readBack(store, execute, run, saved); authorize(); return read; });
        if (!verified) remaining.push(`${intent.operation} ${intent.target}`);
    }
    return { settled: !remaining.length, remaining };
}

export const versionedMaintenanceRun = (run: MaintenanceRun) => !!(run.stop || run.publication || run.steps.some(step => step.publicationVersion === 1));

/** Provider completion alone does not establish that the run saved a worker's result. */
export function unresolvedMaintenanceWorkers(store: Store, run: MaintenanceRun) {
    const decided = new Set(run.publication?.candidates.map(candidate => candidate.issueDecision?.workerId));
    const pending = new Set((store.state.workLog || []).filter(work => work.requestId === run.id && work.stage !== 'maintenance-readback' && work.processId
        && !(work.stage === 'proposal-issue' && work.executionStatus === 'completed' && decided.has(work.id))));
    let since = Date.parse(run.startedAt || run.requestedAt);
    for (const step of run.steps) {
        if (step.stage === 'maintenance-readback') continue;
        const savedAt = Date.parse(step.at);
        const matching = [...pending].filter(work => work.role === step.role && (work.stage === step.stage
            || work.stage === 'proposal-issue' && step.stage === 'proposal' && step.publicationVersion === 1 && step.result.outcome === 'reroute')
            && work.executionStatus === 'completed' && Date.parse(work.startedAt) >= since && Date.parse(work.endedAt) <= savedAt);
        // Each step can account for one worker from its interval. Ambiguous matches still need native evidence.
        if (matching.length === 1) pending.delete(matching[0]);
        since = savedAt;
    }
    return [...pending];
}

export function harnessOnlyStop(store: Store, run: MaintenanceRun): boolean {
    return versionedMaintenanceRun(run) && unresolvedMaintenanceWorkers(store, run).length === 0;
}
