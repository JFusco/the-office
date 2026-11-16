import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { restartStoppedWriters } from '../../../../server/delivery/attempts/restart-stopped-writers';
afterEach(cleanupFakes);

const PARTIAL = 'e'.repeat(40);
/** An interrupted update-base run on a published PR; the worktree holds one unaccepted commit. */
function stopped() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked', pr: 200, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', detail: 'Error: codex timed out; previous action outcome must be reconciled' });
    job.stop = { kind: 'uncertain-effect', at: '2026-11-16T12:00:00.000Z' };
    f.state.remote[job.branch!] = HEAD; f.state.local.head = PARTIAL;
    f.state.prs.push({ number: 200, html_url: job.prUrl, state: 'open', draft: false, mergeable: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, base: { ref: 'main', sha: 'b'.repeat(40), repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-01T16:15:30Z' });
    // No process id and dispatched=false: nothing is left running, so the real process probe is not consulted.
    f.store.state.workLog = [{ id: 'run-1', requestId: job.id, stage: 'github-update-base', status: 'interrupted', startedAt: new Date(Date.now() - 900000).toISOString(), endedAt: new Date(Date.now() - 600000).toISOString(), failure: { category: 'cancelled', dispatched: false, detail: 'cancelled' } } as any];
    const writes: string[] = [], base = f.delivery.execute, hooks: { onWrite?: (command: string) => void } = {};
    f.delivery.execute = (async (program: string, args: string[], options: any) => {
        if (program === 'git' && args[0] === 'submodule') return '';
        if (program === 'git' && ['cat-file', 'add', 'write-tree', 'commit-tree', 'update-ref', 'reset', 'clean'].includes(args[0])) {
            writes.push(args.join(' '));
            hooks.onWrite?.(args[0]);
            if (args[0] === 'reset') Object.assign(f.state.local, { head: args[2], dirty: false });
            return '';
        }
        return base(program, args, options);
    }) as any;
    return { f, job, writes, hooks };
}

test('a stopped writer whose branch and PR have not moved is saved, reset and queued again', async () => {
    const { f, job, writes } = stopped();
    await restartStoppedWriters(f.delivery);
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued' });
    expect(job.stop).toBeUndefined();
    expect(job.writerRestarts).toEqual([expect.objectContaining({ workId: 'run-1', stage: 'update-base', accepted: HEAD, abandoned: PARTIAL, ref: `refs/office/salvage/${job.id}/run-1` })]);
    expect(writes).toEqual([`cat-file -e ${HEAD}^{commit}`, `update-ref refs/office/salvage/${job.id}/run-1 ${PARTIAL}`, `reset --hard ${HEAD}`, 'clean -fd']);
    expect(f.state.calls.some(call => /^git push|^gh pr (create|ready|merge)/.test(call))).toBe(false);
    // The same stopped run is never restarted twice.
    job.status = 'blocked';
    await restartStoppedWriters(f.delivery);
    expect(job.writerRestarts).toHaveLength(1);
});

test('a moved remote branch or PR declines the restart once and leaves the worktree alone', async () => {
    type X = ReturnType<typeof stopped>;
    for (const move of [(x: X) => { x.f.state.remote[x.job.branch!] = 'c'.repeat(40); }, (x: X) => { x.f.state.prs[0].state = 'closed'; }, (x: X) => { x.f.state.prs[0].head.sha = 'c'.repeat(40); }, (x: X) => { x.job.worktree = x.f.store.project.repo; }]) {
        const x = stopped(); move(x);
        await restartStoppedWriters(x.f.delivery);
        expect(x.job).toMatchObject({ status: 'blocked', writerRestartDeclined: { workId: 'run-1' } });
        expect(x.job.writerRestarts).toBeUndefined();
        expect(x.writes).toEqual([]);
    }
});

test('an unreadable remote decides nothing, and a salvage that fails declines with its reason', async () => {
    const unread = stopped();
    unread.f.state.fail = (program: string, args: string[]) => program === 'git' && args[0] === 'ls-remote';
    await restartStoppedWriters(unread.f.delivery);
    await restartStoppedWriters(unread.f.delivery);
    expect(unread.job).toMatchObject({ status: 'blocked', writerRestartReadError: expect.stringContaining('ls-remote') });
    expect(unread.job.writerRestartDeclined).toBeUndefined();
    // The reason is reported once, not on every observation, and clears when the read works again.
    expect(unread.f.store.state.events.filter((event: any) => event.kind === 'writer-restart-unreadable')).toHaveLength(1);
    unread.f.state.fail = () => false;
    await restartStoppedWriters(unread.f.delivery);
    expect(unread.job).toMatchObject({ status: 'queued' });
    expect(unread.job.writerRestartReadError).toBeUndefined();
    const wrong = stopped(); wrong.f.state.local.branch = 'someone-elses-branch';
    await restartStoppedWriters(wrong.f.delivery);
    expect(wrong.job).toMatchObject({ status: 'blocked', writerRestartDeclined: { reason: expect.stringContaining('not on the delivery branch') } });
    expect(wrong.writes).toEqual([]);
});

test('a job cancelled or held while its worktree is being saved is not queued, and a hold stops before the reset', async () => {
    const cancelled = stopped();
    cancelled.hooks.onWrite = command => { if (command === 'clean') cancelled.job.status = 'cancelled'; };
    await restartStoppedWriters(cancelled.f.delivery);
    // The reset already happened, so it is recorded; the cancelled job stays cancelled.
    expect(cancelled.job).toMatchObject({ status: 'cancelled', writerRestarts: [expect.objectContaining({ workId: 'run-1' })] });
    const paused = stopped();
    paused.hooks.onWrite = command => { if (command === 'update-ref') paused.f.store.state.paused = true; };
    await restartStoppedWriters(paused.f.delivery);
    expect(paused.writes.some(write => write.startsWith('reset'))).toBe(false);
    expect(paused.job).toMatchObject({ status: 'blocked' });
    expect(paused.job.writerRestarts).toBeUndefined();
    expect(paused.job.writerRestartDeclined).toBeUndefined();
});
