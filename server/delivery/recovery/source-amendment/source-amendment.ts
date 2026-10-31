import {outsideAmendmentFindingIds} from './source-amendment-held';
import { AsyncLocalStorage } from 'node:async_hooks';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import type { HarnessRequest, SourceAmendmentAuthorization, StageResult, TicketJob } from '../../../../src/shared';
import { workKey } from '../../../../src/shared';
import type { Store } from '../../../store/store';
import { hasUncertainEffects, type GitHubDelivery } from '../../pipeline/github-delivery';
import { currentAssignment } from '../../../workers/assignment-context';
import { containedFile } from '../../../cec/workflow';
import { GitOperations } from '../../../github/git-operations';
import { ResultSchema } from '../../../workers/agents';
import { RELEASE_AMENDMENT_PATHS, RELEASE_SOURCE_IDS, releaseAmendmentProfileIds, sourceHash, sourceJson, verifyReleaseAmendmentScope } from './source-amendment-scope';
import { verifyReleaseCaptures } from './source-amendment-captures';
import { amendmentCaptureObservation, parseAmendmentProof, releaseCapturesCover2026, verifyAmendmentGeneration, verifyLegacyCaptureMetadata } from './source-amendment-proof';
import { adoptCandidate } from '../implementation/candidate-adoption';

export const GH91 = {
    projectId: 'cms-field-vocabulary', repository: 'JFusco/cms-field-vocabulary',
    jobId: '3fb12021-08c6-4674-96da-897eeb89951c', issue: 91,
    originalHead: '8d1ea2bd935e53ac512244901da47b66d9b10933',
    originalBase: '043311a9076bc88a709a74ad63ca7feeaf2752c6',
    questionItemId: '[request_user_input_async,call_f2c8558b88ba44b99682b5378a09fd07,0]',
} as const;
const sha = z.string().regex(/^[a-f0-9]{64}$/), head = z.string().regex(/^[a-f0-9]{40}$/);
const ids = z.array(z.enum(RELEASE_SOURCE_IDS)).length(3).refine(value => new Set(value).size === 3, 'Exactly the three authorized source IDs are required');
export const SourceAmendmentCommand = z.object({
    projectId: z.literal(GH91.projectId), repository: z.literal(GH91.repository), jobId: z.literal(GH91.jobId), issue: z.literal(91),
    originalHead: z.literal(GH91.originalHead), originalBase: z.literal(GH91.originalBase), sourceIds: ids,
    approvedBy: z.literal('human'), questionItemId: z.literal(GH91.questionItemId), proposalSha256: sha,
}).strict();
type Ownership = { complete: boolean; fresh: boolean; ownership?: { status: string } };
type RefreshOwnership = () => Promise<Ownership>;
const ownershipContext = new AsyncLocalStorage<RefreshOwnership>();
export const refreshDeliveryOwnership = () => { const refresh=ownershipContext.getStore(); if(!refresh)throw new Error('Scheduler ownership refresh unavailable'); return refresh(); };
export const withAmendmentOwnership = <T>(refresh: RefreshOwnership, operation: () => T): T => ownershipContext.run(refresh, operation);
function requireThat(condition: unknown, detail: string): asserts condition { if (!condition) throw new Error(detail); }
const proofRoot = (store: Store, job: TicketJob) => resolve(store.dataRoot, 'ticket-work', job.id);

