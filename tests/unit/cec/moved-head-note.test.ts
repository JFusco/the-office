import { expect, test } from 'vitest';
import { movedHeadNote } from '../../../server/cec/moved-head-note';
import { NEW, OLD } from './moved-head-fixtures';
import type { Stage } from '../../../src/shared';

const FIXED = 'c'.repeat(40), move = { from: OLD, to: NEW, prId: 4242, at: '' };

test('the developer is told to confirm the moved head while the accepted candidate is still the old commit', () => {
    const note = movedHeadNote({ headMove: move, commit: OLD }, 'repair');
    expect(note).toContain(`HEAD MOVED AT DRAFT PR: Draft pull request 4242 was opened on ${NEW}, which contains the previously accepted candidate ${OLD}`);
    expect(note).toContain('No finding is being repaired by this run.');
});

test('the reviewer and QA are told while the candidate is the commit the confirming pass settled on, including one that fixed a check', () => {
    for (const confirmed of [NEW, FIXED]) {
        const ticket = { headMove: { ...move, confirmed }, commit: confirmed };
        expect(movedHeadNote(ticket, 'repair-review')).toContain('Review what changed between the two commits');
        expect(movedHeadNote(ticket, 'retest')).toContain('Earlier review and QA evidence is for the previous commit');
        expect(movedHeadNote(ticket, 'qa')).toContain('Earlier review and QA evidence is for the previous commit');
    }
});

test('a later repair of a real finding, a head changed again, other stages and a ticket with no move are told nothing', () => {
    expect(movedHeadNote({ headMove: { ...move, confirmed: NEW }, commit: NEW }, 'repair')).toBe('');
    expect(movedHeadNote({ headMove: { ...move, confirmed: NEW }, commit: FIXED }, 'retest')).toBe('');
    expect(movedHeadNote({ headMove: move, commit: NEW }, 'repair-review')).toBe('');
    for (const stage of ['draft-pr', 'publish', 'implement'] as Stage[]) expect(movedHeadNote({ headMove: { ...move, confirmed: NEW }, commit: NEW }, stage)).toBe('');
    expect(movedHeadNote({ commit: OLD }, 'repair')).toBe('');
});
