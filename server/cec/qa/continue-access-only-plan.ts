import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { Ticket, EffectIntent } from '../../../src/shared';
import type { Store } from '../../store/store';
import { rootArtifact } from '../../store/readback-evidence';
import { command, processGroupAlive } from '../../workers/process';
import { HOLDS, SKILLS } from '../../office/config';
import { isAccessOnlyPlan, settledAccessOnlyState } from './access-only-plan';

function entryExists(path: string): boolean {
    try { lstatSync(path); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

/** After resume's fresh ownership/provider gates. Never modifies or accepts the old QA run. */
export async function continueAccessOnlyPlan(store: Store, ticket: Ticket, dataRoot: string,
    execute = command, groupAlive = processGroupAlive): Promise<boolean> {
    if (!['qa', 'retest'].includes(ticket.stage) || ticket.approach && ticket.approach.validation !== 'browser') return false;
    if (ticket.qaPlanContinuations?.some(item => item.stage === ticket.stage && item.attempt === ticket.attempt)) return false;
    const result = ticket.results[ticket.stage];
    if (!result || result.outcome !== 'blocked') return false;
    const runRoot = resolve(dataRoot, 'runs', ticket.runId);
    const fromRunDir = resolve(runRoot, '.qa', 'runs', `qa-${ticket.stage}-${ticket.attempt}`);
    if (result.qaRunDir !== fromRunDir || !existsSync(resolve(fromRunDir, 'plan.json'))) return false;
    const artifacts: { path: string; sha256: string }[] = [];
    const read = (path: string) => {
        const artifact = rootArtifact(dataRoot, path), bytes = readFileSync(path);
        if (bytes.length > 4 * 1024 * 1024) throw new Error('QA access-plan artifact exceeds the bounded inspection limit');
        artifacts.push({ path, sha256: artifact.sha256 });
        return JSON.parse(bytes.toString('utf8'));
    };
    const plan = read(resolve(fromRunDir, 'plan.json'));
    if (!isAccessOnlyPlan(plan)) return false;
    const fail = () => { throw new Error('Access-only QA plan requires settled native history and a fresh explicit resume; original artifacts and budgets retained'); };
    const stage = ticket.stage as 'qa' | 'retest', state = read(resolve(fromRunDir, 'orchestration/state.json'));
    const intake = read(resolve(fromRunDir, 'intake.json'));
    const toRunDir = `${fromRunDir}-acceptance`;
    const requests = store.state.deliveryQueue?.filter(item => item.key === ticket.key && item.action === 'resume-ticket' && item.status === 'working') || [];
    const request = requests.length === 1 ? requests[0] : undefined;
    const work = store.state.workLog?.filter(item => item.ticket === ticket.key && item.role === 'qa' && item.stage === stage).at(-1);
    const snapshot = JSON.stringify({ stage, attempt: ticket.attempt, commit: ticket.commit, result, repairAttempts: ticket.repairAttempts });
    const current = () => {
        if (store.ticket(ticket.key) !== ticket || store.state.paused || store.state.draining || HOLDS[ticket.key] ||
            !ticket.pilot || ticket.activity !== 'blocked' || !/^[a-f0-9]{40}$/.test(ticket.commit) ||
            !Number.isInteger(ticket.attempt) || ticket.attempt < 1 ||
            ticket.parked && !ticket.parked.resumeRequestedAt || !request || request.status !== 'working' ||
            !store.state.deliveryQueue?.includes(request) || !work || !['completed', 'blocked'].includes(work.status) ||
            work.executionStatus !== 'completed' || work.failure || !work.endedAt || !work.claimId || !work.processId || groupAlive(work.processId) ||
            Date.parse(request.requestedAt) <= Date.parse(work.endedAt) || !Number.isFinite(Date.parse(request.requestedAt)) ||
            !Number.isFinite(Date.parse(work.endedAt)) || store.activeClaims().some(claim => claim.id === work.claimId) ||
            store.state.workLog?.some(item => item.ticket === ticket.key && ['running', 'stopping'].includes(item.status)) ||
            result.commit !== ticket.commit || result.paidRuns !== 0 || result.receipts.some(item => !item.verified || item.uncertain) ||
            JSON.stringify({ stage: ticket.stage, attempt: ticket.attempt, commit: ticket.commit, result: ticket.results[ticket.stage], repairAttempts: ticket.repairAttempts }) !== snapshot ||
            entryExists(toRunDir) || entryExists(resolve(fromRunDir, 'final.md'))) return fail();
        const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
        if (effects.some(effect => effect.work.projectId === store.project.id &&
            [ticket.runId, `ticket:${ticket.key}`].includes(effect.work.id) && !['verified', 'rejected'].includes(effect.status))) return fail();
    };
    current();
    const run = read(resolve(fromRunDir, 'run.json')), report = read(resolve(fromRunDir, 'report.json'));
    if (plan.run_id !== `qa-${stage}-${ticket.attempt}` || !isDeepStrictEqual(intake, plan.contract?.intake) || plan.contract?.target?.build_ref !== ticket.commit ||
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
        !Number.isFinite(Date.parse(claim.endedAt)) || Date.parse(request!.requestedAt) <= Date.parse(claim.endedAt) || claim.lane !== 'delivery' ||
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
        !batch.actions.every((action: any) => action.action_kind === 'input-required' && action.reason_code === 'handoff-required' &&
            ['plan', 'orchestration-state', 'intake'].every(name => action.authority_digests?.some((item: any) => item.name === name &&
                item.path === resolve(fromRunDir, name === 'orchestration-state' ? 'orchestration/state.json' : `${name}.json`) &&
                /^sha256:[a-f0-9]{64}$/.test(item.digest))))) return fail();
    const planDigest = batch.actions[0].authority_digests.find((item: any) => item.name === 'plan').digest;
    if (!settledAccessOnlyState(plan, state, planDigest) || batch.actions.some((action: any) =>
        action.authority_digests.find((item: any) => item.name === 'plan').digest !== planDigest)) return fail();
    await candidate();
    store.transaction(() => {
        current();
        if (artifacts.some(item => rootArtifact(dataRoot, item.path).sha256 !== item.sha256) ||
            ticket.qaPlanContinuations?.some(item => item.stage === stage && item.attempt === ticket.attempt)) return fail();
        (ticket.qaPlanContinuations ??= []).push({ stage, attempt: ticket.attempt, commit: ticket.commit, requestId: request!.id,
            workerId: work!.id, fromRunDir, toRunDir, at: store.clock.now().toISOString(), previousPaidRuns: 0,
            verificationDigest: createHash('sha256').update(JSON.stringify(batch)).digest('hex'), artifacts });
        store.emit('qa-plan-continued', 'Settled access-only QA retained as incomplete history; one fresh acceptance plan is bound to this resume. Original counters and verification gates remain.', 'qa', ticket.key);
    });
    return true;
}
