import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { confirmsMovedHead, movedHeadUnconfirmed, recordConfirmedHead, routeConfirmedHead } from '../../../server/cec/confirm-moved-head';
import { DATA } from '../../../server/office/config';
import { cecPrompt } from '../../../server/cec/prompts/cec';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import { NEW, OLD, draft, git, passed, readback, saved, stopped } from './moved-head-fixtures';
import { STAGE_ROLE } from '../../../src/shared';
import type { Stage, StageResult } from '../../../src/shared';

const FIXED = 'c'.repeat(40), move = { from: OLD, to: NEW, prId: 4242, at: '' };

test('the confirming repair must report the moved head or a commit that contains it', async () => {
    const t = { commit: OLD, worktree: '/worktree', headMove: move };
    expect(await movedHeadUnconfirmed(git() as any, t, 'repair', passed({ commit: NEW }))).toBe('');
    expect(await movedHeadUnconfirmed(git() as any, t, 'repair', passed({ commit: FIXED }))).toBe('');
    expect(await movedHeadUnconfirmed(git() as any, t, 'repair', passed({ commit: OLD }))).toBe(`The repair must confirm the head the draft pull request was opened on (${NEW.slice(0, 10)}); it reported ${OLD.slice(0, 10)}`);
    expect(await movedHeadUnconfirmed(git({ contains: false }) as any, t, 'repair', passed({ commit: FIXED }))).toContain('must confirm the head');
    // A repair that did not pass, another stage, a ticket with no move and a repair after the head is confirmed are not this rule's business.
    expect(await movedHeadUnconfirmed(git() as any, t, 'repair', passed({ commit: OLD, outcome: 'failed' }))).toBe('');
    expect(await movedHeadUnconfirmed(git() as any, t, 'retest', passed({ commit: OLD }))).toBe('');
    expect(await movedHeadUnconfirmed(git() as any, { ...t, headMove: undefined }, 'repair', passed({ commit: OLD }))).toBe('');
    expect(await movedHeadUnconfirmed(git() as any, { ...t, commit: NEW, headMove: { ...move, confirmed: NEW } }, 'repair', passed({ commit: NEW }))).toBe('');
});

test('only the first passing repair on the old candidate is the confirming pass, and it records the commit it settled on', () => {
    const t = { commit: OLD, headMove: { ...move } as typeof move & { confirmed?: string } };
    expect(confirmsMovedHead(t, 'repair')).toBe(true);
    expect(confirmsMovedHead(t, 'retest')).toBe(false);
    recordConfirmedHead(t, 'repair', passed({ commit: FIXED, outcome: 'failed' }));
    expect(t.headMove.confirmed).toBeUndefined();
    recordConfirmedHead(t, 'repair', passed({ commit: FIXED }));
    expect(t.headMove.confirmed).toBe(FIXED);
    expect(confirmsMovedHead(t, 'repair')).toBe(false);
});

test('a head confirmed before any QA goes on to the selected validation; one QA has already seen is retested', () => {
    const base = { stage: 'retest' as Stage, commit: NEW, headMove: { ...move, confirmed: NEW }, results: {} as any };
    const routed = (validation: string, extra = {}) => { const t = { ...base, approach: { validation } as any, ...extra }; routeConfirmedHead(t); return t.stage; };
    expect(routed('browser')).toBe('preview');
    expect(routed('independent-checks')).toBe('qa');
    expect(routed('developer-checks')).toBe('publish');
    expect(routed('browser', { results: { retest: passed({ commit: OLD }) } })).toBe('retest');
    expect(routed('browser', { commit: FIXED })).toBe('retest');
    expect(routed('browser', { headMove: undefined })).toBe('retest');
    expect(routed('browser', { stage: 'repair-review' })).toBe('repair-review');
});

test('a confirming repair that reports the old commit is refused and leaves the ticket where it can be run again', async () => {
    const { store, engine, t } = stopped();
    engine.agents.readback = readback(4242) as any;
    await engine.resume(t.key, false);
    engine.agents.stage = async () => passed({ commit: OLD, evidence: [saved(t.runId, 'stale-checks', 'checks', OLD)] });
    await engine.run(t.key);
    expect(store.ticket(t.key)).toMatchObject({ stage: 'repair', activity: 'blocked', commit: OLD, blocker: `The repair must confirm the head the draft pull request was opened on (${NEW.slice(0, 10)}); it reported ${OLD.slice(0, 10)}` });
    expect(store.ticket(t.key).headMove?.confirmed).toBeUndefined();
});

