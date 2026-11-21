import { createHash } from 'node:crypto';
import type { HarnessRequest } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';

/**
 * What one resume is: this subject, for this fix of this incident. A digest, because it is saved
 * in a project's state and matched again after a restart, and every string saved there passes
 * the credential redaction: an event ID a person chose, such as `cookie:fix-421`, comes back
 * changed, and two such IDs can come back the same. A digest comes back as it went in.
 */
export function resumeIdentity(incident: string, subject: string, fix: string): string {
    return createHash('sha256').update(JSON.stringify([incident, subject, fix])).digest('hex');
}

/**
 * The request a project queued for this resume, or undefined. Whatever became of that request,
 * it is the one resume the fix gets: a blocked or completed one counts as much as a queued one.
 * The project's own store is the authority; the incident ledger only records the admission
 * afterwards.
 */
export function boundResume(state: OfficeSnapshot, identity: string): HarnessRequest | undefined {
    return state.coordination?.requests?.find(request => request.repairResume?.id === identity);
}
