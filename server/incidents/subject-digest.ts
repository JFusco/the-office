import { createHash } from 'node:crypto';
import { subjectKey, type IncidentSubjectRecord, type RepairSubject } from '../../src/contracts/incidents';

/**
 * One subject exactly as it stood: its key and a digest of which stop this is and how it stood,
 * its episode count and marker, stage, saved stop and head. A repair is for these and no others:
 * a binding for another stop, stage or head of that subject does not match.
 */
export function repairSubject(subject: IncidentSubjectRecord): RepairSubject {
    const key = subjectKey(subject);
    return { subject: key, digest: createHash('sha256').update(JSON.stringify([key, subject.episodeCount, subject.episode, subject.stage, subject.stop, subject.head])).digest('hex') };
}