test('a confirming repair reconstructed on resume is held to the same rule', async () => {
    const { store, engine, t } = stopped();
    engine.agents.readback = readback(4242) as any;
    await engine.resume(t.key, false);
    const live = store.ticket(t.key);
    // The confirming run was cut off with a write of unknown outcome; the resume reconstructs it by read-back.
    live.results.repair = passed({ outcome: 'blocked', blocker: 'Interrupted', commit: OLD, receipts: [{ id: 'push', action: 'git-push', target: 'origin', verified: false, uncertain: true, detail: '' }] });
    live.activity = 'blocked'; live.blocker = 'Interrupted';
    engine.agents.reconcile = async () => passed({ commit: OLD, evidence: [saved(t.runId, 'reconciled-checks', 'checks', OLD)] });
    await expect(engine.resume(t.key, false)).rejects.toThrow('Reconciliation incomplete: The repair must confirm the head the draft pull request was opened on');
    engine.agents.reconcile = async () => passed({ commit: NEW, evidence: [saved(t.runId, 'reconciled-new', 'checks', NEW)] });
    await engine.resume(t.key, false);
    expect(store.ticket(t.key)).toMatchObject({ stage: 'repair-review', commit: NEW, headMove: { confirmed: NEW } });
});

test('a confirming pass that had to fix a check still has the merge reviewed and tested: the notes follow the commit it settled on', async () => {
    const { store, engine, t } = stopped();
    engine.agents.readback = readback(4242) as any;
    await engine.resume(t.key, false);
    const prompts: Partial<Record<Stage, string>> = {};
    engine.agents.stage = async (current, stage) => { prompts[stage] = cecPrompt(store, current, stage, STAGE_ROLE[stage]!, resolve(DATA, 'runs', t.runId));
        return stage === 'repair' ? passed({ commit: FIXED, evidence: [saved(t.runId, 'fixed-checks', 'checks', FIXED)] })
            : stage === 'repair-review' ? passed({ commit: FIXED, evidence: [saved(t.runId, 'fixed-review', 'review', FIXED)] })
                : decision('', { resolution: null, commit: FIXED, summary: 'End of the scripted path', blocker: 'End of the scripted path' }); };
    for (let i = 0; i < 6 && store.ticket(t.key).activity !== 'blocked'; i++) await engine.run(t.key);
    expect(store.ticket(t.key).blocker).toBe('End of the scripted path');
    expect(store.ticket(t.key).headMove).toMatchObject({ confirmed: FIXED });
    expect(Object.keys(prompts)).toEqual(['repair', 'repair-review', 'qa']);
    for (const stage of ['repair', 'repair-review', 'qa'] as Stage[]) expect(prompts[stage], stage).toContain('HEAD MOVED AT DRAFT PR');
});

test('a head that moves before any QA is confirmed and reviewed, then goes on to the validation the approach selected', async () => {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    const t = { ...ticket('In Progress'), stage: 'draft-pr' as const, activity: 'waiting' as const, commit: OLD, prId: 0, worktree: '/worktree',
        approach: { plan: 'none', review: 'full', validation: 'independent-checks', checks: ['Focused checks'], reason: 'Unit route' } as any };
    t.results.implement = decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, commit: OLD, evidence: [saved(t.runId, 'impl-checks', 'checks', OLD)] });
    store.state.tickets = [t];
    const engine = new Engine(store), stages: Stage[] = [], worktree = git();
    engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? worktree(program, args, options) : jira.execute(program, args, options)) as any);
    engine.agents.transition = async (_ticket, target) => { jira.state[t.key].status = target;
        return { ...decision(''), outcome: 'passed', resolution: null, blocker: '', summary: `Moved to ${target}`, receipts: [{ id: 'status', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic read-back' }] }; };
    engine.agents.stage = async (_ticket, stage) => { stages.push(stage);
        return stage === 'draft-pr' ? draft() : stage === 'repair' ? decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, commit: NEW, evidence: [saved(t.runId, 'pre-checks', 'checks', NEW)] })
            : stage === 'repair-review' ? decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, commit: NEW, evidence: [saved(t.runId, 'pre-review', 'review', NEW)] })
                : decision('', { resolution: null, commit: NEW, summary: 'End of the scripted path', blocker: 'End of the scripted path' }); };
    for (let i = 0; i < 8 && store.ticket(t.key).activity !== 'blocked'; i++) await engine.run(t.key);
    expect(stages).toEqual(['draft-pr', 'repair', 'repair-review', 'qa']);
    expect(store.ticket(t.key)).toMatchObject({ stage: 'qa', commit: NEW, prId: 4242 });
});
