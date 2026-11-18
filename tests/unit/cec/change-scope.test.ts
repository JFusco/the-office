import { expect, test } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { applyChangeScope, endChangeScope, statedApproach, verifiedCandidate } from '../../../server/cec/change-scope';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import { NEW, OLD, draft, git, passed, readback, saved, stopped } from './moved-head-fixtures';
import type { Stage, StageResult, Ticket, WorkApproach } from '../../../src/shared';

const full: WorkApproach = { plan: 'none', review: 'full', validation: 'browser', checks: ['Acceptance A', 'Acceptance B'], reason: 'Ticket approach' };
const narrow: WorkApproach = { plan: 'reviewed', review: 'none', validation: 'independent-checks', checks: ['Typecheck', 'Migration test'], reason: 'Only the target branch was merged in' };
const base = () => ({ approach: full, commit: OLD, worktree: '/worktree', results: { 'repair-review': passed({ commit: OLD }), retest: passed({ commit: OLD }) } as Ticket['results'] });
const repair = (extra: Partial<StageResult> = {}) => passed({ commit: NEW, approach: narrow, ...extra });

test('a candidate is verified when the review and QA the approach selects both passed on it with nothing left open', () => {
    expect(verifiedCandidate(base())).toBe(OLD);
    expect(verifiedCandidate({ ...base(), approach: { ...full, review: 'none' }, results: { retest: passed({ commit: OLD }) } })).toBe(OLD);
    expect(verifiedCandidate({ ...base(), results: { 'code-review': passed({ commit: OLD }), qa: passed({ commit: OLD }) } })).toBe(OLD);
    for (const [name, changed] of [
        ['QA on another commit', { results: { ...base().results, retest: passed({ commit: NEW }) } }],
        ['QA that failed', { results: { ...base().results, retest: passed({ commit: OLD, outcome: 'failed' }) } }],
        ['QA with a finding not verified', { results: { ...base().results, retest: passed({ commit: OLD, findings: [{ id: 'F', status: 'fixed' } as any] }) } }],
        ['QA with unknown provider usage', { results: { ...base().results, retest: passed({ commit: OLD, paidRuns: null }) } }],
        ['a review with an open finding', { results: { ...base().results, 'repair-review': passed({ commit: OLD, findings: [{ id: 'F', status: 'open' } as any] }) } }],
        ['no review on this commit', { results: { retest: passed({ commit: OLD }) } }],
        ['a retest that failed on it, though the approach selects no independent validation', { approach: { ...full, validation: 'developer-checks' }, results: { ...base().results, retest: passed({ commit: OLD, outcome: 'failed' }) } }],
        ['a review that was blocked, though the approach selects no review', { approach: { ...full, review: 'none' }, results: { 'code-review': passed({ commit: OLD, outcome: 'blocked' }), retest: passed({ commit: OLD }) } }],
        ['an approach that selects neither', { approach: { ...full, review: 'none', validation: 'developer-checks' } }],
        ['a change already being verified at its own scope', { changeScope: { base: OLD, approach: full } }],
        ['a ticket bound to a feature', { featureBinding: {} }],
        ['no approach', { approach: undefined }],
    ] as const) expect(verifiedCandidate({ ...base(), ...changed } as any), name).toBe('');
});

test('what a repair states on a verified candidate is the scope for its change when git shows its commit contains that candidate', async () => {
    expect(await statedApproach(git() as any, base(), 'repair', repair())).toBe('scope');
    expect(await statedApproach(git() as any, base(), 'repair', repair({ approach: { ...full, validation: 'independent-checks' } }))).toBe('scope');
    // The same levels with other checks are still what this change needs, not a new approach for the ticket.
    expect(await statedApproach(git() as any, base(), 'repair', repair({ approach: { ...full, checks: ['Build passes'] } }))).toBe('scope');
});