/** Neither a symlink nor a model-selected path may escape the private artifact root. */
function privateFile(path: string, root: string, limit: number): string {
    const absolute = resolve(path), canonicalRoot = realpathSync(root);
    requireThat(!lstatSync(root).isSymbolicLink(), 'Amendment artifact root cannot use symlinks');
    requireThat(absolute.startsWith(resolve(root) + sep) && containedFile(absolute, root) && realpathSync(absolute) === resolve(canonicalRoot, absolute.slice(resolve(root).length + 1)), 'Amendment artifact is not a canonical contained file');
    for (let parent = absolute; parent !== resolve(root); parent = dirname(parent))
        requireThat(!lstatSync(parent).isSymbolicLink(), 'Amendment artifact cannot use symlinks');
    const stat = lstatSync(absolute);
    requireThat(stat.isFile() && stat.size > 0 && stat.size <= limit, 'Amendment artifact is empty, not regular, or exceeds its size bound');
    const value = readFileSync(absolute, 'utf8'), after = lstatSync(absolute);
    requireThat(after.ino === stat.ino && after.dev === stat.dev && after.size === stat.size && after.mtimeMs === stat.mtimeMs && Buffer.byteLength(value) === stat.size, 'Amendment artifact changed during reading');
    return value;
}
function stoppedAndCertain(store: Store, job: TicketJob, allowOwnClaim = false) {
    const own = currentAssignment()?.claim;
    requireThat(!store.state.paused && !store.state.draining && (allowOwnClaim || job.status !== 'working') && !job.mergeAttempt && !store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status)) &&
        !store.activeClaims().some(claim => claim.work.id === job.id && (!allowOwnClaim || claim.id !== own?.id || claim.status !== 'running')),
    'Amendment requires stopped work and unchanged ownership');
    requireThat(!store.state.coordination?.jobs?.some(other => other.id !== job.id && other.status !== 'cancelled' && (other.key === job.key || job.worktree && other.worktree === job.worktree)), 'Amendment candidate ownership conflicts');
    requireThat(!job.steps.some(step => hasUncertainEffects(step.stage, step.result)), 'Uncertain original effects require reconciliation');
    const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    requireThat(!effects.some(row => { const effect = JSON.parse(row.body); return effect.status !== 'verified' && !(effect.operation === 'github-merge' && effect.status === 'prepared') && !(effect.status === 'rejected' && !effect.dispatchedAt); }), 'Uncertain amendment effects require reconciliation');
}
export function amendmentIssueSha256(issue: any): string {
    requireThat(issue.state === 'open' && !issue.pull_request && issue.assignees?.some((person: any) => person.login === 'JFusco') &&
        typeof issue.updated_at === 'string' && issue.updated_at.length > 0, 'Amendment issue scope/assignment changed');
    return sourceHash(sourceJson({ title: issue.title, body: issue.body, labels: (issue.labels || []).map((label: any) => typeof label === 'string' ? label : label.name).sort(), assignees: issue.assignees.map((person: any) => person.login).sort() }));
}
export function validateAmendmentIntent(store: Store, input: unknown): SourceAmendmentAuthorization {
    const authorization = SourceAmendmentCommand.parse(input);
    authorization.sourceIds = [...authorization.sourceIds].sort();
    const job = store.state.coordination?.jobs?.find(job => job.id === authorization.jobId);
    requireThat(store.project.provider === 'github' && store.project.id === authorization.projectId && store.project.repository === authorization.repository && job?.key === 'GH-91', 'Amendment project/job/issue identity differs');
    stoppedAndCertain(store, job);
    if (!job.sourceAmendment?.adoptedAt)
        requireThat(['blocked', 'interrupted'].includes(job.status) && (!job.head || job.head === authorization.originalHead) && (!job.candidateBase || job.candidateBase === authorization.originalBase), 'Original amendment candidate changed or is running');
    requireThat(sourceHash(privateFile(resolve(proofRoot(store, job), 'cms91-bounded-amendment.md'), proofRoot(store, job), 128000)) === authorization.proposalSha256, 'Approved proposal digest differs');
    if (job.sourceAmendment) requireThat(isDeepStrictEqual(job.sourceAmendment.authorization, authorization), 'A different amendment authorization already exists');
    return authorization;
}

