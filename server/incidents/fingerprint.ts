import { createHash } from 'node:crypto';
import type { IncidentCause, IncidentSubject } from '../../src/contracts/incidents';

const digest = (parts: unknown[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');

/**
 * The identity of a cause. A cause the harness wrote is the same incident wherever it happens, so
 * the project is left out. Anything else, a model's blocker or text of unknown origin, is
 * identified by its subject, stage and typed cause: its wording is never part of the identity and
 * never groups it with another subject.
 */
export function fingerprint(cause: IncidentCause, subject: Pick<IncidentSubject, 'projectId' | 'kind' | 'id'>): string {
    return cause.author === 'harness'
        ? digest(['harness', cause.source, cause.provider, cause.stage, cause.kind, cause.text])
        : digest(['subject', cause.source, subject.projectId, subject.kind, subject.id, cause.stage, cause.kind]);
}

/** Short enough to type, long enough not to collide in one office. */
export const incidentId = (print: string) => `inc-${print.slice(0, 16)}`;
