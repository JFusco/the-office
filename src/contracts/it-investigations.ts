export type OfficeFix = { status: 'proposed'; title: string; changes: { sourceRef: string; change: string }[]; tests: string[]; evidenceRefs: string[] } | { status: 'blocked'; reason: string; owner: string };

/** Local operational diagnosis. A model finding never settles the original effect. */
export interface ITInvestigation {
    retirement?: import('./history-retirement').HistoryRetirement;
    id: string;
    source: { kind: 'slack' | 'worker'; id: string; requestId: string; ticket: string; failureKind: string; workerIds: string[] };
    status: 'queued' | 'working' | 'diagnosed' | 'blocked' | 'resolved';
    createdAt: string;
    updatedAt: string;
    attempts: number;
    nextAt: string;
    lastError: string;
    /** Harness-captured hashes bind later review to the exact diagnosis inputs. */
    reportEvidence?: { ref: string; sha256: string }[];
    evidenceRequeues?: { at: string; afterAttempt: number; evidence: { ref: string; sha256: string }[] }[];
    diagnosisHistory?: { supersededAt: string; report: NonNullable<ITInvestigation['report']>; reportEvidence: { ref: string; sha256: string }[] }[];
    report?: { summary: string; cause: 'process' | 'authentication' | 'provider' | 'harness' | 'unknown'; evidence: { ref: string; observation: string }[]; recommendation: string; blocker: string; officeFix?: OfficeFix };
    resolution?: { kind?: 'confirmed' | 'superseded'; sourceId: string; at: string; receipt: string };
}
