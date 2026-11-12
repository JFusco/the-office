import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

type Member = { executable: string };
type Snapshot = { status: 'observed' | 'unavailable'; truncated?: boolean; members: Member[] };
/** A lifecycle record for the fixture sender whose exit snapshot, and optional term snapshot, list `members`. */
function lifecycle(f: ReturnType<typeof investigationFixture>, exit: Snapshot, group = f.worker.processId, term?: Snapshot) {
    const at = '2026-11-08T02:01:00.000Z', start = 'Sun Nov 8 02:00:58 2026';
    const snapshot = (taken: Snapshot, phase: string) => ({ status: taken.status, truncated: taken.truncated ?? false, members: taken.members.map((member, i) => ({ pid: 4000 + i, ppid: 1, pgid: group, startIdentity: start, executable: member.executable })), at, phase });
    const dir = resolve(f.root, 'sessions', f.worker.id); mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'process-lifecycle.json'), JSON.stringify({ version: 1, processGroup: group, providerTerminalObserved: true, outcome: 'failed', failureCategory: 'uncertain-effect', probeCount: 3, omittedEvents: 0,
        events: [{ at, phase: 'exit', code: 0, signal: null }, ...(term ? [{ at, phase: 'term', signal: 'SIGTERM' }] : [])],
        snapshots: [snapshot(exit, 'exit'), ...(term ? [snapshot(term, 'term')] : [])] }));
}
const helper = { status: 'observed' as const, members: [{ executable: 'SkyComputerUseClient' }] };
function subprocessFixture() {
    const f = investigationFixture();
    f.worker.failure = { category: 'uncertain-effect', dispatched: true, detail: 'Worker exited with surviving subprocesses', code: 'surviving-subprocesses' } as never;
    Object.assign(f.delivery, { status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
    return f;
}
const entry = (f: ReturnType<typeof investigationFixture>) => f.store.state.it!.investigations!.find(item => item.source.failureKind === 'surviving-subprocesses')!;

test.each([
    ['no term snapshot', undefined],
    ['a helper-only term snapshot', helper],
    ['an empty term snapshot after the helper exited', { status: 'observed' as const, members: [] }],
])("only Codex's notify helper left behind, with the delivery read back, explains the surviving subprocess (%s)", (_case, term) => {
    const f = subprocessFixture(); try {
        lifecycle(f, helper, f.worker.processId, term);
        syncInvestigations(f.store);
        expect(entry(f)).toMatchObject({ status: 'resolved', resolution: { kind: 'confirmed', sourceId: 'delivery' } });
    } finally { f.close(); }
});
test.each([
    ['another process joined the group after the leader exited', { status: 'observed' as const, members: [{ executable: 'SkyComputerUseClient' }, { executable: 'node' }] }],
    ['the term snapshot could not be captured', { status: 'unavailable' as const, members: [] }],
    ['the term snapshot was truncated', { ...helper, truncated: true }],
])('the investigation stays open when the exit snapshot is helper-only but %s', (_case, term) => {
    const f = subprocessFixture(); try {
        lifecycle(f, helper, f.worker.processId, term); syncInvestigations(f.store);
        expect(entry(f).status).not.toBe('resolved');
    } finally { f.close(); }
});
test.each([
    ['is uncertain', { status: 'uncertain' }],
    ['is confirmed without a message URL', { permalink: '' }],
])('the investigation stays open when a second delivery of the request %s', (_case, change) => {
    const f = subprocessFixture(); try {
        lifecycle(f, helper);
        f.store.state.slackDeliveries!.push({ ...f.delivery, id: 'second', ...change } as never); syncInvestigations(f.store);
        expect(entry(f).status).not.toBe('resolved');
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
