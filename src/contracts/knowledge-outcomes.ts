import type { LearningSubject,LessonReference,KnowledgeSourceBinding } from './knowledge';
import type { KnowledgeReference } from './knowledge-retrieval';
/** An accepted result cited these exact supplied/retrieved identities; semantic application stays unknown. */
export interface KnowledgeOutcome {
    id:string; eventId:string; assignmentId:string; subject:LearningSubject; stage:string; at:string; resultSha256:string;
    lessons:LessonReference[]; evidence:KnowledgeReference[]; sourceBindings:KnowledgeSourceBinding[];
}
