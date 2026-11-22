import { afterEach, expect, test } from 'vitest';
import { writerRestartPending } from '../../../../server/delivery/attempts/restart-writer';
import { boardPreflightCandidate } from '../../../../server/delivery/recovery/board-preflight';
import { closeoutRecoveryCandidate } from '../../../../server/delivery/recovery/closeout/closeout-recovery-evidence';
import { savedNegativeContinuationReview } from '../../../../server/delivery/recovery/implementation/continuation-review-readback';
import { implementationRecoveryCandidate } from '../../../../server/delivery/recovery/implementation/implementation-recovery';
import { hasSavedPrerequisiteResult, savedPrerequisiteOriginal } from '../../../../server/delivery/recovery/implementation/saved-prerequisite-handoff';
import { completedConflictDraftCandidate } from '../../../../server/delivery/recovery/preparation/post-conflict-preparation';
import { postConflictReadbackCandidate, preparationReadbackCandidate } from '../../../../server/delivery/recovery/preparation/preparation-readback';
import { publishedDraftConflictCandidate } from '../../../../server/delivery/recovery/preparation/published-draft-conflict';
import { scopeRepairResumeCandidate } from '../../../../server/delivery/recovery/scope-repair/scope-repair-resume';
import { stoppedBaseHandoffResolved } from '../../../../server/delivery/recovery/stopped-base-disposition';
import { stoppedBaseUpdateCandidate } from '../../../../server/delivery/recovery/stopped-base-update';
import { validationReadbackCandidate } from '../../../../server/delivery/recovery/validation/validation-readback';
import { HANDLER_RULES, routeHeadFault, type HandlerRules } from '../../../../server/incidents/repair/route-head';
import type { Store } from '../../../../server/store/store';
import { completedExecution } from '../../../../server/workers/worker-completion';
import type { TicketJob } from '../../../../src/shared';
import { projectStore } from '../incident-fixture';
import { job } from './repair-wait-fixture';
import { rules, run } from './route-head-fixture';

const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); });

/** A project whose first job is the one asked about. */
function world(...jobs: Record<string, unknown>[]) {
    const store = projectStore(); stores.push(store);
    store.state.coordination!.jobs = (jobs.length ? jobs : [job('1')]) as TicketJob[];
    const first = store.state.coordination!.jobs![0];
    return { store, job: first, fault: (action: string, head: string, over: Partial<HandlerRules> = {}) => routeHeadFault(store, first, action, head, rules(over)) };
}
const NOTHING = (action: string, head: string) => `${action} has nothing to read for GH-1 ${head ? `under ${head}` : 'without a head'} as the job stands.`;
const READS = (action: string, expected: string, head: string) => `${action} for GH-1 reads ${expected || 'its saved result, with no head'}; the route names ${head || 'no head'}.`;
const never = () => { throw new Error('not to be asked'); };

test('each rule is the handler\'s own function, under the name that says which', () => {
    const own: Record<keyof HandlerRules, unknown> = {
        savedPrerequisite: hasSavedPrerequisiteResult, savedPrerequisiteOriginal, implementation: implementationRecoveryCandidate, validation: validationReadbackCandidate, scopeRepair: scopeRepairResumeCandidate,
        publishedDraft: publishedDraftConflictCandidate, completedDraft: completedConflictDraftCandidate, postConflictPreparation: postConflictReadbackCandidate, preparation: preparationReadbackCandidate,
        boardPreflight: boardPreflightCandidate, stoppedBaseUpdate: stoppedBaseUpdateCandidate, writerRestartPending, closeout: closeoutRecoveryCandidate,
        baseHandoffResolved: stoppedBaseHandoffResolved, completedRun: completedExecution, continuationReview: savedNegativeContinuationReview,
    };
    expect(Object.keys(HANDLER_RULES).sort()).toEqual(Object.keys(own).sort());
    for (const [name, rule] of Object.entries(own)) expect(HANDLER_RULES[name as keyof HandlerRules], name).toBe(rule);
});

