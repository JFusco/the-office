import { subjectKey, type Incident, type IncidentEvent, type IncidentState, type IncidentSubjectRecord } from '../../../src/contracts/incidents';
import type { RepairWait, WorkRef } from '../../../src/contracts/work';
import type { Store } from '../../store/store';
import { eventId } from '../event-id';
import type { IncidentLedger } from '../incident-ledger';
import { redactEvidence } from '../redact-evidence';
import { repairSubject } from '../subject-digest';
import { REPAIR_WAIT_MS, sameStop, standingStop, waitKey } from './repair-wait';

/** While an incident is in one of these states its repair covers the stops it recorded. */
const COVERING: readonly IncidentState[] = ['fixing', 'shipped', 'deployed'];

export interface RepairWaitEntry { store: Pick<Store, 'project' | 'state' | 'transaction'> }
/** `project/kind/id` of every marker one pass admitted, expired or removed, and of covered subjects that could not be marked. Only what was saved is listed. */
export interface RepairWaitPass { admitted: string[]; expired: string[]; removed: string[]; unmarked: string[] }
interface Covered { incident: Incident; subject: IncidentSubjectRecord; key: string; digest: string; progress: string[] }

/** When the repair moved, oldest first: its start, each fix bound to it, and that fix found in the running release. */
function progressOf(incident: Incident): string[] {
    const repair = incident.repair!, times = [repair.startedAt];
    for (const fix of incident.fixes ?? []) if (fix.boundAt >= repair.startedAt) times.push(fix.boundAt, ...(fix.deployed ? [fix.deployed.at] : []));
    return times.sort();
}

/**
 * The last progress that reached the wait in time, starting from `from`. Progress extends the wait
 * only when it comes within 48 hours of the progress before it; what comes after a gap that long
 * came after the wait had already run out, and does not bring it back.
 */
function lastProgress(from: string, progress: readonly string[]): string {
    let last = from;
    for (const time of progress) {
        if (time <= last) continue;
        if (Date.parse(time) - Date.parse(last) >= REPAIR_WAIT_MS) break;
        last = time;
    }
    return last;
}

const expiryId = (incident: string, repair: string, subject: string) => eventId(incident, 'repair-wait-expired', repair, subject);
const expiryEvent = (project: string, wait: RepairWait): IncidentEvent => ({
    id: expiryId(wait.incident, wait.repair, wait.subject), incident: wait.incident, at: wait.expiredAt!, kind: 'repair-wait-expired',
    body: { repair: wait.repair, project, subject: wait.subject, since: wait.since, progressAt: wait.progressAt },
});

/**
 * Keeps each project's repair-wait markers in step with the ledger. For every incident whose
 * repair is in progress, each subject the repair recorded that the ledger still holds open exactly
 * as recorded, and whose project record stands stopped the same way, has one marker. A marker
 * follows the repair's progress and runs out 48 hours after the last progress that reached it in
 * time; that is recorded once on the incident. An expired wait is never brought back for the same
 * repair and subject: the expired marker is kept while the repair covers the stop, and the
 * recorded expiry is what a marker is rebuilt from if it was removed in between. A marker whose
 * repair or stop the ledger no longer holds is removed, after its expiry, if any, is on record.
 *
 * This is the one place the incident domain writes a project store, and it writes only the
 * marker map, in one transaction per project. Nothing is read or written while `fenced` says so,
 * and the fence is asked again before every write. A subject with no record of its own in a
 * project store, or whose record no longer stands as the ledger last saw it, is not marked.
 */
