import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { restartStoppedWriters } from '../../../../server/delivery/attempts/restart-stopped-writers';
import type { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { assessResumes } from '../../../../server/incidents/repair/assess-resumes';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes, resumeAdmitted } from '../../../../server/incidents/repair/resume-arrivals';
import type { Store } from '../../../../server/store/store';
import type { RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import { salvageGit } from '../../delivery/support/salvage-git';
import { later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const ONE = 'cms-field-vocabulary/delivery/1', HEAD = 'a'.repeat(40), PARTIAL = 'e'.repeat(40), HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
const route = (jobId: string): RepairRoute => ({ action: 'release-writer', payload: { key: `GH-${jobId}`, head: `run-${jobId}` }, expectedStage: 'implement' });
const leaving = (bound: SubjectFix): SubjectFix => bound.disposition === 'route' ? { ...bound, boundary: { kind: 'stage-left', stage: 'implement' } } : bound;

test('a release is granted once, spent by exactly one more harness restart, and judged by the stage it was bound to', async () => {
    const worktree = mkdtempSync(resolve(tmpdir(), 'office-release-')); roots.push(worktree);
    const spent = [1, 2, 3].map(n => ({ workId: `old-${n}`, stage: 'implement', at: later(-30).toISOString(), accepted: HEAD, abandoned: String(n).repeat(40), ref: `refs/office/salvage/1/old-${n}` }));
    const w = await deployedWorld(stores, dbs, ['1'], route, { job: { stage: 'implement', stop: { kind: 'uncertain-effect', at: 't1' }, branch: 'codex/1-fix', worktree, head: HEAD, steps: [], writerRestarts: structuredClone(spent) }, declare: leaving });
    // Dead of its own process ten minutes before the fixture's hour: never dispatched again, so no process probe is asked.
    w.store.state.workLog = [{ id: 'run-1', requestId: '1', stage: 'github-implement', status: 'failed', startedAt: later(-20).toISOString(), endedAt: later(-10).toISOString(), failure: { category: 'uncertain-effect', dispatched: false, detail: 'codex timed out' } } as any];
    w.store.save();
    let minute = 4;
    w.store.clock = { now: () => later(minute), monotonic: () => 0 };
    const { git, answer } = salvageGit({ head: PARTIAL, branch: 'codex/1-fix' });
    const earlierRefs = spent.map(({ ref, abandoned }) => [ref, abandoned] as const);
    for (const [ref, object] of earlierRefs) git.refs.set(ref, object);
    const delivery = {
        store: w.store, get jobs() { return w.store.state.coordination!.jobs!; },
        // An unpublished candidate: no remote branch and no pull request to read.
        execute: async (program: string, args: string[]) => answer(program, args) ?? (program === 'git' && args[0] === 'ls-remote' ? '' : fail(`unexpected ${program} ${args.join(' ')}`)),
        verifyPR: async () => fail('no pull request'),
    } as unknown as GitHubDelivery;
    const job = () => w.jobs()[0], restarted = () => w.store.state.events.filter(event => event.kind === 'writer-restarted');
    const judge = () => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minute), fenced: () => false, report: fail });

    // Spent and held: the poll restarts nothing.
    await restartStoppedWriters(delivery);
    expect(job()).toMatchObject({ status: 'blocked', writerRestarts: spent });
    expect(git.writes).toEqual([]);

    minute = 5;
    expect(dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => HOLDS_IT, now: () => later(5), fenced: () => false, report: fail })).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(w.requests().map(request => [request.action, request.status, request.head])).toEqual([['release-writer', 'completed', '']]);
    expect(w.requests().filter(request => ['queued', 'working'].includes(request.status))).toEqual([]);
    expect(w.waits()).toEqual({});
    expect(job()).toMatchObject({ status: 'blocked', writerRestarts: spent, repairRelease: { workId: 'run-1', stage: 'implement', accepted: HEAD } });
    const incident = w.ledger.get(w.id)!;
    expect(assessResumes(incident, ENABLED, undefined, subject => resumeAdmitted(w.ledger, incident, subject))!.subjects).toEqual([
        { subject: ONE, standing: 'admitted', action: 'release-writer', reason: 'One more restart of worker run-1 was granted for this fix; the harness restarts it, and a fix resumes a subject once.' },
    ]);

    // Two polls: one restart, from the accepted head, spending the release.
    minute = 6;
    await restartStoppedWriters(delivery);
    await restartStoppedWriters(delivery);
    expect(job().writerRestarts).toEqual([...spent, expect.objectContaining({ workId: 'run-1', stage: 'implement', accepted: HEAD, abandoned: PARTIAL, ref: 'refs/office/salvage/1/run-1' })]);
    expect(job()).toMatchObject({ stage: 'implement', status: 'queued', repairRelease: { consumedAt: later(6).toISOString() } });
    expect(restarted()).toHaveLength(1);
    expect(git.writes.filter(write => write.startsWith('reset'))).toEqual([`reset --hard ${HEAD}`]);
    expect(git.refs).toEqual(new Map([...earlierRefs, ['refs/office/salvage/1/run-1', PARTIAL]]));

    // Still at implement: the outcome waits. Once the restarted job leaves implement, it advanced.
    minute = 7;
    expect(judge()).toEqual([]);
    Object.assign(job(), { stage: 'review', status: 'queued' });
    minute = 8;
    expect(judge()).toEqual([ONE]);
    expect(w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes!.map(held => [held.subject, held.outcome, held.detail])).toEqual([[ONE, 'advanced', 'The job left implement for review after its resume.']]);
});
