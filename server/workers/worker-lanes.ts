import type { ExecutionLane, Role, WorkClaim } from '../../src/shared';
/** Leadership capacity never substitutes for delivery capacity. Free-form advice remains advice. */
export function assertWorkerLane(role: Role, stage: string, readOnly: boolean, assignment?: { lane: ExecutionLane; claim: WorkClaim }) {
    if (role === 'analyst' && (!readOnly || !['feature-research', 'feature-question-round'].includes(stage)))
        throw new Error('Casey is restricted to read-only feature discovery');
    if (role === 'cto' && (!readOnly || !['conversation', 'daily-cto'].includes(stage)))
        throw new Error('CTO capacity is reserved for read-only advice and daily assessment');
    if (role === 'it' && (!readOnly || stage !== 'conversation'))
        throw new Error('IT capacity is reserved for read-only operational assessment');
    if (role === 'knowledge' && (!readOnly || stage !== 'retrospective'))
        throw new Error('Knowledge capacity is reserved for read-only retrospectives');
    if (!assignment) return;
    const expected = role === 'cto' ? 'cto' : role === 'it' ? 'it' : role === 'knowledge' ? 'knowledge' : 'delivery';
    if (assignment.lane !== expected || assignment.claim.lane && assignment.claim.lane !== expected)
        throw new Error('Worker role does not belong to the claimed execution lane');
    if (['cto', 'it'].includes(role) && !['conversation', 'daily-cto'].includes(assignment.claim.work.kind))
        throw new Error('Leadership cannot claim ticket execution work');
    if (role === 'knowledge' && assignment.claim.work.kind !== 'retrospective')
        throw new Error('Knowledge capacity can only claim retrospectives');
}
