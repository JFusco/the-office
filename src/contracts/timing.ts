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
    /** `not-landed`: a GitHub hours write read back as never applied; terminal, superseded by a fresh write. */
    status: 'prepared' | 'dispatching' | 'verified' | 'uncertain' | 'not-landed';
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
    /** Which work counts toward hours; see server/telemetry/billable-work.ts. Absent means legacy. */
    scopePolicy?: 'legacy' | 'model-work-v1';
    /** Receipt of the previewed historical correction that moved this ledger to the current scope. */
    scopeCorrection?: { requestId: string; policy: 'model-work-v1'; expectedSha256: string; auditPath: string; changedEntries: number; at: string };
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
