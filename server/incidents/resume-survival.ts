import type { Incident } from '../../src/contracts/incidents';

/**
 * How often the cause outlived a resume: a subject that stopped again for the same cause after its
 * earlier stop was acted on has a new episode. The count is the most any one subject shows, because
 * the same stop on several subjects is breadth, not survival.
 */
export function observedResumes(incident: Pick<Incident, 'subjects'>): number {
    return Math.max(0, ...incident.subjects.map(subject => subject.episodeCount - 1));
}
