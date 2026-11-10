import type { KnowledgeReference } from './knowledge-retrieval';
export interface KnowledgeCapture {
    requestId:string;detailCursor:string;source:string;intakeStatus:string;reviewStatus:'pending'|'accepted'|'rejected'|'superseded'|'quarantined'|'unavailable';noteCount:number;
    reviewedAt?:string;acceptance?:{pr:number;url:string;mergeCommit:string};lineage:'mapped'|'unknown'|'unavailable';
    notes:{path:string;url:string;reference:KnowledgeReference}[];
}
export interface KnowledgeCapturePage {captures:KnowledgeCapture[];next:string|null;limitations:string[]}