test('a route that reads one original run takes that run\'s ID and no other', () => {
    for (const [action, rule] of [['reconcile-validation', 'validation'], ['reconcile-scope-repair', 'scopeRepair'], ['reconcile-implementation', 'implementation']] as const) {
        const w = world(), named = { [rule]: () => run('worker-1') };
        expect(w.fault(action, 'worker-1', named), action).toBeNull();
        expect(w.fault(action, 'worker-2', named), action).toBe(READS(action, 'worker-1', 'worker-2'));
        expect(w.fault(action, '', named), action).toBe(READS(action, 'worker-1', ''));
        // With no run named there is nothing to read, with a head or without.
        expect(w.fault(action, 'worker-1'), action).toBe(NOTHING(action, 'worker-1'));
        expect(w.fault(action, ''), action).toBe(NOTHING(action, ''));
        // Each asks its own rule and only that one: every other names another run.
        const others = Object.fromEntries((['validation', 'scopeRepair', 'implementation', 'closeout', 'preparation'] as const).filter(other => other !== rule).map(other => [other, () => run('worker-9')]));
        expect(w.fault(action, 'worker-1', { ...others, ...named }), action).toBeNull();
        expect(w.fault(action, 'worker-9', others), action).toBe(NOTHING(action, 'worker-9'));
    }
});

test('reconcile-implementation takes the writer the saved-prerequisite handoff reads, when a saved prerequisite result sends it there, else the recovery candidate\'s', () => {
    const action = 'reconcile-implementation', w = world(), asked: unknown[] = [];
    // Two completed writers carry a saved prerequisite result; the handoff reads only the later one.
    const saved: Partial<HandlerRules> = {
        savedPrerequisite: (store, job, head) => { asked.push(['result', store === w.store, job === w.job, head]); return ['worker-6', 'worker-7'].includes(head); },
        savedPrerequisiteOriginal: (store, job, head) => { asked.push(['original', store === w.store, job === w.job, head]); if (head !== 'worker-7') throw new Error('One exact completed original writer required'); return {}; },
        implementation: () => run('worker-1'),
    };
    expect(w.fault(action, 'worker-7', saved)).toBeNull();
    expect(w.fault(action, 'worker-6', saved)).toBe('What reconcile-implementation reads for GH-1 could not be established: Error: One exact completed original writer required');
    // Without a saved prerequisite result for that head the handoff is not asked: the recovery candidate's run is what is read.
    expect(w.fault(action, 'worker-1', saved)).toBeNull();
    expect(w.fault(action, 'worker-2', saved)).toBe(READS(action, 'worker-1', 'worker-2'));
    expect(asked).toEqual([['result', true, true, 'worker-7'], ['original', true, true, 'worker-7'], ['result', true, true, 'worker-6'], ['original', true, true, 'worker-6'], ['result', true, true, 'worker-1'], ['result', true, true, 'worker-2']]);
    // The handoff's writer is taken without the recovery candidate being asked.
    expect(w.fault(action, 'worker-7', { ...saved, implementation: never })).toBeNull();
});

