import { expect, test } from 'vitest';
import type { HarnessDefectResult } from '../../../src/contracts/overseer';
import { agreement } from '../../../server/overseer/agreement';
import { DOC, DOC_PATH, defect, falsePositive, GUARD, GUARD_PATH, needsJoe, rangeOf, realBlock, sha, staleState } from './triage-world';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const differsOn = (edit: (result: HarnessDefectResult) => void) => { const b = clone(defect()); edit(b); return agreement(defect(), b); };

test('the same verdict on the same basis agrees, whatever its wording or confidence', () => {
    expect(agreement(defect(), defect())).toMatchObject({ agree: true, differences: [] });
    const reworded = clone(defect());
    reworded.causalExplanation = 'Renaming the branch breaks a name comparison.';
    reworded.invariant.statement = 'Ownership follows creation.';
    reworded.correction.explanation = 'Check who made it.';
    reworded.regression.description = 'Rebased branches stay owned.';
    reworded.confidence = 'medium';
    expect(agreement(defect(), reworded).agree).toBe(true);
    // A different verified window around the same decisive line is the same anchor.
    const window = clone(defect());
    window.refusalSite = rangeOf(GUARD_PATH, GUARD, 3, 3, 3);
    expect(agreement(defect(), window).agree).toBe(true);
    for (const make of [realBlock, falsePositive, staleState, needsJoe]) expect(agreement(make(), make()).agree, make.name).toBe(true);
});

test('each compared field differing alone is named', () => {
    const guard = { path: GUARD_PATH, sha256: sha(GUARD) };
    const cases: [string, (result: HarnessDefectResult) => void][] = [
        ['refusal', b => { b.refusalSite = rangeOf(GUARD_PATH, GUARD, 2, 4, 4); }],
        ['requirement', b => { b.invariant.requirement = rangeOf(DOC_PATH, DOC, 4); }],
        ['direction', b => { b.correction.direction = 'refuse-differently'; }],
        ['site', b => { b.correction.site = rangeOf(GUARD_PATH, GUARD, 1, 4, 2); }],
        ['clause', b => { b.correction.case.trigger.clause = rangeOf(DOC_PATH, DOC, 3); }],
        ['facts', b => { b.correction.case.trigger.facts = [{ name: 'branch', value: 'renamed by hand' }]; }],
        ['scope', b => { b.correction.case.trigger.scope = 'unconditional'; b.correction.case.trigger.condition = null; }],
        ['observed', b => { b.correction.case.observed = { outcome: 'refuse', cause: 'protected-branch' }; }],
        ['required', b => { b.correction.case.required = { outcome: 'refuse', cause: 'owned-branch' }; }],
        ['edit-paths', b => { b.correction.editPaths = [guard]; }],
        ['affected', b => { b.affectedFiles = [...b.affectedFiles, { path: 'server/delivery/harness/refusal.ts', sha256: 'e'.repeat(64) }]; }],
        ['regression-target', b => { b.regression.target = { path: 'tests/unit/delivery/other.test.ts', sha256: 'a'.repeat(64) }; }],
        ['episodes', b => { b.correction.case.episodes = [{ kind: 'subject', key: 'office/job/GH-8', stopDigest: 'a'.repeat(64) }]; }],
    ];
    for (const [field, edit] of cases) expect(differsOn(edit), field).toMatchObject({ agree: false, differences: [field] });
    // Overlapping context around a different guard line is a different refusal.
    expect(differsOn(b => { b.refusalSite = rangeOf(GUARD_PATH, GUARD, 1, 5, 2); })).toMatchObject({ agree: false, differences: ['refusal'] });
    // The same affected files and direction do not make different dispositions agree.
    expect(differsOn(b => { b.correction.case.required = { outcome: 'allow', cause: 'maintainer-override' }; })).toMatchObject({ agree: false, differences: ['required'] });
});

test('different verdicts never agree, and each kind compares its own basis', () => {
    expect(agreement(defect(), realBlock())).toEqual({ agree: false, matched: [], differences: ['verdict'] });
    const block = realBlock() as Extract<ReturnType<typeof realBlock>, { verdict: 'real-block' }>;
    expect(agreement(block, { ...block, rule: rangeOf(DOC_PATH, DOC, 4) })).toMatchObject({ agree: false, differences: ['rule'] });
    const positive = falsePositive() as Extract<ReturnType<typeof falsePositive>, { verdict: 'false-positive' }>;
    expect(agreement(positive, { ...positive, citation: rangeOf(GUARD_PATH, GUARD, 4) })).toMatchObject({ agree: false, differences: ['citation'] });
    const stale = staleState() as Extract<ReturnType<typeof staleState>, { verdict: 'stale-state' }>;
    expect(agreement(stale, { ...stale, change: [{ kind: 'event', id: 'ev-1' }] })).toMatchObject({ agree: false, differences: ['change'] });
    expect(agreement(stale, { ...stale, change: [...stale.change].reverse() }).agree).toBe(true);
});

test('trigger facts compare as complete name and value pairs in any order', () => {
    const a = defect(), b = defect();
    const shared = { name: 'branch', value: 'renamed by rebase' };
    a.correction.case.trigger.facts = [{ name: 'a=b', value: 'c' }, shared];
    b.correction.case.trigger.facts = [shared, { name: 'a', value: 'b=c' }];
    expect(agreement(a, b)).toMatchObject({ agree: false, differences: ['facts'] });
    b.correction.case.trigger.facts = [...a.correction.case.trigger.facts].reverse();
    expect(agreement(a, b)).toMatchObject({ agree: true, differences: [] });
});
