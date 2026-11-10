import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { onTestFinished, vi } from 'vitest';
import { fakeGitHub, cleanupFakes, HEAD, BASE, REPOSITORY } from '../unit/delivery/support/fake-github';
import { bindMetadata } from '../../server/delivery/publication/metadata-context';
import { artifact, digest } from '../../server/store/readback-evidence';
import { withAssignment } from '../../server/workers/assignment-context';
import type { WorkTime, WorkClaim, Role, StageResult } from '../../src/shared';
import { enqueueMetadataRecovery } from '../../server/delivery/recovery/pr-metadata-intent';
import { reconcilePRMetadata } from '../../server/delivery/recovery/pr-metadata-recovery';
import { workerProfile } from '../../server/workers/worker-profiles';

/** Synthetic native result/claim/provider evidence; never contacts GitHub or a model. */
export function metadataFixture(saved = true) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', status: 'working', pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    onTestFinished(cleanupFakes);
    f.store.state.coordination!.enabled = true;
    const root = f.artifactRoot(job);
    writeFileSync(resolve(job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@11.1.1', scripts: { 'lint:pr': 'node scripts/validate_pr_body.cjs' } }));
    mkdirSync(resolve(job.worktree, 'node_modules'), { recursive: true });
    const pr = { number: 200, html_url: job.prUrl, state: 'open', draft: false, merged_at: null, title: 'fix: release scans', body: 'Closes #5',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: REPOSITORY } }, base: { sha: BASE, ref: 'main', repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const record = job.prMetadataRepair = bindMetadata(f.delivery, job, pr, ['pr-metadata'], 'lead-pr');
    const selected = { title: pr.title, body: '## Summary\nRestore the fixture release scans.\n## Linked issue\nCloses #5\n' };
    const verdict = { outcome: 'repair' as const, findingIds: ['pr-metadata'], evidence: ['Retained successful exact-head fixture checks'], summary: 'Repair only the evidenced metadata', ...selected };
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'metadata-fixture', 'prepare-pr')!;
    const ownership = { complete: true, fresh: true, project: f.store.project.id, key: job.key, ownership: { status: 'clear' } };
    const writes = { patches: 0, land: true, loseResponse: false };
    const links = { urls: [f.issueUrl], more: false };
    const original = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'curl') return JSON.stringify(ownership);
        if (program === 'pnpm') return args[0] === '--version' ? '11.1.1\n' : '';
        if (program === 'gh' && args.includes('PATCH')) {
            writes.patches++;
            if (writes.land) Object.assign(pr, JSON.parse(options!.input!));
            if (writes.loseResponse) throw new Error('gh: HTTP 499 after metadata dispatch');
            return JSON.stringify(pr);
        }
        if (program === 'gh' && args[1]?.includes('/issues/200/comments?')) return '[[]]';
        if (program === 'gh' && args[0] === 'api' && args[1] === 'graphql' && JSON.parse(options!.input!).query.includes('closingIssuesReferences(first:100)'))
            return JSON.stringify({ data: { repository: { pullRequest: { number: 200, headRefOid: pr.head.sha,
                closingIssuesReferences: { nodes: links.urls.map(url => ({ url })), pageInfo: { hasNextPage: links.more } } } } } });
        return original(program, args, options);
    }) as typeof original;
    function nativeAssessment<T = typeof verdict>(result: T = verdict as T, options: { stage?: string; role?: Role; claim?: WorkClaim } = {}) {
        const now = f.store.clock.now().toISOString(), id = randomUUID(), sessionId = randomUUID(), path = resolve(f.store.dataRoot, 'sessions', id);
        mkdirSync(path, { recursive: true });
        const assigned = options.claim || claim, role = options.role || 'lead', stage = options.stage || 'github-pr-metadata-assessment', profile = workerProfile(stage, role !== 'developer');
        const worker: WorkTime = { id, role, task: 'Synthetic metadata assessment', ticket: job.key, stage, requestId: job.id,
            sessionId, provider: role === 'developer' ? 'claude' : 'codex', lane: 'delivery', processId: 2147483646,
            model: 'fixture', effort: 'fixture', status: 'completed', executionStatus: 'completed', claimId: assigned.id,
            startedAt: now, lastHeartbeatAt: now, endedAt: now, elapsedMs: 1, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: now };
        (f.store.state.workLog ??= []).push(worker);
        const raw = JSON.stringify({ session: sessionId, provider: worker.provider, result }), resultSha256 = createHash('sha256').update(raw).digest('hex');
        const resultPath = resolve(path, 'result.json'); writeFileSync(resultPath, raw);
        writeFileSync(resolve(path, 'assignment.json'), JSON.stringify({ id, claimId: assigned.id, work: assigned.work, role, stage: worker.stage, lane: 'delivery', profile: profile.name,
            scope: { repository: REPOSITORY, worktree: job.worktree, artifacts: path } }));
        writeFileSync(resolve(path, 'provider.json'), JSON.stringify({ session: sessionId, role, provider: worker.provider, project: f.store.project.id, repository: REPOSITORY, readOnly: profile.readOnly }));
        writeFileSync(resolve(path, 'capabilities.json'), JSON.stringify(profile));
        writeFileSync(resolve(path, 'assignment-identity.json'), JSON.stringify({ attemptId: id, requestId: job.id, projectId: f.store.project.id, repository: REPOSITORY, role, threadId: sessionId }));
        writeFileSync(resolve(path, 'execution-completion.json'), JSON.stringify({ workerId: id, session: sessionId, provider: worker.provider, resultSha256 }));
        return { worker, resultPath, resultSha256 };
    }
    if (saved) {
        const n = nativeAssessment(); record.assessmentStartedAt = f.store.clock.now().toISOString(); record.assessmentClaimId = claim.id;
        record.scopeSha256 = digest({ issue: { number: f.state.issue.number, title: f.state.issue.title, body: f.state.issue.body || '', labels: f.state.issue.labels || [], assignees: f.state.issue.assignees || [] }, prLabels: [], issueComments: [], prComments: [] });
        record.assessment = { workerId: n.worker.id, claimId: claim.id, sessionId: n.worker.sessionId, resultPath: n.resultPath, resultSha256: n.resultSha256,
            outcome: 'repair', summary: verdict.summary, evidence: verdict.evidence, selected, proposalSha256: digest(selected) };
        record.phase = 'publish';
    }
    const run = <T>(fn: () => T) => withAssignment(claim, 'delivery', fn);
    return { ...f, job, root, pr, record, selected, verdict, claim, ownership, writes, links, nativeAssessment, run };
}