test('reconcile-preparation takes the run its stage\'s rule names, and no head only when no original stands', () => {
    const action = 'reconcile-preparation';
    const cases: [string, string, Partial<HandlerRules>, string, string | null][] = [
        // stage, status, rules, head, fault
        ['draft', 'blocked', { publishedDraft: () => run('draft-1'), completedDraft: () => run('draft-2') }, 'draft-1', null],
        ['draft', 'blocked', { publishedDraft: () => run('draft-1'), completedDraft: () => run('draft-2') }, 'draft-2', READS(action, 'draft-1', 'draft-2')],
        ['draft', 'blocked', { completedDraft: () => run('draft-2') }, 'draft-2', null],
        ['draft', 'blocked', { completedDraft: () => run('draft-2') }, 'draft-1', READS(action, 'draft-2', 'draft-1')],
        // At draft the read-back rules are not what is read, even when one names a run.
        ['draft', 'blocked', { preparation: () => run('prepare-1') }, 'prepare-1', NOTHING(action, 'prepare-1')],
        ['draft', 'blocked', {}, 'draft-1', NOTHING(action, 'draft-1')],
        ['prepare-pr', 'blocked', { postConflictPreparation: () => run('prepare-2'), preparation: () => run('prepare-1') }, 'prepare-2', null],
        ['prepare-pr', 'blocked', { postConflictPreparation: () => run('prepare-2'), preparation: () => run('prepare-1') }, 'prepare-1', READS(action, 'prepare-2', 'prepare-1')],
        ['prepare-pr', 'blocked', { preparation: () => run('prepare-1') }, 'prepare-1', null],
        // Past draft the draft rules are not what is read.
        ['prepare-pr', 'blocked', { completedDraft: () => run('draft-2') }, 'draft-2', NOTHING(action, 'draft-2')],
        ['prepare-pr', 'blocked', {}, 'prepare-1', NOTHING(action, 'prepare-1')],
        // Without a head: the saved result of a finished blocked preparation, and only while no original stands.
        ['prepare-pr', 'blocked', {}, '', null],
        ['prepare-pr', 'interrupted', {}, '', NOTHING(action, '')],
        ['draft', 'blocked', {}, '', NOTHING(action, '')],
        ['prepare-pr', 'blocked', { preparation: () => run('prepare-1') }, '', READS(action, 'prepare-1', '')],
        ['prepare-pr', 'blocked', { postConflictPreparation: () => run('prepare-2') }, '', READS(action, 'prepare-2', '')],
        ['draft', 'blocked', { publishedDraft: () => run('draft-1') }, '', READS(action, 'draft-1', '')],
        ['draft', 'blocked', { completedDraft: () => run('draft-2') }, '', READS(action, 'draft-2', '')],
        // An original of the other stage still rules out the saved-result form.
        ['prepare-pr', 'blocked', { completedDraft: () => run('draft-2') }, '', NOTHING(action, '')],
    ];
    for (const [stage, status, named, head, fault] of cases)
        expect(world(job('1', { stage, status })).fault(action, head, named), JSON.stringify([stage, status, Object.keys(named), head])).toBe(fault);
});

test('reconcile-base-update takes the board preflight\'s commit, else the stopped run, else no head', () => {
    const action = 'reconcile-base-update', w = world(job('1', { stage: 'update-base', status: 'interrupted' }));
    const preflight = { boardPreflight: () => ({ head: 'c'.repeat(40) }) }, stopped = { stoppedBaseUpdate: () => ({ head: 'worker-1' }) };
    expect(w.fault(action, 'c'.repeat(40), preflight)).toBeNull();
    expect(w.fault(action, 'worker-1', { ...preflight, ...stopped })).toBe(READS(action, 'c'.repeat(40), 'worker-1'));
    // With a preflight the stopped-run rule is not asked: it throws for some jobs.
    expect(w.fault(action, 'c'.repeat(40), { ...preflight, stoppedBaseUpdate: never })).toBeNull();
    expect(w.fault(action, 'worker-1', stopped)).toBeNull();
    expect(w.fault(action, '', stopped)).toBe(READS(action, 'worker-1', ''));
    // Neither: the saved result of a stopped base update, which takes no head.
    expect(w.fault(action, '')).toBeNull();
    expect(w.fault(action, 'worker-1')).toBe(READS(action, '', 'worker-1'));
    for (const [stage, status] of [['update-base', 'queued'], ['review', 'blocked']])
        expect(world(job('1', { stage, status })).fault(action, ''), stage).toBe(NOTHING(action, ''));
    // A dead writer the harness may still restart: the stopped-run rule names nothing until a request is queued, and then the handler reads that run. Neither form is taken.
    const restartable: Partial<HandlerRules> = { writerRestartPending: (store, asked) => store === w.store && asked === w.job };
    expect(w.fault(action, '', restartable)).toBe(NOTHING(action, ''));
    expect(w.fault(action, 'worker-1', restartable)).toBe(NOTHING(action, 'worker-1'));
    // A lease is read before that question is asked.
    expect(w.fault(action, 'worker-1', { ...stopped, writerRestartPending: never })).toBeNull();
    expect(world(job('1', { stage: 'update-base', status: 'blocked' })).fault(action, '')).toBeNull();
});

