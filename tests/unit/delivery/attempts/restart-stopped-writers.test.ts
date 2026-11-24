import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { salvageGit } from '../support/salvage-git';
import { restartStoppedWriters } from '../../../../server/delivery/attempts/restart-stopped-writers';
import { HOLDS } from '../../../../server/office/config';
import { markAwaitingRepair, unmark } from '../../incidents/repair/mark-fixture';
import { savedState } from '../../store/saved-state-fixture';
import type { TicketJob } from '../../../../src/shared';
afterEach(cleanupFakes);

const PARTIAL = 'e'.repeat(40);
/** An interrupted update-base run on a published PR; the worktree holds one unaccepted commit. */
function stopped() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked', pr: 200, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', detail: 'Error: codex timed out; previous action outcome must be reconciled' });
    job.stop = { kind: 'uncertain-effect', at: '2026-11-16T12:00:00.000Z' };
    f.state.remote[job.branch!] = HEAD;
    f.state.prs.push({ number: 200, html_url: job.prUrl, state: 'open', draft: false, mergeable: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, base: { ref: 'main', sha: 'b'.repeat(40), repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-01T16:15:30Z' });
    // No process id and dispatched=false: nothing is left running, so the real process probe is not consulted.
    f.store.state.workLog = [{ id: 'run-1', requestId: job.id, stage: 'github-update-base', status: 'interrupted', startedAt: new Date(Date.now() - 900000).toISOString(), endedAt: new Date(Date.now() - 600000).toISOString(), failure: { category: 'cancelled', dispatched: false, detail: 'cancelled' } } as any];
    // The worktree's own Git, held in memory with its refs; everything else goes to the fake provider.
    const { git, answer } = salvageGit({ head: PARTIAL, branch: job.branch! }), base = f.delivery.execute;
    const hooks: { onWrite?: (command: string) => void; onRead?: (args: string[]) => void } = {};
    git.onWrite = command => hooks.onWrite?.(command);
    f.delivery.execute = async (program, args, options) => {
        if (program === 'git' && options?.readOnly) hooks.onRead?.(args);
        return answer(program, args) ?? base(program, args, options);
    };
    return { f, job, git, writes: git.writes, hooks, ref: `refs/office/salvage/${job.id}/run-1` };
}
/** Three restarts spent from the accepted head and a repair release for run-1: the next attempt is the released one. */
function released() {
    const x = stopped();
    x.job.writerRestarts = [1, 2, 3].map(n => ({ workId: `old-${n}`, stage: 'update-base', at: '2026-11-16T12:00:00.000Z', accepted: HEAD, abandoned: HEAD, ref: `refs/office/salvage/${x.job.id}/old-${n}` }));
    const grant = (id = 'g') => ({ id: id.repeat(64), incident: 'inc-1', subject: `${x.f.store.project.id}/delivery/${x.job.id}`, fix: 'cli-bind-1', commit: 'f'.repeat(40), workId: 'run-1', stage: 'update-base', accepted: HEAD, grantedAt: '2026-11-16T12:30:00.000Z' });
    x.job.repairRelease = grant();
    // Saved as the poll finds it, so what is saved afterwards can be compared.
    x.f.store.save();
    const earlier = structuredClone(x.job.writerRestarts), restarted = () => x.f.store.state.events.filter(event => event.kind === 'writer-restarted');
    return { ...x, grant, earlier, restarted };
}

test('a stopped writer whose branch and PR have not moved is saved, reset and queued again', async () => {
    const { f, job, writes } = stopped();
    await restartStoppedWriters(f.delivery);
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued' });
    expect(job.stop).toBeUndefined();
    expect(job.writerRestarts).toEqual([expect.objectContaining({ workId: 'run-1', stage: 'update-base', accepted: HEAD, abandoned: PARTIAL, ref: `refs/office/salvage/${job.id}/run-1` })]);
    // The ref is created against an empty old value, so it can never be moved.
    expect(writes).toEqual([`cat-file -e ${HEAD}^{commit}`, `update-ref refs/office/salvage/${job.id}/run-1 ${PARTIAL} `, `reset --hard ${HEAD}`, 'clean -fd']);
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
    const wrong = stopped(); wrong.git.branch = 'someone-elses-branch';
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

test('a stopped writer whose stop a harness repair covers is not restarted, nothing is written, and it is restarted once the wait ends', async () => {
    const { f, job, writes } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    const at = new Date().toISOString();
    markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at });
    const before = JSON.stringify(job), calls = f.state.calls.length;
    await restartStoppedWriters(f.delivery);
    await restartStoppedWriters(f.delivery);
    expect(JSON.stringify(job)).toBe(before);
    expect(writes).toEqual([]);
    // Held before anything is read: the remote branch and pull request are not even asked about.
    expect(f.state.calls.length).toBe(calls);
    expect(job.writerRestarts).toBeUndefined();
    unmark(f.store.state);
    await restartStoppedWriters(f.delivery);
    expect(job).toMatchObject({ status: 'queued', writerRestarts: [expect.objectContaining({ workId: 'run-1' })] });
});

test('a wait that arrives while the stopped run is being read stops the restart before anything is reset', async () => {
    const { f, job, writes, hooks } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    const at = new Date().toISOString();
    hooks.onWrite = command => { if (command === 'cat-file') markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at }); };
    await restartStoppedWriters(f.delivery);
    expect(job.status).toBe('blocked');
    expect(writes.some(write => write.startsWith('reset'))).toBe(false);
    expect(job.writerRestarts).toBeUndefined();
});

