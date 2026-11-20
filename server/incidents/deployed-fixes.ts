import type { Incident, IncidentEvent } from '../../src/contracts/incidents';
import type { ReleaseIdentity } from '../office/release-identity';
import type { command } from '../workers/process';
import { inHistoryOf } from './commit-ancestry';
import { eventId } from './event-id';
import type { IncidentLedger } from './incident-ledger';
import { nextState } from './transitions';

/**
 * What is kept between passes. `answers`: what GitHub said for a release commit and a fix commit;
 * a commit's history never changes, so an answer holds for the life of the process. `resumeAfter`:
 * the incident the last GitHub read was for, so the next pass asks about the ones after it first
 * and reads that keep failing cannot keep later incidents waiting.
 */
export interface CompareMemory { answers: Map<string, boolean>; resumeAfter: string | null }
export const compareMemory = (): CompareMemory => ({ answers: new Map(), resumeAfter: null });

/** The most GitHub reads one pass makes; the rest wait for the next pass. */
export const COMPARES_PER_PASS = 10;

export interface DeployedFixesInput {
    ledger: IncidentLedger;
    /** Read when the pass starts and again before each fix is marked deployed: the receipt can change while GitHub is asked. */
    identity: () => ReleaseIdentity;
    /** The hash loaded at start-up: what an unknown identity is recorded against. */
    loadedHash: string;
    execute: typeof command;
    now: Date;
    memory: CompareMemory;
    /** Asked after every GitHub read and before every write; once it says no the pass ends and nothing more is read or recorded. */
    allowed?: () => boolean;
}

/** Incident IDs by what one pass did with them. `waiting`: GitHub gave no plain answer, the pass ran out of reads, or the release changed under it. */
export interface DeployedFixes { deployed: string[]; unknown: string[]; absent: string[]; waiting: string[] }

const sameRelease = (a: ReleaseIdentity, b: Extract<ReleaseIdentity, { status: 'verified' }>) =>
    a.status === 'verified' && a.commit === b.commit && a.hash === b.hash && a.operation === b.operation && a.manifestDigest === b.manifestDigest;

/**
 * Recognises bound fixes in the release the service runs. For every `shipped` incident: when the
 * release identity is verified and the release commit contains the incident's fix commit, one
 * `fix-deployed` event is recorded and the incident becomes `deployed`. When the identity is
 * unknown, one `release-identity-unknown` event per incident, fix and loaded hash explains why,
 * and nothing is marked live. A release that does not hold the fix records nothing.
 *
 * A merge or a binding never makes a fix live; only this comparison does. It reads GitHub at most
 * once per release and fix commit, and only for incidents that are `shipped`.
 */
export async function recordDeployedFixes({ ledger, identity, loadedHash, execute, now, memory, allowed = () => true }: DeployedFixesInput): Promise<DeployedFixes> {
    const result: DeployedFixes = { deployed: [], unknown: [], absent: [], waiting: [] };
    const at = now.toISOString(), served = identity(), shipped = ledger.inState('shipped');
    const first = memory.resumeAfter === null ? 0 : shipped.findIndex(incident => incident.id > memory.resumeAfter!);
    const failed = new Set<string>();
    let reads = 0;
    for (const seen of first > 0 ? [...shipped.slice(first), ...shipped.slice(0, first)] : shipped) {
        const fix = seen.fixes?.at(-1);
        if (!fix?.onMain) continue;
        if (served.status === 'unknown') {
            const id = eventId(seen.id, 'release-identity-unknown', fix.event, loadedHash);
            if (!ledger.event(id)) {
                if (!allowed()) return result;
                ledger.record({ events: [{ id, incident: seen.id, at, kind: 'release-identity-unknown', body: { fix: fix.event, commit: fix.commit, loadedHash, reason: served.reason } }], incidents: [] });
            }
            result.unknown.push(seen.id);
            continue;
        }
        const key = `${served.commit}:${fix.commit}`;
        if (!memory.answers.has(key)) {
            if (failed.has(key) || reads >= COMPARES_PER_PASS) { result.waiting.push(seen.id); continue; }
            reads += 1;
            memory.resumeAfter = seen.id;
            try { memory.answers.set(key, await inHistoryOf(fix.commit, served.commit, execute)); }
            catch { failed.add(key); }
            // The fence may have been taken while GitHub was asked, whatever it answered.
            if (!allowed()) return result;
            if (failed.has(key)) { result.waiting.push(seen.id); continue; }
        }
        if (!memory.answers.get(key)) { result.absent.push(seen.id); continue; }
        if (!allowed()) return result;
        // The answer about the two commits stands; the receipt that names the release may not.
        if (!sameRelease(identity(), served)) { result.waiting.push(seen.id); return result; }
        // Read again: the incident may have changed while GitHub was being asked.
        const incident = ledger.get(seen.id), current = incident?.fixes?.at(-1);
        if (!incident || incident.state !== 'shipped' || !current || current.event !== fix.event || current.commit !== fix.commit) continue;
        const revision = incident.revision + 1, release = { commit: served.commit, hash: served.hash, operation: served.operation, activatedAt: served.activatedAt };
        const event: IncidentEvent = {
            id: eventId(incident.id, 'fix-deployed', fix.event), incident: incident.id, at, kind: 'fix-deployed',
            body: { fix: fix.event, commit: fix.commit, release, from: incident.state, to: nextState(incident.state, 'fix-deployed'), revision },
        };
        const next: Incident = {
            ...incident, state: nextState(incident.state, 'fix-deployed'), revision,
            fixes: [...incident.fixes!.slice(0, -1), { ...current, deployed: { event: event.id, release, at } }],
        };
        ledger.record({ events: [event], incidents: [next] });
        result.deployed.push(incident.id);
    }
    return result;
}
