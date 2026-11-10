import type { LearningSubject } from '../../../src/contracts/knowledge';
import type { OfficeSnapshot } from '../../../src/shared';
import type { SourceRegistry } from './registry';
import { proofAuthorized,proofBindings } from './proof-scope';
import { exposureSourceVisible } from './lesson-visibility';
import { exposureBindings } from '../lookup/exposure-bindings';

/** A lookup can add private dependencies after the immutable original exposure was written. */
export function deniedAssignments(registry: SourceRegistry, project: string, state: OfficeSnapshot, officeWide = false): string[] {
    const denied: string[] = [];
    for (const exposure of state.knowledge?.exposures || []) {
        const bindings = exposureBindings(state.knowledge,exposure);
        if (bindings.some(b => officeWide&&!b.approvedTextOnly || !exposureSourceVisible(registry, project, b))) denied.push(exposure.id);
    }
    return denied;
}
export function revokedSubjects(registry: SourceRegistry, project: string, state: OfficeSnapshot, officeWide = false): LearningSubject[] {
    const denied = new Set(deniedAssignments(registry, project, state, officeWide));
    const subjects = (state.knowledge?.exposures || []).filter(e => denied.has(e.id) && e.subject).map(e => e.subject!);
    for (const pending of state.knowledge?.pending || []) for (const event of pending.opportunities || [])
        if (event.evidence.some(proof => officeWide ? proofBindings(proof).some(b=>!b.approvedTextOnly||!exposureSourceVisible(registry,project,b)) : !proofAuthorized(registry, project, proof))) subjects.push(event.subject);
    return [...new Map(subjects.map(subject => [`${subject.kind}:${subject.id}`, subject])).values()];
}
