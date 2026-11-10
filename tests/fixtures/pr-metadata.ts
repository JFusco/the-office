import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { onTestFinished } from 'vitest';
import { fakeGitHub, cleanupFakes, HEAD, BASE, REPOSITORY } from '../unit/delivery/support/fake-github';
import { bindMetadata } from '../../server/delivery/publication/metadata-context';
import { digest } from '../../server/store/readback-evidence';
import { withAssignment } from '../../server/workers/assignment-context';
import type { WorkTime, WorkClaim, Role } from '../../src/shared';
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
