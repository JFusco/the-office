import { test, expect } from 'vitest';
import { linkedRepairGap } from '../../../server/knowledge/linked-repair-gate';
import { job, knowledgeStore, maintenanceRun } from './knowledge-fixture';
test('linked open work and missing repair identities block independently of description wording', async () => {
    const f = knowledgeStore();
    try {
        const original = maintenanceRun({ id: 'original', blockerFollowup: { status: 'completed', issue: 88, detail: '' } });
        f.store.state.maintenance = { runs: [original], lastDaily: '', lastWeekly: '', ledger: '' };
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [{ key: 'GH-88' }])).toContain('Existing linked repair GH-88');
        delete original.blockerFollowup!.issue;
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [])).toContain('no verified provider identity');
    } finally { f.close(); }
});
test('only positive closure with no active local owner clears linked work', async () => {
    const f = knowledgeStore();
    try {
        f.store.state.maintenance = { runs: [maintenanceRun({ id: 'original', blockerFollowup: { status: 'completed', issue: 88, detail: '' } })], lastDaily: '', lastWeekly: '', ledger: '' };
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [])).toContain('unverified');
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [], async () => false)).toContain('unverified');
        const repair = job({ key: 'GH-88', status: 'working' }); f.store.state.coordination!.jobs!.push(repair);
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [], async () => true)).toContain('still owns');
        repair.status = 'completed';
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [], async key => key === 'GH-88')).toBeUndefined();
    } finally { f.close(); }
});
test('saved continuation links remain useful after source pruning and respect project identity', async () => {
    const f = knowledgeStore();
    try {
        const link = { original: { projectId: 'brain', kind: 'maintenance', id: 'original' }, repairIssue: 88 };
        f.store.state.coordination!.continuations = [link as never];
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [{ key: 'GH-88' }])).toContain('GH-88');
        link.original.projectId = 'elsewhere';
        expect(await linkedRepairGap(f.store, ['maintenance:original'], [{ key: 'GH-88' }])).toBeUndefined();
    } finally { f.close(); }
});
