import type { KnowledgeReference } from '../../../src/contracts/knowledge-retrieval';
import type { KnowledgeContext } from '../context';

/** A retained copy is delivered only for a pinned Brain revision or a lesson the project still holds. */
export function referenceVisible(context: KnowledgeContext, project: string, reference: KnowledgeReference): boolean {
    if (reference.kind === 'brain') return !!reference.snapshot && /^[a-f0-9]{40}$/.test(reference.snapshot);
    const knowledge=context.stores.get(project)?.state.knowledge, identity=reference.lesson;
    return !!identity && [...(knowledge?.lessons||[]),...(knowledge?.officeLessons||[])].some(l=>l.id===identity.id&&l.scope===identity.scope);
}
