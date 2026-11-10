import { isDeepStrictEqual } from 'node:util';
import { workKey, type StageResult, type TicketJob } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { harnessDelivers } from '../harness/scope';
import { assertMetadataBinding, bindMetadata } from './metadata-context';
import { metadataWorkspace } from './metadata-workspace';
import { lintPRContent, PRContentRejected } from './pr-body';
import type { GitHubDelivery } from '../pipeline/github-delivery';

export const METADATA_FINDING = 'pr-metadata';
export const METADATA_FINDING_GUIDANCE = 'For a blocking defect confined to the live PR title/body, use the reserved finding ID pr-metadata. When that is the sole restriction, return blocked with resolution=null; the harness confirms the repository content rejection and owns its bounded metadata handoff. Do not classify it by prose or send a source worker to edit GitHub metadata. Keep any genuine permission, service, scope, release, human hold or uncertain-effect classification.';

/** A typed finding AND an actual content rejection are required; narratives never select this route. */
export async function admitPRMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string): Promise<boolean> {
    const { store } = delivery;
    if (!harnessDelivers(store, job) || job.stage !== 'lead-pr' || job.prMetadataRepair || job.parked || result.resolution ||
        !['blocked', 'failed'].includes(result.outcome) || result.commit !== job.head || result.prId !== job.pr ||
        inputSha256 !== deliveryInputSha256(store, job.key) || !isDeepStrictEqual(job.steps.at(-1)?.result, result)) return false;
    const open = result.findings.filter(f => f.status === 'open');
    if (open.length !== 1 || open[0].id !== METADATA_FINDING || new Set(result.findings.map(f => f.id)).size !== result.findings.length) return false;
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt))) throw new Error('Original effects need readback before metadata admission');
    const pr = await delivery.verifyPR(job, true), record = bindMetadata(delivery, job, pr, [METADATA_FINDING], 'lead-pr');
    const cwd = await metadataWorkspace(delivery, job, true, record);
    let rejected = false;
    try { await lintPRContent(delivery.execute, cwd, { title: pr.title, body: pr.body, source: 'developer' }, Number(job.key.slice(3))); }
    catch (error) { if (!(error instanceof PRContentRejected)) throw error; rejected = true; }
    assertMetadataBinding(delivery, job, record, 'admission');
    if (!rejected) return false;
    const current = await delivery.verifyPR(job, true);
    assertMetadataBinding(delivery, job, record, 'admission');
    if (current.head.sha !== record.binding.head || current.head.ref !== record.binding.branch || current.title !== record.binding.before.title || current.body !== record.binding.before.body)
        throw new Error('Live metadata changed during content admission');
    job.prMetadataRepair = record;
    delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
    job.stage = 'prepare-pr'; job.status = 'queued'; job.detail = 'Exact metadata finding and repository content rejection recorded. One read-only Lead metadata assessment is queued; no source worker or repair budget was spent.';
    store.save(); return true;
}