export function admitRepairWaits(ledger: IncidentLedger, entries: readonly RepairWaitEntry[], now: Date, fenced: () => boolean = () => false, report: (message: string) => void = console.error): RepairWaitPass {
    const pass: RepairWaitPass = { admitted: [], expired: [], removed: [], unmarked: [] };
    if (fenced()) return pass;
    const at = now.toISOString();
    // What the ledger says is covered now, by project.
    const covered = new Map<string, Covered[]>();
    for (const incident of COVERING.flatMap(state => ledger.inState(state))) {
        if (!incident.repair) continue;
        const recorded = new Map(incident.repair.subjects.map(subject => [subject.subject, subject.digest])), progress = progressOf(incident);
        for (const subject of incident.subjects) {
            const key = subjectKey(subject);
            if (subject.status !== 'open' || recorded.get(key) !== repairSubject(subject).digest) continue;
            covered.set(subject.projectId, [...covered.get(subject.projectId) ?? [], { incident, subject, key, digest: recorded.get(key)!, progress }]);
        }
    }
    for (const { store } of entries) {
        const project = store.project.id;
        try {
            const coordination = store.state.coordination, before = coordination?.repairWaits ?? {}, next: Record<string, RepairWait> = {};
            const mine: RepairWaitPass = { admitted: [], expired: [], removed: [], unmarked: [] };
            for (const { incident, subject, key, digest, progress } of covered.get(project) ?? []) {
                const work = { projectId: project, kind: subject.kind as WorkRef['kind'], id: subject.id }, slot = waitKey(work), stands = coordination ? standingStop(store.state, work, subject.stage) : null;
                // The ledger keeps a subject as it last saw it while it cannot see the project; only a record that still stands that way is marked.
                if (!stands || !sameStop(stands, { stage: subject.stage, episode: subject.episode, stop: subject.stop, head: subject.head })) { mine.unmarked.push(key); continue; }
                const repair = incident.repair!, existing = before[slot], same = existing?.incident === incident.id && existing.repair === repair.event && existing.digest === digest;
                let wait: RepairWait;
                if (same) wait = existing.expiredAt ? existing : { ...existing, progressAt: lastProgress(existing.progressAt, progress) };
                else {
                    // An expiry already on record for this repair and subject stands: the marker is rebuilt as expired, not admitted afresh.
                    const past = ledger.event(expiryId(incident.id, repair.event, key)), fresh = { incident: incident.id, repair: repair.event, issue: repair.issue, subject: key, digest, stands };
                    wait = past ? { ...fresh, since: String(past.body.since), progressAt: String(past.body.progressAt), expiredAt: past.at } : { ...fresh, since: at, progressAt: lastProgress(repair.startedAt, progress) };
                    if (!past) mine.admitted.push(key);
                }
                if (!wait.expiredAt && now.getTime() - Date.parse(wait.progressAt) >= REPAIR_WAIT_MS) { wait = { ...wait, expiredAt: at }; mine.expired.push(key); }
                next[slot] = wait;
            }
            for (const [slot, wait] of Object.entries(before)) if (!next[slot]) mine.removed.push(wait.subject);
            // An expiry saved earlier is on record before its marker can be dropped or relied on; if that cannot be written, nothing changes this pass.
            const owed = Object.values(before).filter(wait => wait.expiredAt).map(wait => expiryEvent(project, wait)).filter(event => !ledger.event(event.id));
            if (owed.length) { if (fenced()) return pass; ledger.record({ events: owed, incidents: [] }); }
            if (JSON.stringify(next) !== JSON.stringify(before)) {
                if (fenced()) return pass;
                store.transaction(() => { if (Object.keys(next).length) coordination!.repairWaits = next; else delete coordination!.repairWaits; });
            }
            pass.admitted.push(...mine.admitted); pass.expired.push(...mine.expired); pass.removed.push(...mine.removed); pass.unmarked.push(...mine.unmarked);
            // Recorded from the saved marker, so a pass that stopped between the two writes records the same event the next time.
            const expired = Object.values(next).filter(wait => wait.expiredAt).map(wait => expiryEvent(project, wait)).filter(event => !ledger.event(event.id));
            if (expired.length) { if (fenced()) return pass; ledger.record({ events: expired, incidents: [] }); }
        } catch (error) { report(`Repair waits could not be kept for ${project}: ${redactEvidence(String(error)).slice(0, 300)}`); }
    }
    return pass;
}
