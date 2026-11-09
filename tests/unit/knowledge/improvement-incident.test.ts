import { test, expect } from 'vitest';
import { improvementIncident, improvementIncidentKey } from '../../../server/knowledge/improvement-incident';
import { proposeImprovements } from '../../../server/knowledge/propose-improvements';
import { job, knowledgeStore, maintenanceRun } from './knowledge-fixture';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

const investigation = (requestId: string): ITInvestigation => ({ id: 'diagnosis', source: { kind: 'worker', id: 'work', requestId, ticket: '', failureKind: 'fixture', workerIds: [] }, status: 'diagnosed', createdAt: '', updatedAt: '', attempts: 1, nextAt: '', lastError: '' });
test('a maintenance incident, its repair, continuation and diagnosis count once', () => {
    const f = knowledgeStore();
    try {
        f.store.state.maintenance = { runs: [maintenanceRun({ id: 'original', blockerFollowup: { status: 'completed', issue: 88, detail: '' } }), maintenanceRun({ id: 'continuation' })], lastDaily: '', lastWeekly: '', ledger: '' };
        f.store.state.coordination!.jobs!.push(job({ id: 'repair', key: 'GH-88' }));
        f.store.state.coordination!.continuations = [{ original: { projectId: 'brain', kind: 'maintenance', id: 'original' }, repair: { projectId: 'brain', kind: 'delivery', id: 'repair' }, repairIssue: 88, runId: 'continuation' } as never];
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [], investigations: [investigation('original')] };
        const proposal = { cause: 'same cause', change: 'one fix', regression: 'one regression', acceptance: ['passes'], evidenceIds: ['proof'] };
        const catalog = { proof: { kind: 'learning' as const, ref: 'proof', url: '', detail: 'accepted observation' } };
        for (const source of [{ kind: 'maintenance' as const, id: 'original' }, { kind: 'job' as const, id: 'repair' }, { kind: 'maintenance' as const, id: 'continuation' }, { kind: 'investigation' as const, id: 'diagnosis' }]) {
            expect(improvementIncident(f.store, source)).toEqual({ kind: 'maintenance', id: 'original' });
            proposeImprovements(f.store, source, [proposal], catalog);
        }
        expect(f.store.state.knowledge!.improvements![0].incidents).toEqual(['maintenance:original']);
    } finally { f.close(); }
});
test('investigations resolve actual typed requests and never invent a job for unknown or ambiguous requests', () => {
    const f = knowledgeStore('cec');
    try {
        f.store.state.tickets = [{ key: 'CEC-77', runId: 'cec-run' } as never];
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [], investigations: [investigation('ticket:CEC-77')] };
        expect(improvementIncident(f.store, { kind: 'investigation', id: 'diagnosis' })).toEqual({ kind: 'ticket', id: 'cec-run' });
        f.store.state.it!.investigations![0].source.requestId = 'unknown';
        expect(improvementIncident(f.store, { kind: 'investigation', id: 'diagnosis' })).toBeUndefined();
        f.store.state.coordination!.jobs!.push(job({ id: 'shared' }));
        f.store.state.features = [{ id: 'shared' } as never];
        f.store.state.it!.investigations![0].source.requestId = 'shared';
        expect(improvementIncident(f.store, { kind: 'investigation', id: 'diagnosis' })).toBeUndefined();
    } finally { f.close(); }
});
test('feature correlation and durable Harper-origin suppression survive an investigation hop', () => {
    const f = knowledgeStore();
    try {
        const child = job({ id: 'child', featureBinding: { featureId: 'feature' } as never });
        f.store.state.coordination!.jobs!.push(child);
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [], investigations: [investigation('child')] };
        expect(improvementIncident(f.store, { kind: 'investigation', id: 'diagnosis' })).toEqual({ kind: 'feature', id: 'feature' });
        child.improvementId = 'retained-provenance';
        expect(improvementIncident(f.store, { kind: 'investigation', id: 'diagnosis' })).toBeUndefined();
        expect(improvementIncident(f.store, { kind: 'feature', id: 'feature' })).toBeUndefined();
    } finally { f.close(); }
});
test('explicit supersession retains typed IDs and ambiguous or cyclic ancestry cannot add an incident', () => {
    const f = knowledgeStore();
    try {
        const replacement = maintenanceRun({ id: 'new:run', supersedes: ['original:run'] });
        f.store.state.maintenance = { runs: [replacement], lastDaily: '', lastWeekly: '', ledger: '' };
        expect(improvementIncidentKey(f.store, 'maintenance:new:run')).toBe('maintenance:original:run');
        replacement.supersedes = ['one', 'two'];
        expect(improvementIncidentKey(f.store, 'maintenance:new:run')).toBeUndefined();
        replacement.supersedes = ['new:run'];
        expect(improvementIncidentKey(f.store, 'maintenance:new:run')).toBeUndefined();
        expect(improvementIncidentKey(f.store, 'invalid:work')).toBeUndefined();
    } finally { f.close(); }
});
