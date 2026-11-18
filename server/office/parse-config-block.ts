import { z } from 'zod';

export const TEXT = 'must be a non-empty string';
export const text = z.string({ error: TEXT }).min(1, TEXT);
export const https = (reason: string) => z.string({ error: reason }).refine(value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash; }
    catch { return false; }
}, reason);

/** Parse one project config block, failing with `Project "<id>": <path> <reason>` for its first issue. */
export function parsed<T>(id: string, block: string, schema: z.ZodType<T>, raw: unknown): T {
    const result = schema.safeParse(raw);
    if (result.success) return result.data;
    const issue = result.error.issues[0], path = [block, ...issue.path].join('.');
    const at = issue.path.reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<PropertyKey, unknown>)[key as PropertyKey] : undefined, raw);
    const missing = issue.path.length > 0 && at === undefined;
    throw new Error(`Project "${id}": ${issue.code === 'unrecognized_keys' ? `${path}.${issue.keys[0]} is not supported` : missing ? `${path} is required` : `${path} ${issue.message}`}`);
}
