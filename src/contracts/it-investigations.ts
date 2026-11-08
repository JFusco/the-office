/** Local operational diagnosis. A model finding never settles the original effect. */
export interface ITInvestigation {
    id: string;
    source: { kind: 'slack' | 'worker'; id: string; requestId: string; ticket: string; failureKind: string; workerIds: string[] };
    status: 'queued' | 'working' | 'diagnosed' | 'blocked' | 'resolved';
    createdAt: string;
    updatedAt: string;
    attempts: number;
    nextAt: string;
    lastError: string;
    report?: { summary: string; cause: 'process' | 'authentication' | 'provider' | 'harness' | 'unknown'; evidence: { ref: string; observation: string }[]; recommendation: string; blocker: string };
    resolution?: { kind?: 'confirmed' | 'superseded'; sourceId: string; at: string; receipt: string };
}
