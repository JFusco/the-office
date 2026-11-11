import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { recordOfficeMerge } from '../../../fixtures/office-merge';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect, vi } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { reconcileMergeScannerRetry, retryMergeScanner, transientScannerJobs } from '../../../../server/delivery/repairs/merge-scanner-retry';
import { recheckPR } from '../../../../server/scheduling/operator-commands';

vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }));

function setup() {
    const f = ciFixture(); Object.assign(f.job, { stage: 'ci-recovery', status: 'working', mergeCommit: newHead });
    Object.assign(f.pr, { merged_at: '2026-11-09T08:00:00Z', merge_commit_sha: newHead });
    recordOfficeMerge(f);
    const run = { ...f.run, head_sha: newHead, event: 'push', head_branch: 'main', path: '.github/workflows/quality.yml' };
    const jobs = [{ id: 10, run_id: run.id, run_attempt: 1, head_sha: newHead, status: 'completed', conclusion: 'failure', steps: [{ name: 'Install the pinned scanner profile', conclusion: 'failure' }] }];
    const runs = [run];
    let writes = 0, fail = false, landed = true;
    const original = f.delivery.execute;
    f.delivery.api = async path => {
        if (path.startsWith('issues/')) return f.issue;
        if (path.startsWith('actions/runs?')) return { total_count: runs.length, workflow_runs: runs };
        if (path.endsWith('/jobs?per_page=100')) return { total_count: jobs.length, jobs };
        if (path === 'actions/runs/20') return run;
        throw new Error('Unexpected API '+path);
    };
    f.delivery.execute = async (bin, args, options) => {
        if (args[1]?.endsWith('/logs')) return 'Error: HTTP 504 from github.com';
        if (args[1]?.endsWith('/rerun-failed-jobs')) { writes++; if (landed) { run.run_attempt++; run.status = 'queued'; run.conclusion = null as any; } if (fail) throw new Error('Lost response'); return ''; }
        return original(bin, args, options);
    };
    f.delivery.verifyPR = async () => f.pr;
    return { ...f, run, jobs, runs, writes: () => writes, fail: (didLand: boolean) => { fail = true; landed = didLand; } };
}
test('positively evidenced post-merge gateway failure gets one durable failed-job retry', async () => {
    const f = setup(); expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true);
    expect(f.writes()).toBe(1); expect(f.job.status).toBe('watching'); expect(f.run.run_attempt).toBe(2);
    expect(f.job.mergeScannerRetry).toMatchObject({ runId: 20, attempt: 1, head: newHead });
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true); expect(f.writes()).toBe(1);
});
test('delayed attempt visibility repeats only bounded GETs after one POST', async () => {
    const f = setup(), api = f.delivery.api; let reads = 0;
    f.delivery.api = async path => {
        if (path === 'actions/runs/20' && f.writes() && ++reads < 3) return { ...f.run, run_attempt: 1 };
        return api(path);
    };
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true);
    expect(reads).toBe(3); expect(f.writes()).toBe(1); expect(f.job.status).toBe('watching');
});
test.each(['draining', 'replacement', 'head', 'record'])('final scanner preflight rechecks %s after the last provider read', async change => {
    const f = setup(), api = f.delivery.api; let reads = 0;
    f.delivery.api = async path => {
        const value = await api(path);
        if (path === 'actions/runs/20' && ++reads === 3) {
            if (change === 'draining') f.store.state.draining = true;
            if (change === 'replacement') f.delivery.jobs.splice(0, 1, { ...f.job });
            if (change === 'head') f.job.head = 'e'.repeat(40);
            if (change === 'record') f.job.mergeScannerRetry!.runId = 21;
        }
        return value;
    };
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow();
    expect(f.writes()).toBe(0);
    expect(f.store.getEffect(`harness:${f.job.id}:merge-scanner-retry:20`)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
});
test('unobserved accepted retry exhausts bounded reads and remains uncertain without resending', async () => {
    const f = setup(), api = f.delivery.api; let reads = 0;
    f.delivery.api = async path => {
        if (path === 'actions/runs/20' && f.writes()) { reads++; return { ...f.run, run_attempt: 1 }; }
        return api(path);
    };
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow('read-back');
    expect(reads).toBe(4); expect(f.writes()).toBe(1);
    expect(f.store.getEffect(`harness:${f.job.id}:merge-scanner-retry:20`)?.status).toBe('uncertain');
});
test('successful CI recovery reconciles the original uncertain retry before advancing closeout', async () => {
    const f = setup(); f.fail(true);
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow('Lost response');
    f.run.status = 'completed'; f.run.conclusion = 'success';
    await f.delivery.recoverMergeCI(f.job);
    expect(f.store.getEffect(`harness:${f.job.id}:merge-scanner-retry:20`)).toMatchObject({ status: 'verified', receipt: { runId: 20, attempt: 2 } });
    expect(f.job.status).toBe('watching'); expect(f.writes()).toBe(1);
    await f.delivery.observe(); expect(f.job).toMatchObject({ stage: 'closeout', status: 'queued' });
});
test.each(['foreign-effect', 'foreign-run', 'changed-job'])('read-only retry reconciliation preserves %s without clearing uncertainty', async kind => {
    const f = setup(); f.fail(true);
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow();
    const id = `harness:${f.job.id}:merge-scanner-retry:20`;
    if (kind === 'foreign-effect') f.store.putEffect({ ...f.store.getEffect(id)!, target: 'https://github.com/other/repo/actions/runs/20' });
    if (kind === 'foreign-run') f.run.id = 21;
    if (kind === 'changed-job') {
        const api = f.delivery.api;
        f.delivery.api = async path => { const result = await api(path); if (path === 'actions/runs/20') f.job.mergeCommit = 'f'.repeat(40); return result; };
    }
    await expect(claimedDelivery(f.store, f.job, () => reconcileMergeScannerRetry(f.delivery, f.job))).rejects.toThrow();
    expect(f.store.getEffect(id)?.status).toBe('uncertain'); expect(f.writes()).toBe(1);
});
test.each([true, false])('lost retry response is read back, never resent (landed=%s)', async landed => {
    const f = setup(); f.fail(landed);
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow('Lost response');
    if (landed) expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true);
    else await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow('will not be resent');
    expect(f.writes()).toBe(1);
});
test.each(['release', 'PR-event', 'other-head', 'already-retried', 'other-step', 'other-failure'])('scanner retry excludes %s', async kind => {
    const f = setup();
    if (kind === 'release') f.run.path = '.github/workflows/release.yml';
    if (kind === 'PR-event') f.run.event = 'pull_request';
    if (kind === 'other-head') f.run.head_sha = 'e'.repeat(40);
    if (kind === 'already-retried') f.run.run_attempt = 2;
    if (kind === 'other-step') f.jobs[0].steps[0].name = 'Run tests';
    if (kind === 'other-failure') f.jobs.push({ ...f.jobs[0], id: 11, steps: [{ name: 'Run tests', conclusion: 'failure' }] });
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(false); expect(f.writes()).toBe(0);
});
test('a deterministic scanner error is not retried', () => {
    const f = setup(); expect(transientScannerJobs(f.jobs, ['Error: HTTP 404 from github.com'])).toBe(false);
});
test.each(['blocked', 'interrupted'] as const)('operator recovery queues an inactive merged job without directly retrying Actions (%s)', status => {
    const f = setup(); f.job.status = status;
    recheckPR.call({ store: f.store, state: f.store.state.coordination } as any, f.job.key);
    expect(f.job.status).toBe('queued'); expect(f.job.stage).toBe('ci-recovery'); expect(f.writes()).toBe(0);
    expect(() => recheckPR.call({ store: f.store, state: f.store.state.coordination } as any, f.job.key)).toThrow('inactive');
});

