import { expect, test } from 'vitest';
import { TRIAGE_VERDICTS, TriageResultSchema } from '../../../src/contracts/overseer';
import { defect, falsePositive, needsJoe, realBlock, staleState } from './triage-world';

const parses = (value: unknown) => TriageResultSchema.safeParse(value).success;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

test('an honest example of each of the five verdicts parses', () => {
    const examples = [defect(), realBlock(), falsePositive(), staleState(), needsJoe()];
    expect(examples.map(example => example.verdict)).toEqual([...TRIAGE_VERDICTS]);
    for (const example of examples) expect(TriageResultSchema.safeParse(example).error?.issues, example.verdict).toBeUndefined();
});

test('unknown verdicts and keys, at any depth, are refused', () => {
    expect(parses({ ...defect(), verdict: 'probably-fine' })).toBe(false);
    expect(parses({ ...defect(), extra: 1 })).toBe(false);
    const nested = clone(defect()) as any;
    nested.correction.case.trigger.extra = true;
    expect(parses(nested)).toBe(false);
    const range = clone(defect()) as any;
    range.refusalSite.note = 'x';
    expect(parses(range)).toBe(false);
    expect(parses({ ...realBlock(), correction: { direction: 'refuse-less' } })).toBe(false);
});

test('a defect without its repair fields, or with them inconsistent, is refused', () => {
    for (const field of ['refusalSite', 'invariant', 'correction', 'affectedFiles', 'regression', 'authorityPrerequisite']) {
        const missing = clone(defect()) as any;
        delete missing[field];
        expect(parses(missing), field).toBe(false);
    }
    const siteOutside = clone(defect());
    siteOutside.correction.editPaths = siteOutside.correction.editPaths.slice(1);
    siteOutside.affectedFiles = siteOutside.correction.editPaths;
    expect(parses(siteOutside)).toBe(false);
    const editNotAffected = clone(defect());
    editNotAffected.affectedFiles = editNotAffected.affectedFiles.slice(0, 1);
    expect(parses(editNotAffected)).toBe(false);
    const unconditional = clone(defect());
    unconditional.correction.case.trigger.scope = 'unconditional';
    expect(parses(unconditional)).toBe(false);
    unconditional.correction.case.trigger.condition = null;
    expect(parses(unconditional)).toBe(true);
});

test('blank text, oversize lists, bad hashes, bad paths and inverted ranges are refused', () => {
    expect(parses({ ...defect(), causalExplanation: '   ' })).toBe(false);
    expect(parses({ ...defect(), causalExplanation: 'x'.repeat(4001) })).toBe(false);
    expect(parses({ ...needsJoe(), references: Array.from({ length: 81 }, (_, n) => ({ kind: 'event', id: `ev-${n}` })) })).toBe(false);
    expect(parses({ ...needsJoe(), references: [{ kind: 'event', id: 'ev-1' }, { kind: 'event', id: 'ev-1' }] })).toBe(false);
    expect(parses({ ...needsJoe(), references: [] })).toBe(false);
    const site = defect().refusalSite;
    for (const bad of [{ ...site, sha256: 'A'.repeat(64) }, { ...site, excerptSha256: 'abc' }, { ...site, startLine: 4, endLine: 2 }, { ...site, decisiveLine: 9 },
        { ...site, startLine: 0 }, { ...site, path: '/etc/passwd' }, { ...site, path: 'server/../../x.ts' }, { ...site, path: 'server\\x.ts' }, { ...site, path: 'a'.repeat(301) }])
        expect(parses({ ...defect(), refusalSite: bad }), JSON.stringify(bad).slice(0, 80)).toBe(false);
    expect(parses({ ...realBlock(), affectedFiles: [{ path: 'x.ts', sha256: 'a'.repeat(64) }] })).toBe(false);
});
