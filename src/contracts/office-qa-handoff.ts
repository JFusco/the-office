import type { StageResult } from '../shared';
export type QAOwnershipProof = {kind:'clear';observedAt:string} |
    {kind:'coordinated';observedAt:string;sessionId:string;contextSha256:string};

/** Explicit protocol handoff; the incomplete legacy attempt is never converted into a pass. */
export interface OfficeQAHandoffInput {
    coordinatorSessionId?: string;
    workerId: string;
    commit: string;
    acknowledgeIncompleteHistory: true;
    setupNote: string;
}
export interface OfficeQAHandoffRequest extends OfficeQAHandoffInput { consumedAt?: string }
export interface OfficeQAHandoff extends OfficeQAHandoffInput {
    ownership?: QAOwnershipProof;
    requestId: string; stage: 'qa' | 'retest'; attempt: number; at: string;
    originalResult: StageResult;
    artifacts: { path: string; sha256: string }[];
}
