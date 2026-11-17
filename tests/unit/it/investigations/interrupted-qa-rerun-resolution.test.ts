import { afterEach, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { interruptedQARerunResolution } from '../../../../server/it/investigations/interrupted-qa-rerun-resolution';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function arrange() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-rerun-')); roots.push(root);
    const store = new Store(':memory:', projectById('cec'), root); stores.push(store);
    const interrupted: any = { id: 'run-1', ticket: 'CEC-900', role: 'qa', stage: 'retest', status: 'failed', failure: { category: 'uncertain-effect', dispatched: true, detail: 'usage limit' } };
    const rerun: any = { id: 'run-2', ticket: 'CEC-900', role: 'qa', stage: 'retest', status: 'blocked', executionStatus: 'completed', endedAt: '2026-11-17T18:00:00Z', sessionId: 'session-2', provider: 'codex' };
    store.state.workLog = [interrupted, rerun];
    const dir = resolve(root, 'sessions', rerun.id), saved = JSON.stringify({ session: rerun.sessionId, result: { outcome: 'blocked' } });
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'result.json'), saved);
    writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: rerun.id, session: rerun.sessionId, provider: rerun.provider, resultSha256: createHash('sha256').update(saved).digest('hex') }));
    const entry: any = { id: 'investigation', source: { kind: 'worker', id: interrupted.id, requestId: '', ticket: 'CEC-900', failureKind: 'uncertain-effect', workerIds: [interrupted.id] }, status: 'blocked' };
    return { store, interrupted, rerun, entry };
}

test('an interrupted QA run is settled by a later run of the same stage that returned a result', () => {
    const { store, entry } = arrange();
    expect(interruptedQARerunResolution(store, entry)).toEqual({ kind: 'superseded', sourceId: 'run-2', receipt: 'sessions/run-2/execution-completion.json' });
});

test('nothing else settles it: a rerun still going, another stage, ticket or role, an earlier run, or a non-QA worker', () => {
    const cases: [string, (x: ReturnType<typeof arrange>) => void][] = [
        ['the rerun has not returned', x => { delete x.rerun.executionStatus; x.rerun.status = 'running'; }],
        ['another stage', x => { x.rerun.stage = 'qa'; }],
        ['another ticket', x => { x.rerun.ticket = 'CEC-901'; }],
        ['another role', x => { x.rerun.role = 'developer'; }],
        ['the completed run came first', x => { x.store.state.workLog!.reverse(); }],
        ['a developer stage', x => { x.interrupted.stage = 'repair'; x.rerun.stage = 'repair'; }],
        ['the original run did return', x => { x.interrupted.executionStatus = 'completed'; }],
        ['a Slack delivery', x => { x.entry.source.kind = 'slack'; }],
    ];
    for (const [name, change] of cases) { const x = arrange(); change(x); expect(interruptedQARerunResolution(x.store, x.entry), name).toBeUndefined(); }
});
