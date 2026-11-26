import { isDeepStrictEqual } from 'node:util';
import { workKey, type Finding, type StageResult, type TicketJob } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { harnessDelivers } from '../harness/scope';
import { assertMetadataBinding, bindMetadata } from './metadata-context';
import { metadataWorkspace } from './metadata-workspace';
import { lintPRContent, PRContentRejected } from './pr-body';
import { readDescriptionHistory } from './description-history';
import { matchesBoundDescription } from './description-continuity';
import { ownDescription } from './own-description';
import { staleOwnDescription } from './stale-own-description';
import type { GitHubDelivery } from '../pipeline/github-delivery';

export const METADATA_FINDING = 'pr-metadata';
export const METADATA_FINDING_GUIDANCE = 'For a blocking defect confined to the live PR title/body, use the reserved finding ID pr-metadata. When that is the sole restriction, apart from advisories carried from the saved review or validation of this head, return blocked with resolution=null. The harness owns its bounded metadata handoff when the repository content lint rejects the live content, or when it proves the live description is its own, written for an earlier head of this pull request and unedited since; otherwise a person edits the pull request. Do not classify it by prose or send a source worker to edit GitHub metadata. Keep any genuine permission, service, scope, release, human hold or uncertain-effect classification.';

/** An open reserved finding the harness may not take over, bound to the saved review step and the pull request content Sam reviewed. */
export interface MetadataHumanEdit {
    route: 'human-edit';
    /** `lint-accepted`: the sole open finding, whose live content the repository's own lint accepts. `other-findings`: other findings are open beside it. */
    why: 'lint-accepted' | 'other-findings';
    finding: Finding;
    /** Every other open finding of the same result, in its order. */
    others: Finding[];
    /** Index of the saved `lead-pr` step this decision reads, and a digest of that saved result. */
    step: number;
    resultSha256: string;
    /** The human-input digest the review read, as `acceptStageResult` supplied it; never computed again later. */
    inputSha256: string;
    /** The pull request Sam reviewed: its identity and the title and body the review started from. */
    pr: { number: number; url: string; head: string; branch: string; title: string; body: string };
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
 * Reads a blocked or failed readiness review with an open `pr-metadata` finding, once. The bounded metadata handoff
 * is queued on one of two routes. Content: that finding alone, with the repository's own lint rejecting the live
 * content. Stale own description: the lint accepts it (or the other open findings are all advisories the saved
 * steps carried, and no lint runs), and `stale-own-description.ts` proves the live description is the Office's
 * own, written for an earlier head of this pull request and unedited since; that proof joins the binding.
 * Anything else the harness may not take over is a `human-edit`, only while the pull request still shows, after the
 * last read, the head, title and body Sam's review started from. A same-head edit during the review, the lint or
 * the authorship read makes it `ineligible`. The last read must also show the same open, unmerged pull request,
 * repository, target and branch: a closed or changed one neither parks nor is taken over. Narratives never select a
 * route. Tool, permission and unsettled-effect errors, and a refused binding, stay errors.
 */
export async function evaluatePRMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string, reviewed?: { title?: unknown; body?: unknown; head?: { sha?: unknown }; base?: { ref?: unknown } }): Promise<MetadataDecision> {
    const { store } = delivery;
    const ineligible = (reason: string): MetadataDecision => ({ route: 'ineligible', reason });
    const gate = unbound(delivery, job, result, inputSha256);
    if (gate) return ineligible(gate);
    const step = job.steps.length - 1, resultSha256 = digest(job.steps[step].result);
    const open = result.findings.filter(f => f.status === 'open'), finding = open.find(f => f.id === METADATA_FINDING);
    if (!finding) return ineligible('no open pr-metadata finding');
    if (new Set(result.findings.map(f => f.id)).size !== result.findings.length) return ineligible('duplicate finding ids');
    const settled = () => {
        const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
        if (effects.some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt))) throw new Error('Original effects need readback before metadata admission');
    };
    settled();
    const sole = open.length === 1, others = open.filter(f => f !== finding);
    const pr = await delivery.verifyPR(job, true);
    if (inputSha256 !== deliveryInputSha256(store, job.key)) return ineligible('human inputs changed since the review');
    const record = bindMetadata(delivery, job, pr, [METADATA_FINDING], 'lead-pr');
    let rejected = false;
    if (sole) {
        const cwd = await metadataWorkspace(delivery, job, true, record);
        try { await lintPRContent(delivery.execute, cwd, { title: pr.title, body: pr.body, source: 'developer' }, Number(job.key.slice(3))); }
        catch (error) { if (!(error instanceof PRContentRejected)) throw error; rejected = true; }
    }
    // A genuine other open finding is refused before any read, so it goes straight to the person.
    const stale = rejected ? undefined : await staleOwnDescription(delivery, job, others, record, reviewed);
    assertMetadataBinding(delivery, job, record, 'admission');
    const current = await delivery.verifyPR(job, true);
    const last = stale?.stale ? await readDescriptionHistory(store, delivery.execute, job.pr) : undefined;
    assertMetadataBinding(delivery, job, record, 'admission');
    settled();
    if (job.steps.length - 1 !== step || digest(job.steps[step]?.result) !== resultSha256 || digest(result) !== resultSha256)
        return ineligible('the saved review changed while the pull request was read');
    const before = record.binding.before, repository = store.project.repository;
    const moved = current.head.sha !== record.binding.head || current.head.ref !== record.binding.branch || current.title !== before.title || current.body !== before.body;
    const closed = current.number !== job.pr || current.html_url !== job.prUrl || current.state !== 'open' || !!current.merged_at ||
        current.head?.repo?.full_name !== repository || current.base?.repo?.full_name !== repository || current.base?.ref !== store.project.target;
    const takeover = (bound: typeof record, detail: string): MetadataDecision => {
        job.prMetadataRepair = bound;
        delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
        job.stage = 'prepare-pr'; job.status = 'queued'; job.detail = detail;
        store.save(); return { route: 'takeover' };
    };
    if (!rejected) {
        if (closed) return ineligible('the pull request is no longer the open pull request the review read');
        if (moved) return ineligible('the pull request changed while its content was read');
        if (reviewed?.head?.sha !== record.binding.head || reviewed.title !== before.title || reviewed.body !== before.body ||
            reviewed.base?.ref !== record.binding.base)
            return ineligible('the pull request changed after the review started');
        if (stale && !stale.stale && stale.drift) return ineligible(stale.reason);
        if (stale?.stale && last) {
            if (!matchesBoundDescription(last, record.binding) || last.revision.sha256 !== stale.proof.revision.sha256)
                return ineligible('the pull request description changed while its authorship was read');
            const owned = ownDescription(store, job, last);
            if (!owned.owned || owned.attribution.head !== stale.proof.head || owned.attribution.contentSha256 !== stale.proof.contentSha256 ||
                !isDeepStrictEqual(owned.attribution.source, stale.proof.source))
                return ineligible('the Office write attribution changed while the pull request was read');
            const bound = bindMetadata(delivery, job, pr, [METADATA_FINDING], 'lead-pr', stale.proof);
            assertMetadataBinding(delivery, job, bound, 'admission');
            return takeover(bound, `The live PR description is the Office's own, written for ${stale.proof.head.slice(0, 7)} and unedited since; the head is now ${record.binding.head.slice(0, 7)}. One read-only Lead metadata assessment refreshes the body; no source worker or repair budget was spent.`);
        }
        return { route: 'human-edit', why: sole ? 'lint-accepted' : 'other-findings', finding, others, step, resultSha256, inputSha256,
            pr: { number: job.pr, url: job.prUrl, head: record.binding.head, branch: record.binding.branch, title: before.title, body: before.body } };
    }
    if (moved || closed) throw new Error('Live metadata changed during content admission');
    return takeover(record, 'Exact metadata finding and repository content rejection recorded. One read-only Lead metadata assessment is queued; no source worker or repair budget was spent.');
}

/** A typed finding AND an actual content rejection are required; narratives never select this route. */
export async function admitPRMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, inputSha256: string): Promise<boolean> {
    return (await evaluatePRMetadata(delivery, job, result, inputSha256)).route === 'takeover';
}
