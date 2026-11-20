import { afterEach, expect, test } from 'vitest';
import { itInvestigations } from '../../../../server/incidents/sources/it-investigations';
import type { Store } from '../../../../server/store/store';
import { observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }

test('open diagnoses that name the harness or propose an Office fix, each its own incident', () => {
    const s = store();
    const base = { source: { kind: 'worker', id: 'w', requestId: '', ticket: 'GH-12', failureKind: 'timeout', workerIds: ['run-1', 'run-2'] }, attempts: 1 };
    s.state.it = { recoveries: {}, investigations: [
        { ...base, id: 'inv-1', status: 'diagnosed', report: { cause: 'harness', summary: 'The stage prompt omits the worktree path', officeFix: { status: 'proposed', title: 'Pass the worktree path to review', changes: [], tests: [], evidenceRefs: [] } } },
        { ...base, id: 'inv-2', status: 'blocked', report: { cause: 'harness', summary: 'The harness lost the session' } },
        { ...base, id: 'inv-3', status: 'diagnosed', report: { cause: 'provider', summary: 'GitHub was down' } },
        { ...base, id: 'inv-4', status: 'resolved', report: { cause: 'harness', summary: 's' }, resolution: { sourceId: 'x', at: 'a', receipt: 'r' } },
        { ...base, id: 'inv-5', status: 'diagnosed', report: { cause: 'harness', summary: 's' }, retirement: {} },
        { ...base, id: 'inv-6', status: 'working' },
    ] } as any;
    // The investigation's own runs are filed under its ID; the runs it investigates are not its workers.
    s.state.workLog = [{ id: 'ellis-1', requestId: 'inv-1', stage: 'it-investigation' }, { id: 'ellis-2', requestId: 'inv-1', stage: 'it-investigation' }, { id: 'other', requestId: 'inv-1', stage: 'conversation' }] as any;
    const found = itInvestigations(observe(s));
    expect(found.map(f => [f.subject.id, f.cause.kind, f.cause.author, f.cause.text, f.evidence, f.subject.lastWorker])).toEqual([
        ['inv-1', 'office-fix-proposed', 'model', '', 'Pass the worktree path to review', 'ellis-2'],
        ['inv-2', 'harness', 'model', '', 'The harness lost the session', ''],
    ]);
});