/** An answered human request and PM reply give the linked note delivery-input provenance. */
export function addMetadataHumanInput(f: Pick<ReturnType<typeof metadataFixture>, 'store' | 'job'>) {
    const id = randomUUID(), at = f.store.clock.now().toISOString();
    const request = { id, requestId: '', from: 'human' as const, to: 'pm' as const, ticket: f.job.key, actionId: '',
        body: 'Review the published metadata with this clarified acceptance requirement.', status: 'answered' as const,
        createdAt: at, sessionId: '', recheck: false, error: '', recipients: [], receipts: [] };
    f.store.state.messages.push(request, { ...request, id: randomUUID(), requestId: id, from: 'pm', body: 'Recorded for the next independent review.' });
    f.store.state.projectNotes.push({ id: randomUUID(), ticket: f.job.key, summary: 'Clarified human requirement',
        detail: request.body, requestId: id, createdAt: at });
}

export function originalMetadataFixture() {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed');
    f.job.stage = 'update-base'; f.job.status = 'blocked';
    const old = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'source-fixture', 'update-base')!;
    const result: StageResult = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Source stage cannot write GitHub metadata', blocker: 'Use the exact prepared body through the Office harness',
        evidence: [{ id: 'B3', kind: 'checks', summary: 'Prepared body passes', path: '', commit: f.job.head, environment: 'fixture', observedAt: '', url: '' }],
        findings: [{ id: 'F2', status: 'open', summary: 'PR body missing', expected: 'Prepared body', actual: 'Unpublished', attempts: 3 }],
        resolution: { kind: 'permission', findingIds: ['F2'], evidenceIds: ['B3'], release: null }, receipts: [], paidRuns: 0, approach: null, prerequisites: null, previewUrl: '', qaRunDir: '' };
    const source = f.nativeAssessment(result, { role: 'developer', stage: 'github-update-base', claim: old });
    f.store.finishClaim(old.id, 'completed');
    f.job.steps = [{ stage: 'update-base', result }]; f.job.repairCycle = { attempts: 2, findingAttempts: { F2: 2 }, pendingFindingIds: ['F2'], owner: 'developer', sourceStage: 'lead-pr', sourceHead: f.job.head, phase: 'repair', publishedHead: f.job.head };
    const at = source.worker.endedAt!;
    f.job.parked = { at, stage: 'update-base', published: true, reason: result.blocker };
    f.state.cards[0].status = 'block'; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: f.job.pr, status: 'block' });
    f.job.boardUpdates = f.state.cards.map(card => ({ stage: 'update-base', head: f.job.head, project: 'project', item: card.id, field: 'status', option: 'block', target: 'Block', at, status: 'verified', detail: 'Block verified by read-back.' }));
    const dir = resolve(f.root, 'update-base-checks'); mkdirSync(dir, { recursive: true }); const path = resolve(dir, 'pr-200-body.md'); writeFileSync(path, f.selected.body);
    const intent = { jobId: f.job.id, head: f.job.head, workerId: source.worker.id, parkAt: at, parkSha256: digest(f.job.parked),
        proposal: { path, sha256: artifact(f.store, path).sha256, bytes: Buffer.byteLength(f.selected.body) }, authorization: { reference: 'Synthetic explicit operator command', sha256: digest('fixture authorization') } };
    const request = enqueueMetadataRecovery(f.store, f.job.key, intent); request.status = 'working';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'original-metadata', 'reconcile-pr-metadata')!;
    const verdict = { ...f.verdict, findingIds: ['F2'] };
    const model = vi.spyOn(f.engine.agents, 'run').mockImplementation(async () => { f.nativeAssessment(verdict, { claim }); return verdict as any; });
    const run = () => withAssignment(claim, 'delivery', () => reconcilePRMetadata(f.delivery, request));
    return { ...f, source, intent, request, claim, model, run };
}
