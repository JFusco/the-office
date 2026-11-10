import { z } from 'zod';

export const SlackChannel = z.object({ id: z.string().regex(/^[CG][A-Z0-9]+$/), name: z.string().regex(/^[a-z0-9_-]+$/) }).strict();
export const SlackTools = z.object({ channel: z.string(), thread: z.string(), search: z.string(), file: z.string(), canvas: z.string(), lookup: z.string() }).strict();
export const SlackAppId = z.string().regex(/^[a-zA-Z0-9_-]+$/);
export const SlackWorkspace = z.string().url();
export const PublicHosts = z.array(z.string().regex(/^[a-z0-9.-]+$/));
type Fields = { workspace: string; channels: { id: string; name: string }[]; tools: z.infer<typeof SlackTools> };

/** Shared with the legacy parser: extracting this must not change legacy serialization. */
export function validateSlackFields(c: Fields, ctx: z.RefinementCtx): void {
    if (new Set(c.channels.map(x => x.id)).size !== c.channels.length || new Set(c.channels.map(x => x.name)).size !== c.channels.length) ctx.addIssue({ code: 'custom', message: 'Duplicate intake channel' });
    if (!/^https:\/\/[a-z0-9-]+\.slack\.com$/.test(c.workspace)) ctx.addIssue({ code: 'custom', message: 'Invalid Slack workspace' });
    const expected = { channel: 'slack_read_channel', thread: 'slack_read_thread', search: 'slack_search_public_and_private', file: 'slack_read_file', canvas: 'slack_read_canvas', lookup: 'slack_search_channels' };
    for (const [key, suffix] of Object.entries(expected)) if (!new RegExp('(^|[./_])' + suffix + '$').test(c.tools[key as keyof typeof c.tools]) || !/^[a-zA-Z0-9_/.-]+$/.test(c.tools[key as keyof typeof c.tools])) ctx.addIssue({ code: 'custom', message: 'Unsupported intake tool' });
}

/** Read authority contains no lifecycle, destination or technical Brain domains. */
export const SlackReadAuthority = z.object({
    workspace: SlackWorkspace, appId: SlackAppId, channels: z.array(SlackChannel).length(1), tools: SlackTools, publicHosts: PublicHosts,
}).strict().superRefine(validateSlackFields);
export type SlackReadAuthority = z.infer<typeof SlackReadAuthority>;