test.each(['success', 'failure'])('a completed bounded retry falls through to ordinary recovery (%s)', async conclusion => {
    const f = setup(); await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job));
    f.run.status = 'completed'; f.run.conclusion = conclusion;
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(false); expect(f.writes()).toBe(1);
});
test('another timed out workflow excludes the narrow scanner retry', async () => {
    const f = setup(); f.runs.push({ ...f.run, id: 21, conclusion: 'timed_out', path: '.github/workflows/other.yml' });
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(false); expect(f.writes()).toBe(0);
});
test('a verified suffixed effect is recognized after an undispatched rejected preflight', async () => {
    const f = setup(); await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job));
    const id = `harness:${f.job.id}:merge-scanner-retry:20`, effect = f.store.getEffect(id)!;
    f.store.putEffect({ ...effect, id: `${id}:retry-1` });
    f.store.putEffect({ ...effect, status: 'rejected', dispatchedAt: '' });
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true); expect(f.writes()).toBe(1);
});
test('completed failed retry reaches ordinary PM diagnosis once, without another retry', async () => {
    const f = setup(); await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job));
    f.run.status = 'completed'; f.run.conclusion = 'failure'; let diagnoses = 0;
    f.engine.agents.run = async () => { diagnoses++; return { outcome: 'needs-human', issue: 0, summary: 'Persistent failure needs diagnosis', receipts: [] } as any; };
    await expect(f.delivery.recoverMergeCI(f.job)).rejects.toThrow('Persistent failure');
    expect(diagnoses).toBe(1); expect(f.writes()).toBe(1);
});
test('uncertain unlanded retries remain blocked across normal observation', async () => {
    const f = setup(); f.fail(false);
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow();
    f.job.status = 'blocked';
    const count = f.calls.length;
    await f.delivery.observe(); await f.delivery.observe();
    expect(f.job).toMatchObject({ status: 'blocked', stage: 'ci-recovery' });
    expect(f.calls).toHaveLength(count); expect(f.writes()).toBe(1);
});

