import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub } from './fake-github';
import { artifact, digest } from '../../../../server/store/readback-evidence';
import { GREEN156 } from '../../../../server/delivery/recovery/green156-authorization';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { enqueueGreen156, admitGreen156 } from '../../../../server/delivery/recovery/green156-admission';
import type { WorkTime } from '../../../../src/shared';

/** Synthetic retained negative reader; no native CLI, login, live provider or historical production bytes. */
export function green156Fixture() {
    const f = fakeGitHub(159), job = f.candidate({ id: GREEN156.job, existingPR: true, pr: 156,
        stage: 'update-base', status: 'interrupted', repairCycle: { owner: 'developer', attempts: 2,
            findingAttempts: { retained: 3 }, pendingFindingIds: ['retained'], sourceStage: 'review', sourceHead: 'a'.repeat(40), phase: 'repair' } });
    job.admission!.jobId = job.id;
    const root = f.artifactRoot(job), at = f.store.clock.now().toISOString();
    const file = (name: string, value: string) => { const path = resolve(root, name); mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, value); return artifact(f.store, path); };
    const native = file('native/original.jsonl', 'Synthetic interrupted native bytes');
    const auditNative = file('audit.jsonl', 'Synthetic negative audit native bytes');
    const original = { id: GREEN156.original, requestId: job.id, claimId: 'original-claim', sessionId: 'original-session',
        ticket: job.key, stage: 'github-update-base', status: 'interrupted' } as WorkTime;
    const audit = { id: 'audit-reader', requestId: job.id, claimId: 'audit-claim', sessionId: 'audit-session', role: 'lead', provider: 'codex',
        stage: 'stopped-base-update-audit', status: 'blocked', executionStatus: 'completed', endedAt: at } as WorkTime;
    (f.store.state.workLog ??= []).push(original, audit);
    const dir = resolve(f.store.dataRoot, 'sessions', audit.id); mkdirSync(dir, { recursive: true });
    const saved = { session: audit.sessionId, result: { outcome: 'blocked', noRepositorySourceOrPublicationMutation: false } };
    writeFileSync(resolve(dir, 'result.json'), JSON.stringify(saved));
    writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: audit.id, session: audit.sessionId,
        provider: audit.provider, resultSha256: digest(saved) }));
    const input = { originalWorkId: original.id, nativeSha256: native.sha256, originalArtifacts: [], rows: [] };
    const inputFile = file('input.json', JSON.stringify(input));
    job.stoppedBaseUpdate = { originalWorkId: original.id, originalSessionId: original.sessionId, originalClaimId: original.claimId!,
        nativePath: native.path, nativeSha256: native.sha256, contextSha256: 'context', providerVersion: 'old-provider', phase: 'audit',
        input: { ...inputFile, inputSha256: digest(input) }, audit: { key: 'one-reservation', state: 'completed', requestId: 'old-request',
            claimId: audit.claimId!, workerId: audit.id, reservedAt: at, completion: { sessionId: audit.sessionId,
                resultPath: resolve(dir, 'result.json'), resultSha256: digest(saved),
                executionCompletionSha256: artifact(f.store, resolve(dir, 'execution-completion.json')).sha256,
                nativePath: auditNative.path, nativeSha256: auditNative.sha256, completedAt: at } } };
    const execute = f.delivery.execute.bind(f.delivery);
    f.delivery.execute = (async (program: string, args: string[], options: any) =>
        program === 'git' && args[0] === 'config' ? args[2] === 'user.name' ? 'Fixture User' : 'fixture@example.test' : execute(program, args, options)) as typeof f.delivery.execute;
    f.state.prs.push({ number: 156, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/156', state: 'open', draft: false, mergeable: true, body: 'Closes #159', head: { sha: GREEN156.head, ref: 'renovate/npm-maintenance' }, base: { ref: 'main', sha: 'b'.repeat(40), repo: { full_name: GREEN156.repository } } });
    f.state.prFiles[156] = ['package.json', 'pnpm-lock.yaml'];
    const enqueue = () => enqueueGreen156(f.store, job.key, original.id);
    const request = enqueue();
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture-owner', request.action, 'delivery')!;
    request.status = 'working';
    return { ...f, job, original, audit, request, claim, native, inputFile, enqueue,
        run: () => withAssignment(claim, 'delivery', () => admitGreen156(f.delivery, request)) };
}
