import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Store } from '../../store/store';
import { SlackChannel, SlackTools, SlackAppId, SlackWorkspace, PublicHosts, validateSlackFields } from './read-authority';
export const IntakeConfig = z.object({
    seedLaunchesPerDay:z.number().int().min(8).max(32).optional(),
    enabled: z.boolean(), workspace: SlackWorkspace, appId: SlackAppId, tools: SlackTools,
    channels: z.array(SlackChannel).min(1).max(7),
    domains: z.array(z.string().regex(/^[a-z0-9_/-]+$/)).min(1), publicHosts: PublicHosts,
}).strict().superRefine(validateSlackFields);
export type Config = z.infer<typeof IntakeConfig>;
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const configDigest = (c: Config) => digest(JSON.stringify({ ...IntakeConfig.parse(c), enabled: undefined, seedLaunchesPerDay:undefined }));
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
