import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { containedFile } from '../../cec/workflow';
import { assertMayMutate } from '../harness/guards';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { handsOff } from '../harness/scope';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

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
        const evidencePath = resolve(root, `merge-scanner-${run.id}.json`);
        writeFileSync(evidencePath, JSON.stringify({ run, jobs: page.jobs, logs }, null, 2), { mode: 0o600, flag: 'wx' });
        record = job.mergeScannerRetry = { runId: run.id, attempt: 1, head: job.mergeCommit, evidencePath };
        store.save();
    }
    const r = record;
    if (r.head !== job.mergeCommit || !containedFile(r.evidencePath, root)) throw new Error('Saved merge retry evidence changed');
    const evidence = JSON.parse(readFileSync(r.evidencePath, 'utf8'));
    if (evidence.run.id !== r.runId || evidence.run.run_attempt !== r.attempt || evidence.run.head_sha !== r.head || !transientScannerJobs(evidence.jobs, evidence.logs))
        throw new Error('Original transient failure proof changed');
    const readBack = async () => {
        const live = await delivery.api(`actions/runs/${r.runId}`);
        return runIdentity(live, repo, r.head, store.project.target) && live.run_attempt === r.attempt + 1 ? { runId: live.id, attempt: live.run_attempt } : null;
    };
    const key = `merge-scanner-retry:${r.runId}`, prior = store.getEffect(activeEffectId(store, `harness:${job.id}:${key}`));
    if (prior?.status === 'verified') {
        const live = await delivery.api(`actions/runs/${r.runId}`);
        if (!runIdentity(live, repo, r.head, store.project.target) || live.run_attempt !== 2) throw new Error('Verified merge retry execution changed');
        if (live.status === 'completed') return false;
    } else {
        const guard = async () => {
            assertMayMutate(store, delivery.jobs, job, job.head);
            if (store.state.draining || job.status !== 'working' || job.stage !== 'ci-recovery' || job.mergeScannerRetry !== r) throw new Error('Merge retry ownership changed');
            const pr = await delivery.verifyPR(job, true), live = await delivery.api(`actions/runs/${r.runId}`);
            if (!pr.merged_at || pr.merge_commit_sha !== r.head || !runIdentity(live, repo, r.head, store.project.target) ||
                live.run_attempt !== r.attempt || live.status !== 'completed' || live.conclusion !== 'failure') throw new Error('Merge retry scope or run attempt changed');
        };
        await harnessEffect(store, job, { key, operation: 'github-merge-scanner-retry', target: `https://github.com/${repo}/actions/runs/${r.runId}`,
            payload: { runId: r.runId, head: r.head, attempt: r.attempt, evidencePath: r.evidencePath }, guard, readBack,
            dispatch: async () => {
                await delivery.execute('gh', ['api', `repos/${repo}/actions/runs/${r.runId}/rerun-failed-jobs`, '--method', 'POST'], { cwd: store.project.repo, timeout: 60000 });
                return readBack();
            } });
    }
    job.status = 'watching'; job.detail = 'One evidenced transient scanner-download retry submitted and read back; original failed attempt retained. Waiting for exact-merge Actions.';
    store.save(); return true;
}
function runIdentity(run: any, repo: string, head: string, target: string) {
    return Number.isSafeInteger(run?.id) && run.id > 0 && run.repository?.full_name === repo && run.head_repository?.full_name === repo &&
        run.head_sha === head && run.event === 'push' && run.head_branch === target && run.path === '.github/workflows/quality.yml';
}
