import type { LearningSubject } from './knowledge';
import type { KnowledgeReference } from './knowledge-retrieval';
export interface KnowledgeLookupResponse {
    assignment: string; index: number; at: string;
    outcome: 'served' | 'unavailable'; text: string; textSha256:string;
    selected: { reference: KnowledgeReference; excerptSha256: string }[];
    snapshot: string | null; technicalStatus: 'available' | 'unavailable';
}
/** Store projection contains hashes and references only. Exact queries/responses stay private. */
export interface KnowledgeLookupSummary {
    recordingUnavailable?:boolean;
    id: string; stage: string; subject?: LearningSubject; at: string; endedAt?: string;
    count: number; digest: string; records: Omit<KnowledgeLookupResponse, 'text'>[];
}