test('a scope that cannot be shown to sit on the verified candidate is ignored, and nothing stated during a scope replaces it', async () => {
    for (const [name, ticket, result, state] of [
        ['a commit that does not contain the verified candidate', base(), repair(), { contains: false }],
        ['an unreadable worktree', base(), repair(), { fail: true }],
        ['the verified commit itself', base(), repair({ commit: OLD }), {}],
        ['no worktree', { ...base(), worktree: '' }, repair(), {}],
    ] as const) expect(await statedApproach(git(state) as any, ticket as any, 'repair', result), name).toBe('ignored');
    const scoped = { ...base(), commit: NEW, changeScope: { base: OLD, approach: full } };
    for (const stage of ['repair-review', 'retest', 'publish', 'repair'] as Stage[]) expect(await statedApproach(git() as any, scoped, stage, repair({ approach: full })), stage).toBe('ignored');
});

test('a wider approach, an approach stated where no candidate is verified, and a restatement are the ticket-wide rule\'s to decide', async () => {
    for (const [name, ticket, stage, result] of [
        ['a wider review', { ...base(), approach: { ...full, review: 'focused' } }, 'repair', repair({ approach: full })],
        ['a wider validation with a narrower review', { ...base(), approach: { ...full, validation: 'independent-checks' } }, 'repair', repair({ approach: { ...full, review: 'none' } })],
        ['the ticket\'s approach restated', base(), 'repair', repair({ approach: { ...full, reason: 'Restated' } })],
        ['another stage', base(), 'retest', repair()],
        ['a candidate that is not verified', { ...base(), results: {} }, 'repair', repair()],
    ] as const) expect(await statedApproach(git() as any, ticket as any, stage as Stage, result), name).toBe('ticket');
});

test('the scope becomes the approach for this change, keeps the ticket\'s plan level and its approach to return to, and is recorded as a decision', () => {
    const t = { ...ticket(), ...base() } as Ticket;
    applyChangeScope(t, narrow, 'developer', 'repair', '2026-11-18T00:00:00.000Z');
    expect(t.approach).toEqual({ ...narrow, plan: 'none' });
    expect(t.changeScope).toEqual({ base: OLD, approach: full });
    expect(t.decisions?.at(-1)).toEqual({ role: 'developer', stage: 'repair', at: '2026-11-18T00:00:00.000Z', approach: { ...narrow, plan: 'none' } });
    expect(endChangeScope(t, 'publish', '2026-11-18T01:00:00.000Z')).toBe(true);
    expect(t).toMatchObject({ approach: full });
    expect(t.changeScope).toBeUndefined();
    // The return is on record, so the latest decision is the approach in force.
    expect(t.decisions?.at(-1)).toEqual({ role: 'pm', stage: 'publish', at: '2026-11-18T01:00:00.000Z', approach: full });
    expect(endChangeScope(t, 'publish', '')).toBe(false);
});

test('a ticket whose review once failed keeps a review on the change, because publication requires one on the current head', () => {
    const t = { ...ticket(), ...base() } as Ticket;
    t.results['code-review'] = passed({ commit: 'd'.repeat(40), outcome: 'blocked' });
    applyChangeScope(t, narrow, 'developer', 'repair', '');
    expect(t.approach).toMatchObject({ review: 'focused', validation: 'independent-checks' });
});

