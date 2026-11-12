import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

type Member = { executable: string };
/** A lifecycle record for the fixture sender whose exit snapshot lists `members`. */
function lifecycle(f: ReturnType<typeof investigationFixture>, exit: { status: 'observed' | 'unavailable'; truncated?: boolean; members: Member[] }, group = f.worker.processId) {
    const at = '2026-11-08T02:01:00.000Z', start = 'Sun Nov 8 02:00:58 2026';
    const dir = resolve(f.root, 'sessions', f.worker.id); mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'process-lifecycle.json'), JSON.stringify({ version: 1, processGroup: group, providerTerminalObserved: true, outcome: 'failed', failureCategory: 'uncertain-effect', probeCount: 3, omittedEvents: 0,
        events: [{ at, phase: 'exit', code: 0, signal: null }],
        snapshots: [{ status: exit.status, truncated: exit.truncated ?? false, members: exit.members.map((member, i) => ({ pid: 4000 + i, ppid: 1, pgid: group, startIdentity: start, executable: member.executable })), at, phase: 'exit' }] }));
}
function subprocessFixture() {
    const f = investigationFixture();
    f.worker.failure = { category: 'uncertain-effect', dispatched: true, detail: 'Worker exited with surviving subprocesses', code: 'surviving-subprocesses' } as never;
    Object.assign(f.delivery, { status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
    return f;
}
const entry = (f: ReturnType<typeof investigationFixture>) => f.store.state.it!.investigations!.find(item => item.source.failureKind === 'surviving-subprocesses')!;

test("only Codex's notify helper left behind, with the delivery read back, explains the surviving subprocess", () => {
    const f = subprocessFixture(); try {
        lifecycle(f, { status: 'observed', members: [{ executable: 'SkyComputerUseClient' }] });
        syncInvestigations(f.store);
        expect(entry(f)).toMatchObject({ status: 'resolved', resolution: { kind: 'confirmed', sourceId: 'delivery' } });
    } finally { f.close(); }
});
test.each([
    ['another process survived beside the helper', { status: 'observed' as const, members: [{ executable: 'SkyComputerUseClient' }, { executable: 'node' }] }],
    ['a different process survived', { status: 'observed' as const, members: [{ executable: 'node' }] }],
    ['the exit snapshot could not be captured', { status: 'unavailable' as const, members: [] }],
    ['the exit snapshot was truncated', { status: 'observed' as const, truncated: true, members: [{ executable: 'SkyComputerUseClient' }] }],
])('the investigation stays open when %s', (_case, exit) => {
    const f = subprocessFixture(); try {
        lifecycle(f, exit); syncInvestigations(f.store);
        expect(entry(f).status).not.toBe('resolved');
    } finally { f.close(); }
});
test('the investigation stays open without a confirmed delivery, or when the record belongs to another process group', () => {
    const f = subprocessFixture(); try {
        lifecycle(f, { status: 'observed', members: [{ executable: 'SkyComputerUseClient' }] });
        f.delivery.status = 'uncertain'; syncInvestigations(f.store); expect(entry(f).status).not.toBe('resolved');
    } finally { f.close(); }
    const g = subprocessFixture(); try {
        lifecycle(g, { status: 'observed', members: [{ executable: 'SkyComputerUseClient' }] }, 12345);
        syncInvestigations(g.store); expect(entry(g).status).not.toBe('resolved');
    } finally { g.close(); }
});
