import { isDeepStrictEqual } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../store/store';
import { rootArtifact } from '../store/readback-evidence';
import { processGroupAlive } from '../workers/process';
import { readerAnalysisReference } from '../workers/reader-analysis';
import { advance, resultGate } from './workflow';
import type { Ticket, EffectIntent } from '../../src/shared';

export const MISSING_SAVED_PLAN = 'Saved implementation plan is required';
/** Called only after resume's fresh provider/ownership readback. Never reruns the plan worker. */
export function recoverSavedPlan(store: Store, ticket: Ticket, dataRoot: string, groupAlive = processGroupAlive): boolean {
    if (ticket.stage !== 'plan') return false;
    // A preceding ownership/provider read-back may have replaced the visible
    // blocker. The unchanged accepted result, not that presentation string,
    // determines whether the original saved-plan repair is still required.
    const missingReference = ticket.results.plan?.outcome === 'passed' &&
        resultGate(ticket, 'plan', ticket.results.plan, resolve(dataRoot, 'runs', ticket.runId)) === MISSING_SAVED_PLAN;
    if (ticket.blocker !== MISSING_SAVED_PLAN && !ticket.savedPlanRecoveryFailure && !missingReference) return false;
    try { store.transaction(() => {
        const fail = () => { throw new Error('Saved plan needs Office artifact reconciliation; original result and counters retained'); };
        if (store.ticket(ticket.key) !== ticket) return fail();
        const result = ticket.results.plan;
        if (!ticket.pilot || ticket.activity !== 'blocked' || ticket.savedPlanRecovery || !result || result.outcome !== 'passed' ||
            ticket.commit || ticket.branch || ticket.worktree || ticket.prId || result.commit || result.branch || result.worktree || result.prId ||
            Object.values(ticket.results).some(item => item?.receipts.some(receipt => !receipt.verified || receipt.uncertain))) return fail();
        const workers = (store.state.workLog || []).filter(work => work.ticket === ticket.key && work.stage === 'plan');
        const work = workers.at(-1);
        if (!work || work.status !== 'completed' || work.executionStatus !== 'completed' || !work.endedAt || !work.claimId ||
            !work.processId || groupAlive(work.processId) || store.activeClaims().some(claim => claim.id === work.claimId) ||
            store.state.workLog?.some(item => item.ticket === ticket.key && ['running', 'stopping'].includes(item.status))) return fail();
        const claimRow = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work.claimId) as { body: string } | undefined;
        const claim = claimRow && JSON.parse(claimRow.body);
        if (!claim || claim.status !== 'completed' || !claim.endedAt || claim.lane !== 'delivery' || claim.work?.kind !== 'delivery' || claim.work?.projectId !== store.project.id || claim.work?.id !== `ticket:${ticket.key}` || claim.stage !== 'plan') return fail();
        const runRoot = resolve(dataRoot, 'runs', ticket.runId), sessionRoot = resolve(dataRoot, 'sessions', work.id);
        const path = resolve(runRoot, `${work.id}-analysis.md`), resultPath = resolve(sessionRoot, 'result.json');
        const files = [path, resultPath, resolve(sessionRoot, 'assignment.json'), resolve(sessionRoot, 'execution-completion.json'), resolve(sessionRoot, 'capabilities.json')].map(file => rootArtifact(dataRoot, file));
        const read = (file: string) => JSON.parse(readFileSync(resolve(sessionRoot, file), 'utf8'));
        const saved = read('result.json'), assignment = read('assignment.json'), completion = read('execution-completion.json'), capabilities = read('capabilities.json');
        if (!isDeepStrictEqual(saved.result, result) || completion.resultSha256 !== files[1].sha256 || completion.workerId !== work.id ||
            saved.session !== work.sessionId || completion.session !== work.sessionId || saved.provider !== work.provider || completion.provider !== work.provider ||
            assignment.id !== work.id || assignment.claimId !== work.claimId || assignment.lane !== 'delivery' || assignment.work?.projectId !== store.project.id ||
            assignment.work?.kind !== 'delivery' || assignment.work?.id !== `ticket:${ticket.key}` || assignment.stage !== 'plan' || assignment.role !== 'developer' ||
            assignment.profile !== 'reader' || assignment.scope?.repository !== store.project.repository || assignment.scope?.worktree !== runRoot || assignment.scope?.artifacts !== sessionRoot ||
            capabilities.name !== 'reader' || capabilities.readOnly !== true || capabilities.cutover !== 'verified' ||
            readFileSync(path, 'utf8') !== result.summary) return fail();
        const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
        if (effects.some(effect => effect.work.projectId === store.project.id && [ticket.runId, `ticket:${ticket.key}`].includes(effect.work.id) && !['verified', 'rejected'].includes(effect.status))) return fail();
        const linked = structuredClone(result);
        linked.evidence.push(readerAnalysisReference(work.id, path, store.clock.now().toISOString()));
        if (resultGate(ticket, 'plan', linked, runRoot)) return fail();
        ticket.savedPlanRecovery = { workerId: work.id, resultPath, resultSha256: files[1].sha256, analysisPath: path, analysisSha256: files[0].sha256, at: store.clock.now().toISOString() };
        delete ticket.savedPlanRecoveryFailure;
        advance(ticket, 'plan', linked);
        if (ticket.results['plan-review']?.outcome === 'failed') ticket.stage = 'plan-review';
        store.emit('saved-plan-reconciled', 'Original saved plan linked after exact worker/result read-back; selected review and delivery gates remain. No plan rerun or counter reset.', 'pm', ticket.key);
    }); } catch (error) {
        // A missing/mismatched artifact must remain this recovery class on future resumes,
        // even when the delivery request records a different error string. Never fall back to replanning.
        store.transaction(() => { store.ticket(ticket.key).savedPlanRecoveryFailure = { at: store.clock.now().toISOString(), detail: 'Original saved-plan binding remains unverified. Office artifact reconciliation required; do not rerun the plan.' }; });
        throw error;
    }
    return true;
}
