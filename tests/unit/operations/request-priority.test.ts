import { expect, test } from 'vitest';
import { requestPriority } from '../../../server/operations/request-priority';
import { selectWork } from '../../../server/scheduling/scheduler';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test('recurring reads cannot repeatedly overtake already queued evidence capture', () => {
    const fixture = knowledgeStore('cec');
    try {
        const item = (stage: string, at: string) => ({ store: fixture.store, stage, enqueuedAt: at,
            rank: stage === 'evidence-capture' ? 3 : requestPriority(stage),
            eligibility: { state: 'runnable' }, execute: async () => {}, identity: () => stage });
        const capture = item('evidence-capture', '2026-11-11T02:15:00Z');
        for (let minute = 16; minute < 30; minute++) {
            expect(selectWork([item('refresh', `2026-11-11T02:${minute}:00Z`), capture] as any, 0)).toBe(capture);
        }
        expect(selectWork([item('refresh', '2026-11-11T02:14:00Z'), capture] as any, 0)?.stage).toBe('refresh');
        expect(requestPriority('reconcile-closeout')).toBe(2);
        expect(requestPriority('cleanup-merged-candidate', true)).toBe(0);
    } finally { fixture.close(); }
});
