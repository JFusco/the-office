import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { CEC, HOLDS } from '../../office/config';
import { assertFeatureGate } from '../../features/enrollment-gate';
import { digest, rootArtifact } from '../../store/readback-evidence';
import { processGroupAlive } from '../../workers/process';
import type { Store } from '../../store/store';
import type { EffectIntent, WorkTime } from '../../../src/shared';

/** A deliberately narrow administrative abandonment: one failed, first implementation timeout. */
export function interruptedImplementation(store: Store, key: string, requestId = '', alive = processGroupAlive) {
    const ticket = store.state.tickets.find(t => t.key === key);
    if (store.project.id !== 'cec' || store.project.provider !== 'azure' || !/^CEC-[1-9][0-9]*$/.test(key) || !ticket ||
        !ticket.pilot || ticket.stage !== 'implement' || ticket.activity !== 'blocked' || ticket.implementationContinuation ||
        ticket.commit || ticket.branch || ticket.worktree || ticket.prId || store.state.paused || store.state.draining || HOLDS[key] ||
        ticket.assignee !== CEC.account || ticket.subtask || !ticket.boardMember || ticket.type === 'Epic' || !ticket.approach)
        throw new Error('A paused first implementation with no admitted candidate is required');
    assertFeatureGate(store, key);
    if (ticket.approach.plan !== 'none' && ticket.results.plan?.outcome !== 'passed' ||
        ticket.approach.plan === 'reviewed' && ticket.results['plan-review']?.outcome !== 'passed')
        throw new Error('The selected plan and independent plan review must already be accepted');
    if (store.state.deliveryQueue?.some(r => r.key === key && r.id !== requestId && ['queued', 'working'].includes(r.status)) ||
        store.state.workLog?.some(w => w.ticket === key && ['running', 'stopping'].includes(w.status)))
        throw new Error('An assignment or request is still active for this ticket');
    const result = ticket.results.implement;
    if (!result || result.outcome !== 'blocked' || result.commit || result.branch || result.worktree || result.prId ||
        result.evidence.length || result.receipts.length !== 1 || !result.receipts[0].uncertain || result.receipts[0].verified ||
        result.receipts[0].action !== 'implement' || result.receipts[0].target !== key || result.paidRuns !== null)
        throw new Error('The exact interrupted implementation result must be retained');
    const workers = (store.state.workLog || []).filter(w => w.ticket === key && w.stage === 'implement');
    const work = workers.at(-1);
    if (!work || workers.length !== 1 || work.role !== 'developer' || work.provider !== 'claude' || work.status !== 'failed' ||
        work.executionStatus || !work.endedAt || !work.startedAt || !work.claimId || !work.processId || alive(work.processId) ||
        work.failure?.category !== 'uncertain-effect' || !work.failure.dispatched || !/^[a-f0-9-]{36}$/.test(work.id) || work.sessionId !== work.id)
        throw new Error('The original failed writer must be positively identified and terminated');
    const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work.claimId) as { body: string } | undefined;
    const claim = row && JSON.parse(row.body);
    if (!claim || claim.status !== 'completed' || !claim.endedAt || claim.stage !== 'implement' || claim.lane !== 'delivery' ||
        claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || claim.work?.id !== `ticket:${key}` ||
        store.activeClaims().some(c => c.work.id === `ticket:${key}`)) throw new Error('Original delivery claim is not settled');
    const attempt = store.db.prepare('SELECT ticket,stage,status,body FROM attempts WHERE id=?').get(result.receipts[0].id) as { ticket: string; stage: string; status: string; body: string } | undefined;
    const savedAttempt = attempt && JSON.parse(attempt.body), { startedAt, endedAt, elapsedMs, ...savedResult } = savedAttempt || {};
    const times = [startedAt, endedAt, work.startedAt, work.endedAt].map(value => Date.parse(value));
    if (!attempt || attempt.ticket !== key || attempt.stage !== 'implement' || attempt.status !== 'blocked' ||
        !times.every(Number.isFinite) || !isDeepStrictEqual(savedResult, result) || times[0] > times[2] || times[1] < times[3])
        throw new Error('Original failed stage attempt does not match its worker');
    const root = resolve(store.dataRoot, 'sessions', work.id);
    const artifacts = ['assignment.json', 'provider.json', 'error.json', 'process-lifecycle.json', 'capabilities.json'].map(name => rootArtifact(store.dataRoot, resolve(root, name)));
    const [assignment, provider, error, lifecycle, capabilities] = artifacts.map(a => JSON.parse(readFileSync(a.path, 'utf8')));
    if (assignment.id !== work.id || assignment.claimId !== work.claimId || assignment.stage !== 'implement' || assignment.role !== 'developer' ||
        assignment.lane !== 'delivery' || !isDeepStrictEqual(assignment.work, claim.work) || assignment.scope?.repository !== store.project.repository || assignment.scope?.artifacts !== root ||
        assignment.profile !== capabilities.name || capabilities.readOnly !== false || capabilities.cutover !== 'native' ||
        provider.project !== store.project.id || provider.repository !== store.project.repository || provider.provider !== 'claude' ||
        provider.session !== work.id || provider.role !== 'developer' || provider.readOnly !== false || error.session !== work.id ||
        error.provider !== 'claude' || error.error !== 'Error: claude timed out; previous action outcome must be reconciled' ||
        lifecycle.processGroup !== work.processId || lifecycle.outcome !== 'failed' || lifecycle.failureCategory !== 'uncertain-effect' ||
        lifecycle.providerTerminalObserved !== false || !lifecycle.events?.some((e: any) => e.phase === 'probe' && e.state === 'absent' && e.errno === 'ESRCH'))
        throw new Error('Original timeout, native artifacts or capability binding changed');
    const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
    const ownCopy = (e: EffectIntent) => !!requestId && e.id === `cec-implementation-copy:${requestId}` &&
        e.operation === 'cec-copy-preserved-implementation' && e.attemptId === requestId && e.authorization === requestId &&
        e.work.kind === 'delivery' && e.work.id === `ticket:${key}` && ['prepared', 'dispatching'].includes(e.status);
    if (effects.some(e => e.work.projectId === store.project.id && !['verified', 'rejected'].includes(e.status) && !ownCopy(e)))
        throw new Error('An unresolved provider operation must be reconciled first');
    const identity = ({ id, ticket, stage, role, provider, sessionId, claimId, processId, startedAt, endedAt, status, failure }: WorkTime) =>
        ({ id, ticket, stage, role, provider, sessionId, claimId, processId, startedAt, endedAt, status, failure });
    const originalDigest = digest({ project: store.project, key, runId: ticket.runId, result, work: identity(work), claim,
        ticketIdentity: { assignee: ticket.assignee, type: ticket.type, subtask: ticket.subtask, boardMember: ticket.boardMember, status: ticket.status, statusId: ticket.statusId },
        attempt: savedAttempt, artifacts: artifacts.map(({ path, sha256 }) => ({ path, sha256 })),
        approach: ticket.approach, featureBinding: ticket.featureBinding, plan: ticket.results.plan, review: ticket.results['plan-review'],
        counters: { attempt: ticket.attempt, repairCycle: ticket.repairCycle, repairAttempts: ticket.repairAttempts } });
    return { ticket, work, result, originalDigest, artifacts };
}