/** A ticket sent back to repair on a candidate that review and QA already passed, with its draft pull request open. */
function verifiedTicket(extra: Partial<Ticket> = {}) {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'repair' as Stage, activity: 'waiting' as const, commit: OLD, prId: 4242, worktree: '/worktree', approach: full, ...extra } as Ticket;
    const run = t.runId;
    t.results.implement = passed({ commit: OLD, evidence: [saved(run, 'impl', 'checks', OLD)] });
    t.results['code-review'] = passed({ commit: OLD, evidence: [saved(run, 'review', 'review', OLD)] });
    t.results['draft-pr'] = draft({ commit: OLD });
    t.results.qa = passed({ commit: OLD, evidence: [saved(run, 'qa', 'checks', OLD)], receipts: [{ id: 'c', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: '' }] });
    store.state.tickets = [t];
    const engine = new Engine(store), worktree = git(), stages: Stage[] = [];
    engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? worktree(program, args, options) : jira.execute(program, args, options)) as any);
    engine.agents.transition = async (_ticket, target) => { jira.state[t.key].status = target;
        return { ...decision(''), outcome: 'passed', resolution: null, blocker: '', summary: `Moved to ${target}`, receipts: [{ id: 'status', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic read-back' }] }; };
    const script = (results: Partial<Record<Stage, () => StageResult>>) => { engine.agents.stage = async (_ticket, stage) => { stages.push(stage); return results[stage]!(); }; };
    const drive = async () => { for (let i = 0; i < 8 && store.ticket(t.key).activity !== 'blocked' && store.ticket(t.key).stage !== 'ci'; i++) await engine.run(t.key); return store.ticket(t.key); };
    return { store, t, run, stages, script, drive };
}

test('a scoped change is reviewed and tested at its scope, published, and the ticket then returns to its own approach', async () => {
    const { t, run, stages, script, drive } = verifiedTicket();
    const scopes: Partial<Record<Stage, WorkApproach | undefined>> = {};
    const seen = (stage: Stage, result: StageResult) => () => { scopes[stage] = structuredClone(t.approach); return result; };
    script({
        repair: seen('repair', repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] })),
        retest: seen('retest', passed({ commit: NEW, evidence: [saved(run, 'merge-qa', 'checks', NEW)] })),
        publish: seen('publish', passed({ commit: NEW, prId: 4242, receipts: [{ id: 'publish', action: 'publish-pr', target: 'https://example.test/pullrequest/4242', verified: true, uncertain: false, detail: 'Read back' }] })),
    });
    const live = await drive();
    // No review was selected for the change, so the repair goes straight to the retest; QA covers the scope's checks only.
    expect(stages).toEqual(['repair', 'retest', 'publish']);
    expect(scopes.retest).toEqual({ ...narrow, plan: 'none' });
    expect(scopes.publish).toEqual({ ...narrow, plan: 'none' });
    expect(live).toMatchObject({ stage: 'ci', commit: NEW, approach: full });
    expect(live.changeScope).toBeUndefined();
});

test('a scoped change that has to come back for another repair is verified at the ticket\'s own approach from then on', async () => {
    const { store, t, run, script, drive } = verifiedTicket();
    script({
        repair: () => repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] }),
        retest: () => passed({ commit: NEW, outcome: 'failed', blocker: 'The migration fails on a fresh database', findings: [{ id: 'MERGE-1', summary: 'Migration fails', expected: '', actual: '', status: 'open', attempts: 0 } as any] }),
    });
    await drive(); await drive();
    const live = store.ticket(t.key);
    expect(live.approach).toEqual(full);
    expect(live.changeScope).toBeUndefined();
    expect(store.state.events.some(event => event.kind === 'change-scope-ended')).toBe(true);
});

test('a repair on a candidate that is not verified keeps the ticket-wide rule: a reduction with work unresolved is refused', async () => {
    const { store, t, run, script, drive } = verifiedTicket();
    t.results.qa = passed({ commit: OLD, outcome: 'failed', blocker: 'Case 3 fails' });
    script({ repair: () => repair({ evidence: [saved(run, 'checks', 'checks', NEW)] }) });
    const live = await drive();
    expect(live.approach).toEqual(full);
    expect(live.changeScope).toBeUndefined();
    expect(live).toMatchObject({ activity: 'blocked' });
    expect(store.ticket(t.key).blocker).toContain('before reducing required verification or review');
});

