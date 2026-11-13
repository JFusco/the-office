import { expect, test } from 'vitest';
import { subjectLabel, withoutIdentifiers } from '../../../../src/office/without-identifiers';

test('machine identifiers are removed and the sentence around them stays readable', () => {
    expect(withoutIdentifiers('Maintenance 3f2a9c1e-0b7d-4e8a-9c1d-2f4b6a8c0e12 enqueued for follow-up')).toBe('Maintenance enqueued for follow-up');
    expect(withoutIdentifiers('Source: investigation:brain:worker:ced1b10e-ce8d-453e-bf59-afb913cd906b:surviving-subprocesses')).toBe('Source');
    expect(withoutIdentifiers('checks for 4db12f538c. Review current PR 177')).toBe('checks for. Review current PR 177');
    expect(withoutIdentifiers('cited learning:ea50e80eab7c3efd7a9acb8092d3e68ee29136b2 and brain:abc123def4567:knowledge/next.md')).toBe('cited and');
    expect(withoutIdentifiers('receipt (95134ecf-5963-48f3-beed-c5466fb77d4a) saved')).toBe('receipt saved');
});

test('short commit ids go, the closing period stays, and a full commit reads as the reviewed commit', () => {
    expect(withoutIdentifiers('Office harness ran test: passed at 4db12f5.')).toBe('Office harness ran test: passed at.');
    expect(withoutIdentifiers('Stopped by job:3f2a9c1e-0b7d-4e8a-9c1d-2f4b6a8c0e12:surviving-subprocesses. Next owner: Morgan')).toBe('Stopped by. Next owner: Morgan');
    expect(withoutIdentifiers("Sam's review passed for 4db12f538c4d189d452f415047f1695b50ede078.")).toBe("Sam's review passed for the reviewed commit.");
    expect(withoutIdentifiers('95134ecf-5963-48f3-beed-c5466fb77d4a · Accepted work')).toBe('Accepted work');
    expect(withoutIdentifiers('job:95134ecf-5963-48f3-beed-c5466fb77d4a')).toBe('');
});

test('text without identifiers is returned exactly as written, and links, paths and branches survive', () => {
    for (const text of ['edit .gitignore and .github/workflows/ci.yml', 'call refresh() then string[]', 'Findings:\n- [ ] add test\n  - nested', 'style :focus-visible', 'branch feature/abc123def456 built index-4db12f538c.js', 'see https://github.com/o/r/commit/4db12f538c4d189d452f415047f1695b50ede078 for detail', 'colour #1a2b3c4 and version 0.9.70'])
        expect(withoutIdentifiers(text)).toBe(text);
    const once = withoutIdentifiers('Source: job:95134ecf-5963-48f3-beed-c5466fb77d4a, then (4db12f538c) and more');
    expect(once).toBe('Source, then and more');
    expect(withoutIdentifiers(once)).toBe(once);
});

test('ticket keys, pull request numbers, dates, counts and ordinary words are kept', () => {
    for (const text of ['GH-177 merged on 2026-11-12 at 17:00', 'CEC-154 needs selected-comment revisions', 'PR #177 · attempt 2 of 5', 'Build 20261112.3 succeeded', 'A decade of feedback added 1234567890 rows', 'Waiting for GH-255, PR #12'])
        expect(withoutIdentifiers(text)).toBe(text);
    expect(withoutIdentifiers('')).toBe('');
    expect(withoutIdentifiers(undefined)).toBe('');
});

test('a subject is named by its ticket key, or by its kind when it only has an internal id', () => {
    expect(subjectLabel('GH-12', 'job')).toBe('GH-12');
    expect(subjectLabel('95134ecf-5963-48f3-beed-c5466fb77d4a', 'feature')).toBe('Feature');
    expect(subjectLabel('', 'investigation')).toBe('IT investigation');
    expect(subjectLabel('investigation:brain:worker:ced1b10e-ce8d-453e-bf59-afb913cd906b:surviving-subprocesses', 'investigation')).toBe('IT investigation');
    expect(subjectLabel(undefined, undefined)).toBe('Office work');
    expect(subjectLabel('implementation:3f2a9c1e-0b7d-4e8a-9c1d-2f4b6a8c0e12', 'recovery')).toBe('Recovery');
});
