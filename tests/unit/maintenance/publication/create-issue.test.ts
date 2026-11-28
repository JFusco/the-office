import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { ensureMaintenanceIssue } from '../../../../server/maintenance/publication/create-issue';
import { reconcilePublication } from '../../../../server/maintenance/publication/reconcile-publication';
import { BODY } from './support/issue-body';
import type { MaintenanceRun } from '../../../../src/shared';
afterEach(cleanupFakes);

function setup() {
    const f = fakeMaintenanceGitHub();
    const run = { id: 'run-1', requestedAt: '', startedAt: '', endedAt: '', status: 'working', weekly: true, stage: 'proposal', error: '', steps: [] } as MaintenanceRun;
    f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    const owner = { run, claim: 'maintenance' as const, subject: 'cms-k', current: () => undefined };
    const proposed = { key: 'cms-k', title: '[Bug] Restore x', body: BODY, labels: ['Bug', 'area:sources'], named: 0, grounded: () => false };
    const ensure = () => f.claimed(run, 'maintenance', () => ensureMaintenanceIssue(f.store, f.execute as any, owner, proposed));
    return { ...f, run, ensure };
}

test('one assigned create with canonical labels and the marker, verified field by field; a replay sends nothing', async () => {
    const f = setup();
    const issue = await f.ensure();
    expect(f.state.writes).toEqual(['issue-create']);
    const saved = f.state.issues[0];
    expect(saved.assignees).toEqual([{ login: 'JFusco' }]);
    expect(saved.labels.map((l: any) => l.name)).toEqual(['area:sources', 'bug']);
    expect(saved.body).toContain('<!-- office-maintenance-issue:cms-k -->');
    expect(issue).toMatchObject({ number: saved.number, adopted: false, title: '[Bug] Restore x' });
    expect(f.store.getEffect(issue.effectId)).toMatchObject({ status: 'verified', work: { kind: 'maintenance', id: 'run-1' }, payload: { key: 'cms-k' } });
    await f.ensure();
    expect(f.state.writes).toEqual(['issue-create']);
});

test('a lost create response stays uncertain, then is settled by read-back under its saved writer and never resent', async () => {
    const f = setup();
    f.state.faults['issue-create'] = 'lost';
    await expect(f.ensure()).rejects.toThrow(/HTTP 502/);
    expect(f.store.getEffect('maintenance:run-1:cms-k:issue-create')!.status).toBe('uncertain');
    const issue = await f.ensure();
    expect(issue.number).toBe(f.state.issues[0].number);
    expect(f.store.getEffect(issue.effectId)!.status).toBe('verified');
    expect(f.state.writes).toEqual(['issue-create']);
});

test('a dropped assignee leaves the create unverified with its identity kept, and it is not created again', async () => {
    const f = setup();
    f.state.faults['issue-create'] = 'drop-assignee';
    await expect(f.ensure()).rejects.toThrow();
    const effect = f.store.getEffect('maintenance:run-1:cms-k:issue-create')!;
    expect(effect.status).toBe('uncertain');
    expect((effect.receipt as any).number).toBe(f.state.issues[0].number);
    await expect(f.ensure()).rejects.toThrow(/will not be resent/);
    expect((await reconcilePublication(f.store, f.run, f.execute as any)).settled).toBe(false);
    expect(f.state.writes).toEqual(['issue-create']);
});

test('an unknown label or a missing area stops before any write', async () => {
    const f = setup();
    await expect(f.claimed(f.run, 'maintenance', () => ensureMaintenanceIssue(f.store, f.execute as any, { run: f.run, claim: 'maintenance', subject: 'cms-k', current: () => undefined },
        { key: 'cms-k', title: '[Bug] Restore x', body: BODY, labels: ['bug'], named: 0, grounded: () => false }))).rejects.toThrow(/area:/);
    expect(f.state.writes).toEqual([]);
});

test('a create whose response named issue A settles only on A: a replacement B with the same marker, content and writer does not', async () => {
    const f = setup();
    f.state.faults['issue-create'] = 'drop-assignee';
    await expect(f.ensure()).rejects.toThrow();
    const id = 'maintenance:run-1:cms-k:issue-create', a = f.state.issues[0];
    expect((f.store.getEffect(id)!.receipt as any)).toMatchObject({ number: a.number, url: a.html_url, nodeId: a.node_id });
    // A loses its marker and B carries it with exactly the saved payload and writer: B is the only marked issue.
    const body = a.body; a.body = 'moved';
    f.addIssue({ title: a.title, body, labels: a.labels.map((label: any) => label.name), assignees: ['JFusco'] });
    expect((await reconcilePublication(f.store, f.run, f.execute as any)).settled).toBe(false);
    await expect(f.ensure()).rejects.toThrow(/will not be resent/);
    expect(f.store.getEffect(id)!.status).toBe('uncertain');
    // A itself, fixed by a person and read again, settles the original create without another send.
    f.state.issues.splice(1, 1); a.body = body; a.assignees.push({ login: 'JFusco' });
    expect((await reconcilePublication(f.store, f.run, f.execute as any)).settled).toBe(true);
    expect(f.store.getEffect(id)).toMatchObject({ status: 'verified', receipt: { number: a.number, url: a.html_url, nodeId: a.node_id } });
    expect(f.state.writes).toEqual(['issue-create']);
});

test('a lost create settled by read-back before its run recorded the issue is still that key\'s issue: a later run adopts it after its title and marker change, and stops if it is missing or replaced', async () => {
    const later = async (arrange: (f: ReturnType<typeof setup>, issue: any) => void) => {
        const f = setup();
        f.state.faults['issue-create'] = 'lost';
        await expect(f.ensure()).rejects.toThrow(/HTTP 502/);
        // Run A's read-back settles the create; run A never recorded the issue on a candidate.
        expect((await reconcilePublication(f.store, f.run, f.execute as any)).settled).toBe(true);
        expect(f.run.publication).toBeUndefined();
        const issue = f.state.issues[0];
        issue.title = '[Bug] Restore x (edited)'; issue.body = 'Edited by a person; the marker is gone.';
        arrange(f, issue);
        const runB = { ...f.run, id: 'run-2', status: 'working' } as MaintenanceRun;
        f.store.state.maintenance!.runs.push(runB);
        const owner = { run: runB, claim: 'maintenance' as const, subject: 'cms-k', current: () => undefined };
        const outcome = await f.claimed(runB, 'maintenance', () => ensureMaintenanceIssue(f.store, f.execute as any, owner,
            { key: 'cms-k', title: '[Bug] Restore x', body: BODY, labels: ['Bug', 'area:sources'], named: 0, grounded: () => false })).catch(error => error as Error);
        return { f, issue, outcome };
    };
    const adopted = await later(() => {});
    expect(adopted.outcome).toMatchObject({ number: adopted.issue.number, adopted: true });
    expect(adopted.f.state.writes).toEqual(['issue-create']);
    const missing = await later(f => { f.state.issues.splice(0, 1); });
    expect(String(missing.outcome)).toMatch(/not in the complete listing/);
    expect(missing.f.state.writes).toEqual(['issue-create']);
    const replaced = await later((_f, issue) => { issue.node_id = 'I_replaced'; });
    expect(String(replaced.outcome)).toMatch(/no longer matches the identity an earlier run verified/);
    expect(replaced.f.state.writes).toEqual(['issue-create']);
});
