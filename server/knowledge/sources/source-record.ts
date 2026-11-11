import { z } from 'zod';
import { createHash } from 'node:crypto';
import { publicUrl } from './public-url';

export const SourceInput = z.object({
    kind: z.enum(['artifact', 'link']), title: z.string().trim().min(1).max(160),
    homeProjectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    cadence: z.enum(['daily', 'weekly', 'manual']).default('daily'),
    url: z.string().url().max(2048).transform(value=>new URL(value).href).optional(),
}).strict().superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (s.kind === 'link' && (!s.url || !(()=>{try{return !!publicUrl(s.url,[new URL(s.url).hostname]);}catch{return false;}})())) fail('An allowlisted public HTTPS source URL is required');
    if (s.kind !== 'link' && s.url) fail('Only link sources have a URL');
});
export type SourceInput = z.infer<typeof SourceInput>;
export type KnowledgeSource = SourceInput & {
    id: string; state: 'active' | 'paused' | 'removed' | 'withdrawn'; revision: number;
    sourceDigest: string; createdAt: string; updatedAt: string; refreshRequestedAt?: string;
};
export function sourceIdentity(source: SourceInput): string {
    return source.kind === 'link' ? JSON.stringify(['link', source.homeProjectId, source.url]) : '';
}
export function sourceDigest(s: SourceInput): string {
    // The constant field keeps the digests of sources registered before it was retired.
    return createHash('sha256').update(JSON.stringify({ version: 1, kind: s.kind, destination: 'project-evidence', url: s.url })).digest('hex');
}
