import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOLDS } from '../../office/config';
import { packed165Admitted } from './packed165-evidence';
import { assertAutomationEffects } from '../readiness/automation-effects';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { assertDraftClaimHistory } from '../publication/link-draft-issue';
import { readPublication } from '../publication/read-command';
import { artifact, digest } from '../../store/readback-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';

const originalDetail = 'Error: Earlier draft claim has no certain comment receipt; read back its original execution before another write';

/** Reconcile the already-published approved repair. No push, PR, comment or source command runs here. */
export async function resumePacked165DraftLink(delivery: GitHubDelivery) {
    const { store, execute } = delivery;
    const job = delivery.jobs.find(j => j.stage === 'draft' && j.status === 'blocked' && j.detail === originalDetail && j.pr &&
        !j.packedPublicationRepair?.draftLinkContinuation && packed165Admitted(store, j));
    if (!job || store.state.paused || store.state.draining || HOLDS[job.key]) return;
    const identity = () => digest({ id: job.id, head: job.head, branch: job.branch, worktree: job.worktree, pr: job.pr, prUrl: job.prUrl,
        status: job.status, stage: job.stage, detail: job.detail, repair: job.packedPublicationRepair });
    const original = identity(), root = resolve(store.dataRoot, 'ticket-work', job.id);
    const guard = () => {
        if (identity() !== original || store.state.paused || store.state.draining || HOLDS[job.key] ||
            !packed165Admitted(store, job) || !assessDeliveryEligibility(store, job).eligible ||
            store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status)))
            throw Error('Draft-link readback authority changed');
        assertAutomationEffects(store, job);
        assertDraftClaimHistory(store, job, root);
        for (const [key, operation] of [[`push:${job.head}`, 'git-push'], [`pr-create:${job.head}`, 'github-pr-create']]) {
            const e = store.getEffect<Record<string, unknown>>(`harness:${job.id}:${key}`);
            const receipt = e?.receipt as { head?: unknown; number?: unknown; url?: unknown } | null;
            if (!e || e.status !== 'verified' || e.operation !== operation || e.work.kind !== 'delivery' || e.work.id !== job.id ||
                e.work.projectId !== store.project.id || e.payload.head !== job.head || e.payload.branch !== job.branch ||
                e.target !== `${store.project.repository}:${job.branch}` || !receipt ||
                (operation === 'git-push' ? receipt.head !== job.head : receipt.number !== job.pr || receipt.url !== job.prUrl))
                throw Error('Original current-head publication must already be verified');
        }
    };
    try {
        guard();
        const pr = await delivery.verifyPR(job, true, kind => readPublication(store, execute, job, root, kind));
        const content = JSON.parse(readFileSync(resolve(job.packedPublicationRepair!.contentRoot, 'pr.json'), 'utf8'));
        const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
        if (pr.number !== job.pr || pr.html_url !== job.prUrl || pr.state !== 'open' || pr.draft !== true || pr.merged_at ||
            pr.head?.sha !== job.head || pr.head.ref !== job.branch || pr.head.repo?.full_name !== store.project.repository ||
            pr.title !== content.title || pr.body !== content.body || issue.state !== 'open' || !issue.assignees?.some((a: any) => a.login === 'JFusco')) return;
        guard();
        const proofPath = resolve(root, `draft-link-readback-${crypto.randomUUID()}.json`);
        writeFileSync(proofPath, JSON.stringify({ at: store.clock.now().toISOString(), jobId: job.id, head: job.head, pr: job.pr, originalDetail,
            publication: { url: pr.html_url, head: pr.head.sha, bodySha256: digest(pr.body) },
            meaning: 'Current publication and every original draft read ledger reconciled. No historical failure was relabeled; no publication or source write was replayed.' }, null, 2), { flag: 'wx', mode: 0o600 });
        const proof = artifact(store, proofPath);
        store.transition('packed165-draft-link-reconciled', 'Existing approved PR publication reconciled; Office will finish its issue link and normal check gates without another push or model stage.', () => {
            guard();
            job.packedPublicationRepair!.draftLinkContinuation = { at: store.clock.now().toISOString(), originalDetail, proofPath, proofSha256: proof.sha256 };
            job.status = 'queued';
            job.detail = 'Existing repaired PR publication verified; continuing the same draft handoff without source, push or PR creation replay.';
        }, 'pm', job.key);
    } catch { /* A failed read is not clearance. Normal read-only observation may try again; no write or budget is replayed. */ }
}
