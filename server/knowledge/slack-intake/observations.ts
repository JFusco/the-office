import { nativeReadPayload } from './native-format';
import { readRateLimit } from './rate-limits';
import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
import { digest, type Config } from './config';
import { compareTs, micros } from './timestamps';
import type { Observation, ReadTask, SourceUnit } from './contracts';
const Message = z.object({ ts: z.string(), text: z.string(), thread_ts: z.string().optional(), reply_count: z.number().int().nonnegative().optional(), latest_reply: z.string().optional(), files: z.array(z.object({ id: z.string(), size: z.number().optional() }).passthrough()).optional() }).passthrough();
const Page = z.object({ channel: z.string(), messages: z.array(Message), has_more: z.boolean(), response_metadata: z.object({ next_cursor: z.string() }), truncated: z.literal(false).optional(), format: z.literal('slack-text-v1').optional() }).passthrough();
export class ReadUnavailable extends Error { constructor(readonly code: string) { super(code); } }
/** Inventory and reply search share one provider method, so they share its rate-limit backoff. */
export const readMethod = (config: Config, kind: ReadTask['kind']): string => config.tools[(kind === 'inventory' ? 'search' : kind) as keyof Config['tools']];
/** Harness-owned query scope; the native call must match it exactly. */
export function readArguments(task: ReadTask): Record<string, unknown> {
    if (task.cursor) return { ...readArguments({ ...task, cursor: undefined }), cursor: task.cursor };
    if (task.kind === 'lookup') return { keywords: [task.resource], natural_language_query: '', include_archived: true, channel_types: 'public_channel,private_channel', limit: 20, response_format: 'detailed' };
    if (task.kind === 'inventory') return { keywords: [], filters: `in:<#${task.channel}> type:canvas`, natural_language_query: '', content_types: 'files', limit: 20, include_context: false, sort: 'timestamp', sort_dir: 'desc' };
    if (task.kind === 'search') return { filters: `in:<#${task.channel}> threads:replies`, after: task.oldest, before: task.latest, keywords: [], natural_language_query: '', include_bots: true, include_context: false, sort: 'timestamp', sort_dir: 'desc', content_types: 'messages', limit: 20 };
    if (task.kind === 'file') return { file_id: task.resource };
    if (task.kind === 'canvas') return { canvas_id: task.resource };
    // Zero is the stored unbounded seed start; omit it from the native query, which times out on that sentinel.
    return { channel_id: task.channel, ...(task.oldest === '0.000000' ? {} : { oldest: task.oldest }), latest: task.latest, limit: 100, response_format: 'detailed', ...(task.kind === 'thread' ? { message_ts: task.resource } : {}) };
}
/** Only native completion events establish read evidence; model summaries never do. */
export function observeRead(event: any, config: Config, task: ReadTask, at: string): Observation | undefined {
    const item = event?.item;
    if (event?.type !== 'item.completed' || item?.type !== 'mcp_tool_call') return;
    readRateLimit(item.result);
    const tool = item.tool;
    if (!Object.values(config.tools).includes(tool)) throw new ReadUnavailable('unexpected-tool');
    const args = typeof item.arguments === 'string' ? JSON.parse(item.arguments) : item.arguments;
    if (!args || !item.id || item.status !== 'completed' || item.error || item.result?.isError) throw new ReadUnavailable('provider-read-failed');
    if (tool !== readMethod(config, task.kind)) throw new ReadUnavailable('unexpected-read-kind');
    // Missing, extra or narrowed arguments (keywords, query, content types, cursor) would certify partial coverage.
    if (!isDeepStrictEqual(args, readArguments(task))) throw new ReadUnavailable(`${task.kind}-scope-mismatch`);
    const result = nativeReadPayload(item.result, config, task);
    if (!result) throw new ReadUnavailable('structured-read-evidence-unavailable');
    let units: SourceUnit[], cursor = '', complete = true;
    if (task.kind === 'lookup') {
        const expected = config.channels.find(channel => channel.id === task.channel);
        if (!expected || result.workspace !== config.workspace || !Array.isArray(result.channels) || !result.channels.some((channel: any) => channel.id === expected.id && channel.name === expected.name) || (result.truncated !== false && result.format !== 'slack-text-v1')) throw new ReadUnavailable('channel-identity-unverified');
        units = [];
    } else if (task.kind === 'inventory') {
        if (result.format !== 'slack-text-v1' || !Array.isArray(result.resources)) throw new ReadUnavailable('inventory-evidence-unavailable');
        cursor = result.response_metadata.next_cursor; complete = !result.has_more;
        units = result.resources.map((resource: any) => ({ id: `inventory:${task.channel}:${resource.id}`, channel: task.channel, resource: resource.id, kind: 'inventory', version: digest(resource.text), text: resource.text, url: resource.url, evidence: 'formatted-excerpt', references: [{ kind: 'canvas', id: resource.id }], state: 'no-reusable-lesson', reason: 'inventory-only; canvas body queued separately', requests: [], observedAt: at, attempt: task.attempt }));
    } else if (['channel', 'thread', 'search'].includes(task.kind)) {
        const page = Page.safeParse(result);
        if (!page.success || page.data.channel !== task.channel || page.data.truncated !== false && page.data.format !== 'slack-text-v1') throw new ReadUnavailable('page-evidence-unavailable');
        cursor = page.data.response_metadata.next_cursor; complete = !page.data.has_more;
        if (complete === !!cursor) throw new ReadUnavailable('pagination-inconsistent');
        units = page.data.messages.map(message => {
            micros(message.ts);
            if (!(task.kind === 'thread' && message.ts === task.resource) && (compareTs(message.ts, task.oldest) < 0 || compareTs(message.ts, task.latest) > 0)) throw new ReadUnavailable('source-outside-range');
            const parent = message.thread_ts || message.ts;
            return { evidence: result.format === 'slack-text-v1' ? 'formatted-excerpt' : 'structured', id: `${task.channel}:${message.ts}`, channel: task.channel, resource: message.ts, kind: task.kind, version: digest(JSON.stringify(message)), text: message.text,
                url: `${config.workspace.replace(/\/$/, '')}/archives/${task.channel}/p${message.ts.replace('.', '')}`, ts: message.ts, parent,
                replies: message.reply_count || 0, latestReply: message.latest_reply, references: (message.files || []).map(file => ({ kind: 'file' as const, id: file.id })),
                state: 'pending', reason: '', requests: [], observedAt: at, attempt: task.attempt };
        });
    } else {
        const key = task.kind === 'file' ? 'file_id' : 'canvas_id';
        if (task.kind === 'file' && (typeof result.size !== 'number' || result.size > 10000000)) throw new ReadUnavailable('file-size-unavailable');
        if (args[key] !== task.resource || result.id !== task.resource || typeof result.text !== 'string' || (result.truncated !== false && result.format !== 'slack-text-v1') || typeof result.version !== 'string') throw new ReadUnavailable('resource-evidence-unavailable');
        units = [{ id: `${task.kind}:${task.resource}`, channel: task.channel, resource: task.resource, kind: task.kind, version: result.version, text: result.text, url: task.sourceUrl || '', evidence: result.format === 'slack-text-v1' ? 'formatted-excerpt' : 'structured', references: [], state: result.unavailable ? 'inaccessible' : 'pending', reason: result.unavailable || '', requests: [], observedAt: at, attempt: task.attempt }];
    }
    for (const unit of units) {
        for (const match of unit.text.matchAll(/https:\/\/[^\s<>"\]|)]+/g)) {
            // Incidental malformed tokens (code spans, placeholders) are not references and never fail the page.
            let url: URL; try { url = new URL(match[0]); } catch { continue; }
            const internal = url.origin === config.workspace;
            const canvas = internal && /^\/docs\/T[A-Z0-9]+\/(F[A-Z0-9]+)/.exec(url.pathname);
            const file = internal && /^\/files\/U[A-Z0-9]+\/(F[A-Z0-9]+)/.exec(url.pathname);
            unit.references.push(canvas ? { kind: 'canvas', id: canvas[1], url: url.origin + canvas[0] } : file ? { kind: 'file', id: file[1] } : internal ? { kind: 'internal', id: url.href } : { kind: 'link', id: url.href });
        }
    }
    return { id: item.id, attempt: task.attempt, task: task.id, tool, arguments: args, units, complete, cursor,
        bytes: Buffer.byteLength(JSON.stringify(item.result)), textBytes: units.reduce((n, u) => n + Buffer.byteLength(u.text), 0), at };
}