test('a repair wait arriving after reset is dispatched lets cleanup finish and keeps the salvage ref', async () => {
    const { f, job, writes, hooks } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    const at = f.store.clock.now().toISOString();
    hooks.onWrite = command => {
        if (command === 'reset') markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at });
    };

    await restartStoppedWriters(f.delivery);

    expect(writes).toContain('clean -fd');
    expect(job).toMatchObject({
        status: 'queued',
        writerRestarts: [expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: `refs/office/salvage/${job.id}/run-1` })],
    });
});

test('a wait arriving during a completed reset readback defers recording and spending the grant', async () => {
    const x = released();
    x.job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    x.git.refs.set(x.ref, PARTIAL);
    Object.assign(x.git, { head: HEAD, origHead: PARTIAL });
    const at = x.f.store.clock.now().toISOString(), grant = structuredClone(x.job.repairRelease);
    x.hooks.onRead = args => {
        if (args.at(-1) === 'ORIG_HEAD^{commit}') {
            markAwaitingRepair(x.f.store.state, x.f.store.project.id, { kind: 'delivery', id: x.job.id }, x.job.stage, { since: at, progressAt: at });
        }
    };
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'blocked', writerRestarts: x.earlier });
    expect(x.job.repairRelease).toEqual(grant);
    expect(x.restarted()).toHaveLength(0);

    unmark(x.f.store.state);
    delete x.hooks.onRead;
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'queued', repairRelease: { consumedAt: expect.any(String) } });
    expect(x.job.writerRestarts).toEqual([...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })]);
    expect(x.restarted()).toHaveLength(1);
    expect(x.writes.filter(write => /^(reset|clean)/.test(write))).toEqual([]);
});

test('a job cancelled while a pass only corroborates an earlier reset records nothing and spends no release', async () => {
    const x = released();
    x.git.refs.set(x.ref, PARTIAL);
    Object.assign(x.git, { head: HEAD, origHead: PARTIAL });
    x.hooks.onRead = args => { if (args.at(-1) === 'ORIG_HEAD^{commit}') x.job.status = 'cancelled'; };
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'cancelled', writerRestarts: x.earlier });
    expect(x.job.repairRelease).toEqual(x.grant());
    expect(x.restarted()).toHaveLength(0);
    expect(x.writes.filter(write => /^(reset|clean)/.test(write))).toEqual([]);
});