test('interrupted successful retry resumes normal observation and verified closeout without PM diagnosis', async () => {
    const f = setup(); await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job));
    f.run.status = 'completed'; f.run.conclusion = 'success'; f.job.status = 'interrupted';
    recheckPR.call({ store: f.store, state: f.store.state.coordination } as any, f.job.key);
    let diagnoses = 0; f.engine.agents.run = async () => { diagnoses++; throw new Error('No diagnosis expected'); };
    f.job.status = 'working'; await f.delivery.recoverMergeCI(f.job);
    expect(f.job.status).toBe('watching'); expect(diagnoses).toBe(0); expect(f.writes()).toBe(1);
    await f.delivery.observe(); expect(f.job).toMatchObject({ stage: 'closeout', status: 'queued' });
});
test('successful scanner retry does not hide another failed exact-merge workflow', async () => {
    const f = setup(); await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job));
    f.run.status = 'completed'; f.run.conclusion = 'success';
    f.runs.push({ ...f.run, id: 21, path: '.github/workflows/other.yml', conclusion: 'failure' });
    let diagnoses = 0; f.engine.agents.run = async () => { diagnoses++; return { outcome: 'needs-human', issue: 0, summary: 'Other workflow failed', receipts: [] } as any; };
    await expect(f.delivery.recoverMergeCI(f.job)).rejects.toThrow('Other workflow');
    expect(diagnoses).toBe(1); expect(f.writes()).toBe(1);
});
test('green Actions cannot bypass an earlier unresolved PM issue/card recovery attempt', async () => {
    const f = setup(); f.job.ciRecoveryAttemptAt = 'original-attempt';
    f.run.status = 'completed'; f.run.conclusion = 'success';
    let reads = 0;
    f.engine.agents.run = async (_role, task, _schema, options) => {
        reads++; expect(task).toContain('READ-BACK ONLY'); expect(options?.readOnly).toBe(true);
        return { outcome: 'needs-human', issue: 0, summary: 'Original issue/card effect is still uncertain', receipts: [] } as any;
    };
    f.job.status = 'blocked'; recheckPR.call({ store: f.store, state: f.store.state.coordination } as any, f.job.key);
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(reads).toBe(1); expect(f.writes()).toBe(0);
    expect(f.job).toMatchObject({ stage: 'ci-recovery', status: 'blocked', ciRecoveryAttemptAt: 'original-attempt' });
    expect(f.job.detail).toContain('still uncertain'); expect(f.job.mergeScannerRetry).toBeUndefined();
});
test('an interrupted original diagnosis reaches only the existing read-only issue/card reconciliation', async () => {
    const f = setup(); f.job.ciRecoveryAttemptAt = '2026-11-09T08:00:00Z';
    f.store.state.workLog ??= [];
    f.store.state.workLog.push({ id: 'interrupted-original', requestId: f.job.id, ticket: f.job.key, role: 'pm', stage: 'ci-recovery', status: 'interrupted',
        startedAt: '2026-11-09T08:00:01Z', endedAt: '2026-11-09T08:00:02Z' } as any);
    f.run.status = 'completed'; f.run.conclusion = 'success'; let reads = 0;
    f.engine.agents.run = async (_role, task, _schema, options) => {
        reads++; expect(task).toContain('READ-BACK ONLY'); expect(options?.readOnly).toBe(true); expect(options?.stage).toBe('ci-recovery');
        return { outcome: 'repair-issue', issue: 777, summary: 'Original exact repair issue/card read back', receipts: [] } as any;
    };
    const api = f.delivery.api;
    f.delivery.api = async path => path === 'issues/777' ? { number: 777, state: 'open', body: `Office CI recovery ${f.job.id} ${f.job.mergeCommit}`, assignees: [{ login: 'JFusco' }] } : api(path);
    f.job.status = 'blocked'; recheckPR.call({ store: f.store, state: f.store.state.coordination } as any, f.job.key);
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(reads).toBe(1); expect(f.writes()).toBe(0); expect(f.job.mergeScannerRetry).toBeUndefined();
    expect(f.job).toMatchObject({ stage: 'ci-recovery', status: 'watching', ciFollowupKey: 'GH-777' });
    expect(f.delivery.jobs.some(j => j.key === 'GH-777')).toBe(true);
    expect(f.store.state.workLog.find(w => w.id === 'interrupted-original')?.status).toBe('interrupted');
});

test('an externally merged PR without an Office merge attempt never gets a new scanner retry', async () => {
    const f = setup(); delete f.job.mergeAttempt;
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(false); expect(f.writes()).toBe(0);
});
test('an orphaned pre-dispatch evidence artifact cannot permanently block a retry', async () => {
    const f = setup(), orphan = resolve(f.artifactRoot, 'merge-scanner-20.json');
    writeFileSync(orphan, 'Retained orphan evidence');
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true);
    const path = f.job.mergeScannerRetry!.evidencePath;
    expect(path).not.toBe(orphan); expect(readFileSync(orphan, 'utf8')).toBe('Retained orphan evidence');
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true);
    expect(f.job.mergeScannerRetry!.evidencePath).toBe(path); expect(f.writes()).toBe(1);
});
test('already dispatched uncertain scanner retry remains read-back only even if merge proof is unavailable', async () => {
    const f = setup(); f.fail(true);
    await expect(claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).rejects.toThrow('Lost response');
    delete f.job.mergeAttempt;
    expect(await claimedDelivery(f.store, f.job, () => retryMergeScanner(f.delivery, f.job))).toBe(true); expect(f.writes()).toBe(1);
});
