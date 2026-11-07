import { expect, test } from 'vitest';
import { candidateOwner, skipOwnedCandidate, skippedCandidateLedger } from '../../../server/maintenance/candidate-ownership';

const state = (jobs: any[]) => ({ coordination: { jobs } } as any);

test('a configured hold owns the issue', () => {
    expect(candidateOwner(state([]), { 'GH-112': 'Wait for stable 3.1.' }, 112)).toBe('GH-112 is held: Wait for stable 3.1.');
});

test('an unsettled delivery job owns the issue; settled jobs do not', () => {
    expect(candidateOwner(state([{ id: 'a67', key: 'GH-112', status: 'blocked', stage: 'implement' }]), {}, 112)).toBe('GH-112 is owned by delivery job a67 (blocked at implement)');
    expect(candidateOwner(state([{ id: 'x', key: 'GH-112', status: 'cancelled', stage: 'lead-pr' }, { id: 'y', key: 'GH-112', status: 'completed', stage: 'closeout' }]), {}, 112)).toBe('');
    expect(candidateOwner(state([{ id: 'z', key: 'GH-1120', status: 'working', stage: 'implement' }]), {}, 112)).toBe('');
});

test('an issue not yet created is never owned', () => {
    expect(candidateOwner(state([{ id: 'z', key: 'GH-0', status: 'working', stage: 'implement' }]), { 'GH-0': 'x' }, 0)).toBe('');
});

test('ownership is decided only for a fresh slot and a recorded skip holds for that same slot only', () => {
    const run: any = {}, triage0 = { index: 0, checkpoint: 'triage' } as const;
    expect(skipOwnedCandidate(run, triage0, 112, false, () => 'owned')).toEqual({ reason: '', added: false });
    expect(run.skippedCandidates).toBeUndefined();
    expect(skipOwnedCandidate(run, triage0, 112, true, () => 'owned', 't1')).toEqual({ reason: 'owned', added: true });
    expect(run.skippedCandidates).toEqual([{ index: 0, checkpoint: 'triage', issue: 112, reason: 'owned', at: 't1' }]);
    expect(skipOwnedCandidate(run, triage0, 112, false, () => '')).toEqual({ reason: 'owned', added: false });
    expect(skipOwnedCandidate(run, { index: 1, checkpoint: 'triage' }, 112, false, () => 'owned')).toEqual({ reason: '', added: false });
    expect(skipOwnedCandidate(run, { index: 0, checkpoint: 'proposal' }, 112, false, () => 'owned')).toEqual({ reason: '', added: false });
    expect(skipOwnedCandidate(run, { index: 2, checkpoint: 'triage' }, 0, true, () => 'owned')).toEqual({ reason: '', added: false });
    expect(run.skippedCandidates).toHaveLength(1);
});

test('the ledger line appends after retained text', () => {
    expect(skippedCandidateLedger('Kept.\n', 112, 'held', '2026-11-07')).toBe('Kept.\nSKIPPED CANDIDATE #112 (maintenance 2026-11-07): held');
    expect(skippedCandidateLedger('', 112, 'held', '2026-11-07')).toBe('SKIPPED CANDIDATE #112 (maintenance 2026-11-07): held');
});
