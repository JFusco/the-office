import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOLDS } from '../../office/config';
import { deliveryInputSha256 } from '../../github/github-context';
import { CurrentChecksWait } from '../readiness/github-check-selection';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { readCIFailure } from './ci-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** Observation schedules Sam; it never starts a writer or takes over a checkout. */
export async function queueCIDiagnosis(delivery: GitHubDelivery, job: TicketJob) {
    const { store } = delivery;
    if (job.stage !== 'lead-pr' || job.status !== 'watching' || !job.pr || job.mergeAttempt ||
        store.state.paused || store.state.draining || HOLDS[job.key] || job.prerequisites?.length ||
        job.steps.some(s => hasUncertainEffects(s.stage, s.result))) return false;
    const last = job.ciRepairs?.at(-1);
    if (last && last.phase !== 'done') return false;
    let failure;
    try { failure = await readCIFailure(delivery, job); }
    catch (error) { if (error instanceof CurrentChecksWait) return false; throw error; }
    if (!failure || job.ciRepairs?.some(r => r.fingerprint === failure.fingerprint)) return false;
    const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
    if (issue.state !== 'open' || !Number.isFinite(Date.parse(issue.updated_at))) return false;
    if ((job.ciRepairs?.length || 0) >= 3) {
        job.status = 'blocked'; job.detail = 'Sam exhausted three CI repair attempts; retained diagnostics need Morgan’s next decision.';
        store.save(); return true;
    }
    const id = crypto.randomUUID(), root = resolve(store.dataRoot, 'ticket-work', job.id);
    mkdirSync(root, { recursive: true });
    const evidencePath = resolve(root, `ci-failure-${id}.json`);
    writeFileSync(evidencePath, JSON.stringify(failure, null, 2), { flag: 'wx', mode: 0o600 });
    (job.ciRepairs ??= []).push({ id, head: job.head, base: failure.pr.base.sha, branch: failure.pr.head.ref,
        fingerprint: failure.fingerprint, evidencePath, inputSha256: deliveryInputSha256(store, job.key), issueUpdatedAt: issue.updated_at, phase: 'diagnose', startedAt: store.clock.now().toISOString() });
    job.status = 'queued';
    job.detail = 'Sam will diagnose the failed CI jobs and choose a scoped repair; original logs are saved.';
    store.emit('ci-diagnosis-queued', job.detail, 'lead', job.key);
    return true;
}