test('reconcile-closeout takes a pending cleanup\'s original run, else the recovery candidate\'s, else no head', () => {
    const action = 'reconcile-closeout', pending = { closeoutRecovery: { status: 'cleanup-pending', originalWorkId: 'closeout-1' } };
    const cleaning = world(job('1', { stage: 'closeout', ...pending }));
    expect(cleaning.fault(action, 'closeout-1')).toBeNull();
    expect(cleaning.fault(action, 'closeout-2')).toBe(READS(action, 'closeout-1', 'closeout-2'));
    expect(cleaning.fault(action, '')).toBe(READS(action, 'closeout-1', ''));
    // While a cleanup is pending the candidate rule is not what is read.
    expect(cleaning.fault(action, 'closeout-2', { closeout: () => run('closeout-2') })).toBe(READS(action, 'closeout-1', 'closeout-2'));
    // A recovery that is past its cleanup is not pending.
    const cleaned = world(job('1', { stage: 'closeout', closeoutRecovery: { status: 'completed', originalWorkId: 'closeout-1' } }));
    expect(cleaned.fault(action, 'closeout-1')).toBe(READS(action, '', 'closeout-1'));
    const stopped = world(job('1', { stage: 'closeout' })), named = { closeout: () => run('closeout-2') };
    expect(stopped.fault(action, 'closeout-2', named)).toBeNull();
    expect(stopped.fault(action, 'closeout-1', named)).toBe(READS(action, 'closeout-2', 'closeout-1'));
    expect(stopped.fault(action, '', named)).toBe(READS(action, 'closeout-2', ''));
    // Neither: the saved closeout result, at closeout only.
    expect(stopped.fault(action, '')).toBeNull();
    expect(stopped.fault(action, 'closeout-1')).toBe(READS(action, '', 'closeout-1'));
    expect(world(job('1', { stage: 'merge' })).fault(action, '')).toBe(NOTHING(action, ''));
    // The saved closeout is found by key and stage alone: a cancelled closeout of the same key that comes first is the one read, not this job.
    const cancelled = { ...job('1', { stage: 'closeout' }), id: 'old', status: 'cancelled' };
    expect(world(job('1', { stage: 'closeout' }), cancelled).fault(action, '')).toBeNull();
    const behind = world(job('1', { stage: 'closeout' }), cancelled);
    behind.store.state.coordination!.jobs!.reverse();
    expect(routeHeadFault(behind.store, behind.job, action, '', rules())).toBe(NOTHING(action, ''));
    // A cancelled job of that key at another stage, in front, is not the one read.
    const elsewhere = world(job('1', { stage: 'closeout' }), { ...job('1', { stage: 'merge' }), id: 'old', status: 'cancelled' });
    elsewhere.store.state.coordination!.jobs!.reverse();
    expect(routeHeadFault(elsewhere.store, elsewhere.job, action, '', rules())).toBeNull();
    // A cancelled job of the same key with a pending cleanup sends a headed request to the cleanup, which this job has none of.
    const beside = world(job('1', { stage: 'closeout' }), { ...job('1'), id: 'old', status: 'cancelled', ...pending });
    expect(beside.fault(action, 'closeout-2', named)).toBe(NOTHING(action, 'closeout-2'));
    expect(beside.fault(action, '')).toBe(NOTHING(action, ''));
});

