import type { KnowledgeReference } from '../../../src/contracts/knowledge-retrieval';
import type { LessonReference } from '../../../src/contracts/knowledge';
export const lessonCitation=(r:LessonReference)=>`lesson:${r.scope}:${r.id}@${r.revision}`;
/** Source IDs bind immutable unit versions; Brain IDs bind committed snapshots. */
export const knowledgeCitation=(r:KnowledgeReference)=>r.kind==='lesson'&&r.lesson?lessonCitation(r.lesson):r.id;
