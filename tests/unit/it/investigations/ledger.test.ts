import { expect, test } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

test('repeated ticks and restart snapshots preserve identity, budget and original failure', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0]; entry.attempts = 2; entry.status = 'diagnosed';
        f.store.state = structuredClone(f.store.state); syncInvestigations(f.store);
        expect(f.store.state.it!.investigations).toHaveLength(1); expect(f.store.state.it!.investigations![0]).toMatchObject({ id: entry.id, attempts: 2, status: 'diagnosed' });
        expect(f.store.state.slackDeliveries![0].status).toBe('uncertain');
    } finally { f.close(); }
});
test('diagnosis and a different confirmed follow-up cannot settle the original delivery; exact receipt can', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0]; entry.status = 'diagnosed';
        f.store.state.slackDeliveries!.push({ ...f.delivery, id: 'fresh', requestId: 'fresh-request', status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
        syncInvestigations(f.store); expect(entry.status).toBe('diagnosed');
        Object.assign(f.delivery, { status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
        syncInvestigations(f.store); expect(entry).toMatchObject({ status: 'resolved', resolution: { sourceId: 'delivery' } });
        f.delivery.status = 'uncertain'; syncInvestigations(f.store); expect(entry.status).toBe('blocked'); expect(entry.resolution).toBeUndefined();
    } finally { f.close(); }
});

test('worker resolution requires a bound completed execution receipt and does not refund the investigation budget', async () => {
    const { mkdirSync, writeFileSync } = await import('node:fs'); const { resolve } = await import('node:path'); const { createHash } = await import('node:crypto');
    const f = investigationFixture(); try {
        f.store.state.slackDeliveries = []; syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0]; entry.attempts = 3; entry.status = 'blocked';
        const recovery = { ...f.worker, id: 'recovery', originalId: f.worker.id, status: 'completed', executionStatus: 'completed', sessionId: 'session', provider: 'codex' } as any;
        f.store.state.workLog!.push(recovery); syncInvestigations(f.store); expect(entry.status).toBe('blocked');
        const dir = resolve(f.root, 'sessions/recovery'); mkdirSync(dir, { recursive: true }); const result = '{}'; writeFileSync(resolve(dir, 'result.json'), result);
        writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: 'recovery', session: 'session', provider: 'codex', resultSha256: createHash('sha256').update(result).digest('hex') }));
        syncInvestigations(f.store); expect(entry).toMatchObject({ status: 'resolved', attempts: 3, resolution: { sourceId: 'recovery' } });
    } finally { f.close(); }
});
