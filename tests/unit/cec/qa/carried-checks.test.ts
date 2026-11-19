import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { qaCoverage } from '../../../../server/cec/qa/carried-checks';
import { applyChangeScope, scopeBase, statedApproach } from '../../../../server/cec/change-scope';
import { changeScopeNote } from '../../../../server/cec/change-scope-note';
import { carriedNotRepeated } from '../../../../server/cec/carried-not-repeated';
import { rerouteUnderScope } from '../../../../server/cec/reroute-under-scope';
import { officeQAEvidenceGap } from '../../../../server/qa/report-evidence';
import { qaComment } from '../../../../server/cec/qa-comment';
import { qaCriteria } from '../../../../server/qa/criteria';
import { DATA } from '../../../../server/office/config';
import { ticket as fixture } from '../parking/fixtures';
import { NEW, OLD, git, passed, saved } from '../moved-head-fixtures';
import type { Ticket, WorkApproach } from '../../../../src/shared';

const RUN = 'carried-checks-unit', ROOT = resolve(DATA, 'runs', RUN), FIXED = 'c'.repeat(40);
const CHECKS = ['Saved spec opens', 'Regenerate creates a review', 'Decision is recorded'];
const full: WorkApproach = { plan: 'none', review: 'full', validation: 'browser', checks: CHECKS, reason: 'Ticket approach' };
const [open, regenerate, decision] = qaCriteria(CHECKS);
const item = (id: string, criterionId: string | null, status: string, evidenceIds = ['shot']) => ({ id, check: id, kind: criterionId ? 'acceptance' : 'regression', status, expected: 'x', observed: 'y', evidenceIds, criterionId });
const URL = 'https://staging.example.test/specs';
const report = (cases: unknown[], extra: Record<string, unknown> = {}) => ({ version: 2, ticket: 'CEC-900', commit: OLD, stage: 'retest', validation: 'browser',
    setup: { status: 'ready', summary: 'Ready', owner: 'Riley', nextAction: 'None', url: URL, actor: 'Editor', resources: ['Saved spec'] }, cases, nextOwner: 'Alex', nextAction: 'Fix', ...extra });
const CASES = [item('open', open.id, 'passed'), item('regenerate', regenerate.id, 'failed'), item('decision', decision.id, 'not-tested'), item('adjacent', null, 'passed')];
const EVIDENCE = () => [saved(RUN, 'shot', 'screenshot', OLD), saved(RUN, 'log', 'checks', OLD), { ...saved(RUN, 'session', 'browser', OLD), url: URL }];
/** Saves the report where QA saves it; `saved` false leaves the run without one. */
const run = (name: string, qa: unknown) => { const dir = resolve(ROOT, name); mkdirSync(dir, { recursive: true }); if (qa) writeFileSync(resolve(dir, 'report.json'), JSON.stringify(qa)); return dir; };
let runs = 0;
/** A retest on OLD that QA failed: the first check passed, the second failed and the third was not tested. */
const failedQA = (extra: Record<string, unknown> = {}, savedReport: unknown = undefined) => { const qa = 'qa' in extra ? extra.qa : report(CASES);
    return passed({ outcome: 'failed', commit: OLD, blocker: 'Regenerate fails', evidence: EVIDENCE(),
        findings: [{ id: 'QA-1', summary: 'Regenerate fails', expected: '', actual: '', status: 'open', attempts: 0 } as any], ...extra, qa: qa as any, qaRunDir: run(`qa-${++runs}`, savedReport === undefined ? qa : savedReport) }); };
const afterFailedQA = (qa = failedQA()) => ({ ...fixture('QA'), key: 'CEC-900', approach: full, commit: OLD, worktree: '/worktree', results: { 'repair-review': passed({ commit: OLD }), retest: qa } }) as Ticket;
const stated = (checks: string[], extra: Partial<WorkApproach> = {}): WorkApproach => ({ plan: 'none', review: 'focused', validation: 'independent-checks', checks, reason: 'One function changed', ...extra });