/** Conditional instructions exist only after the scheduler durably binds permission. */
export function amendmentInstruction(store: Store, job: TicketJob): string {
    if (!job.sourceAmendment) return 'For #91 remove unauthorized source-lock acceptance and unrelated index drift from the net diff while preserving the release-note fix.';
    const authorization = SourceAmendmentCommand.parse(job.sourceAmendment.authorization);
    requireThat(store.project.id === authorization.projectId && store.project.repository === authorization.repository && job.id === authorization.jobId && job.key === 'GH-91' &&
        sourceHash(privateFile(resolve(proofRoot(store, job), 'cms91-bounded-amendment.md'), proofRoot(store, job), 128000)) === authorization.proposalSha256, 'Durable amendment authorization no longer matches');
    const held = job.scopeRepairReadback ? ` Independently audited outside finding f-other-index-drift MUST remain OPEN for source IDs ${JSON.stringify(job.scopeRepairReadback.outsideSourceIds)}. Return evidence id source-amendment-held-finding with path ${job.scopeRepairReadback.proofPath}, commit equal to the full current result commit, and summary JSON ${JSON.stringify({version:1,authorizationId:job.sourceAmendment.id,readbackSha256:job.scopeRepairReadback.proofSha256,findingId:'f-other-index-drift',scope:'wholly-outside-unchanged',sourceIds:job.scopeRepairReadback.outsideSourceIds})}. This binding applies to the WHOLE finding, never an overlapping or unknown concern. Keep its scope and evidence visible as separate freshness work, with no source acceptance or all-catalog freshness claim. The harness rechecks immutable read-back evidence and unchanged outside source rows/profile claims on every candidate. Any overlap, unknown or changed outside row blocks. Alex must repair the capture-derived journal using the exact deterministic releaseAmendmentJournal template, regenerate native graph/catalog artifacts on this same branch and save fresh head-qualified proof; Sam and Riley inspect this evidence without editing source. Preserve all old raw packets. ` : '';
    return `${held}Durable conditional amendment ${job.sourceAmendment.id}, human question ${authorization.questionItemId}, approved proposal sha256 ${authorization.proposalSha256}: repair ONLY ${RELEASE_SOURCE_IDS.join(', ')} and their generated bindings on this same saved branch. Preserve the frozen scanner/rejection-test delta and all unrelated current-base source rows, bindings and all seven profile claims. Permission to repair is not acceptance. Capture body and complete native observation from the SAME official response per source; no refetch after review. Keep raw bodies private. Never accept held sources or broader profile claims. Preserve f-lock-acceptance and f-other-index-drift with actual resolution evidence. Preserve historical proof bytes. Save each fresh candidate proof as source-amendment-proof-<full-candidate-head>.json under ${proofRoot(store, job)} using proof version 1 (authorizationId, head, current base, exact sourceIds, captures [{sourceId,url,bodyPath,observationPath}], sourceDispositions [{sourceId,disposition:"repaired",evidence2026}], profileDispositions [{profileId,disposition:"unchanged"}], generation {head,inputSha256,command,graphPath,connectionsPath,outputPath}). Generation must retain successful native build-graph output for these candidate inputs, including exitCode=0, head, inputSha256, command, graphSha256 and connectionsSha256. For fresh proofs, command is argv ["node","scripts/wiki/build-graph.cjs"] or a registered npm/pnpm run command; inputSha256 is sourceHash(sourceJson(the map of RELEASE_AMENDMENT_PATHS except graph and connections, with each path mapped to the SHA256 of its exact committed candidate bytes)). Retain generated outputs and the successful generation receipt privately under this job. Do not reuse an older head/input digest after journal or base changes. Native source-review supports only IDs, --all, --allow-manual and --metadata-only; it refetches and rebuilds all lock rows. Never invent offline/acceptance flags or run that broad writer blindly; use a bounded native observer with private same-response capture. Sam and Riley must independently check this exact head, base, proof and scope; neither may be skipped by approach or reroute.`;
}

