import { createHash } from 'node:crypto';
import { subjectKey, type IncidentSubjectRecord, type RepairSubject } from '../../src/contracts/incidents';

/**
 * One subject exactly as it stood: its key and a digest of which stop this is and how it stood,
 * its episode count and marker, stage, saved stop and head. A repair is for these and no others:
 * a binding for another stop, stage or head of that subject does not match.
 */
export function repairSubject(subject: IncidentSubjectRecord): RepairSubject {
    // The stop's two fields in a fixed order: the same stop is the same digest however its record was written.
    const key = subjectKey(subject), stop = subject.stop ? { kind: subject.stop.kind, at: subject.stop.at } : null;
    return { subject: key, digest: createHash('sha256').update(JSON.stringify([key, subject.episodeCount, subject.episode, subject.stage, stop, subject.head])).digest('hex') };
}