test('a required check is carried only when every one of its cases passed with saved evidence on that commit; the rest are owed', () => {
    expect(qaCoverage(afterFailedQA(), ROOT)).toEqual({ commit: OLD, carried: ['Saved spec opens'], owed: ['Regenerate creates a review', 'Decision is recorded'] });
    for (const [name, qa] of [
        ['a second case for the same check that failed', failedQA({ qa: report([...CASES, item('open-error', open.id, 'failed')]) })],
        ['evidence from another commit', failedQA({ evidence: [saved(RUN, 'shot', 'screenshot', NEW), ...EVIDENCE().slice(1)] })],
        ['evidence saved outside the run', failedQA({ evidence: [saved('another-run', 'shot', 'screenshot', OLD), ...EVIDENCE().slice(1)] })],
        ['evidence that does not exist', failedQA({ evidence: [{ ...saved(RUN, 'shot', 'screenshot', OLD), path: resolve(ROOT, 'missing.png') }, ...EVIDENCE().slice(1)] })],
        ['a regression case that refers to the check and failed', failedQA({ qa: report([...CASES, { ...item('open-regression', open.id, 'failed'), kind: 'regression' }]) })],
        ['a browser check with only a log behind it', failedQA({ qa: report([item('open', open.id, 'passed', ['log']), ...CASES.slice(1)]) })],
        ['a case citing no evidence', failedQA({ qa: report([item('open', open.id, 'passed', []), ...CASES.slice(1)]) })],
    ] as const) expect(qaCoverage(afterFailedQA(qa as any), ROOT)!.carried, name).toEqual([]);
});

test('nothing is established by a run that is not QA\'s own failed verdict for this ticket, stage, level and commit', () => {
    for (const [name, qa] of [
        ['a result a gate refused', failedQA({ outcome: 'blocked' })],
        ['a passed result', failedQA({ outcome: 'passed' })],
        ['another commit', failedQA({ commit: NEW })],
        ['a setup stop', failedQA({ qa: report(CASES, { setup: { ...report([]).setup, status: 'blocked' } }) })],
        ['another validation level', failedQA({ qa: report(CASES, { validation: 'independent-checks' }) })],
        ['another ticket', failedQA({ qa: report(CASES, { ticket: 'CEC-1' }) })],
        ['another stage', failedQA({ qa: report(CASES, { stage: 'qa' }) })],
        ['unknown provider usage', failedQA({ paidRuns: null })],
        ['an unsettled write', failedQA({ receipts: [{ id: 'c', action: 'jira-comment', target: 't', verified: false, uncertain: true, detail: '' }] })],
        ['a first-version report', failedQA({ qa: report(CASES.map(({ criterionId, ...rest }) => rest), { version: 1 }) })],
        ['an incomplete report', failedQA({ qa: { ...report(CASES), nextOwner: '' } })],
        ['a report that was not saved in the run', failedQA({}, null)],
        ['a saved report that differs from the result', failedQA({}, report(CASES.slice(0, 1)))],
        ['a browser run with no browser session behind it', failedQA({ evidence: EVIDENCE().slice(0, 2) })],
        ['a browser run with no actor', failedQA({ qa: report(CASES, { setup: { ...report([]).setup, actor: '' } }) })],
        ['no report', failedQA({ qa: null })],
    ] as const) expect(qaCoverage(afterFailedQA(qa as any), ROOT), name).toBeNull();
});

test('a repair may scope from a candidate QA ran on when some checks passed and its review stands', () => {
    expect(scopeBase(afterFailedQA(), ROOT)).toMatchObject({ commit: OLD, carried: ['Saved spec opens'], owed: ['Regenerate creates a review', 'Decision is recorded'] });
    expect(scopeBase(afterFailedQA(failedQA({ qa: report([item('open', open.id, 'failed')]) })), ROOT)).toBeNull();
    expect(scopeBase({ ...afterFailedQA(), results: { 'repair-review': passed({ commit: NEW }), retest: failedQA() } } as Ticket, ROOT)).toBeNull();
});

test('the harness adds every owed check, keeps the ticket\'s validation and keeps a review, so a failed case cannot be scoped away', () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Unit tests for the regenerate fix'], { review: 'none' }), 'developer', 'repair', '', ROOT);
    expect(t.approach).toMatchObject({ review: 'focused', validation: 'browser', checks: ['Unit tests for the regenerate fix', 'Regenerate creates a review', 'Decision is recorded'] });
    expect(t.changeScope).toEqual({ base: OLD, approach: full, owed: ['Regenerate creates a review', 'Decision is recorded'], carried: { checks: ['Saved spec opens'], commit: OLD } });
});