test('reconcile-review without a head is not checked; with one it takes the started base handoff\'s run or a saved negative continuation review\'s', () => {
    const action = 'reconcile-review';
    // Without a head nothing is asked, whatever the job looks like.
    const all = Object.fromEntries(Object.keys(rules()).map(name => [name, never])) as unknown as HandlerRules;
    const unasked = world(job('1'), job('1', { id: 'twin' }));
    expect(routeHeadFault(unasked.store, unasked.job, action, '', all)).toBeNull();
    // With a head and nothing else, the handler would read the saved review, which takes none.
    expect(world().fault(action, 'worker-1')).toBe(READS(action, '', 'worker-1'));

    const handoff = (over: Record<string, unknown> = {}, runs: Record<string, unknown>[] = [{ id: 'handoff-1', claimId: 'claim-1' }], phase = 'lead') => {
        const w = world(job('1', { stage: 'lead-pr', stoppedBaseUpdate: { phase, handoffStarted: { claimId: 'claim-1' } }, ...over }));
        w.store.state.workLog = runs.map(run => ({ requestId: '1', stage: 'stopped-base-update-handoff', ...run })) as never;
        return w;
    };
    const completed: Partial<HandlerRules> = { completedRun: (_store, work) => work.id === 'handoff-1' };
    for (const phase of ['lead', 'checkout']) expect(handoff({}, undefined, phase).fault(action, 'handoff-1', completed), phase).toBeNull();
    // The handoff is read from that run's own completion, at the PR review: without either there is nothing to read yet.
    expect(handoff().fault(action, 'handoff-1')).toBe(NOTHING(action, 'handoff-1'));
    expect(handoff().fault(action, 'handoff-1', { completedRun: (_store, work) => work.id !== 'handoff-1' })).toBe(NOTHING(action, 'handoff-1'));
    expect(handoff({ stage: 'update-base' }).fault(action, 'handoff-1', completed)).toBe(NOTHING(action, 'handoff-1'));
    // Another run, a second handoff run, another claim, a job that is not stopped: each is one the handler throws for.
    expect(handoff({}, [{ id: 'handoff-1', claimId: 'claim-1' }, { id: 'handoff-2', claimId: 'claim-1' }]).fault(action, 'handoff-1', completed)).toBe(NOTHING(action, 'handoff-1'));
    expect(handoff({}, [{ id: 'handoff-1', claimId: 'claim-2' }]).fault(action, 'handoff-1', completed)).toBe(NOTHING(action, 'handoff-1'));
    expect(handoff({ status: 'working' }).fault(action, 'handoff-1', completed)).toBe(NOTHING(action, 'handoff-1'));
    // A run of another job or another stage is not a handoff run of this one.
    expect(handoff({}, [{ id: 'handoff-1', claimId: 'claim-1', requestId: '2' }]).fault(action, 'handoff-1')).toBe(READS(action, '', 'handoff-1'));
    expect(handoff({}, [{ id: 'handoff-1', claimId: 'claim-1', stage: 'github-lead-pr' }]).fault(action, 'handoff-1')).toBe(READS(action, '', 'handoff-1'));
    // A head that is no handoff run, or a handoff outside lead and checkout, is read as a review instead.
    expect(handoff().fault(action, 'worker-9')).toBe(READS(action, '', 'worker-9'));
    expect(handoff({}, undefined, 'audit').fault(action, 'handoff-1')).toBe(READS(action, '', 'handoff-1'));
    // A handoff already resolved answers for its one run, whatever the phase, and for no other.
    const resolved: Partial<HandlerRules> = { baseHandoffResolved: (_store, request) => request.key === 'GH-1' && request.head === 'handoff-1' };
    // A resolved handoff has its completion in what resolved it; the run is not asked again, and the stage no longer matters.
    expect(handoff({}, undefined, 'review').fault(action, 'handoff-1', { ...resolved, completedRun: never })).toBeNull();
    expect(handoff({ stage: 'merge' }, undefined, 'review').fault(action, 'handoff-1', resolved)).toBeNull();
    expect(handoff({}, [{ id: 'handoff-1', claimId: 'claim-2' }], 'review').fault(action, 'handoff-1', resolved)).toBe(NOTHING(action, 'handoff-1'));
    // Even a rule that calls every head resolved answers only for the run the handoff holds, as the handler itself insists.
    expect(handoff({}, undefined, 'review').fault(action, 'worker-9', { baseHandoffResolved: () => true })).toBe(NOTHING(action, 'worker-9'));
    // Without a started handoff the recovery is not consulted at all.
    expect(world(job('1', { stoppedBaseUpdate: { phase: 'lead' } })).fault(action, 'handoff-1', { baseHandoffResolved: never })).toBe(READS(action, '', 'handoff-1'));
    // The handler looks the recovery up by key alone: one on a cancelled job that comes first is the one it finds, and is not this job's.
    const shadowed = world(job('1', { stage: 'lead-pr' }), { ...job('1', { stoppedBaseUpdate: { phase: 'lead', handoffStarted: { claimId: 'claim-1' } } }), id: 'old', status: 'cancelled' });
    shadowed.store.state.coordination!.jobs!.reverse();
    shadowed.store.state.workLog = [{ id: 'handoff-1', claimId: 'claim-1', requestId: 'old', stage: 'stopped-base-update-handoff' }] as never;
    expect(routeHeadFault(shadowed.store, shadowed.job, action, 'handoff-1', rules(completed))).toBe(NOTHING(action, 'handoff-1'));

    // A continuation before the PR review reads the saved negative review the rule accepts for that head.
    const continued = world(job('1', { implementationContinuation: { phase: 'technical-review' } })), asked: unknown[] = [];
    const negative: Partial<HandlerRules> = { continuationReview: (store, job, head) => { asked.push([store === continued.store, job === continued.job, head]); return head === 'review-1' ? {} : undefined; } };
    expect(continued.fault(action, 'review-1', negative)).toBeNull();
    expect(continued.fault(action, 'review-2', negative)).toBe(NOTHING(action, 'review-2'));
    expect(asked).toEqual([[true, true, 'review-1'], [true, true, 'review-2']]);
    // At the PR review a continuation is no longer what is read.
    expect(world(job('1', { stage: 'lead-pr', implementationContinuation: { phase: 'technical-review' } })).fault(action, 'review-1', { continuationReview: never })).toBe(READS(action, '', 'review-1'));
});

