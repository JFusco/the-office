import { expect, test, vi } from 'vitest';
import { fixture } from '../test-store';
import { automaticIntakeWait } from '../../../../server/features/handoff/intake-eligibility';
import { pendingQuestions } from '../../../../server/features/questions/pending-questions';
import { commandFeature } from '../../../../server/features/commands';
import { scheduledFeatures } from '../../../../server/features/scheduled-features';
import { FeatureWorkflow } from '../../../../server/features/workflow';

test('automatic Backlog handoff stays out of questions and claims, and stale answers cannot restart it', async () => {
    const f = fixture(); try {
        f.feature.handoff = { episodeId: 'automatic' } as any; f.feature.sourceTicket = 'GH-70'; f.feature.status = 'waiting';
        f.feature.rounds.push({ id: 'round', revision: 1, author: 'product', createdAt: 'now', answers: {}, questions: [{ id: 'q', question: 'Which?', recommendation: 'A', choices: ['A', 'B'] }] });
        f.store.state.coordination!.pickup = { enabled: true, status: 'Ready' };
        f.store.state.coordination!.listener.assigned.push({ key: 'GH-70', pickupStatus: 'Backlog', status: 'OPEN' } as any);
        const raw = JSON.stringify(f.feature);
        expect(automaticIntakeWait(f.store, f.feature)).toContain('Ready');
        expect(pendingQuestions([f.store], { brain: { progression: 'automatic' } })).toEqual([]);
        expect(() => commandFeature(f.store, f.feature.id, { action: 'answer', requestId: 'stale', expectedRevision: 1, roundId: 'round', answers: { q: 'A' } })).toThrow('intake');
        expect(JSON.stringify(f.feature)).toBe(raw);
        f.feature.status = 'queued';
        const scheduled = scheduledFeatures({ store: f.store, engine: {} } as any)[0]; expect(scheduled.eligibility.state).toBe('waiting'); expect(scheduled.claimEligible!()).toBe(false);
        const run = vi.fn(); await new FeatureWorkflow(f.store, { run, active: new Map() } as any).step(f.feature.id); expect(run).not.toHaveBeenCalled();
        f.store.state.coordination!.listener.assigned[0].pickupStatus = 'Ready';
        expect(automaticIntakeWait(f.store, f.feature)).toBe(''); f.feature.status = 'waiting';
        expect(pendingQuestions([f.store], { brain: { progression: 'automatic' } })).toHaveLength(1);
    } finally { f.close(); }
});
test('explicit planning and already authorized delivery retain their own authority and history', () => {
    const f = fixture(); try {
        f.feature.sourceTicket = 'GH-70'; expect(automaticIntakeWait(f.store, f.feature)).toBe('');
        f.feature.handoff = { episodeId: 'automatic' } as any;
        expect(automaticIntakeWait(f.store, f.feature)).toContain('membership');
        f.feature.approvals.push({ id: 'old', featureRevision: 0 } as any); expect(automaticIntakeWait(f.store, f.feature)).toContain('membership');
        f.feature.approvals.push({ id: 'accepted', featureRevision: 1 } as any); expect(automaticIntakeWait(f.store, f.feature)).toBe('');
    } finally { f.close(); }
});
