import { officeMergeProvenance } from './merge-provenance';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual, stripVTControlCharacters } from 'node:util';
import { setTimeout as wait } from 'node:timers/promises';
import { Effects } from '../../store/effects';
import { containedFile } from '../../cec/workflow';
import { assertMayMutate } from '../harness/guards';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { handsOff } from '../harness/scope';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

type Retry = NonNullable<TicketJob['mergeScannerRetry']>;

function savedRetry(delivery: GitHubDelivery, job: TicketJob, r: Retry) {
    const root = resolve(delivery.store.dataRoot, 'ticket-work', job.id);
    if (r.attempt !== 1 || !Number.isSafeInteger(r.runId) || r.runId <= 0 || r.head !== job.mergeCommit || !containedFile(r.evidencePath, root)) throw new Error('Saved merge retry evidence changed');
    const evidence = JSON.parse(readFileSync(r.evidencePath, 'utf8'));
    if (evidence.run.id !== r.runId || evidence.run.run_attempt !== r.attempt || !runIdentity(evidence.run, delivery.store.project.repository, r.head, delivery.store.project.target) || !transientScannerJobs(evidence.jobs, evidence.logs))
        throw new Error('Original transient failure proof changed');
}

async function retryReadBack(delivery: GitHubDelivery, r: Retry) {
    const live = await delivery.api(`actions/runs/${r.runId}`);
    return live.id === r.runId && runIdentity(live, delivery.store.project.repository, r.head, delivery.store.project.target) && live.run_attempt === r.attempt + 1 ? { runId: live.id, attempt: live.run_attempt } : null;
}

/** Settle only the original dispatched retry before successful Actions can advance closeout. */
export async function reconcileMergeScannerRetry(delivery: GitHubDelivery, job: TicketJob) {
    const { store } = delivery, r = job.mergeScannerRetry;
    if (!r) return;
    const id = activeEffectId(store, `harness:${job.id}:merge-scanner-retry:${r.runId}`), prior = store.getEffect(id);
    if (!prior || !['dispatching', 'uncertain'].includes(prior.status)) return;
    savedRetry(delivery, job, r);
    if (!prior.dispatchedAt || prior.operation !== 'github-merge-scanner-retry' || prior.target !== `https://github.com/${store.project.repository}/actions/runs/${r.runId}` ||
        prior.work.projectId !== store.project.id || prior.work.kind !== 'delivery' || prior.work.id !== job.id || prior.attemptId !== job.id || prior.authorization !== 'office-harness' ||
        !isDeepStrictEqual(prior.payload, { runId: r.runId, head: r.head, attempt: r.attempt, evidencePath: r.evidencePath }) ||
        !isDeepStrictEqual(prior.expectedState, { key: `merge-scanner-retry:${r.runId}` })) throw new Error('Original scanner retry effect identity changed');
    const expected = structuredClone(prior), record = structuredClone(r);
    if (!await new Effects(store).reconcile(id, async () => {
        const receipt = await retryReadBack(delivery, r);
        return { verified: !!receipt && delivery.jobs.find(j => j.id === job.id) === job && job.stage === 'ci-recovery' && !job.ciFollowupKey &&
            job.mergeCommit === record.head && isDeepStrictEqual(job.mergeScannerRetry, record) && isDeepStrictEqual(store.getEffect(id), expected), receipt };
    })) throw new Error('Original scanner retry is still unverified; no operation resent');
}

/** Only the scanner installer failing with a positively evidenced GitHub gateway error is retryable. */
export function transientScannerJobs(jobs: any[], logs: string[]) {
    const failed = jobs.filter(j => j.conclusion === 'failure');
    return failed.length > 0 && failed.length === logs.length && jobs.every(j => j.status === 'completed' &&
        ['success', 'skipped', 'failure'].includes(j.conclusion)) && failed.every((job, i) => {
        const steps = job.steps?.filter((s: any) => s.conclusion === 'failure');
        return steps?.length === 1 && steps[0].name === 'Install the pinned scanner profile' &&
            /Error: HTTP (502|503|504) from github\.com\b/.test(logs[i]);
    });
}

