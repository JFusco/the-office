import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Store } from '../../store/store';
const ToolNames = z.object({ channel: z.string(), thread: z.string(), search: z.string(), file: z.string(), canvas: z.string(), lookup: z.string() }).strict();
export const IntakeConfig = z.object({
    enabled: z.boolean(), workspace: z.string().url(), appId: z.string().regex(/^[a-zA-Z0-9_-]+$/), tools: ToolNames,
    channels: z.array(z.object({ id: z.string().regex(/^[CG][A-Z0-9]+$/), name: z.string().regex(/^[a-z0-9_-]+$/) }).strict()).min(1).max(7),
    domains: z.array(z.string().regex(/^[a-z0-9_/-]+$/)).min(1), publicHosts: z.array(z.string().regex(/^[a-z0-9.-]+$/)),
}).strict().superRefine((c, ctx) => {
    if (new Set(c.channels.map(x => x.id)).size !== c.channels.length || new Set(c.channels.map(x => x.name)).size !== c.channels.length) ctx.addIssue({ code: 'custom', message: 'Duplicate intake channel' });
    if (!/^https:\/\/[a-z0-9-]+\.slack\.com$/.test(c.workspace)) ctx.addIssue({ code: 'custom', message: 'Invalid Slack workspace' });
    const expected = { channel: 'slack_read_channel', thread: 'slack_read_thread', search: 'slack_search_public_and_private', file: 'slack_read_file', canvas: 'slack_read_canvas', lookup: 'slack_search_channels' };
    for (const [key, suffix] of Object.entries(expected)) if (!new RegExp('(^|[./_])' + suffix + '$').test(c.tools[key as keyof typeof c.tools]) || !/^[a-zA-Z0-9_/.-]+$/.test(c.tools[key as keyof typeof c.tools])) ctx.addIssue({ code: 'custom', message: 'Unsupported intake tool' });
});
export type Config = z.infer<typeof IntakeConfig>;
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const configDigest = (c: Config) => digest(JSON.stringify({ ...IntakeConfig.parse(c), enabled: undefined }));
export function privateFile(store: Pick<Store, 'dataRoot'>, relative: string): string {
    if (!/^[a-zA-Z0-9/_.-]+$/.test(relative) || relative.split('/').some(x => x === '..' || !x)) throw Error('Invalid intake artifact path');
    const root = realpathSync(store.dataRoot), target = resolve(root, 'slack-intake', relative);
    let current = root;
    for (const part of ['slack-intake', ...relative.split('/')]) {
        current = resolve(current, part);
        if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw Error('Intake artifact symlink refused');
    }
    return target;
}
export function readConfig(store: Store): Config | undefined {
    if (store.project.id !== 'brain') return;
    const path = privateFile(store, 'config.json');
    if (!existsSync(path)) return;
    if (lstatSync(path).mode & 0o077) throw Error('Intake config requires private permissions');
    try { return IntakeConfig.parse(JSON.parse(readFileSync(path, 'utf8'))); }
    catch { throw Error('Invalid private intake configuration'); }
}