test.each(['queued', 'cancelled'] as const)('a stale final read makes no write after the same restart was recorded (%s)', async status => {
    const x = stopped(), { store } = x.f;
    let cleaned = false, commits = 0;
    store.commitListeners.add(() => { commits++; });
    x.hooks.onWrite = command => { if (command === 'clean') cleaned = true; };
    const recorded = { workId: 'run-1', stage: x.job.stage, at: store.clock.now().toISOString(), accepted: HEAD, abandoned: PARTIAL, ref: x.ref };
    x.hooks.onRead = args => {
        if (!cleaned || args[0] !== 'status') return;
        store.transaction(() => {
            Object.assign(x.job, { status, writerRestarts: [recorded], writerRestartReadError: 'Read error from the live job' });
        });
    };
    await restartStoppedWriters(x.f.delivery);
    const expected = { status, writerRestarts: [recorded], writerRestartReadError: 'Read error from the live job' };
    expect(x.job).toMatchObject(expected);
    expect(savedState(store).coordination!.jobs!.find(job => job.id === x.job.id)).toMatchObject(expected);
    expect(commits).toBe(1);
    expect(store.state.events.filter(event => event.kind === 'writer-restarted')).toEqual([]);
});

test.each(['show', 'ORIG_HEAD^{commit}'])('a transient %s failure leaves an already-reset writer eligible', async read => {
    const x = released();
    x.git.refs.set(x.ref, PARTIAL);
    Object.assign(x.git, { head: HEAD, origHead: PARTIAL });
    x.hooks.onRead = args => {
        if (args[0] === read || args.at(-1) === read) throw new Error('Synthetic Git read timeout');
    };
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'blocked', writerRestarts: x.earlier });
    expect(x.job.repairRelease).toEqual(x.grant());
    expect(x.job.writerRestartReadError).toContain(x.ref);
    expect(x.job.writerRestartReadError).toContain('Synthetic Git read timeout');
    expect(x.job.writerRestartDeclined).toBeUndefined();

    delete x.hooks.onRead;
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'queued', repairRelease: { consumedAt: expect.any(String) } });
    expect(x.job.writerRestartReadError).toBeUndefined();
    expect(x.job.writerRestarts).toEqual([...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })]);
    expect(x.restarted()).toHaveLength(1);
    expect(x.writes.filter(write => /^(reset|clean)/.test(write))).toEqual([]);
});

test('a genuine cleanup failure after reset is recorded even if a repair wait arrived', async () => {
    const { f, job, hooks } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    const at = f.store.clock.now().toISOString();
    hooks.onWrite = command => {
        if (command === 'reset') markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at });
        if (command === 'clean') throw new Error('Synthetic cleanup failure');
    };

    await restartStoppedWriters(f.delivery);

    expect(job.status).toBe('blocked');
    expect(job.writerRestartDeclined).toMatchObject({
        workId: 'run-1',
        reason: expect.stringContaining(`Unfinished work is kept at refs/office/salvage/${job.id}/run-1`),
    });
});

test('a failed salvage read during a repair wait leaves the writer eligible to restart after release', async () => {
    const { f, job, writes, hooks } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    const at = f.store.clock.now().toISOString();
    hooks.onWrite = command => {
        if (command !== 'cat-file') return;
        markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at });
        throw new Error('Synthetic cat-file read failure');
    };
    job.writerRestartReadError = 'Earlier read failure';

    await restartStoppedWriters(f.delivery);
    expect(writes).toEqual([`cat-file -e ${HEAD}^{commit}`]);
    expect(job.status).toBe('blocked');
    expect(job.writerRestartReadError).toBe('Earlier read failure');
    expect(job.writerRestartDeclined).toBeUndefined();
    expect(job.writerRestarts).toBeUndefined();

    unmark(f.store.state);
    delete hooks.onWrite;
    await restartStoppedWriters(f.delivery);
    expect(job.writerRestartReadError).toBeUndefined();
    expect(job).toMatchObject({ status: 'queued', writerRestarts: [expect.objectContaining({ workId: 'run-1' })] });
});

test('a failed remote read after admission preserves the last restart read error', async () => {
    const { f, job, writes } = stopped();
    job.stop = { kind: 'unclassified', at: '2026-11-16T12:00:00.000Z' };
    job.writerRestartReadError = 'Earlier read failure';
    const at = f.store.clock.now().toISOString();
    f.state.fail = (program, args) => {
        if (program !== 'git' || args[0] !== 'ls-remote') return false;
        markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: at, progressAt: at });
        return true;
    };

    await restartStoppedWriters(f.delivery);

    expect(job.writerRestartReadError).toBe('Earlier read failure');
    expect(f.store.state.events.some(event => event.kind === 'writer-restart-unreadable')).toBe(false);
    expect(writes).toEqual([]);
});

