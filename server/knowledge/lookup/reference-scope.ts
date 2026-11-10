import type { KnowledgeReference } from '../../../src/contracts/knowledge-retrieval';
import type { KnowledgeContext } from '../context';
import { evidenceRead } from '../sources/evidence-read';
import { exposureSourceVisible, lessonVisible } from '../sources/lesson-visibility';

/** Historical copies retain their original dependencies; a later revision cannot remove that check. */
export function referenceVisible(context: KnowledgeContext, project: string, reference: KnowledgeReference): boolean {
    if (!(reference.sourceBindings || []).every(b=>exposureSourceVisible(context.registry,project,b))) return false;
    if (reference.kind === 'brain') return !!reference.snapshot && /^[a-f0-9]{40}$/.test(reference.snapshot);
    if (reference.kind === 'source') {
        const record=evidenceRead(context,project,reference.id);
        return !!record && record.sourceId===reference.sourceId && record.unitId===reference.unitId && record.version===reference.version && record.contentSha256===reference.contentSha256;
    }
    const knowledge=context.stores.get(project)?.state.knowledge, identity=reference.lesson;
    if (!identity) return false;
    const lesson=[...(knowledge?.lessons||[]),...(knowledge?.officeLessons||[])].find(l=>l.id===identity.id&&l.scope===identity.scope);
    return !!lesson && lessonVisible(context.registry,project,lesson);
}