test('a scope restated on a later commit still holds every owed check', async () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    t.commit = NEW;
    expect(await statedApproach(git() as any, t, 'repair', passed({ commit: FIXED, approach: stated(['Unit tests']) }), ROOT)).toBe('scope');
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    expect(t.approach!.checks).toEqual(['Unit tests', 'Regenerate creates a review', 'Decision is recorded']);
    expect(t.changeScope).toMatchObject({ base: OLD, owed: ['Regenerate creates a review', 'Decision is recorded'], carried: { checks: ['Saved spec opens'] } });
});

test('with checks owed, whatever the repair states is a scope, even at a higher level; one that would not fit is not applied', async () => {
    // The ticket-wide rule replaces checks wholesale and would drop the owed ones.
    expect(await statedApproach(git() as any, { ...afterFailedQA(), approach: { ...full, review: 'focused' } }, 'repair', passed({ commit: NEW, approach: { ...full, checks: ['Saved spec opens'] } }), ROOT)).toBe('scope');
    const many = Array.from({ length: 11 }, (_, index) => `Check ${index}`);
    expect(await statedApproach(git() as any, afterFailedQA(), 'repair', passed({ commit: NEW, approach: stated(many) }), ROOT)).toBe('ignored');
});

test('the developer is told which checks are owed and carried; reviewer, QA and publisher are told the truth about the base', () => {
    const t = afterFailedQA();
    const repair = changeScopeNote(t, 'repair', ROOT);
    expect(repair).toContain(`PARTLY VERIFIED CANDIDATE: QA ran on ${OLD} and did not pass. These required checks passed there with evidence on that commit: ["Saved spec opens"]. These are still owed: ["Regenerate creates a review","Decision is recorded"].`);
    expect(repair).toContain('a failed case cannot be scoped away');
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    t.commit = NEW;
    for (const stage of ['repair-review', 'retest', 'publish'] as const) {
        expect(changeScopeNote(t, stage, ROOT), stage).toContain(`SCOPED VERIFICATION: QA ran on ${OLD} and passed some required checks there; the rest are in the scope.`);
        expect(changeScopeNote(t, stage, ROOT), stage).not.toContain('The verification the team selected passed');
        expect(changeScopeNote(t, stage, ROOT), stage).toContain(`CARRIED CHECKS: these required checks passed in QA on ${OLD} with evidence on that commit and are not in this scope: ["Saved spec opens"].`);
    }
    expect(changeScopeNote(t, 'retest', ROOT)).toContain('if the change touches one, widen the scope to include it before executing');
    expect(changeScopeNote(t, 'publish', ROOT)).toContain('They were not run again on the current HEAD.');
});

test('a carried check the scope names is run again, so it is not reported as carried', () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Saved spec opens', 'Unit tests']), 'developer', 'repair', '', ROOT);
    expect(carriedNotRepeated(t)).toEqual([]);
    expect(changeScopeNote({ ...t, commit: NEW }, 'retest', ROOT)).not.toContain('CARRIED CHECKS');
});

test('the QA comment says which checks were carried and from which build, and says nothing when none were', () => {
    const result = passed({ commit: NEW, summary: 'Both failed cases now pass.' });
    expect(qaComment('CEC-900', 'retest', 'attempt-1', result, { checks: ['Saved spec opens'], commit: OLD }).paragraphs).toEqual(['Both failed cases now pass.', `1 required check passed in the earlier QA run on build ${OLD.slice(0, 7)} and was carried, not run again on this build.`]);
    expect(qaComment('CEC-900', 'retest', 'attempt-1', result, { checks: [], commit: OLD }).paragraphs).toEqual(['Both failed cases now pass.']);
    expect(qaComment('CEC-900', 'retest', 'attempt-1', result).paragraphs).toEqual(['Both failed cases now pass.']);
});

test('independent checks are carried only from a run with saved check output', () => {
    const light = { ...full, validation: 'independent-checks' as const }, qa = report(CASES.map(c => ({ ...c, evidenceIds: ['log'] })), { validation: 'independent-checks' });
    expect(qaCoverage({ ...afterFailedQA(failedQA({ qa })), approach: light }, ROOT)!.carried).toEqual(['Saved spec opens']);
    expect(qaCoverage({ ...afterFailedQA(failedQA({ qa: report(CASES, { validation: 'independent-checks' }), evidence: EVIDENCE().filter(e => e.kind !== 'checks') })), approach: light }, ROOT)).toBeNull();
});

