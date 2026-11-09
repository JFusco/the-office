import { z } from 'zod';
export const LIMITS = { timeout: 1200000, launches: 8, pages: 10, messages: 200, files: 10, links: 25, bytes: 25 * 1024 * 1024, text: 1024 * 1024, fileBytes: 10000000 } as const;
export type ReadKind = 'channel' | 'thread' | 'search' | 'file' | 'canvas' | 'inventory' | 'lookup';
export interface SourceUnit {
    id: string; channel: string; resource: string; kind: ReadKind; version: string; text: string; url: string;
    ts?: string; parent?: string; replies?: number; latestReply?: string;
    evidence?: 'formatted-excerpt' | 'structured';
    /** `internal`: a workspace link this connector cannot dereference; an explicit gap, never a public read. */
    references: { kind: 'file' | 'canvas' | 'link' | 'internal'; id: string; /** Canonical resource permalink when the reference carries one. */ url?: string }[];
    state: 'pending' | 'captured' | 'no-reusable-lesson' | 'deferred' | 'inaccessible' | 'error';
    reason: string; requests: string[]; observedAt: string; attempt: string; week?: string;
}
export interface ReadTask {
    id: string; channel: string; kind: ReadKind; resource: string; oldest: string; latest: string; week: string;
    status: 'pending' | 'running' | 'complete' | 'needs-attention'; failures: number; nextAt: string; createdAt: string;
    attempt: string; ownerClaim: string; error: string; configHash: string; cursor?: string; processing?: string[]; sourceUrl?: string;
}
export interface ChannelProgress { id: string; seedUpperTs: string; enumerated: boolean; through: string; week: string; caughtUp?: boolean; }
export interface Observation {
    id: string; attempt: string; task: string; tool: string; arguments: Record<string, unknown>; units: SourceUnit[];
    complete: boolean; cursor: string; bytes: number; textBytes: number; at: string;
}
export interface Proposal {
    id: string; task: string; domain: string; body: string; hash: string; units: string[]; sourceVersions: string[];
    status: 'pending' | 'captured' | 'unresolved' | 'rejected'; receipt?: CaptureReceipt; predecessor?: string; configHash: string; nextAt?: string;
}
export interface CaptureReceipt {
    found: boolean; requestId: string; id?: string; inputSha256?: string; domain?: string; status?: string; duplicate?: boolean;
}
export const IntakeResult = z.object({
    units: z.array(z.object({ id: z.string(), outcome: z.enum(['proposed', 'no-reusable-lesson', 'deferred', 'inaccessible', 'error']), reason: z.string() }).strict()),
    proposals: z.array(z.object({ domain: z.string(), body: z.string(), units: z.array(z.string()) }).strict()),
}).strict();
export type IntakeResultValue = z.infer<typeof IntakeResult>;