test('a released attempt is recorded, queued and spends its release in one write, keeping the earlier restarts', async () => {
    const x = released();
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'queued', repairRelease: { id: 'g'.repeat(64), consumedAt: expect.any(String) } });
    expect(x.job.writerRestarts).toEqual([...x.earlier, expect.objectContaining({ workId: 'run-1', accepted: HEAD, abandoned: PARTIAL, ref: x.ref })]);
    expect(x.job.detail).toContain(`attempt 4, released by harness fix ${'f'.repeat(7)}`);
    expect(x.job.detail).not.toContain('of 3');
    expect(x.restarted()).toHaveLength(1);
    expect(savedState(x.f.store).coordination!.jobs!.find(job => job.id === x.job.id)).toMatchObject({ status: 'queued', repairRelease: { consumedAt: x.job.repairRelease!.consumedAt } });
    // Spent: the same run is never restarted again, and the release funds nothing more.
    x.job.status = 'blocked';
    await restartStoppedWriters(x.f.delivery);
    expect(x.job.writerRestarts).toHaveLength(4);
    expect(x.restarted()).toHaveLength(1);
});

test('an ordinary restart leaves a matching release unspent, and the run it was for is never restarted again', async () => {
    const x = released();
    x.job.writerRestarts = x.earlier.slice(0, 2);
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'queued', repairRelease: { id: 'g'.repeat(64) } });
    expect(x.job.repairRelease!.consumedAt).toBeUndefined();
    expect(x.job.detail).toContain('attempt 3 of 3 restarts');
    x.job.status = 'blocked';
    await restartStoppedWriters(x.f.delivery);
    expect(x.job.writerRestarts).toHaveLength(3);
});

test('a pass whose accepted head changed during its last read records nothing, and the next pass declines before any second reset', async () => {
    const x = released(), NEW = 'c'.repeat(40);
    x.hooks.onWrite = command => { if (command === 'clean') x.job.head = NEW; };
    await restartStoppedWriters(x.f.delivery);
    // The worktree was saved and reset; nothing about the stale pass was recorded.
    expect(x.git.refs.get(x.ref)).toBe(PARTIAL);
    expect(x.job).toMatchObject({ status: 'blocked', writerRestarts: x.earlier });
    expect(x.job.repairRelease!.consumedAt).toBeUndefined();
    expect(x.job.writerRestartDeclined).toBeUndefined();
    expect(x.restarted()).toHaveLength(0);
    // Unpublished at the new head: an ordinary attempt is due and reaches the salvage, which finds the tree at the old head, not the work kept.
    delete x.hooks.onWrite;
    delete x.f.state.remote[x.job.branch!];
    delete (x.job as { pr?: number }).pr;
    x.git.writes.length = 0;
    await restartStoppedWriters(x.f.delivery);
    expect(x.job.writerRestartDeclined).toMatchObject({ workId: 'run-1', reason: expect.stringContaining(x.ref) });
    expect(x.git.writes.filter(write => /^(reset|clean|update-ref)/.test(write))).toEqual([]);
    expect(x.git.refs.get(x.ref)).toBe(PARTIAL);
    expect(x.job.writerRestarts).toEqual(x.earlier);
});

test('a release replaced during the last read leaves the replacement, the read error and the decline state alone, and a later pass spends it once', async () => {
    for (const finalRead of ['succeeds', 'fails'] as const) {
        const x = released();
        x.job.writerRestartReadError = 'Earlier read failure';
        x.hooks.onWrite = command => {
            if (command !== 'clean') return;
            x.job.repairRelease = x.grant('h');
            if (finalRead === 'fails') x.git.contents = '?? left-behind.txt';
        };
        await restartStoppedWriters(x.f.delivery);
        expect(x.job.repairRelease, finalRead).toEqual(x.grant('h'));
        expect(x.job, finalRead).toMatchObject({ status: 'blocked', writerRestartReadError: 'Earlier read failure', writerRestarts: x.earlier });
        expect(x.job.writerRestartDeclined, finalRead).toBeUndefined();
        expect(x.f.store.state.events.filter(event => event.kind.startsWith('writer-restart')), finalRead).toEqual([]);
        // The next pass finds the worktree reset by the first, corroborates the kept work and resets nothing again.
        delete x.hooks.onWrite;
        x.git.contents = '';
        await restartStoppedWriters(x.f.delivery);
        expect(x.job, finalRead).toMatchObject({ status: 'queued', repairRelease: { id: 'h'.repeat(64), consumedAt: expect.any(String) } });
        expect(x.job.writerRestarts, finalRead).toEqual([...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })]);
        expect(x.git.writes.filter(write => write.startsWith('reset')), finalRead).toHaveLength(1);
        expect(x.restarted(), finalRead).toHaveLength(1);
    }
});

