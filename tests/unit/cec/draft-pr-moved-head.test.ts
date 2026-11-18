import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { draftHeadMovedForward } from '../../../server/cec/draft-pr-moved-head';
import { DATA } from '../../../server/office/config';
import { cecPrompt } from '../../../server/cec/prompts/cec';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import { NEW, OLD, draft, git, saved } from './moved-head-fixtures';
import { STAGE_ROLE as STAGE_ROLE_FOR } from '../../../src/shared';
import type { Stage, StageResult } from '../../../src/shared';

const carried = { commit: OLD, worktree: '/worktree' };

test('a passing draft pull request on a head that contains the accepted candidate has moved forward', async () => {
    expect(await draftHeadMovedForward(git() as any, carried, draft())).toBe(true);
});

test.each([
    ['the accepted candidate itself', draft({ commit: OLD }), {}],
    ['a head that does not contain the accepted candidate', draft(), { contains: false }],
    ['a worktree that is not on the reported head', draft(), { head: 'c'.repeat(40) }],
    ['an unreadable worktree', draft(), { fail: true }],
    ['a result that did not pass', draft({ outcome: 'blocked' }), {}],
    ['a result with no pull request', draft({ prId: 0 }), {}],
    ['a result with no draft pull request receipt', draft({ receipts: [draft().receipts[0]] }), {}],
    ['a result with an unverified write', draft({ receipts: [...draft().receipts, { id: 'x', action: 'jira-comment', target: 't', verified: false, uncertain: false, detail: '' }] }), {}],
    ['a result with a write of unknown outcome', draft({ receipts: [...draft().receipts, { id: 'x', action: 'git-push', target: 't', verified: true, uncertain: true, detail: '' }] }), {}],
])('%s is not a forward move', async (_name, result, state) => {
    expect(await draftHeadMovedForward(git(state) as any, carried, result)).toBe(false);
});

