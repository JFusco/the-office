import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { DeliveryRequest, EffectIntent } from '../../../src/shared';
import type { Store } from '../../store/store';
import { rootArtifact } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import { command, processGroupAlive } from '../../workers/process';
import { HOLDS } from '../../office/config';
import { assertOwnership, type OwnershipRead } from '../implementation-continuation/intent';
import { qaRunDirectory } from './run-directory';

/** Consume one explicit, freshly gated resume of an unsealed legacy setup block. No legacy SDK calls. */
export async function continueUnsealedQA(store: Store, request: DeliveryRequest, dataRoot: string, ownership: OwnershipRead,
    execute = command, groupAlive = processGroupAlive) {
    const input = request.officeQAHandoff, ticket = store.ticket(request.key), assignment = currentAssignment();
    const fail = (): never => { throw new Error('QA handoff requires settled unsealed setup history, the same candidate and a fresh explicit decision; preserve all evidence and counters'); };
    if (store.project.provider !== 'azure' || !input || input.consumedAt || request.action !== 'resume-ticket' || request.status !== 'working' ||
        !store.state.deliveryQueue?.includes(request) || !assignment || assignment.lane !== 'delivery' ||
        assignment.claim.work.projectId !== store.project.id || assignment.claim.work.kind !== 'delivery' ||
        assignment.claim.work.id !== request.id || assignment.claim.stage !== 'resume-ticket' ||
        !store.activeClaims().some(c => c.id === assignment.claim.id)) return fail();
    const result = ticket.results[ticket.stage], stage = ticket.stage;
    if (!['qa', 'retest'].includes(stage) || ticket.approach?.validation !== 'browser' || !result || result.qa ||
        ticket.qaProtocol?.[stage] || result.outcome !== 'blocked' || input.commit !== ticket.commit || result.commit !== ticket.commit ||
        input.acknowledgeIncompleteHistory !== true || result.paidRuns !== 0 || result.worktree !== ticket.worktree || result.branch !== ticket.branch ||
        result.receipts.some(r => !r.verified || r.uncertain)) return fail();
    const from = qaRunDirectory(ticket, stage, resolve(dataRoot, 'runs', ticket.runId));
    if (result.qaRunDir !== from) return fail();
    const work = store.state.workLog?.filter(w => w.ticket === ticket.key && w.role === 'qa' && w.stage === stage).at(-1);
    const snapshot = structuredClone({ ticket, input });
    const workSnapshot = structuredClone(work);
    const artifacts: { path: string; sha256: string }[] = [];
    const read = (path: string) => {
        const artifact = rootArtifact(dataRoot, path); artifacts.push({ path, sha256: artifact.sha256 });
        return JSON.parse(readFileSync(path, 'utf8'));
    };
    const current = () => {
        if (!isDeepStrictEqual({ ticket: store.ticket(request.key), input: request.officeQAHandoff }, snapshot) ||
            !isDeepStrictEqual(work, workSnapshot) || !store.activeClaims().some(c => c.id === assignment.claim.id) ||
            store.state.paused || store.state.draining || HOLDS[ticket.key] || !ticket.pilot || ticket.activity !== 'blocked' ||
            ticket.parked && !ticket.parked.resumeRequestedAt || request.status !== 'working' ||
            !store.state.deliveryQueue?.includes(request) || store.state.deliveryQueue.some(r => r.key === ticket.key && r.id !== request.id && ['queued','working'].includes(r.status)) ||
            !work || work.id !== input.workerId || !['completed','blocked'].includes(work.status) || work.executionStatus !== 'completed' || work.failure ||
            !work.processId || groupAlive(work.processId) || !work.claimId || !work.endedAt ||
            !Number.isFinite(Date.parse(work.endedAt)) || !Number.isFinite(Date.parse(request.requestedAt)) || Date.parse(request.requestedAt) <= Date.parse(work.endedAt) ||
            store.activeClaims().some(c => c.id === work.claimId) || store.state.workLog?.some(w => w.ticket === ticket.key && ['running','stopping'].includes(w.status)) ||
            ticket.officeQAHandoffs?.some(h => h.workerId === input.workerId) ||
            existsSync(resolve(from, 'plan.json')) || existsSync(resolve(from, 'final.md'))) return fail();
        // No sealed packets, browser bindings, unfinished calls or execution handoffs may be abandoned here.
        for (const name of ['orchestration','packets','handoffs','tickets','cleanup','calls','leases']) {
            const path = resolve(from, name);
            if (existsSync(path) && readdirSync(path).length) return fail();
        }
        const effects = (store.db.prepare('SELECT body FROM effects').all() as {body:string}[]).map(r => JSON.parse(r.body) as EffectIntent);
        if (effects.some(e => e.work.projectId === store.project.id &&
            ([ticket.runId, `ticket:${ticket.key}`].includes(e.work.id) || e.target === ticket.key || e.authorization === ticket.runId) &&
            !['verified','rejected'].includes(e.status))) return fail();
    };
    current();
    const run = read(resolve(from,'run.json')), report = read(resolve(from,'report.json')), intake = read(resolve(from,'intake.json'));
    if (run.kind !== 'qa-run' || run.run_id !== from.split('/').at(-1) || report.run_id !== run.run_id ||
        report.kind !== 'qa-run-report' || report.status !== 'pending' || report.result_handoff || intake.run_id !== run.run_id) return fail();
    const session = resolve(dataRoot,'sessions',work!.id), saved = read(resolve(session,'result.json'));
    const completion = read(resolve(session,'execution-completion.json')), nativeAssignment = read(resolve(session,'assignment.json'));
    const capabilities = read(resolve(session,'capabilities.json'));
    if (completion.workerId !== work!.id || completion.resultSha256 !== artifacts.find(a => a.path === resolve(session,'result.json'))!.sha256 ||
        completion.provider !== work!.provider || completion.session !== work!.sessionId || saved.provider !== work!.provider || saved.session !== work!.sessionId ||
        nativeAssignment.id !== work!.id || nativeAssignment.claimId !== work!.claimId || nativeAssignment.lane !== 'delivery' ||
        nativeAssignment.work?.projectId !== store.project.id || nativeAssignment.work?.kind !== 'delivery' || nativeAssignment.work?.id !== `ticket:${ticket.key}` ||
        nativeAssignment.stage !== stage || nativeAssignment.role !== 'qa' || nativeAssignment.profile !== 'qa-native' ||
        nativeAssignment.scope?.repository !== store.project.repository || nativeAssignment.scope?.worktree !== ticket.worktree || nativeAssignment.scope?.artifacts !== session ||
        capabilities.name !== 'qa-native' || capabilities.cutover !== 'native' || capabilities.readOnly !== false || saved.result?.qa ||
        saved.result?.receipts?.some((r: {verified:boolean;uncertain:boolean}) => !r.verified || r.uncertain)) return fail();
    for (const key of ['outcome','summary','blocker','commit','worktree','branch','qaRunDir','paidRuns','evidence','findings'] as const)
        if (!isDeepStrictEqual(saved.result?.[key], result[key])) return fail();
    const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work!.claimId!) as {body:string}|undefined;
    const claim = row && JSON.parse(row.body);
    if (!claim || !['completed','blocked'].includes(claim.status) || !Number.isFinite(Date.parse(claim.endedAt)) ||
        Date.parse(request.requestedAt) <= Date.parse(claim.endedAt) || claim.lane !== 'delivery' || claim.stage !== stage ||
        claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || claim.work?.id !== `ticket:${ticket.key}`) return fail();
    await assertOwnership(ticket.key, ownership);
    if ((await execute('git',['rev-parse','HEAD'],{cwd:ticket.worktree,timeout:10000,readOnly:true})).trim() !== ticket.commit ||
        (await execute('git',['status','--porcelain'],{cwd:ticket.worktree,timeout:10000,readOnly:true})).trim()) return fail();
    await assertOwnership(ticket.key, ownership);
    store.transaction(() => {
        current();
        if (artifacts.some(a => rootArtifact(dataRoot,a.path).sha256 !== a.sha256)) return fail();
        const at = store.clock.now().toISOString();
        (ticket.officeQAHandoffs ??= []).push({ ...input, requestId: request.id, stage: stage as 'qa'|'retest', attempt:ticket.attempt,
            at, originalResult:structuredClone(result), artifacts });
        input.consumedAt = at; (ticket.qaProtocol ??= {})[stage] = 'office-v1';
        store.emit('office-qa-handed-off','Incomplete unsealed QA setup retained; one explicit handoff to independent Office QA. No prior acceptance or counter reset.','qa',ticket.key);
    });
}
