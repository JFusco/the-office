/** Explicit operator disposition, never proof of success or a corrected cause. */
export interface HistoryRetirement {
    kind: 'incomplete-history';
    at: string;
    requestId: string;
    recordSha256: string;
    reason: string;
}
export interface HistoryRetirementIntent {
    acceptIncompleteHistory: true;
    reason: string;
    targets: { kind: 'maintenance' | 'investigation'; id: string; sha256: string }[];
}
