import { expect, test } from 'vitest';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
import { checkpointSuperseded } from '../../../server/maintenance/superseded';
import { projectOutbox } from '../../../server/conversations/outbox';
const failed = () => ({ id: 'old-read', date: '2026-11-13', dueAt: '2026-11-13T14:00:00Z', requestedAt: '2026-11-13T14:00:01Z',
    startedAt: '2026-11-13T14:00:02Z', endedAt: '2026-11-13T14:02:00Z', status: 'blocked' as const, runId: '', detail: 'Original board read failed' });
test('a later accepted manual Jira intake resolves the stale outbox item and preserves its original failure', () => {
    const f = knowledgeStore('cec');
    try {
        const checkpoint = failed(), original = structuredClone(checkpoint);
        f.store.state.coordination!.checkpoints = [checkpoint];
        f.store.state.outbox = projectOutbox(f.store.state);
        expect(f.store.state.outbox.some(item => item.id === 'checkpoint:old-read' && item.status === 'open')).toBe(true);
        f.store.state.intake.lastChecked = '2026-11-13T15:47:23Z';
        expect(projectOutbox(f.store.state).find(item => item.id === 'checkpoint:old-read')?.status).toBe('resolved');
        expect(checkpoint).toEqual(original);
        expect(checkpoint.status).toBe('blocked');
    } finally { f.close(); }
});
test.each(['2026-11-12T15:00:00Z', '2026-11-13T14:02:00Z', '', 'not-a-date'])('an older or unverified read does not clear a failed checkpoint (%s)', lastChecked => {
    expect(checkpointSuperseded({ project: { provider: 'azure' }, intake: { lastChecked }, coordination: { checkpoints: [] } } as any, failed())).toBe(false);
});
test.each([
    { status: 'working' }, { status: 'interrupted' }, { runId: 'native-run' }, { repairResume: { needsFollowup: true } },
    { continuationId: 'continuation' }, { endedAt: '' }, { startedAt: '2026-11-14T14:00:00Z' },
])('active, unfinished or linked work remains independent (%j)', patch => {
    expect(checkpointSuperseded({ project: { provider: 'azure' }, intake: { lastChecked: '2026-11-13T15:47:23Z' }, coordination: { checkpoints: [] } } as any, { ...failed(), ...patch } as any)).toBe(false);
});
test('Brain and CMS maintenance cannot be superseded by an unrelated mailbox read', () => {
    for (const project of ['brain', 'cms-field-vocabulary']) {
        const f = knowledgeStore(project);
        try {
            f.store.state.intake.lastChecked = '2026-11-13T15:47:23Z';
            expect(checkpointSuperseded(f.store.state, failed())).toBe(false);
        } finally { f.close(); }
    }
});
test('a later new intake failure stays actionable without resurrecting an earlier resolved read', () => {
    const f = knowledgeStore('cec');
    try {
        f.store.state.coordination!.checkpoints = [failed()];
        f.store.state.intake = { ...f.store.state.intake, lastChecked: '2026-11-13T15:47:23Z', status: 'blocked', error: 'New current access failure' };
        const open = projectOutbox(f.store.state).filter(item => item.status === 'open');
        expect(open.some(item => item.id === 'intake' && item.detail === 'New current access failure')).toBe(true);
        expect(open.some(item => item.id === 'checkpoint:old-read')).toBe(false);
    } finally { f.close(); }
});
