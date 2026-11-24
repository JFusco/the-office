import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { resumeStep } from '../../../server/cec/resume-step';
import { unrecordedStageResult } from '../../../server/cec/unrecorded-result';
import { fakeJira } from './parking/fake-jira';
import { readback } from './moved-head-fixtures';
import { decision, ticket } from './parking/fixtures';
import type { StageResult } from '../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => { try { s.close(); } catch { /* closed */ } }); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
const KEY = 'CEC-900', VERDICT = 'Needs a Target DXP';

/** One Office process on a store file, with Jira shared across restarts; no PM transition or worker may run. */
function office(root: string, path: string, jira: ReturnType<typeof fakeJira>, clock: Store['clock']) {
    const store = new Store(path, projectById('cec'), resolve(root, 'data'), clock); stores.push(store);
    const engine = new Engine(store), spent = { transitions: 0, workers: 0 };
    engine.jira = new JiraOperations(store, jira.execute);
    engine.agents.transition = async () => { spent.transitions++; throw new Error('No PM transition on adoption'); };
    engine.agents.stage = async () => { spent.workers++; throw new Error('No worker on adoption'); };
    engine.agents.readback = readback(9) as any;
    return { store, engine, spent };
}

/** A retest whose worker returned and whose QA comment the harness posted, saved to its attempt and never to the ticket. */
async function returnedRetest(arrange: (jira: ReturnType<typeof fakeJira>) => void = () => undefined) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-adoption-restart-')); roots.push(root);
    let now = Date.parse('2026-10-31T20:00:00Z');
    const clock = { now: () => new Date(now), monotonic: () => now, advance: (ms: number) => { now += ms; } };
    const jira = fakeJira({ [KEY]: { status: 'QA' } });
    const first = office(root, resolve(root, 'office.sqlite'), jira, clock);
    const t = { ...ticket('QA'), stage: 'retest' as const, activity: 'waiting' as const };
    t.results.retest = decision('', { outcome: 'failed', summary: 'Earlier retest', commit: 'b'.repeat(40), resolution: null });
    first.store.state.tickets = [t];
    const attemptId = first.store.begin(t, 'retest');
    let returned: StageResult = decision('', { summary: VERDICT, blocker: VERDICT, resolution: null });
    clock.advance(1000);
    const startedAt = clock.now().toISOString();
    arrange(jira);
    try { await first.engine.jira.qaComment(t, 'retest', attemptId, returned); }
    catch (error) {
        // What the runner keeps when the comment's response was lost (ticket-stage-runner.ts).
        returned = { ...returned, outcome: 'blocked', blocker: `QA outcome retained; Jira comment requires read-back: ${String(error)}` };
        returned.receipts.push({ id: `qa-comment:${attemptId}`, action: 'jira-comment', target: KEY, verified: false, uncertain: true, detail: returned.blocker! });
    }
    Object.assign(jira.faults, { loseCommentResponse: false, failReads: false });
    clock.advance(1000);
    first.store.state.workLog = [{ id: 'run-1', ticket: KEY, stage: 'retest', role: 'qa', status: 'blocked', executionStatus: 'completed', startedAt, endedAt: clock.now().toISOString() } as any];
    clock.advance(1000);
    first.store.finish(attemptId, returned);
    first.store.save();
    let crashed: ReturnType<typeof office> | undefined;
    /** The process dies here: a second process opens what was on disk and runs start-up recovery. */
    const crash = () => {
        if (crashed) return;
        const copy = resolve(root, 'restarted.sqlite');
        first.store.db.exec(`VACUUM INTO '${copy}'`);
        crashed = office(root, copy, jira, clock);
        crashed.store.recover();
        // The dead process's pipeline lock lapses before the next one runs.
        clock.advance(120_000);
    };
    return { first, jira, attemptId, crash, restarted: () => crashed! };
}

const comments = (receipts: StageResult['receipts']) => receipts.filter(receipt => receipt.action === 'jira-comment' && receipt.verified && !receipt.uncertain);
const creates = (jira: ReturnType<typeof fakeJira>) => jira.calls.filter(args => args[2] === 'comment' && args[3] === 'create').length;

test.each<[string, (f: Awaited<ReturnType<typeof returnedRetest>>) => void]>([
    ['before the result is applied', f => f.first.store.listeners.add(event => { if (event.kind === 'stage-result-recovered') f.crash(); })],
    ['after the Jira comment is verified', f => { const post = f.first.engine.jira.qaComment.bind(f.first.engine.jira); f.first.engine.jira.qaComment = async (...args) => { const posted = await post(...args); f.crash(); return posted; }; }],
    ['after the verdict is saved', f => f.first.store.listeners.add(event => { if (event.kind === 'stage-blocked') f.crash(); })],
])('a restart %s ends on the returned verdict, one Jira comment and receipt, and no further worker', async (_point, interrupt) => {
    const f = await returnedRetest();
    interrupt(f);
    await f.first.engine.run(KEY);
    const after = f.restarted();
    const t = after.store.ticket(KEY);
    // A verdict already on the ticket is settled: nothing is applied again and nothing needs resuming.
    if (t.results.retest?.summary !== VERDICT) {
        expect(resumeStep(after.store, t)).toBe('apply-returned-result');
        await after.engine.resume(KEY, false);
        await after.engine.run(KEY);
    }
    const live = after.store.ticket(KEY);
    expect(live.results.retest).toMatchObject({ outcome: 'blocked', summary: VERDICT });
    expect(unrecordedStageResult(after.store, live, 'retest')).toBeUndefined();
    expect(after.store.db.prepare("SELECT id FROM attempts WHERE ticket=? AND stage='retest'").all(KEY)).toEqual([{ id: f.attemptId }]);
    expect([creates(f.jira), after.spent.transitions, after.spent.workers, f.first.spent.workers]).toEqual([1, 0, 0, 0]);
    expect(after.store.db.prepare("SELECT id, status FROM effects WHERE id LIKE 'qa-comment:%'").all()).toEqual([{ id: `qa-comment:${f.attemptId}`, status: 'verified' }]);
    expect(comments(live.results.retest!.receipts)).toHaveLength(1);
});

test('a restart on a candidate that moved does not apply the returned result; the resume reads it back', async () => {
    const f = await returnedRetest();
    f.first.store.listeners.add(event => { if (event.kind === 'stage-result-recovered') f.crash(); });
    await f.first.engine.run(KEY);
    const after = f.restarted(), t = after.store.ticket(KEY);
    t.commit = 'c'.repeat(40);
    expect(resumeStep(after.store, t)).toBe('reconstruct');
});

test('a comment whose response was lost is never posted again when the returned result is applied; the next resume reads it back', async () => {
    const f = await returnedRetest(jira => { jira.faults.loseCommentResponse = true; });
    expect(f.first.store.getEffect(`qa-comment:${f.attemptId}`)?.status).toBe('uncertain');
    f.first.store.listeners.add(event => { if (event.kind === 'stage-result-recovered') f.crash(); });
    await f.first.engine.run(KEY);
    const after = f.restarted();
    expect(resumeStep(after.store, after.store.ticket(KEY))).toBe('apply-returned-result');
    await after.engine.resume(KEY, false);
    await after.engine.run(KEY);
    const live = after.store.ticket(KEY);
    expect([creates(f.jira), after.spent.workers]).toEqual([1, 0]);
    expect(after.store.getEffect(`qa-comment:${f.attemptId}`)?.status).toBe('uncertain');
    expect(live).toMatchObject({ activity: 'blocked', recoveredAttemptId: f.attemptId });
    expect(resumeStep(after.store, live)).toBe('reconstruct');
});