test('a write that fails after the salvage changes nothing in the project, and the retry records the first salvage once', async () => {
    const x = released(), save = x.f.store.save.bind(x.f.store);
    const grant = structuredClone(x.job.repairRelease);
    let fail = false;
    x.f.store.save = () => { if (fail) { fail = false; throw new Error('disk I/O error'); } save(); };
    x.hooks.onWrite = command => { if (command === 'clean') fail = true; };
    await expect(restartStoppedWriters(x.f.delivery)).rejects.toThrow('disk I/O error');
    const stands = (job: TicketJob | undefined) => {
        expect(job).toMatchObject({ status: 'blocked', writerRestarts: x.earlier });
        expect(job!.repairRelease).toStrictEqual(grant);
    };
    stands(x.job);
    stands(savedState(x.f.store).coordination!.jobs!.find(job => job.id === x.job.id));
    expect(x.restarted()).toHaveLength(0);
    expect(x.f.store.db.prepare("SELECT count(*) AS n FROM events WHERE json_extract(body,'$.kind')='writer-restarted'").get()).toEqual({ n: 0 });
    expect(x.git.refs.get(x.ref)).toBe(PARTIAL);
    delete x.hooks.onWrite;
    await restartStoppedWriters(x.f.delivery);
    expect(x.job.writerRestarts).toEqual([...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })]);
    expect(x.job).toMatchObject({ status: 'queued', repairRelease: { consumedAt: expect.any(String) } });
    expect(x.git.writes.filter(write => write.startsWith('reset'))).toHaveLength(1);
    expect(x.restarted()).toHaveLength(1);
});

test('a job cancelled while its worktree is cleaned keeps its status, records the reset and spends no release', async () => {
    const x = released();
    x.hooks.onWrite = command => { if (command === 'clean') x.job.status = 'cancelled'; };
    await restartStoppedWriters(x.f.delivery);
    expect(x.job).toMatchObject({ status: 'cancelled', writerRestarts: [...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })] });
    expect(x.job.repairRelease!.consumedAt).toBeUndefined();
    expect(x.restarted()).toHaveLength(0);
    // Cancelled and given another accepted head meanwhile: nothing about this pass is recorded.
    const moved = released();
    moved.hooks.onWrite = command => { if (command === 'clean') Object.assign(moved.job, { status: 'cancelled', head: 'c'.repeat(40) }); };
    await restartStoppedWriters(moved.f.delivery);
    expect(moved.job.writerRestarts).toEqual(moved.earlier);
});

test('a pass whose worktree or branch was replaced, or that became ineligible, after its last guard records nothing', async () => {
    for (const change of ['worktree', 'branch', 'hold'] as const) {
        const x = released();
        x.hooks.onWrite = command => {
            if (command !== 'clean') return;
            if (change === 'hold') HOLDS[x.job.key] = 'Synthetic hold';
            else x.job[change] = `${x.job[change]}-replaced`;
        };
        try { await restartStoppedWriters(x.f.delivery); }
        finally { delete HOLDS[x.job.key]; }
        expect(x.job, change).toMatchObject({ status: 'blocked', writerRestarts: x.earlier });
        expect(x.job.repairRelease!.consumedAt, change).toBeUndefined();
        expect(x.restarted(), change).toHaveLength(0);
        if (change !== 'hold') continue;
        // Released again, the next pass finds the reset already done and records it once.
        delete x.hooks.onWrite;
        await restartStoppedWriters(x.f.delivery);
        expect(x.job).toMatchObject({ status: 'queued', writerRestarts: [...x.earlier, expect.objectContaining({ workId: 'run-1', abandoned: PARTIAL, ref: x.ref })] });
        expect(x.git.writes.filter(write => write.startsWith('reset'))).toHaveLength(1);
    }
});