test('a carried check the scoped retest then failed is owed again and no longer reported as carried', async () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Saved spec opens', 'Unit tests']), 'developer', 'repair', '', ROOT);
    t.commit = NEW;
    t.results.retest = passed({ outcome: 'failed', commit: NEW, qa: report([item('open', open.id, 'failed'), item('regenerate', regenerate.id, 'passed')], { commit: NEW }) as any });
    expect(await statedApproach(git() as any, t, 'repair', passed({ commit: FIXED, approach: stated(['Unit tests']) }), ROOT)).toBe('scope');
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    expect(t.approach!.checks).toEqual(['Unit tests', 'Regenerate creates a review', 'Decision is recorded', 'Saved spec opens']);
    expect(t.changeScope!.owed).toEqual(['Regenerate creates a review', 'Decision is recorded', 'Saved spec opens']);
    expect(t.changeScope!.carried).toBeUndefined();
    expect(carriedNotRepeated(t)).toEqual([]);
});

test('a route change under a scope keeps the owed checks and the ticket\'s validation, and is refused when they would not fit', () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    const rerouted = rerouteUnderScope(t, passed({ outcome: 'reroute', approach: stated(['Typecheck']) }));
    expect(rerouted.approach).toMatchObject({ validation: 'browser', checks: ['Typecheck', 'Regenerate creates a review', 'Decision is recorded'] });
    expect(() => rerouteUnderScope(t, passed({ outcome: 'reroute', approach: stated(Array.from({ length: 11 }, (_, index) => `Check ${index}`)) }))).toThrow('must leave room');
    const plain = passed({ outcome: 'reroute', approach: stated(['Typecheck']) });
    expect(rerouteUnderScope({ commit: OLD, results: {}, changeScope: { base: OLD, approach: full } }, plain)).toBe(plain);
    expect(rerouteUnderScope({ commit: OLD, results: {} }, plain)).toBe(plain);
});

test('a route change after the scoped retest failed a required check keeps that check, carried before or not, whatever the scope owed', () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Saved spec opens', 'Unit tests']), 'developer', 'repair', '', ROOT);
    t.commit = NEW;
    t.results.retest = passed({ outcome: 'failed', commit: NEW, qa: report([item('open', open.id, 'failed')], { commit: NEW }) as any });
    expect(rerouteUnderScope(t, passed({ outcome: 'reroute', approach: stated(['Unit tests']) })).approach!.checks).toEqual(['Unit tests', 'Regenerate creates a review', 'Decision is recorded', 'Saved spec opens']);
    // A scope from a fully verified candidate owes nothing until its retest fails one of the ticket's checks.
    const verified = { commit: NEW, results: t.results, changeScope: { base: OLD, approach: full } };
    expect(rerouteUnderScope(verified, passed({ outcome: 'reroute', approach: stated(['Unit tests']) })).approach).toMatchObject({ validation: 'browser', checks: ['Unit tests', 'Saved spec opens'] });
});

test('a first scope is not applied when the candidate it would start from can no longer be read', () => {
    const t = afterFailedQA(failedQA({}, null));
    expect(applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT)).toBe(false);
    expect([t.approach, t.changeScope]).toEqual([full, undefined]);
});

test('the scoped retest passes the QA gate only when it covers every owed check on the new commit', () => {
    const t = afterFailedQA();
    applyChangeScope(t, stated(['Unit tests']), 'developer', 'repair', '', ROOT);
    const ids = qaCriteria(t.approach!.checks), cover = (covered: typeof ids) => {
        const qa = report([...covered.map(c => item(c.check, c.id, 'passed')), item('adjacent', null, 'passed')], { commit: NEW });
        const result = passed({ commit: NEW, qa: qa as any, qaRunDir: run(`gate-${++runs}`, qa), evidence: [saved(RUN, 'shot', 'screenshot', NEW), { ...saved(RUN, 'session', 'browser', NEW), url: URL }] });
        return officeQAEvidenceGap(result, { key: 'CEC-900', head: NEW, stage: 'retest', approach: t.approach }, ROOT);
    };
    expect(cover(ids)).toBe('');
    expect(cover(ids.slice(0, 1))).toBe('QA must cover every saved required check');
});
