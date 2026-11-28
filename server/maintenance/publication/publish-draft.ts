import { lintPRContent } from '../../delivery/publication/pr-body';
import { digest } from '../../store/readback-evidence';
import { pushMaintenanceCandidate } from './push-candidate';
import { createMaintenanceDraft } from './create-draft';
import { linkMaintenanceIssue, readLinkComment } from './link-issue';
import { matchingDraft } from './pr-lookup';
import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { exactRemoteHead } from '../../delivery/publication/remote-head';
import { completeGroup } from './group-record';
import { assertNoOutstandingPublication } from './publication-gate';
import type { MaintenanceOwner } from './maintenance-effect';
import type { LintIsolation } from './lint-isolation';
import type { LaunchQualificationRefusal } from '../../workers/launch-qualification';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenanceGroupRecord, MaintenancePublicationCandidate } from '../../../src/shared';

type Execute = typeof command;
export interface DraftInput { title: string; body: string; head: string; draftStep: number }
export interface DraftDependencies {
    /** Runs the repository's candidate-defined PR checks inside the confined boundary (`confined-runner.ts`). */
    confined: Execute;
    /** The reviewed candidate is still exactly what was reviewed, under the run's authority. */
    assertCandidate: () => Promise<void>;
    /** Every launch policy of this chain is still qualified; a refusal before the first fresh write. */
    qualified: () => LaunchQualificationRefusal | undefined;
    /** Whether candidate-defined lint may run (`lint-isolation.ts`); production refuses until its isolation is reviewed. */
    lintIsolation: LintIsolation;
}

/**
 * Publishes a versioned maintenance draft from its saved content (#612): the exact approved bytes are bound to the
 * verified issue, owned worktree, branch, reviewed head and target, linted with the confined runner, then pushed
 * once, opened as one draft and linked to its issue, each through its own Effect and each read back. The group's
 * completion record is written only when all four are verified. A replay continues from what is recorded and from
 * the deterministic Effect ids; nothing is resent. While a draft still needs its lint, an unreviewed lint isolation
 * refuses first, before anything is bound or saved and before any candidate script runs. A title is published
 * byte for byte as approved; one with surrounding whitespace or a line break is refused rather than normalized.
 */
export async function publishMaintenanceDraft(store: Store, execute: Execute, owner: MaintenanceOwner, progress: MaintenancePublicationCandidate, input: DraftInput, deps: DraftDependencies): Promise<MaintenanceGroupRecord> {
    if (progress.completed) return progress.completed;
    const { issue, candidate } = progress;
    if (!issue || !candidate) throw new Error('A maintenance draft needs its verified issue and owned candidate');
    if (!progress.pr) {
        const unreviewed = deps.lintIsolation();
        if (unreviewed) throw unreviewed;
    }
    const content = { title: input.title, body: input.body };
    if (!content.title.trim() || !content.body.trim()) throw new Error('The draft content needs a nonblank title and body');
    if (content.title !== content.title.trim() || /[\r\n]/.test(content.title))
        throw new Error('The approved draft title has surrounding whitespace or a line break; the harness publishes titles exactly as approved and will not normalize it');
    const bound = { title: content.title, body: content.body, contentSha256: digest(content), head: input.head, issue: issue.number, branch: candidate.branch, worktree: candidate.worktree, target: store.project.target };
    if (progress.draft) {
        const { at: _at, ...saved } = progress.draft;
        if (JSON.stringify(saved) !== JSON.stringify(bound)) throw new Error('The approved draft content or its binding changed; reconcile before publication');
    } else {
        progress.draft = { ...bound, at: store.clock.now().toISOString() };
        progress.draftStep = input.draftStep;
        store.save();
    }
    const fresh = !progress.push || !progress.pr || !progress.link;
    const refusal = fresh ? deps.qualified() : undefined;
    if (refusal) throw refusal;
    assertNoOutstandingPublication(store, owner.run.id, [`${store.project.repository}:${candidate.branch}`, issue.url]);
    if (!progress.pr) await lintPRContent(deps.confined, candidate.worktree, { ...content, source: 'developer' }, issue.number);
    if (!progress.push) {
        const pushed = await pushMaintenanceCandidate(store, execute, owner, { branch: candidate.branch, worktree: candidate.worktree, head: input.head, base: candidate.base, hooks: candidate.hooks }, deps.assertCandidate);
        progress.push = { effectId: pushed.effectId, head: input.head, ...(pushed.observed ? { observed: pushed.observed } : {}), at: store.clock.now().toISOString() };
        store.save();
    }
    const expected = { branch: candidate.branch, head: input.head, issueUrl: issue.url, title: content.title, body: content.body };
    if (!progress.pr) {
        const created = await createMaintenanceDraft(store, execute, owner, { ...expected, worktree: candidate.worktree });
        progress.pr = { effectId: created.effectId, number: created.number, url: created.url, head: input.head, adopted: created.adopted, at: store.clock.now().toISOString() };
        store.save();
    }
    if (!progress.link) {
        const pr = progress.pr;
        const linked = await linkMaintenanceIssue(store, execute, owner, { issue: issue.number, issueUrl: issue.url, pr: pr.number, prUrl: pr.url },
            async () => (await matchingDraft(store, execute, expected))?.number === pr.number);
        progress.link = { effectId: linked.effectId, commentId: linked.id, url: linked.url, at: store.clock.now().toISOString() };
        store.save();
    }
    // Each part is read once more before the group counts as published: the issue, the remote ref, the linked draft
    // and the recorded link comment (its ID, URL, author and exact body).
    const live = await readRepo(store, execute, `issues/${issue.number}`) as { state?: string; html_url?: string; pull_request?: unknown };
    const remote = await exactRemoteHead(execute, { branch: candidate.branch, worktree: candidate.worktree });
    const draft = await matchingDraft(store, execute, expected);
    const comment = await readLinkComment(store, execute, owner, { issue: issue.number, issueUrl: issue.url, pr: progress.pr.number, prUrl: progress.pr.url });
    if (live.state !== 'open' || live.html_url !== issue.url || live.pull_request || remote !== input.head || draft?.number !== progress.pr.number)
        throw new Error('The published issue, branch or draft no longer reads back as verified; the group is not complete');
    if (!comment || comment.id !== progress.link.commentId || comment.url !== progress.link.url)
        throw new Error('The recorded link comment no longer reads back on the issue; the group is not complete');
    const record = completeGroup(progress, store.clock.now().toISOString());
    store.save();
    return record;
}
