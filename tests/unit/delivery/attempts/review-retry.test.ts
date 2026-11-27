import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { exitFailure } from '../../../../server/workers/exit-failure';
import { Coordinator } from '../../../../server/scheduling/coordination';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import { noteDeliveryStop } from '../../../../server/delivery/attempts/stop-evidence';
import { captureGitHubFailures, noteGitHubFailure } from '../../../../server/github/refusal-capture';
import type { TicketJob } from '../../../../src/shared';

afterEach(cleanupFakes);
const PR_URL = `https://github.com/${REPOSITORY}/pull/200`, GH_376 = 'gh exited 1: gh: HTTP 499';

/** An adopted Lead review of PR 200: no checkout of its own, stopped where the native-link lookup failed on GH-376's 499. */
function adoptedReview() {
    const f = fakeGitHub();
    f.store.state.paused = false;
    f.delivery.enqueue('GH-5', 200, undefined, { kind: 'linked-pr', reference: PR_URL });
    const job = f.delivery.jobs.at(-1)!;
    Object.assign(job, { stage: 'lead-pr', head: HEAD, branch: 'codex/5-fix' });
    f.state.prs.push({ number: 200, html_url: PR_URL, state: 'open', draft: false, title: 'fix(x): y', body: 'Closes #5', head: { sha: HEAD, ref: 'codex/5-fix' },
        base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null, updated_at: '2026-11-24T18:00:00Z' });
    f.state.cards[0].status = 'review';
    let linkFails = true, assessments = 0;
    // The real exit classifier decides the failure from the command's own readOnly option.
    const execute = async (program: string, args: string[], options: any = {}) => {
        if (linkFails && program === 'gh' && args[0] === 'pr' && args[1] === 'view') throw exitFailure('gh', GH_376, !!options.readOnly);
        return f.execute(program, args, options);
    };
    f.delivery.execute = execute as any;
    f.engine.agents.run = (async (_role: string, _task: string, _schema: unknown, options: { stage: string }) => { assessments++; throw new Error(`stop at ${options.stage}`); }) as any;
    const claimed = async (owner: string, work: () => Promise<unknown>) => {
        const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, owner, job.stage)!;
        try { await withAssignment(claim, 'delivery', work); } finally { f.store.finishClaim(claim.id, 'completed'); }
    };
    const coordinator = new Coordinator(f.store, f.engine, execute as any);
    return { f, job, execute, claimed, pump: () => claimed('scheduler', () => coordinator.pump({ kind: 'delivery', id: job.id })), heal: () => { linkFails = false; }, assessments: () => assessments };
}

test('a Lead review whose read-only native-link lookup fails on a 499 is a transient stop, retried through the pump to Lead assessment on the unchanged head', async () => {
    const r = adoptedReview();
    expect(r.job).toMatchObject({ existingPR: true, worktree: '' });
    await r.claimed('lead-review', () => r.f.delivery.step(r.job));
    expect(r.job).toMatchObject({ status: 'blocked', detail: `Error: ${GH_376}`, stop: { kind: 'transient' } });
    reconcileReadRetries(r.f.store, new Date());
    expect(r.job.retry).toMatchObject({ attempts: 0, limit: 3, binding: { mode: 'read', head: HEAD, pr: 200, branch: 'codex/5-fix', worktree: '' } });
    reconcileReadRetries(r.f.store, new Date(r.job.retry!.nextAt));
    expect(r.job.status).toBe('queued');
    r.heal();
    await r.pump();
    // No checkout was created or needed; the ordinary assessment ran on the live head.
    expect(r.assessments()).toBe(1);
    expect(r.job.detail).toContain('stop at github-lead-pr');
    expect(r.f.state.calls.some(call => call.startsWith('git worktree add'))).toBe(false);
});