async function frozenFiles(delivery: GitHubDelivery) {
    const files: Record<string, Record<string, string>> = { originalBase: {}, proposal: {} };
    for (const [revision, commit] of [['originalBase', GH91.originalBase], ['proposal', GH91.originalHead]])
        for (const path of RELEASE_AMENDMENT_PATHS) files[revision][path] = await gitFile(delivery, commit, path);
    return files;
}
async function gitFile(delivery: GitHubDelivery, commit: string, path: string): Promise<string> {
    const cwd = delivery.store.project.repo, options = { cwd, readOnly: true, timeout: 30000 };
    const entry = (await delivery.execute('git', ['ls-tree', commit, '--', path], options)).trim();
    if (!entry) return '';
    requireThat(/^100644 blob [a-f0-9]{40}\t/.test(entry) || /^100755 blob [a-f0-9]{40}\t/.test(entry), `Amendment source is not a regular Git file: ${path}`);
    const value = await delivery.execute('git', ['show', `${commit}:${path}`], options);
    requireThat(Buffer.byteLength(value) <= 16000000, `Amendment source exceeds its size bound: ${path}`);
    return value;
}
export async function authorizeSourceAmendment(delivery: GitHubDelivery, request: HarnessRequest, ownership: RefreshOwnership) {
    const { store } = delivery, authorization = validateAmendmentIntent(store, request.sourceAmendment);
    const job = delivery.jobs.find(job => job.id === authorization.jobId)!;
    if (job.sourceAmendment?.adoptedAt) return;
    const version = sourceHash(sourceJson(job));
    const candidates = [...job.steps.filter(step => step.stage === 'implement').map(step => ({ ...step.result, head: step.result.commit })), ...(store.state.maintenance?.runs || []).flatMap(run => run.steps.flatMap(step => step.result.candidates.filter(candidate => candidate.issue === 91)))].filter(candidate => candidate.head === authorization.originalHead);
    const unique = [...new Map(candidates.map(candidate => [`${candidate.worktree}:${candidate.branch}`, candidate])).values()];
    requireThat(unique.length === 1, 'Saved amendment candidate is missing or ambiguous');
    const candidate = unique[0];
    requireThat(candidate.branch === 'codex/91-restore-optimizely-release-notes', 'Original amendment branch differs');
    await delivery.engine.maintenance.verifyCandidate({ issue: 91, head: authorization.originalHead, branch: candidate.branch, worktree: candidate.worktree, summary: 'Approved amendment identity check' });
    const inspected = await new GitOperations(store, delivery.execute).candidate(candidate.worktree, authorization.originalHead);
    requireThat(inspected.base === authorization.originalBase, 'Original amendment base differs');
    const frozen = await frozenFiles(delivery), filesSha256 = sourceHash(sourceJson(frozen));
    const issue = await delivery.api('issues/91');
    requireThat(issue.state === 'open' && !issue.pull_request && issue.assignees?.some((person: any) => person.login === 'JFusco'), 'Amendment issue is no longer open and assigned');
    const current = await ownership();
    requireThat(current.complete && current.fresh && current.ownership?.status === 'clear', 'Amendment live ownership is not clear');
    validateAmendmentIntent(store, authorization);
    requireThat(sourceHash(sourceJson(job)) === version, 'Amendment work version changed');
    store.transaction(() => {
        validateAmendmentIntent(store, authorization);
        job.sourceAmendment ??= { id: request.id, authorization, authorizedAt: store.clock.now().toISOString(), proposalFilesSha256: filesSha256, receipts: [] };
        requireThat(job.sourceAmendment.proposalFilesSha256 === filesSha256, 'Frozen amendment proposal changed');
        store.emit('source-amendment-authorized', 'Bounded GH-91 repair permission recorded; independent source acceptance remains required.', 'lead', job.key);
    });
    await adoptCandidate(delivery, job.key, current, ownership);
}

const Binding = z.object({ version: z.literal(1), role: z.enum(['lead', 'qa']), head, base: head, scopeSha256: sha, proofSha256: sha,
    sourceIds: ids, profileIds: z.array(z.string()).length(7), checks: z.array(z.enum(['native-fingerprints', 'negative-extraction', 'scoped-scan', 'full-scan', 'repository-checks', 'native-graph'])).min(1) }).strict();
export const AMENDMENT_REVIEW_PROOF = 'For this amendment return original finding dispositions (review: fixed/verified; QA: verified), except an explicitly harness-proved outside-amendment finding must remain OPEN with its separate freshness evidence. Never invent a waiver or mark that held work fixed/verified. Independently inspect all three records, material 2026 releases and all seven profiles. Return evidence id source-amendment-binding whose summary is JSON {version:1,role:"lead"|"qa",head,base,scopeSha256,proofSha256,sourceIds,profileIds,checks}. This stays in the harness-owned native result; a read-only reviewer must not write a binding file. scopeSha256 uses verifyReleaseAmendmentScope; proofSha256 hashes sourceJson({packet:<sha256 of raw packet>,files:<map of absolute referenced paths to sha256>}). Include successful native-fingerprints, negative-extraction, scoped-scan, full-scan, repository-checks and native-graph checks in QA. Do not refetch or alter the retained proof during review/QA.';

