import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { dismissalRequest } from '../../../server/incidents/dismissal';
import { evidencePacket, PACKET_EVENTS } from '../../../server/incidents/evidence-packet';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent, type ResolvedWrite } from '../../../server/incidents/record-event';
import type { ReleaseIdentity } from '../../../server/office/release-identity';
import type { IncidentCandidate, SourceCitation } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';

export const HASH = '1'.repeat(64);
export const GUARD = 'server/delivery/harness/write-guards.ts', OTHER = 'server/delivery/pipeline/stage-prompts.ts';
export const manifest = (over: Record<string, string> = {}) => Object.entries({ [GUARD]: 'a'.repeat(64), [OTHER]: 'b'.repeat(64), ...over }).map(([path, hash]) => ({ path, hash }));
export const unknownRelease: ReleaseIdentity = { status: 'unknown', reason: 'no deployment has recorded an active release' };
export const REASON = 'the guard is right: the branch is not owned';
export const cite = (path = GUARD, sha256 = 'a'.repeat(64), line?: number): SourceCitation => ({ path, sha256, ...(line ? { line } : {}) });

/** A ledger with one observed incident; `observe` applies another observation of the given candidates. */
export function ledgerOf(dbs: DatabaseSync[], candidates: IncidentCandidate[] = [candidate({ id: 'job-1' }), candidate({ id: 'job-2' })]) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    ledger.record(planSync([], groupCandidates(candidates), AT));
    const id = ledger.list()[0].id;
    // As the production sync does: the incidents with a subject open, and any the new observation names.
    const observe = (next: IncidentCandidate[], minutes: number) => { const observed = groupCandidates(next); ledger.record(planSync(ledger.current(observed.keys()), observed, later(minutes))); };
    const packet = (release: ReleaseIdentity = unknownRelease, loadedHash = HASH) => evidencePacket({ incident: ledger.get(id)!, history: ledger.history(id, PACKET_EVENTS), loadedHash, release });
    /** Dismisses the incident as it stands, the way the route resolves it. */
    const dismiss = (eventId = 'cli-dismiss-1', over: { reason?: string; cited?: SourceCitation[]; packet?: string; revision?: number; files?: Record<string, string>; minutes?: number } = {}) => {
        const write: ResolvedWrite = {
            kind: 'dismissed', request: { kind: 'dismissed', ...dismissalRequest({ reason: over.reason ?? REASON, packet: over.packet ?? packet().digest, cited: over.cited ?? [cite()] }) },
            facts: { loadedHash: HASH, versions: sourceVersions(manifest(over.files)), packet: packet().digest },
        };
        return recordIncidentEvent(ledger, id, eventId, over.revision ?? ledger.get(id)!.revision, write, later(over.minutes ?? 1));
    };
    return { ledger, id, observe, packet, dismiss, saved: () => JSON.stringify([ledger.list(), ledger.events(id)]) };
}
