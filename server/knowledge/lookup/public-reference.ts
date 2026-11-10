import type { KnowledgeReference,KnowledgeSearch } from '../../../src/contracts/knowledge-retrieval';
/** Approved Office text can travel without its original private provenance. */
export function publicReference(reference:KnowledgeReference):KnowledgeReference {
    const {sourceBindings,...result}=reference;void sourceBindings;return result;
}
export function publicSearch(result:KnowledgeSearch):KnowledgeSearch {
    const hits=(list:KnowledgeSearch['office'])=>list.map(hit=>({...hit,reference:publicReference(hit.reference)}));
    return {...result,office:hits(result.office),technical:hits(result.technical)};
}