/** Validate fresh evidence every time; receipt history is never overwritten. */
export async function requireSourceAmendmentAcceptance(delivery: GitHubDelivery, job: TicketJob, create = false, refresh = ownershipContext.getStore()): Promise<void> {
    if (!job.sourceAmendment) return;
    const { store } = delivery, amendment = job.sourceAmendment;
    amendmentInstruction(store, job);
    requireThat(refresh, 'Amendment ownership refresh is unavailable');
    stoppedAndCertain(store, job, true);
    const version = sourceHash(sourceJson(job)), claims = sourceHash(sourceJson(store.activeClaims())), project = sourceJson(store.project);
    const issueSha256 = amendmentIssueSha256(await delivery.api('issues/91'));
    const root = proofRoot(store, job), retained = new Map<string, string>(), stamps = new Map<string, string>();
    const stamp = (path: string) => { const stat = lstatSync(path); return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`; };
    const retain = (path: string, limit = 16000000) => {
        const absolute = resolve(root, path), value = privateFile(absolute, root, limit);
        if (retained.has(absolute)) requireThat(retained.get(absolute) === value, 'Proof artifact changed between reads');
        retained.set(absolute, value); stamps.set(absolute, stamp(absolute)); return value;
    };
    head.parse(job.head);
    const candidatePacketName = `source-amendment-proof-${job.head}.json`;
    const packetName = lstatSync(resolve(root, candidatePacketName), { throwIfNoEntry: false }) ? candidatePacketName : 'source-amendment-proof.json';
    const packet = retain(packetName, 128000), parsed = parseAmendmentProof(packet, { ...amendment.authorization, root }), { proof } = parsed;
    requireThat(proof.authorizationId === amendment.id && proof.head === job.head, 'Amendment proof authorization/head is stale');
    const base = await delivery.api(`commits/${store.project.target}`);
    requireThat(proof.base === base.sha, 'Amendment proof current base is stale');
    const inspected = await new GitOperations(store, delivery.execute).candidate(job.worktree, job.head);
    requireThat(inspected.base === base.sha, 'Candidate must include the verified current base');
    const metadata = await delivery.execute('git', ['diff', '--summary', '--no-renames', base.sha, job.head], { cwd: job.worktree, readOnly: true });
    requireThat(!/mode change|delete mode|create mode (?!100644)/.test(metadata), 'Amendment changed unapproved file metadata');
    await delivery.execute('git', ['merge-base', '--is-ancestor', GH91.originalHead, job.head], { cwd: job.worktree, readOnly: true });
    const frozen = await frozenFiles(delivery);
    requireThat(sourceHash(sourceJson(frozen)) === amendment.proposalFilesSha256, 'Frozen approved proposal files differ');
    const files: Record<string, Record<string, string>> = { ...frozen, base: {}, candidate: {} };
    for (const path of RELEASE_AMENDMENT_PATHS) for (const [revision, commit] of [['base', base.sha], ['candidate', job.head]]) files[revision][path] = await gitFile(delivery, commit, path);
    const json = (path: string) => JSON.parse(files.candidate[path]);
    const profiles = releaseAmendmentProfileIds((path, revision) => files[revision][path]);
    requireThat(isDeepStrictEqual(proof.profileDispositions.map(item => item.profileId).sort(), profiles), 'All seven affected profile no-impact dispositions are required');
    requireThat(isDeepStrictEqual(proof.sourceDispositions.map(item => item.sourceId).sort(), [...RELEASE_SOURCE_IDS].sort()) && proof.sourceDispositions.every(item => /2026/.test(item.evidence2026)), 'Material 2026 source dispositions are incomplete');
    const captures = proof.captures.map(item => {
        const body = retain(item.bodyPath), raw = JSON.parse(retain(item.observationPath, 256000));
        return { sourceId: item.sourceId, url: item.url, body, observation: amendmentCaptureObservation(parsed, item, raw, body) };
    });
    verifyReleaseCaptures(json('sources/official-sources.json').sources, json('sources.lock.json').sources, captures);
    verifyLegacyCaptureMetadata(parsed, captures, retain);
    requireThat(releaseCapturesCover2026(captures), 'Retained response lacks material 2026 release evidence');
    const graphPath = 'scripts/wiki/graph/data/graph.json', connectionsPath = 'wiki/connections.md';
    const inputs = Object.fromEntries(RELEASE_AMENDMENT_PATHS.filter(path => ![graphPath, connectionsPath].includes(path)).map(path => [path, sourceHash(files.candidate[path])]));
    const packageJson = JSON.parse(await gitFile(delivery, job.head, 'package.json'));
    const generated = await verifyAmendmentGeneration(parsed, { head: job.head, worktree: job.worktree, inputSha256: sourceHash(sourceJson(inputs)), packageJson, retain,
        candidateFile: path => gitFile(delivery, job.head, path),
        candidateWikiPaths: async () => {
            const paths = await delivery.execute('git', ['ls-tree', '-r', '--name-only', job.head, '--', 'wiki'], { cwd: job.worktree, readOnly: true });
            return paths.trimEnd().split('\n').filter(Boolean);
        } });
    const { scopeSha256 } = verifyReleaseAmendmentScope((path, revision) => files[revision][path], inspected.files, generated);
    const proofSha256 = sourceHash(sourceJson({ packet: sourceHash(packet), files: Object.fromEntries([...retained].filter(([path]) => path !== resolve(root, packetName)).map(([path, contents]) => [path, sourceHash(contents)])) }));
    const heldFindings=await outsideAmendmentFindingIds(delivery,job);
    const originalIds = ['f-lock-acceptance', 'f-other-index-drift'];
    requireThat(originalIds.every(id => job.steps.some(step => step.result.findings.some(finding => finding.id === id))), 'Original amendment finding history is missing');
    const independent = async (stage: 'review' | 'validate', role: 'lead' | 'qa') => {
        const step = job.steps.filter(step => step.stage === stage).at(-1);
        requireThat(step?.workerId && step.nativeResultSha256 && step.result.commit === job.head && step.result.outcome === 'passed', 'Exact-head independent review and QA are required');
        requireThat(step.issueSha256 === issueSha256, 'Amendment issue changed; fresh independent review and QA are required');
        const worker = store.state.workLog?.find(worker => worker.id === step.workerId);
        requireThat(worker?.requestId === job.id && worker.ticket === job.key && worker.stage === `github-${stage}` && worker.role === role && worker.status === 'completed' && worker.sessionId && worker.endedAt, 'Independent worker identity is incomplete');
        const sessionRoot = resolve(store.dataRoot, 'sessions');
        requireThat(/^[a-zA-Z0-9-]+$/.test(worker.id), 'Worker artifact identity is invalid');
        const providerPath = resolve(sessionRoot, worker.id, 'provider.json'), resultPath = resolve(sessionRoot, worker.id, 'result.json');
        const providerContents = privateFile(providerPath, sessionRoot, 128000), resultContents = privateFile(resultPath, sessionRoot, 2000000);
        const provider = JSON.parse(providerContents), saved = JSON.parse(resultContents), result = ResultSchema.parse(saved.result);
        if(job.scopeRepairReadback) await outsideAmendmentFindingIds(delivery,job,result.commit,result);
        requireThat(provider.project === store.project.id && provider.repository === store.project.repository && provider.role === role && provider.provider === worker.provider && (role !== 'lead' || provider.readOnly === true) && saved.session === worker.sessionId && sourceHash(sourceJson(saved.result)) === step.nativeResultSha256,
            'Independent native provider/result proof differs');
        requireThat(result.outcome === 'passed' && result.commit === job.head && isDeepStrictEqual(result.findings, step.result.findings) && result.paidRuns === 0 && !result.receipts.some(receipt => !receipt.verified || receipt.uncertain) && !result.findings.some(finding => finding.status === 'open' && !heldFindings.has(finding.id)) && originalIds.every(id => result.findings.some(finding => finding.id === id && (heldFindings.has(id) ? finding.status === 'open' : role === 'qa' ? finding.status === 'verified' : finding.status !== 'open'))), 'Independent original finding dispositions are incomplete');
        const bindings = result.evidence.filter(evidence => evidence.id === 'source-amendment-binding' && evidence.commit === job.head).map(evidence => {
            try { return evidence.summary.length <= 8000 ? Binding.parse(JSON.parse(evidence.summary)) : undefined; } catch { return undefined; }
        }).filter(binding => binding !== undefined);
        requireThat(bindings.some(binding => binding.role === role && binding.head === job.head && binding.base === base.sha && binding.scopeSha256 === scopeSha256 && binding.proofSha256 === proofSha256 && isDeepStrictEqual([...binding.profileIds].sort(), profiles) &&
            (role !== 'qa' || ['native-fingerprints', 'negative-extraction', 'scoped-scan', 'full-scan', 'repository-checks', 'native-graph'].every(check => binding.checks.includes(check as any)))), 'Independent proof/scope binding is missing or stale');
        return { workerId: worker.id, sessionId: worker.sessionId, providerPath, providerContents, resultPath, resultContents, worker: sourceJson(worker) };
    };
    const review = await independent('review', 'lead'), qa = await independent('validate', 'qa');
    requireThat(review.workerId !== qa.workerId && review.sessionId !== qa.sessionId, 'Review and QA must have distinct actual worker/native identities');
    const reviewIdentity = { workerId: review.workerId, sessionId: review.sessionId }, qaIdentity = { workerId: qa.workerId, sessionId: qa.sessionId };
    const receiptId = sourceHash(sourceJson({ authorization: amendment.id, head: job.head, base: base.sha, issueSha256, scopeSha256, proofSha256, review: reviewIdentity, qa: qaIdentity }));
    const receipt = amendment.receipts.find(receipt => receipt.id === receiptId && receipt.authorizationId === amendment.id && receipt.head === job.head && receipt.base === base.sha &&
        receipt.issueSha256 === issueSha256 && receipt.scopeSha256 === scopeSha256 && receipt.proofSha256 === proofSha256 && isDeepStrictEqual(receipt.review, reviewIdentity) && isDeepStrictEqual(receipt.qa, qaIdentity));
    requireThat(create || receipt, 'A current exact-head amendment acceptance receipt is required');
    const ownership = await refresh();
    requireThat(ownership.complete && ownership.fresh && ownership.ownership?.status === 'clear', 'Amendment live ownership changed');
    requireThat(amendmentIssueSha256(await delivery.api('issues/91')) === issueSha256, 'Amendment issue changed during acceptance');
    const finalBase = await delivery.api(`commits/${store.project.target}`), finalCandidate = await new GitOperations(store, delivery.execute).candidate(job.worktree, job.head);
    requireThat(finalBase.sha === base.sha && finalCandidate.base === base.sha && isDeepStrictEqual(finalCandidate.files, inspected.files), 'Candidate head/current base changed during acceptance');
    const assertCurrent = () => {
        stoppedAndCertain(store, job, true);
        requireThat(delivery.jobs.find(current => current.id === job.id) === job && sourceJson(store.project) === project && sourceHash(sourceJson(job)) === version && sourceHash(sourceJson(store.activeClaims())) === claims, 'Amendment work version/claim changed');
        amendmentInstruction(store, job);
        for (const [path, contents] of retained) requireThat(privateFile(path, root, 16000000) === contents && stamp(path) === stamps.get(path), 'Amendment proof file changed before acceptance');
        for (const worker of [review, qa]) requireThat(privateFile(worker.providerPath, resolve(store.dataRoot, 'sessions'), 128000) === worker.providerContents && privateFile(worker.resultPath, resolve(store.dataRoot, 'sessions'), 2000000) === worker.resultContents && sourceJson(store.state.workLog?.find(item => item.id === worker.workerId)) === worker.worker, 'Independent native evidence changed before acceptance');
    };
    assertCurrent();
    if (receipt) return;
    store.transaction(() => {
        assertCurrent();
        const at = store.clock.now().toISOString();
        amendment.receipts.push({ id: receiptId, authorizationId: amendment.id, head: job.head, base: base.sha, issueSha256, scopeSha256, proofSha256,
            review: { workerId: review.workerId, sessionId: review.sessionId }, qa: { workerId: qa.workerId, sessionId: qa.sessionId }, at });
        store.emit('source-amendment-accepted', `Bounded source evidence accepted for ${job.head}; receipt ${receiptId}.`, 'lead', job.key);
    });
}
