import { expect, test } from 'vitest';
import { changeScopeNote } from '../../../server/cec/change-scope-note';
import { NEW, OLD, passed } from './moved-head-fixtures';
import type { Stage } from '../../../src/shared';

const full = { plan: 'none', review: 'full', validation: 'browser', checks: ['A', 'B'], reason: 'Ticket' } as any;
const verified = { approach: full, commit: OLD, results: { 'repair-review': passed({ commit: OLD }), retest: passed({ commit: OLD }) } as any };

test('a repair that starts from a verified candidate is told it may scope the verification of its own change', () => {
    const note = changeScopeNote(verified, 'repair');
    expect(note).toContain(`VERIFIED CANDIDATE: The verification the team selected passed on ${OLD}`);
    expect(note).toContain('Return approach=null when the change alters behaviour the earlier review or QA covered');
});

test('a repair on a candidate that is not verified, and every other stage of an unscoped ticket, are told nothing', () => {
    expect(changeScopeNote({ ...verified, results: { ...verified.results, retest: passed({ commit: OLD, outcome: 'failed' }) } }, 'repair')).toBe('');
    for (const stage of ['repair-review', 'retest', 'publish', 'implement', 'qa'] as Stage[]) expect(changeScopeNote(verified, stage), stage).toBe('');
});

test('the review, retest and publication of a scoped change are told what the scope covers and where the verified work ends', () => {
    const scoped = { ...verified, commit: NEW, changeScope: { base: OLD, approach: full } };
    for (const stage of ['repair-review', 'retest', 'qa', 'preview'] as Stage[]) {
        expect(changeScopeNote(scoped, stage), stage).toContain(`SCOPED VERIFICATION: The verification the team selected passed on ${OLD}.`);
        expect(changeScopeNote(scoped, stage), stage).toContain(`git diff ${OLD} HEAD`);
        expect(changeScopeNote(scoped, stage), stage).toContain('return outcome=reroute with a wider approach before executing');
    }
    expect(changeScopeNote(scoped, 'publish')).toContain('evidence for the change is on the current HEAD');
    for (const stage of ['repair', 'implement', 'ci'] as Stage[]) expect(changeScopeNote(scoped, stage), stage).toBe('');
});
