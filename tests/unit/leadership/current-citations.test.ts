import { expect, test } from 'vitest';
import { currentCitations, NOT_CURRENT } from '../../../server/leadership/current-citations';
import type { GoalEvidenceRef } from '../../../src/shared';

const ref = (kind: GoalEvidenceRef['kind'], id: string, version = 'v'): GoalEvidenceRef => ({ projectId: 'cec', kind, id, version, head: 'h' });
const accepted = { started: true, accepted: true };
const ticket = ref('ticket', 'CEC-154'), stalePR = ref('pr', '41448', 'old'), currentPR = ref('pr', '41449');
const resolve = (item: GoalEvidenceRef) => item === stalePR ? null : item === ticket ? accepted : item === currentPR ? { started: true, accepted: false } : null;

test('a pull request observation that no longer resolves is left out and listed once; everything else is kept in its place', () => {
    const cited = currentCitations({ evidence: [stalePR, ticket, currentPR], linkedWork: [stalePR, ticket] }, resolve);
    expect(cited.evidence).toEqual([ticket, currentPR]);
    expect(cited.linkedWork).toEqual([ticket]);
    expect(cited.facts).toEqual([accepted, { started: true, accepted: false }, accepted]);
    expect(cited.dropped).toEqual([{ ref: stalePR, reason: NOT_CURRENT }]);
});

test('any other reference that does not resolve refuses the review, and so do stale observations alone', () => {
    for (const kind of ['ticket', 'job', 'issue', 'maintenance', 'blocker'] as const)
        expect(() => currentCitations({ evidence: [ticket, ref(kind, 'gone')], linkedWork: [] }, resolve), kind).toThrow('stale or unsupported');
    expect(() => currentCitations({ evidence: [stalePR], linkedWork: [stalePR] }, resolve)).toThrow('stale or unsupported');
});

test('a review that cites nothing stays a plain progress note', () => {
    expect(currentCitations({ evidence: [], linkedWork: [] }, resolve)).toEqual({ evidence: [], linkedWork: [], facts: [], dropped: [] });
});
