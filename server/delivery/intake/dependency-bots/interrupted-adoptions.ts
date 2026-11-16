import type { OfficeSnapshot } from '../../../../src/shared';

/**
 * At service start, an adoption still marked in progress was interrupted. Mark it so it is
 * visible at once; the next poll retries it when its PR is still offered for adoption.
 */
export function interruptAdoptions(state: OfficeSnapshot, now: Date): number {
    const interrupted = (state.coordination?.adoptions || []).filter(record => record.status === 'adopting');
    for (const record of interrupted)
        Object.assign(record, { status: 'blocked', detail: `PR #${record.pr} adoption was interrupted by a service restart. The Office retries it on the next poll if the PR is still waiting for adoption; otherwise finish or withdraw it manually.`, at: now.toISOString() });
    return interrupted.length;
}
