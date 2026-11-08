import { expect, test } from 'vitest';
import { investigationFollowUps } from '../../../../server/it/investigations/follow-ups';
import { diagnosticSnapshot } from '../../../../server/it/diagnostic-snapshot';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

test('uncertain delivery is visible before a tick and while paused; diagnosed remains with Morgan', () => {
    const f = investigationFixture(); try {
        f.store.state.paused = true;
        expect(investigationFollowUps(f.store)).toHaveLength(1); expect(diagnosticSnapshot(f.store)!.status).toBe('retrying');
        syncInvestigations(f.store); f.store.state.it!.investigations![0].status = 'diagnosed';
        expect(diagnosticSnapshot(f.store)).toMatchObject({ status: 'needs-attention', followUps: [{ owner: 'Morgan' }] });
        f.store.state.it!.reports.push({ followUps: investigationFollowUps(f.store) } as any);
        Object.assign(f.delivery, { status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
        syncInvestigations(f.store); expect(diagnosticSnapshot(f.store)!.followUps).toEqual([]); expect(f.store.state.it!.reports[0].followUps).toHaveLength(1);
    } finally { f.close(); }
});