test('a job that shares its key with another job that is not cancelled is refused; a cancelled one is no obstacle', () => {
    const named = { validation: () => run('worker-1') };
    for (const status of ['blocked', 'queued', 'working', 'completed'])
        expect(world(job('1'), { ...job('1'), id: 'twin', status }).fault('reconcile-validation', 'worker-1', { validation: never }), status).toBe('GH-1 has another job that is not cancelled; reconcile-validation finds its job by key.');
    expect(world(job('1'), { ...job('1'), id: 'twin', status: 'cancelled' }).fault('reconcile-validation', 'worker-1', named)).toBeNull();
    expect(world(job('1'), job('2')).fault('reconcile-validation', 'worker-1', named)).toBeNull();
});

test('a rule that throws, and an action with no rule, are faults: nothing is taken on trust', () => {
    const w = world(job('1', { stage: 'update-base' }));
    const fault = w.fault('reconcile-base-update', 'worker-1', { stoppedBaseUpdate: () => { throw new Error(`Morgan must reconcile duplicate workers token=ghp_abcdefghijklmnopqrstuvwxyz0123456789 ${'x'.repeat(400)}`); } })!;
    expect(fault).toMatch(/^What reconcile-base-update reads for GH-1 could not be established: Error: Morgan must reconcile duplicate workers/);
    expect(fault).not.toContain('ghp_');
    expect(fault.length).toBeLessThan(280);
    for (const action of ['review-pr', 'resume-ticket', 'reconcile-everything', 'constructor', 'toString'])
        expect(w.fault(action, ''), action).toBe(`${action} has no rule for the run it reads.`);
});

