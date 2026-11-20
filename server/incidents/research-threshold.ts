import type { Incident } from '../../src/contracts/incidents';
import { observedResumes } from './resume-survival';

export const RESEARCH_AFTER = { resumes: 2, subjects: 3, projects: 2, openMs: 24 * 60 * 60 * 1000 };

/**
 * Why an incident may now be investigated, or null. A stop nobody has explained is eligible at
 * once. Expected waits become eligible only when they outlast a threshold: one survived two
 * resumes, three subjects or two projects wait at once, or one has stood for 24 hours. Eligibility
 * permits investigation; it does not lift the hold, decision or wait itself.
 */
export function researchReason(incident: Pick<Incident, 'expected' | 'subjects'>, now: Date): string | null {
    const open = incident.subjects.filter(subject => subject.status === 'open');
    if (!open.length) return null;
    if (open.some(subject => !subject.expected)) return 'no recorded explanation for the stop';
    const wait = incident.expected ?? 'expected wait', resumes = observedResumes({ subjects: open }), projects = new Set(open.map(subject => subject.projectId)).size;
    if (resumes >= RESEARCH_AFTER.resumes) return `the ${wait} came back after ${resumes} resumes`;
    if (open.length >= RESEARCH_AFTER.subjects) return `${open.length} subjects wait on the same ${wait}`;
    if (projects >= RESEARCH_AFTER.projects) return `${projects} projects wait on the same ${wait}`;
    const oldest = Math.min(...open.map(subject => Date.parse(subject.openedAt)));
    if (now.getTime() - oldest >= RESEARCH_AFTER.openMs) return `the ${wait} has stood for 24 hours`;
    return null;
}