/** A single durable retry of ordinary post-merge Quality, never release or reference workflows. */
export async function retryMergeScanner(delivery: GitHubDelivery, job: TicketJob): Promise<boolean> {
    const { store } = delivery, repo = store.project.repository;
    if (!handsOff(store) || job.stage !== 'ci-recovery' || job.ciFollowupKey || !job.mergeCommit) return false;
    const root = resolve(store.dataRoot, 'ticket-work', job.id);
    let record = job.mergeScannerRetry;
    if (!record) {
        if (!await officeMergeProvenance(delivery, job)) return false;
        const inventory = await delivery.api(`actions/runs?head_sha=${job.mergeCommit}&per_page=100`);
        if (!Array.isArray(inventory.workflow_runs) || inventory.total_count !== inventory.workflow_runs.length || inventory.total_count > 100) return false;
        const failed = inventory.workflow_runs.filter((r: any) => r.head_sha === job.mergeCommit && r.event === 'push' &&
            r.head_branch === store.project.target && r.status === 'completed' && !['success', 'skipped', 'neutral'].includes(r.conclusion));
        // Do not mask another failed workflow with this narrow operational repair.
        if (failed.length !== 1 || failed[0].conclusion !== 'failure' || failed[0].path !== '.github/workflows/quality.yml' || failed[0].run_attempt !== 1) return false;
        const run = await delivery.api(`actions/runs/${failed[0].id}`);
        if (!runIdentity(run, repo, job.mergeCommit, store.project.target) || run.run_attempt !== 1 || run.status !== 'completed' || run.conclusion !== 'failure') return false;
        const page = await delivery.api(`actions/runs/${run.id}/attempts/1/jobs?per_page=100`);
        if (!Array.isArray(page.jobs) || page.total_count !== page.jobs.length || page.total_count > 100 ||
            page.jobs.some((j: any) => j.run_id !== run.id || j.run_attempt !== 1 || j.head_sha !== job.mergeCommit)) return false;
        const logs: string[] = [];
        for (const j of page.jobs.filter((j: any) => j.conclusion === 'failure'))
            logs.push(stripVTControlCharacters(await delivery.execute('gh', ['api', `repos/${repo}/actions/jobs/${j.id}/logs`, '--allow-escape-sequences'], { cwd: store.project.repo, readOnly: true, timeout: 60000 })));
        if (!transientScannerJobs(page.jobs, logs)) return false;
        mkdirSync(root, { recursive: true });
        const evidencePath = resolve(root, `merge-scanner-${run.id}-${crypto.randomUUID()}.json`);
        writeFileSync(evidencePath, JSON.stringify({ run, jobs: page.jobs, logs }, null, 2), { mode: 0o600, flag: 'wx' });
        record = job.mergeScannerRetry = { runId: run.id, attempt: 1, head: job.mergeCommit, evidencePath };
        store.save();
    }
    const r = record;
    savedRetry(delivery, job, r);
    const readBack = () => retryReadBack(delivery, r);
    const key = `merge-scanner-retry:${r.runId}`, prior = store.getEffect(activeEffectId(store, `harness:${job.id}:${key}`));
    if ((!prior || !prior.dispatchedAt && ['prepared', 'rejected'].includes(prior.status)) && !await officeMergeProvenance(delivery, job)) return false;
    if (prior?.status === 'verified') {
        const live = await delivery.api(`actions/runs/${r.runId}`);
        if (!runIdentity(live, repo, r.head, store.project.target) || live.run_attempt !== 2) throw new Error('Verified merge retry execution changed');
        if (live.status === 'completed') return false;
    } else {
        const head = job.head, record = structuredClone(r), merged = job.mergeCommit;
        const assertCurrent = () => {
            assertMayMutate(store, delivery.jobs, job, head);
            if (store.state.draining || job.status !== 'working' || job.stage !== 'ci-recovery' || job.mergeScannerRetry !== r ||
                job.mergeCommit !== merged || !isDeepStrictEqual(r, record)) throw new Error('Merge retry ownership changed');
        };
        const guard = async () => {
            assertCurrent();
            if (!await officeMergeProvenance(delivery, job)) throw new Error('A verified guarded Office merge is required before a new scanner retry');
            const pr = await delivery.verifyPR(job, true), live = await delivery.api(`actions/runs/${r.runId}`);
            if (!pr.merged_at || pr.merge_commit_sha !== r.head || !runIdentity(live, repo, r.head, store.project.target) ||
                live.run_attempt !== r.attempt || live.status !== 'completed' || live.conclusion !== 'failure') throw new Error('Merge retry scope or run attempt changed');
            assertCurrent();
        };
        await harnessEffect(store, job, { key, operation: 'github-merge-scanner-retry', target: `https://github.com/${repo}/actions/runs/${r.runId}`,
            payload: { runId: r.runId, head: r.head, attempt: r.attempt, evidencePath: r.evidencePath }, guard, readBack,
            dispatch: async () => {
                await delivery.execute('gh', ['api', `repos/${repo}/actions/runs/${r.runId}/rerun-failed-jobs`, '--method', 'POST'], { cwd: store.project.repo, timeout: 60000 });
                // GitHub may accept the POST before its GET exposes the new attempt. Only reads repeat.
                for (const delay of [0, 1000, 3000, 6000]) {
                    if (delay) await wait(delay);
                    const receipt = await readBack();
                    if (receipt) return receipt;
                }
                return null;
            } });
    }
    job.status = 'watching'; job.detail = 'One evidenced transient scanner-download retry submitted and read back; original failed attempt retained. Waiting for exact-merge Actions.';
    store.save(); return true;
}
function runIdentity(run: any, repo: string, head: string, target: string) {
    return Number.isSafeInteger(run?.id) && run.id > 0 && run.repository?.full_name === repo && run.head_repository?.full_name === repo &&
        run.head_sha === head && run.event === 'push' && run.head_branch === target && run.path === '.github/workflows/quality.yml';
}
