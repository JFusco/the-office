import type { Store } from '../../store/store';
import type { SourceRegistry } from './registry';
import { assignmentSubject } from '../lesson-exposure';
import { revokedSubjects } from './retained-scope';

/** Retained source-derived work cannot carry revoked bytes into another provider invocation. */
export function assertRetainedDispatchScope(store: Store, registry: SourceRegistry, requestId?: string, ticket?: string, featureId?: string): void {
    const subject = assignmentSubject(store, requestId, ticket, featureId);
    if (subject && revokedSubjects(registry, store.project.id, store.state).some(s => s.kind === subject.kind && s.id === subject.id))
        throw Error('Retained assignment evidence is unavailable because source access changed');
}