test('the pass that confirms a head moved at the draft pull request may scope the re-verification of that move', async () => {
    const { store, engine, t } = stopped(), run = t.runId, live = () => store.ticket(t.key), stages: Stage[] = [];
    // Review and QA passed on the candidate before the draft pull request moved the head; a review had failed earlier.
    Object.assign(live(), { approach: full });
    live().results.implement = passed({ commit: OLD, evidence: [saved(run, 'impl', 'checks', OLD)] });
    live().results['code-review'] = passed({ commit: 'd'.repeat(40), outcome: 'blocked', blocker: 'Earlier review' });
    live().results['repair-review'] = passed({ commit: OLD, evidence: [saved(run, 'old-review', 'review', OLD)] });
    live().results.retest = passed({ commit: OLD, evidence: [saved(run, 'old-qa', 'checks', OLD)], receipts: [{ id: 'c', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: '' }] });
    engine.agents.readback = readback(4242) as any;
    await engine.resume(t.key, false);
    engine.agents.stage = async (_ticket, stage) => { stages.push(stage);
        return stage === 'repair' ? repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] })
            : stage === 'repair-review' ? passed({ commit: NEW, evidence: [saved(run, 'merge-review', 'review', NEW)] })
                : stage === 'retest' ? passed({ commit: NEW, evidence: [saved(run, 'merge-qa', 'checks', NEW)] })
                    : decision('', { resolution: null, commit: NEW, summary: 'End of the scripted path', blocker: 'End of the scripted path' }); };
    for (let i = 0; i < 8 && live().activity !== 'blocked'; i++) await engine.run(t.key);
    // The earlier failed review keeps a quick review on the merge; QA runs the scope's checks, not the ticket's browser acceptance.
    expect(stages).toEqual(['repair', 'repair-review', 'retest', 'publish']);
    expect(live()).toMatchObject({ stage: 'publish', commit: NEW, prId: 4242, approach: { review: 'focused', validation: 'independent-checks', checks: narrow.checks }, changeScope: { base: OLD, approach: full } });
});

test('a scoped retest that fails without anything to repair keeps its scope, so a rerun is judged the same way', async () => {
    const { store, t, run, script, drive } = verifiedTicket();
    script({
        repair: () => repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] }),
        retest: () => passed({ commit: NEW, outcome: 'failed', blocker: 'The check runner could not start' }),
    });
    await drive();
    expect(store.ticket(t.key)).toMatchObject({ stage: 'retest', activity: 'blocked', approach: { ...narrow, plan: 'none' }, changeScope: { base: OLD } });
});

test('the same levels with other checks are this change\'s scope, not a new approach for the ticket', async () => {
    const { run, script, drive } = verifiedTicket();
    const restated: WorkApproach = { ...full, checks: ['Build passes'], reason: 'Build fix only' };
    script({
        repair: () => repair({ approach: restated, evidence: [saved(run, 'build', 'checks', NEW)] }),
        'repair-review': () => passed({ commit: NEW, evidence: [saved(run, 'build-review', 'review', NEW)] }),
        retest: () => passed({ commit: NEW, evidence: [saved(run, 'build-qa', 'browser', NEW)] }),
    });
    const live = await drive();
    expect(live).toMatchObject({ approach: restated, changeScope: { base: OLD, approach: full } });
});

test('an approach stated by the publish of a scoped change is not applied: the scope is judged as set, and the ticket then returns to its own approach', async () => {
    const { run, script, drive } = verifiedTicket();
    script({
        repair: () => repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] }),
        retest: () => passed({ commit: NEW, evidence: [saved(run, 'merge-qa', 'checks', NEW)] }),
        publish: () => passed({ commit: NEW, prId: 4242, approach: full, receipts: [{ id: 'publish', action: 'publish-pr', target: 'https://example.test/pullrequest/4242', verified: true, uncertain: false, detail: 'Read back' }] }),
    });
    const live = await drive();
    expect(live).toMatchObject({ stage: 'ci', blocker: '', approach: full });
    expect(live.changeScope).toBeUndefined();
});

test('the review the harness keeps on a change is not refused as a gate added after the fact', async () => {
    const { store, t, run, stages, script, drive } = verifiedTicket({ approach: { ...full, review: 'none' } });
    const live = () => store.ticket(t.key);
    live().results['code-review'] = passed({ commit: 'd'.repeat(40), outcome: 'blocked', blocker: 'Earlier review' });
    live().results['repair-review'] = passed({ commit: OLD, evidence: [saved(run, 'old-review', 'review', OLD)] });
    script({ repair: () => repair({ evidence: [saved(run, 'merge-checks', 'checks', NEW)] }), 'repair-review': () => decision('', { resolution: null, commit: NEW, summary: 'End of the scripted path', blocker: 'End of the scripted path' }) });
    await drive();
    expect(stages).toEqual(['repair', 'repair-review']);
    expect(live().approach).toMatchObject({ review: 'focused' });
    expect(live().blocker).toBe('End of the scripted path');
});