test('a changed remote head withdraws the stale review retry before any assessment', async () => {
    const r = adoptedReview();
    await r.claimed('lead-review', () => r.f.delivery.step(r.job));
    reconcileReadRetries(r.f.store, new Date());
    reconcileReadRetries(r.f.store, new Date(r.job.retry!.nextAt));
    r.heal();
    r.f.state.prs[0].head.sha = 'c'.repeat(40);
    await r.pump();
    expect(r.assessments()).toBe(0);
    expect(r.job).toMatchObject({ status: 'blocked' });
    expect(r.job.retry!.withdrawn?.reason).toContain('ordinary PR observation takes its new head');
});

test('a successful Lead readiness wait retires the quota episode and preserves the counted budget', async () => {
    const r = adoptedReview(), start = new Date();
    let now = start;
    r.f.store.clock = { now: () => now, monotonic: () => now.getTime() };
    const minutesAfter = (time: Date, minutes: number) => new Date(time.getTime() + minutes * 60_000);
    const detail = 'gh exited 1: gh: API rate limit exceeded (HTTP 403)';
    const fail = (retryAt: Date) => captureGitHubFailures(async () => {
        const at = now.toISOString();
        noteGitHubFailure({ args: 'read-pr', at, text: detail, readOnly: true,
            refusal: { at, text: detail, readOnly: true, principal: 'operator', resource: 'core', secondary: false, deadline: retryAt.toISOString() } });
        Object.assign(r.job, { status: 'blocked', detail, stop: { kind: 'transient', at } });
        noteDeliveryStop(r.f.store, r.job, new Error(detail), now);
    });
    const prior = { at: start.toISOString(), detail: GH_376 };
    r.job.retry = { attempts: 1, history: [prior], nextAt: '', exhausted: false, stage: 'lead-pr', head: HEAD, limit: 3 };
    await fail(minutesAfter(now, 1));
    reconcileReadRetries(r.f.store, now);
    now = minutesAfter(start, 1);
    reconcileReadRetries(r.f.store, now);
    const history = [...r.job.retry!.history];
    r.heal();
    r.f.state.prs[0].draft = true;
    await r.pump();
    expect(r.job).toMatchObject({ stage: 'lead-pr', head: HEAD, status: 'watching', stop: { kind: 'pr-not-ready' }, retry: { attempts: 1, history } });
    expect(r.job.retry!.failure).toBeUndefined();
    expect(r.job.retry!.quota).toBeUndefined();
    expect(r.assessments()).toBe(0);

    now = minutesAfter(start, 7 * 60);
    const deadline = minutesAfter(now, 20);
    await fail(deadline);
    reconcileReadRetries(r.f.store, now);
    expect(r.job.retry).toMatchObject({ quota: { since: now.toISOString() }, exhausted: false, attempts: 1, nextAt: deadline.toISOString() });
    expect(r.job.retry!.history.slice(0, history.length)).toEqual(history);
});

test('a failed write carrying the same HTTP text stays uncertain and is never scheduled', async () => {
    const r = adoptedReview();
    const write = exitFailure('gh', GH_376, false);
    expect(write.category).toBe('uncertain-effect');
    // The same lookup made without the read-only mark, as it was before: the classifier calls it a write.
    r.f.delivery.execute = (async (program: string, args: string[], options: any = {}) => {
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'view') throw exitFailure('gh', GH_376, false);
        return r.f.execute(program, args, options);
    }) as any;
    await r.claimed('lead-review', () => r.f.delivery.step(r.job));
    expect(r.job.stop?.kind).toBe('uncertain-effect');
    reconcileReadRetries(r.f.store, new Date());
    expect(r.job.retry?.nextAt ?? '').toBe('');
    expect(r.job.status).toBe('blocked');
});

test.each(['408', '429', '499', '500', '502', '503', '504'])('HTTP %s on a review read is retried at review and Lead review', status => {
    const f = fakeGitHub();
    f.store.state.paused = false;
    for (const stage of ['review', 'lead-pr'] as const) {
        const job = f.candidate({ stage, status: 'blocked', detail: `Error: gh exited 1: gh: HTTP ${status}`, stop: { kind: 'transient', at: new Date().toISOString() } }) as TicketJob;
        reconcileReadRetries(f.store, new Date());
        expect(job.retry?.nextAt, `${stage} ${status}`).toBeTruthy();
        job.status = 'cancelled';
    }
});