test('the handlers\' own rules answer for a plain stopped job without evidence on disk: nothing to read, and nothing thrown', () => {
    const cases: [Record<string, unknown>, string, string, string | null][] = [
        [{}, 'reconcile-implementation', 'worker-1', NOTHING('reconcile-implementation', 'worker-1')],
        [{}, 'reconcile-validation', 'worker-1', NOTHING('reconcile-validation', 'worker-1')],
        [{ stage: 'validate' }, 'reconcile-validation', 'worker-1', NOTHING('reconcile-validation', 'worker-1')],
        [{ stage: 'scope-repair' }, 'reconcile-scope-repair', 'worker-1', NOTHING('reconcile-scope-repair', 'worker-1')],
        [{ stage: 'draft' }, 'reconcile-preparation', 'worker-1', NOTHING('reconcile-preparation', 'worker-1')],
        [{ stage: 'prepare-pr' }, 'reconcile-preparation', '', null],
        [{ stage: 'update-base' }, 'reconcile-base-update', '', null],
        [{ stage: 'update-base' }, 'reconcile-base-update', 'worker-1', READS('reconcile-base-update', '', 'worker-1')],
        [{ stage: 'closeout' }, 'reconcile-closeout', '', null],
        [{ stage: 'closeout' }, 'reconcile-closeout', 'worker-1', READS('reconcile-closeout', '', 'worker-1')],
        [{ stage: 'lead-pr' }, 'reconcile-review', 'worker-1', READS('reconcile-review', '', 'worker-1')],
    ];
    for (const [over, action, head, fault] of cases) {
        const w = world(job('1', over));
        expect(routeHeadFault(w.store, w.job, action, head), `${action} ${head}`).toBe(fault);
    }
});

test('the handoff\'s own rules refuse an older completed writer, and any writer whose completion is not on disk', () => {
    const prerequisites = [{ target: { projectId: 'cms-field-vocabulary', kind: 'pr', id: '12' }, condition: 'pr-merged' }];
    const w = world(job('1', { stage: 'implement', steps: [{ stage: 'implement', result: { outcome: 'passed', prerequisites, blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [] } }] }));
    const writer = (id: string) => ({ id, requestId: '1', stage: 'github-implement', provider: 'claude', role: 'developer', status: 'completed' });
    w.store.state.workLog = [writer('worker-1'), writer('worker-2')] as never;
    const refused = 'What reconcile-implementation reads for GH-1 could not be established: Error: One exact completed original writer required';
    // Both carry a saved prerequisite result by the first rule; the handoff reads only the latest, and that one only from its completion.
    expect(hasSavedPrerequisiteResult(w.store, w.job, 'worker-1')).toBe(true);
    expect(routeHeadFault(w.store, w.job, 'reconcile-implementation', 'worker-1')).toBe(refused);
    expect(routeHeadFault(w.store, w.job, 'reconcile-implementation', 'worker-2')).toBe(refused);
    // With the handoff's reading confirmed for the latest writer, that writer is taken and the older one still is not.
    const confirmed = rules({ savedPrerequisite: hasSavedPrerequisiteResult, savedPrerequisiteOriginal: (store, job, head) => { if (store.state.workLog!.filter(work => work.requestId === job.id).at(-1)!.id !== head) throw new Error('One exact completed original writer required'); } });
    expect(routeHeadFault(w.store, w.job, 'reconcile-implementation', 'worker-2', confirmed)).toBeNull();
    expect(routeHeadFault(w.store, w.job, 'reconcile-implementation', 'worker-1', confirmed)).toBe(refused);
    // A run that is no writer of this job has no saved prerequisite result, and nothing else to read.
    expect(routeHeadFault(w.store, w.job, 'reconcile-implementation', 'worker-3')).toBe(NOTHING('reconcile-implementation', 'worker-3'));
});
