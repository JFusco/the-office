import type { TimeEntry } from '../shared';
export interface ConfirmedSegment {
    startedAt: string;
    endedAt: string;
    durationMs: number;
}
export interface ObservationGap {
    startedAt: string;
    endedAt: string;
    reason: 'heartbeat-gap' | 'clock-change' | 'interrupted';
}
export interface TimePublication {
    id: string;
    provider: 'github' | 'jira';
    key: string;
    status: 'prepared' | 'dispatching' | 'verified' | 'uncertain';
    projectId: string;
    itemId: string;
    fieldId: string;
    worklogId: string;
    baseline: number | null;
    previousValue: number | null;
    intendedValue: number;
    covered: {
        id: string;
        revision: number;
        seconds: number;
    }[];
    payload: unknown;
    createdAt: string;
    detail: string;
}
export interface TimeLedgerState {
    enabled: boolean;
    githubField: boolean;
    activatedAt: string;
    entries: TimeEntry[];
    disabledSince?: string;
    disabledPeriods?: {
        start: string;
        end: string;
    }[];
    baselines?: Record<string, {
        baseline: number;
        lastWritten: number | null;
        itemId: string;
    }>;
    publications?: TimePublication[];
    jiraActivatedAt?: string;
    jiraConnection?: string;
    jiraEnabled?: boolean;
}
export interface SnapshotOrdering {
    serviceInstanceId: string;
    snapshotSequence: number;
}
export interface LiveAnchor {
    receivedAt: number;
    serverTime: string;
    connected: boolean;
    visible: boolean;
    /** Changes on connection invalidation, including a batched reconnect/wake. */
    connectionEpoch?: number;
}