test('the pull request is recorded, the merged head is confirmed, reviewed and retested, and the ticket goes to publish without drafting again', async () => {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'draft-pr' as const, activity: 'waiting' as const, commit: OLD, prId: 0, worktree: '/worktree',
        approach: { plan: 'none', review: 'full', validation: 'independent-checks', checks: ['Focused checks'], reason: 'Unit route' } as any,
        repairCycle: { owner: 'developer', findingAttempts: { F1: 1 }, attempts: 8, pendingFindingIds: ['F1'], sourceStage: 'retest', sourceHead: OLD, phase: 'repair', approachRevision: 1 } as any };
    const run = t.runId;
    t.results.repair = decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, commit: OLD, evidence: [saved(run, 'old-checks', 'checks', OLD)] });
    t.results['repair-review'] = decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, commit: OLD, evidence: [saved(run, 'old-review', 'review', OLD)] });
    t.results.retest = decision('', { outcome: 'passed', resolution: null, blocker: '', prId: 0, commit: OLD, paidRuns: 0, evidence: [saved(run, 'old-qa', 'checks', OLD)],
        receipts: [{ id: 'c', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: '' }] });
    store.state.tickets = [t];
    const engine = new Engine(store), stages: Stage[] = [], prompts: Partial<Record<Stage, string>> = {};
    const worktree = git();
    engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? worktree(program, args, options) : jira.execute(program, args, options)) as any);
    engine.agents.transition = async (_ticket, target) => { jira.state[t.key].status = target;
        return { ...decision(''), outcome: 'passed', resolution: null, blocker: '', summary: `Moved to ${target}`, receipts: [{ id: 'status', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic read-back' }] }; };
    const script: Partial<Record<Stage, () => StageResult>> = {
        'draft-pr': () => draft({ findings: [{ id: 'MERGE-001', summary: 'Renumbered the migration', expected: '', actual: '', status: 'fixed', attempts: 0 } as any] }),
        repair: () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'Checks pass on the merged head.', paidRuns: 0, prId: 0, commit: NEW, evidence: [saved(run, 'new-checks', 'checks', NEW)] }),
        'repair-review': () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'The merge is sound.', paidRuns: 0, prId: 0, commit: NEW, findings: [{ id: 'MERGE-001', summary: 'Renumbered the migration', expected: '', actual: '', status: 'verified', attempts: 0 } as any], evidence: [saved(run, 'new-review', 'review', NEW)] }),
        retest: () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'Retested on the merged head.', prId: 0, commit: NEW, paidRuns: 0, findings: [{ id: 'MERGE-001', summary: 'Renumbered the migration', expected: '', actual: '', status: 'verified', attempts: 0 } as any], evidence: [saved(run, 'new-qa', 'checks', NEW)] }),
        publish: () => decision('', { resolution: null, commit: NEW, summary: 'End of the scripted path', blocker: 'End of the scripted path' }),
    };
    engine.agents.stage = async (current, stage) => { stages.push(stage); prompts[stage] = cecPrompt(store, current, stage, STAGE_ROLE_FOR[stage]!, resolve(DATA, 'runs', run)); return script[stage]!(); };

    await engine.run(t.key);
    let live = store.ticket(t.key);
    // Recorded, not refused: the pull request is on the ticket and the old commit is still the accepted candidate.
    expect(live).toMatchObject({ stage: 'repair', activity: 'waiting', blocker: '', prId: 4242, commit: OLD, attempt: 1, headMove: { from: OLD, to: NEW, prId: 4242 } });
    // What the draft result carried forward is kept for the review and the retest to settle.
    expect(live.findings.map(item => [item.id, item.status])).toEqual([['MERGE-001', 'fixed']]);
    expect(live.results['draft-pr']).toMatchObject({ outcome: 'passed', prId: 4242, commit: NEW });
    expect(live.repairCycle).toMatchObject({ attempts: 8, findingAttempts: { F1: 1 } });

    for (let i = 0; i < 8 && store.ticket(t.key).activity !== 'blocked'; i++) await engine.run(t.key);
    live = store.ticket(t.key);
    expect(stages).toEqual(['draft-pr', 'repair', 'repair-review', 'retest', 'publish']);
    expect(live).toMatchObject({ stage: 'publish', commit: NEW, prId: 4242, blocker: 'End of the scripted path' });
    expect(live.headMove).toMatchObject({ confirmed: NEW });
    // One Dev update, for the draft pull request: the confirming pass fixed nothing and posts none.
    expect(jira.state[t.key].comments.filter((comment: any) => JSON.stringify(comment).includes('Dev update'))).toHaveLength(1);
    expect(live.repairCycle).toMatchObject({ attempts: 8, findingAttempts: { F1: 1 } });
    for (const stage of ['repair', 'repair-review', 'retest'] as Stage[]) expect(prompts[stage], stage).toContain('HEAD MOVED AT DRAFT PR');
    expect(prompts.publish).not.toContain('HEAD MOVED AT DRAFT PR');
});

test('a draft pull request on the accepted candidate behaves as before, and a head that does not contain it is still refused', async () => {
    for (const [name, result, state, expected] of [
        ['same head', draft({ commit: OLD }), {}, { blocker: '', prId: 4242 }],
        ['rewritten head', draft(), { contains: false }, { stage: 'draft-pr', activity: 'blocked', blocker: 'Evidence does not match the current candidate commit', prId: 0 }],
    ] as const) {
        const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
        const t = { ...ticket('QA'), stage: 'draft-pr' as const, activity: 'waiting' as const, commit: OLD, prId: 0, worktree: '/worktree', approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['x'], reason: 'y' } as any };
        store.state.tickets = [t];
        const engine = new Engine(store), worktree = git(state);
        engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? worktree(program, args, options) : jira.execute(program, args, options)) as any);
        engine.agents.stage = async () => result;
        await engine.run(t.key);
        expect(store.ticket(t.key), name).toMatchObject(expected);
        expect(store.ticket(t.key).headMove, name).toBeUndefined();
    }
});

