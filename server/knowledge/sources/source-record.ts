import { z } from 'zod';
import { createHash } from 'node:crypto';
import { SlackReadAuthority } from '../slack-intake/read-authority';
import { publicUrl } from './public-url';

export const SourceInput = z.object({
    kind: z.enum(['slack', 'artifact', 'link']), title: z.string().trim().min(1).max(160),
    homeProjectId: z.string().regex(/^[a-zA-Z0-9_-]+$/), destination: z.enum(['project-evidence', 'technical-brain']).default('project-evidence'),
    cadence: z.enum(['daily', 'weekly', 'manual']).default('daily'),
    authority: SlackReadAuthority.optional(), url: z.string().url().max(2048).transform(value=>new URL(value).href).optional(),
    domains: z.array(z.string().regex(/^[a-z0-9_/-]+$/)).optional(),
}).strict().superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (s.kind === 'slack' && !s.authority) fail('Slack authority is required');
    if (s.kind !== 'slack' && s.authority) fail('Only Slack sources have Slack authority');
    if (s.destination === 'technical-brain' && (s.homeProjectId !== 'brain' || s.kind !== 'slack' || !s.domains?.length)) fail('Technical sources require Brain ownership and domains');
    if (s.destination === 'project-evidence' && s.domains !== undefined) fail('Project evidence cannot carry Brain domains');
    if (s.kind === 'link' && (!s.url || !(()=>{try{return !!publicUrl(s.url,[new URL(s.url).hostname]);}catch{return false;}})())) fail('An allowlisted public HTTPS source URL is required');
    if (s.kind !== 'link' && s.url) fail('Only link sources have a URL');
});
export type SourceInput = z.infer<typeof SourceInput>;
export type KnowledgeSource = SourceInput & {
    id: string; state: 'active' | 'paused' | 'removed' | 'withdrawn'; revision: number;
    sourceDigest: string; createdAt: string; updatedAt: string; refreshRequestedAt?: string;
};
export function sourceIdentity(source: SourceInput): string {
    return source.kind === 'slack' ? JSON.stringify(['slack', source.authority!.workspace, source.authority!.channels[0].id])
        : source.kind === 'link' ? JSON.stringify(['link', source.homeProjectId, source.url]) : '';
}
export function sourceDigest(s: SourceInput): string {
    const a = s.authority;
    return createHash('sha256').update(JSON.stringify({ version: 1, kind: s.kind, destination: s.destination, url: s.url,
        ...(a ? { workspace: a.workspace, channel: a.channels[0], appId: a.appId, toolsetVersion: 1,
            tools: Object.fromEntries(Object.entries(a.tools).sort(([x], [y]) => x.localeCompare(y))), publicHosts: [...new Set(a.publicHosts)].sort() } : {}),
        ...(s.destination === 'technical-brain' ? { domains: [...new Set(s.domains)].sort() } : {}),
    })).digest('hex');
}
