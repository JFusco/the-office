import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { EffectIntent } from '../../../src/shared';
import type { Store } from '../../store/store';
import { rootArtifact } from '../../store/readback-evidence';
import { command, processGroupAlive } from '../../workers/process';
import { HOLDS, SKILLS } from '../../office/config';
import { closedReadonlyPlan } from './closed-readonly-plan';
import { qaRunDirectory } from './run-directory';
import { reviewedPlanGuideDigest } from './reviewed-plan-guidance';
import type { QAPlanRetryProof } from '../../../src/contracts/qa-plan-retry';

function entryExists(path: string): boolean {
    try { lstatSync(path); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

/** Read-only proof for an explicitly abandoned incomplete plan; never advances its public reducer. */
export async function inspectClosedQAPlan(store: Store, key: string, dataRoot: string,
    execute = command, groupAlive = processGroupAlive, allowedRequestId?: string): Promise<QAPlanRetryProof> {
    const ticket = store.ticket(key);
    const fail = (): never => { throw new Error('Incomplete QA history changed or remains owned/uncertain; retain the original plan and counters'); };
    if (store.project.id !== 'cec' || ticket.key !== 'CEC-154') return fail();
    if (!['qa', 'retest'].includes(ticket.stage) || ticket.approach?.validation !== 'browser') return fail();
    const result = ticket.results[ticket.stage];
    if (!result || result.outcome !== 'blocked') return fail();
    const runRoot = resolve(dataRoot, 'runs', ticket.runId);
    const fromRunDir = qaRunDirectory(ticket, ticket.stage, runRoot);
    if (result.qaRunDir !== fromRunDir || !existsSync(resolve(fromRunDir, 'plan.json'))) return fail();
    const artifacts: { path: string; sha256: string }[] = [];
    const read = (path: string) => {
        const artifact = rootArtifact(dataRoot, path), bytes = readFileSync(path);
        if (bytes.length > 4 * 1024 * 1024) throw new Error('QA access-plan artifact exceeds the bounded inspection limit');
        artifacts.push({ path, sha256: artifact.sha256 });
        return JSON.parse(bytes.toString('utf8'));
    };
    const plan = read(resolve(fromRunDir, 'plan.json'));
    const stage = ticket.stage as 'qa' | 'retest', state = read(resolve(fromRunDir, 'orchestration/state.json'));
    const intake = read(resolve(fromRunDir, 'intake.json'));
    const toRunDir = resolve(runRoot, '.qa', 'runs', `qa-${stage}-${ticket.attempt + 1}`);
    const work = store.state.workLog?.filter(item => item.ticket === ticket.key && item.role === 'qa' && item.stage === stage).at(-1);
    const identity = () => ({ branch: ticket.branch, worktree: ticket.worktree, prId: ticket.prId, status: ticket.status, statusId: ticket.statusId, assignee: ticket.assignee });
    const snapshot = JSON.stringify({ ...identity(), stage, attempt: ticket.attempt, commit: ticket.commit, result, repairAttempts: ticket.repairAttempts });
    const current = () => {
        if (store.ticket(ticket.key) !== ticket || store.state.paused || store.state.draining || HOLDS[ticket.key] ||
            !ticket.pilot || ticket.activity !== 'blocked' || !/^[a-f0-9]{40}$/.test(ticket.commit) ||
            !Number.isInteger(ticket.attempt) || ticket.attempt < 1 ||
            ticket.parked && !ticket.parked.resumeRequestedAt ||
            store.state.deliveryQueue?.some(r => r.key === key && ['queued', 'working'].includes(r.status) && r.id !== allowedRequestId) || !work || !['completed', 'blocked'].includes(work.status) ||
            work.executionStatus !== 'completed' || work.failure || !work.endedAt || !work.claimId || !work.processId || groupAlive(work.processId) ||
            !Number.isFinite(Date.parse(work.endedAt)) || Date.parse(work.endedAt) >= store.clock.now().getTime() || store.activeClaims().some(claim => claim.id === work.claimId) ||
            store.state.workLog?.some(item => item.ticket === ticket.key && ['running', 'stopping'].includes(item.status)) ||
            result.commit !== ticket.commit || result.worktree !== ticket.worktree || result.branch !== ticket.branch || result.findings.some(f => f.status !== 'fixed' && f.status !== 'verified') || result.paidRuns !== 0 || result.receipts.some(item => !item.verified || item.uncertain) ||
            JSON.stringify({ ...identity(), stage: ticket.stage, attempt: ticket.attempt, commit: ticket.commit, result: ticket.results[ticket.stage], repairAttempts: ticket.repairAttempts }) !== snapshot ||
            entryExists(toRunDir) || entryExists(resolve(fromRunDir, 'final.md'))) return fail();
        const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
        if (effects.some(effect => effect.work.projectId === store.project.id &&
            [ticket.runId, `ticket:${ticket.key}`].includes(effect.work.id) && !['verified', 'rejected'].includes(effect.status))) return fail();
    };
    current();
    const run = read(resolve(fromRunDir, 'run.json')), report = read(resolve(fromRunDir, 'report.json'));
    if (plan.run_id !== fromRunDir.split('/').at(-1) || !isDeepStrictEqual(intake, plan.contract?.intake) || (plan.contract?.target?.git_sha ?? plan.contract?.target?.build_ref) !== ticket.commit ||
        run.run_id !== plan.run_id || report.run_id !== plan.run_id || report.kind !== 'qa-run-report' || report.status !== 'pending' || report.result_handoff) return fail();
    const sessionRoot = resolve(dataRoot, 'sessions', work!.id);
    const saved = read(resolve(sessionRoot, 'result.json')), completion = read(resolve(sessionRoot, 'execution-completion.json'));
    const assignment = read(resolve(sessionRoot, 'assignment.json')), capabilities = read(resolve(sessionRoot, 'capabilities.json'));
    const resultArtifact = artifacts.find(item => item.path === resolve(sessionRoot, 'result.json'))!;
    if (completion.workerId !== work!.id || completion.resultSha256 !== resultArtifact.sha256 ||
        saved.session !== work!.sessionId || completion.session !== work!.sessionId || saved.provider !== work!.provider || completion.provider !== work!.provider ||
        assignment.id !== work!.id || assignment.claimId !== work!.claimId || assignment.lane !== 'delivery' ||
        assignment.work?.projectId !== store.project.id || assignment.work?.kind !== 'delivery' || assignment.work?.id !== `ticket:${ticket.key}` ||
        assignment.stage !== stage || assignment.role !== 'qa' || assignment.profile !== 'qa-native' ||
        assignment.scope?.repository !== store.project.repository || assignment.scope?.worktree !== ticket.worktree || assignment.scope?.artifacts !== sessionRoot ||
        capabilities.name !== 'qa-native' || capabilities.cutover !== 'native' || capabilities.readOnly !== false) return fail();
    for (const key of ['outcome', 'summary', 'blocker', 'commit', 'worktree', 'branch', 'qaRunDir', 'paidRuns', 'evidence', 'findings'] as const)
        if (!isDeepStrictEqual(saved.result?.[key], result[key])) return fail();
    const claimRow = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work!.claimId!) as { body: string } | undefined;
    const claim = claimRow && JSON.parse(claimRow.body);
    if (!claim || !['completed', 'blocked'].includes(claim.status) || !claim.endedAt ||
        !Number.isFinite(Date.parse(claim.endedAt)) || claim.lane !== 'delivery' ||
        claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || claim.work?.id !== `ticket:${ticket.key}` || claim.stage !== stage) return fail();

    const candidate = async () => {
        if (!ticket.worktree || (await execute('git', ['rev-parse', 'HEAD'], { cwd: ticket.worktree, timeout: 10000, readOnly: true })).trim() !== ticket.commit ||
            (await execute('git', ['status', '--porcelain'], { cwd: ticket.worktree, timeout: 10000, readOnly: true })).trim()) return fail();
    };
    await candidate();

    // The installed public reducer validates native digests and packet/state lineage.
    // Inspect its batch only: never execute its old home-access actions or manufacture a handoff.
    const batch = JSON.parse(await execute('python3', [resolve(SKILLS.qa, 'scripts/qa_harness.py'), 'run-next', '--run-dir', fromRunDir,
        '--evaluated-at', store.clock.now().toISOString()], { cwd: runRoot, timeout: 15000, readOnly: true }));
    if (batch.kind !== 'run-next-batch' || batch.run_id !== plan.run_id || !Array.isArray(batch.actions) || !batch.actions.length ||
        !batch.actions.every((action: any) => action.action_kind === 'command' && action.reason_code === 'orchestration-schedule-required' &&
            ['plan', 'orchestration-state', 'intake'].every(name => action.authority_digests?.some((item: any) => item.name === name &&
                item.path === resolve(fromRunDir, name === 'orchestration-state' ? 'orchestration/state.json' : `${name}.json`) &&
                /^sha256:[a-f0-9]{64}$/.test(item.digest))))) return fail();
    const planDigest = batch.actions[0].authority_digests.find((item: any) => item.name === 'plan').digest;
    if (!closedReadonlyPlan(plan, state, report, planDigest) || batch.actions.some((action: any) =>
        action.authority_digests.find((item: any) => item.name === 'plan').digest !== planDigest)) return fail();
    await candidate();
    current();
    // Bind all public reducer inputs as raw immutable files as well as native digests.
    for (const action of batch.actions) for (const item of action.authority_digests) {
        if (!artifacts.some(file => file.path === item.path)) read(item.path);
    }
    if (artifacts.some(item => rootArtifact(dataRoot, item.path).sha256 !== item.sha256)) return fail();
    const proof = { workerId: work!.id, commit: ticket.commit, stage, attempt: ticket.attempt,
        fromRunDir, toRunDir, guideDigest: reviewedPlanGuideDigest, artifacts };
    return { ...proof, fingerprint: createHash('sha256').update(JSON.stringify({ proof, snapshot, claim, worker: { id: work!.id, claimId: work!.claimId, processId: work!.processId, sessionId: work!.sessionId, endedAt: work!.endedAt, status: work!.status, executionStatus: work!.executionStatus } })).digest('hex') };
}
