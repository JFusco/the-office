import { expect, test } from 'vitest';
import { recordTrigger } from '../../../server/knowledge/record-trigger';
import { captureLearning } from '../../../server/knowledge/learning-events';
import { scheduledRetrospectives } from '../../../server/knowledge/scheduled-retrospectives';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { retrospectiveFacts } from '../../../server/knowledge/retrospective-facts';
import { jobSubject } from '../../../server/knowledge/retrospective-subject';
import { unblockBrief } from '../../../server/knowledge/unblock-brief';
import type { KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import { job, knowledgeStore, result } from './knowledge-fixture';

const never = (async () => ({})) as KnowledgeRunner;
const event = { stage: 'review' as const, head: 'b'.repeat(40), steps: 1, reason: 'PR body invalid' };
const unblock = { known: 'The live PR body fails lint:pr.', decision: 'A metadata-only blocker is not a source repair.', next: 'Morgan republishes the validated body.' };

test('a park absorbed by an open learning batch still owes, asks for and saves an unblock brief', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, parked = job({ status: 'blocked', detail: 'PR body invalid' });
        store.state.coordination!.jobs!.push(parked);
        captureLearning(store, { kind: 'job', id: parked.id }, parked.key, 'review', '0', result('review'), 'Accepted review', 'work', true);
        const batch = k.pending.find(entry => entry.trigger === 'learning')!;
        recordTrigger(store, { id: `${parked.id}:parked:1`, jobId: parked.id, key: parked.key, trigger: 'parked', event });
        expect(k.pending).toHaveLength(1);
        expect(batch).toMatchObject({ trigger: 'learning', blockedBy: 'parked', nextAt: '' });
        expect(retrospectiveFacts(store, jobSubject(store, parked), batch).trigger.kind).toBe('parked');
        acceptRetrospective(store, batch, { catalog: { now: { kind: 'learning', ref: 'now', url: '', detail: 'Current run' } } }, { summary: 'Done', lessons: [], unblock }, 'claim');
        expect(unblockBrief(k, { kind: 'job', id: parked.id })).toContain(`Next: ${unblock.next}`);
    } finally { close(); }
});

test('blocked work runs before routine learning and is not held by the daily limit', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, routine = job({ status: 'completed' }), parked = job({ status: 'blocked' });
        store.state.coordination!.jobs!.push(routine, parked);
        recordTrigger(store, { id: `${routine.id}:completed`, jobId: routine.id, key: routine.key, trigger: 'completed', at: '2026-11-06T10:00:00Z', event });
        recordTrigger(store, { id: `${parked.id}:parked:1`, jobId: parked.id, key: parked.key, trigger: 'parked', at: '2026-11-06T14:00:00Z', event });
        k.learningAttempts = { '2026-11-06': 8 };
        const items = scheduledRetrospectives(store, never), find = (id: string) => items.find(item => item.work.id.startsWith(id))!;
        expect(find(routine.id)).toMatchObject({ rank: 3, eligibility: { state: 'waiting', reason: 'Daily learning attempt limit reached' } });
        expect(find(routine.id).claimEligible!()).toBe(false);
        expect(find(parked.id)).toMatchObject({ rank: 2, eligibility: { state: 'runnable' } });
        expect(find(parked.id).claimEligible!()).toBe(true);
    } finally { close(); }
});
