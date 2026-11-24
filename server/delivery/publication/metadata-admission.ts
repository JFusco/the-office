import { isDeepStrictEqual } from 'node:util';
import { workKey, type Finding, type StageResult, type TicketJob } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { harnessDelivers } from '../harness/scope';
import { assertMetadataBinding, bindMetadata } from './metadata-context';
import { metadataWorkspace } from './metadata-workspace';
import { lintPRContent, PRContentRejected } from './pr-body';
import type { GitHubDelivery } from '../pipeline/github-delivery';

export const METADATA_FINDING = 'pr-metadata';
export const METADATA_FINDING_GUIDANCE = 'For a blocking defect confined to the live PR title/body, use the reserved finding ID pr-metadata. When that is the sole restriction, return blocked with resolution=null; the harness confirms the repository content rejection and owns its bounded metadata handoff. Do not classify it by prose or send a source worker to edit GitHub metadata. Keep any genuine permission, service, scope, release, human hold or uncertain-effect classification.';

/** An open reserved finding the harness may not take over, bound to the saved review step and the pull request content Sam reviewed. */
export interface MetadataHumanEdit {
    route: 'human-edit';
    /** `lint-accepted`: the sole open finding, whose live content the repository's own lint accepts. `other-findings`: other findings are open beside it. */
    why: 'lint-accepted' | 'other-findings';
    finding: Finding;
    /** Every other open finding of the same result, in its order. */
    others: Finding[];
    /** Index of the saved `lead-pr` step this decision reads. */
    step: number;
    pr: { number: number; url: string; head: string; title: string; body: string };
}

/** One reading of a readiness review's reserved metadata finding: the harness takes it over, a person edits the PR, or neither applies. */
export type MetadataDecision = { route: 'takeover' } | MetadataHumanEdit | { route: 'ineligible'; reason: string };

/** Why a saved review is not one this evaluation reads, or '' when it is. */
function unbound(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string): string {
    const { store } = delivery;
    if (!harnessDelivers(store, job)) return 'not a harness delivery';
    if (job.stage !== 'lead-pr') return 'not at the readiness review';
    if (job.prMetadataRepair) return 'a metadata repair is already bound';
    if (job.parked) return 'the job is parked';
    if (result.resolution) return 'the review returned a resolution';
    if (!['blocked', 'failed'].includes(result.outcome)) return 'the review did not block';
    if (result.commit !== job.head || result.prId !== job.pr) return 'the review is of another head or pull request';
    if (inputSha256 !== deliveryInputSha256(store, job.key)) return 'human inputs changed since the review';
    if (!isDeepStrictEqual(job.steps.at(-1)?.result, result)) return 'the review is not the saved last step';
    return '';
}

/**
 * Reads a blocked or failed readiness review with an open `pr-metadata` finding, once. Takeover needs that finding
 * alone and the repository's own lint rejecting the live content: the bounded metadata handoff is then queued.
 * A finding the harness may not take over (the lint accepts the content, or other findings are open) is a
 * `human-edit`, only while the pull request still shows, after the last read, the head, title and body Sam's review
 * started from. A same-head edit during the review or the lint makes it `ineligible`. Narratives never select a
 * route. Tool, permission and unsettled-effect errors, and a refused binding, stay errors.
 */
export async function evaluatePRMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string, reviewed?: { title?: unknown; body?: unknown; head?: { sha?: unknown } }): Promise<MetadataDecision> {
    const { store } = delivery;
    const ineligible = (reason: string): MetadataDecision => ({ route: 'ineligible', reason });
    const gate = unbound(delivery, job, result, inputSha256);
    if (gate) return ineligible(gate);
    const open = result.findings.filter(f => f.status === 'open'), finding = open.find(f => f.id === METADATA_FINDING);
    if (!finding) return ineligible('no open pr-metadata finding');
    if (new Set(result.findings.map(f => f.id)).size !== result.findings.length) return ineligible('duplicate finding ids');
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt))) throw new Error('Original effects need readback before metadata admission');
    const sole = open.length === 1;
    const pr = await delivery.verifyPR(job, true), record = bindMetadata(delivery, job, pr, [METADATA_FINDING], 'lead-pr');
    let rejected = false;
    if (sole) {
        const cwd = await metadataWorkspace(delivery, job, true, record);
        try { await lintPRContent(delivery.execute, cwd, { title: pr.title, body: pr.body, source: 'developer' }, Number(job.key.slice(3))); }
        catch (error) { if (!(error instanceof PRContentRejected)) throw error; rejected = true; }
    }
    assertMetadataBinding(delivery, job, record, 'admission');
    const current = await delivery.verifyPR(job, true);
    assertMetadataBinding(delivery, job, record, 'admission');
    const before = record.binding.before;
    const moved = current.head.sha !== record.binding.head || current.head.ref !== record.binding.branch || current.title !== before.title || current.body !== before.body;
    if (!rejected) {
        if (moved) return ineligible('the pull request changed while its content was read');
        if (reviewed?.head?.sha !== record.binding.head || reviewed.title !== before.title || reviewed.body !== before.body)
            return ineligible('the pull request changed after the review started');
        return { route: 'human-edit', why: sole ? 'lint-accepted' : 'other-findings', finding, others: open.filter(f => f !== finding), step: job.steps.length - 1,
            pr: { number: job.pr, url: job.prUrl, head: record.binding.head, title: before.title, body: before.body } };
    }
    if (moved) throw new Error('Live metadata changed during content admission');
    job.prMetadataRepair = record;
    delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
    job.stage = 'prepare-pr'; job.status = 'queued'; job.detail = 'Exact metadata finding and repository content rejection recorded. One read-only Lead metadata assessment is queued; no source worker or repair budget was spent.';
    store.save(); return { route: 'takeover' };
}

/** A typed finding AND an actual content rejection are required; narratives never select this route. */
export async function admitPRMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string): Promise<boolean> {
    return (await evaluatePRMetadata(delivery, job, result, inputSha256)).route === 'takeover';
}
