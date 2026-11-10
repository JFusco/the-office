import type { LessonExposure } from './knowledge';
import type { KnowledgeLookupResponse } from './knowledge-lookups';
export interface KnowledgeAssignment {
    lookupRecordingUnavailable?:boolean;
    id:string; stage:string; supplied:LessonExposure & {lessonText:string;sourceEvidenceText:string};
    lookups:Pick<KnowledgeLookupResponse,'index'|'at'|'outcome'>[];
    lookup?:{query:string;response:KnowledgeLookupResponse};
    outcomes:import('./knowledge-outcomes').KnowledgeOutcome[];
}
