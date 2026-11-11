/** One version of the claims read from a registered public page. */
export interface SourceUnit {
    id: string; resource: string; kind: 'public-link'; version: string; text: string; url: string;
    state: 'admitted' | 'pending' | 'inaccessible'; reason: string; observedAt: string;
}
/** Bounds for one public read: pages per launch and the worker timeout. */
export const READ_LIMITS = { links: 25, timeout: 1200000 } as const;
