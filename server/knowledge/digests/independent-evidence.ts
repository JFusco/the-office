import type { KnowledgeContext } from '../context';
import type { KnowledgeReference } from '../../../src/contracts/knowledge-retrieval';
import { evidenceRead } from '../sources/evidence-read';

/** Recollected Office messages may remain inspectable, but cannot become new findings. */
export function independentDigestEvidence(context:KnowledgeContext,project:string,references:KnowledgeReference[]):boolean {
    return references.every(reference=>{if(reference.kind!=='source')return true;const record=evidenceRead(context,project,reference.id);return !!record&&record.independent!==false;});
}
