import type { StageResult } from '../shared';

/** Explicit protocol handoff; the incomplete legacy attempt is never converted into a pass. */
export interface OfficeQAHandoffInput {
    workerId: string;
    commit: string;
    acknowledgeIncompleteHistory: true;
    setupNote: string;
}
export interface OfficeQAHandoffRequest extends OfficeQAHandoffInput { consumedAt?: string }
export interface OfficeQAHandoff extends OfficeQAHandoffInput {
    requestId: string; stage: 'qa' | 'retest'; attempt: number; at: string;
    originalResult: StageResult;
    artifacts: { path: string; sha256: string }[];
}
