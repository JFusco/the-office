import type { Incident, IncidentEvent, IncidentFix } from '../../src/contracts/incidents';
import type { ReleaseIdentity } from '../office/release-identity';
import type { command } from '../workers/process';
import { inHistoryOf } from './commit-ancestry';
import type { CompareMemory } from './deployed-fixes';
import { eventId } from './event-id';
import type { IncidentLedger } from './incident-ledger';
import { nextState } from './transitions';

export interface WithdrawnFixesInput {
    ledger: IncidentLedger;
    /** Read when the pass starts and again before each withdrawal: the receipt can change while GitHub is asked. */
    identity: () => ReleaseIdentity;
    execute: typeof command;
    now: Date;
    /** Shared with the pass that recognises fixes: what GitHub said about a release commit and a fix commit holds for both. */
    memory: CompareMemory;
    /** Comparisons that failed this tick, shared with arrivals so they can be retried on a later tick. */
    failed?: Set<string>;
    /** The most GitHub reads this pass may make. */
    limit: number;
    /** Asked after every GitHub read and before every write; once it says no the pass ends and nothing more is read or recorded. */
    allowed?: () => boolean;
}

/** Incident IDs by what one pass did with them, and how many GitHub reads it made. `waiting`: GitHub gave no plain answer, the pass ran out of reads, or the release changed under it. */
export interface WithdrawnFixes { withdrawn: string[]; kept: string[]; waiting: string[]; reads: number }

const same = (a: ReleaseIdentity, b: ReleaseIdentity) =>
    a.status === 'verified' ? b.status === 'verified' && a.commit === b.commit && a.hash === b.hash && a.operation === b.operation && a.manifestDigest === b.manifestDigest : b.status === 'unknown';

/**
 * Keeps `deployed` true of the release the service runs now. For every `deployed` incident: when
 * the release identity is unknown, or is verified and that release's commit does not contain the
 * incident's fix commit, one `fix-withdrawn` event is recorded, the fix loses its deployment mark
 * and the incident returns to `shipped`. The pass that recognises fixes makes it `deployed` again
 * when a verified release holds the fix, and explains an unknown identity as it does for any
 * shipped incident.
 *
 * A release that still holds the fix records nothing: the release the mark names holds it by the
 * comparison that made the mark, and another verified release is compared once, the answer kept
 * with the rest. A comparison GitHub does not answer plainly withdraws nothing and is asked again
 * on a later pass; reads that keep failing do not keep later incidents waiting.
 */
export async function recordWithdrawnFixes({ ledger, identity, execute, now, memory, failed = new Set<string>(), limit, allowed = () => true }: WithdrawnFixesInput): Promise<WithdrawnFixes> {
    const result: WithdrawnFixes = { withdrawn: [], kept: [], waiting: [], reads: 0 };
    const at = now.toISOString(), served = identity(), deployed = ledger.inState('deployed');
    const first = memory.withdrawnAfter === null ? 0 : deployed.findIndex(incident => incident.id > memory.withdrawnAfter!);
    for (const seen of first > 0 ? [...deployed.slice(first), ...deployed.slice(0, first)] : deployed) {
        const fix = seen.fixes?.at(-1), mark = fix?.deployed;
        if (!fix || !mark) continue;
        if (served.status === 'verified') {
            // The same commit serves again: it holds whatever it held when the mark was made.
            if (served.commit === mark.release.commit) { result.kept.push(seen.id); continue; }
            const key = `${served.commit}:${fix.commit}`;
            if (!memory.answers.has(key)) {
                if (failed.has(key) || result.reads >= limit) { result.waiting.push(seen.id); continue; }
                result.reads += 1;
                memory.withdrawnAfter = seen.id;
                try { memory.answers.set(key, await inHistoryOf(fix.commit, served.commit, execute)); }
                catch { failed.add(key); }
                // The fence may have been taken while GitHub was asked, whatever it answered.
                if (!allowed()) return result;
                if (failed.has(key)) { result.waiting.push(seen.id); continue; }
            }
            if (memory.answers.get(key)) { result.kept.push(seen.id); continue; }
        }
        if (!allowed()) return result;
        // What was read about the release may no longer be the release: nothing is withdrawn on a stale reading.
        if (!same(identity(), served)) { result.waiting.push(seen.id); return result; }
        // Read again: the incident may have changed while GitHub was being asked.
        const incident = ledger.get(seen.id), current = incident?.fixes?.at(-1);
        if (!incident || incident.state !== 'deployed' || !current?.deployed || current.event !== fix.event || current.deployed.event !== mark.event) continue;
        const revision = incident.revision + 1, state = nextState(incident.state, 'fix-withdrawn');
        const reason = served.status === 'unknown' ? 'release-identity-unknown' as const : 'not-in-release' as const;
        const running = served.status === 'unknown' ? { status: served.status, reason: served.reason } : { status: served.status, commit: served.commit, hash: served.hash, operation: served.operation };
        // Named by the mark it withdraws: one arrival is withdrawn once.
        const event: IncidentEvent = {
            id: eventId(incident.id, 'fix-withdrawn', mark.event), incident: incident.id, at, kind: 'fix-withdrawn',
            body: { fix: fix.event, commit: fix.commit, reason, deployed: mark, running, from: incident.state, to: state, revision },
        };
        const { deployed: _, ...unmarked } = current;
        const withdrawn: IncidentFix = { ...unmarked, withdrawn: { event: event.id, reason, release: mark.release, deployedAt: mark.at, at } };
        const next: Incident = { ...incident, state, revision, fixes: [...incident.fixes!.slice(0, -1), withdrawn] };
        ledger.record({ events: [event], incidents: [next] });
        result.withdrawn.push(incident.id);
    }
    return result;
}
