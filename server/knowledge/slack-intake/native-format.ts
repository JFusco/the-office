import { nativeFile } from './native-resource';
import { digest, type Config } from './config';
import type { ReadTask } from './contracts';

interface Message { ts: string; text: string; thread_ts?: string; reply_count?: number; files?: { id: string }[] }
const ts = '\\d{1,12}\\.\\d{1,6}';
function exactly(pattern: RegExp, value: string): RegExpMatchArray {
    const matches = [...value.matchAll(pattern)];
    if (matches.length !== 1) throw Error('ambiguous-native-source');
    return matches[0];
}
function pagination(value: unknown): { has_more: boolean; response_metadata: { next_cursor: string } } {
    if (typeof value !== 'string') throw Error('native-pagination-unavailable');
    const cursor = /^(?:There are more messages(?: available| in this thread)\. To view the next page, use cursor:|For the next page of results use cursor) `([^`\s]+)`\s*$/.exec(value);
    if (cursor) return { has_more: true, response_metadata: { next_cursor: cursor[1] } };
    if (/^(?:There are no more messages(?: available| in this channel| in this thread)?\.|End of results - No more pages available\.)(?:\s|\\n)*$/.test(value)) return { has_more: false, response_metadata: { next_cursor: '' } };
    throw Error('native-pagination-unrecognized');
}
function message(block: string, task: ReadTask): Message {
    const stamp = exactly(new RegExp('^Message TS: (' + ts + ')$', 'gm'), block)[1];
    return { ts: stamp, text: block, ...(task.kind === 'thread' ? { thread_ts: task.resource } : {}),
        reply_count: Number(/^Thread: (\d+) replies/m.exec(block)?.[1] || 0), files: [...block.matchAll(/\(ID: (F[A-Z0-9]+),/g)].map(m => ({ id: m[1] })) };
}
/** Decode only the observed connector's envelope. Source prose remains untrusted evidence. */
export function nativeReadPayload(result: any, config: Config, task: ReadTask): any {
    if (result?.structured_content) return task.kind === 'file' ? nativeFile(result.structured_content, task) : result.structured_content;
    // Kept for injected fixtures and transports that use the MCP spelling.
    if (result?.structuredContent) return result.structuredContent;
    if (!Array.isArray(result?.content) || result.content.length !== 1 || result.content[0]?.type !== 'text') throw Error('native-envelope-unavailable');
    let body: any; try { body = JSON.parse(result.content[0].text); } catch { throw Error('native-envelope-unavailable'); }
    if (task.kind === 'canvas') {
        if (body.canvas_id !== task.resource || typeof body.markdown_content !== 'string' || !body.section_id_mapping || typeof body.section_id_mapping !== 'object') throw Error('native-canvas-unavailable');
        return { id: body.canvas_id, text: body.markdown_content, version: digest(body.markdown_content), format: 'slack-text-v1' };
    }
    const page = pagination(body.pagination_info);
    if (task.kind === 'lookup') {
        const text = body.results;
        if (typeof text !== 'string') throw Error('native-channel-identity-unavailable');
        const expected = config.channels.find(c => c.id === task.channel);
        const blocks = text.split(/^### Result \d+ of \d+\s*$/m).slice(1);
        const match = blocks.find(block => /^Name: #([^\n]+)$/m.exec(block)?.[1] === expected?.name && /^Permalink: \[link\]\(([^)]+)\)$/m.exec(block)?.[1] === `${config.workspace.replace(/\/$/, '')}/archives/${task.channel}`);
        if (!match) throw Error('native-channel-identity-unavailable');
        return { workspace: config.workspace, channels: [{ id: task.channel, name: expected!.name }], format: 'slack-text-v1' };
    }
    if (task.kind === 'inventory') {
        if (typeof body.results !== 'string') throw Error('native-inventory-shape');
        if (body.results === '# Search Results for: \n\nNo results found.\n' && !page.has_more) return { ...page, resources: [], format: 'slack-text-v1' };
        const count = exactly(/^## Files \((\d+) results\)$/gm, body.results)[1];
        const resources = body.results.split(/^### Result \d+ of \d+\s*$/m).slice(1).map((block: string) => {
            const id = exactly(/^File ID: (F[A-Z0-9]+)$/gm, block)[1], url = exactly(/^Permalink: \[link\]\(([^)]+)\)$/gm, block)[1];
            const parsed = new URL(url);
            if (!/^File type: canvas$/m.test(block) || parsed.origin !== config.workspace || !new RegExp('^/docs/T[A-Z0-9]+/' + id + '$').test(parsed.pathname)) throw Error('native-inventory-provenance');
            return { id, url, text: block };
        });
        if (resources.length !== Number(count)) throw Error('native-inventory-count');
        return { ...page, resources, format: 'slack-text-v1' };
    }
    let messages: Message[];
    if (task.kind === 'channel') {
        const text = body.messages;
        if (typeof text !== 'string' || !text.startsWith(`Channel: #${config.channels.find(c => c.id === task.channel)?.name} (${task.channel})\n`)) throw Error('native-channel-scope');
        const blocks = text.split(/^=== Message from [^\n]+ ===\s*$/m).slice(1);
        if (!blocks.length && (page.has_more || text.trim() !== `Channel: #${config.channels.find(c => c.id === task.channel)?.name} (${task.channel})`)) throw Error('native-empty-page-unqualified');
        messages = blocks.map((block: string) => message(block, task));
    } else if (task.kind === 'thread') {
        if (typeof body.messages !== 'string' || !body.messages.startsWith('=== THREAD PARENT MESSAGE ===\n')) throw Error('native-thread-scope');
        const sections = body.messages.split(/^=== THREAD REPLIES \((\d+) total\) ===\s*$/m);
        if (sections.length !== 3) throw Error('native-thread-shape');
        const parent = message(sections[0], task);
        if (parent.ts !== task.resource) throw Error('native-thread-parent');
        const replies = sections[2].split(/^--- Reply \d+ of \d+ ---\s*$/m).slice(1).map((block: string) => message(block, task));
        if (replies.length !== Number(sections[1])) throw Error('native-thread-count');
        messages = [parent, ...replies];
    } else if (task.kind === 'search') {
        if (typeof body.results !== 'string') throw Error('native-search-shape');
        if (body.results === '# Search Results for: \n\nNo results found.\n' && !page.has_more) return { ...page, channel: task.channel, messages: [], format: 'slack-text-v1' };
        const count = exactly(/^## Messages \((\d+) results\)$/gm, body.results)[1];
        messages = body.results.split(/^### Result \d+ of \d+\s*$/m).slice(1).map((block: string) => {
            if (exactly(/^Channel: #[^\n]+ \(ID: ([CG][A-Z0-9]+)\)$/gm, block)[1] !== task.channel) throw Error('native-search-scope');
            const stamp = exactly(new RegExp('^Message_ts: (' + ts + ')$', 'gm'), block)[1];
            const url = new URL(exactly(/^Permalink: \[link\]\(([^)]+)\)$/gm, block)[1]);
            if (url.origin !== config.workspace.replace(/\/$/, '') || url.pathname !== `/archives/${task.channel}/p${stamp.replace('.', '')}`) throw Error('native-search-provenance');
            return { ts: stamp, text: block, thread_ts: url.searchParams.get('thread_ts') || stamp };
        });
        if (messages.length !== Number(count)) throw Error('native-search-count');
    } else throw Error('native-resource-contract-unqualified');
    if (new Set(messages.map(m => m.ts)).size !== messages.length) throw Error('native-duplicate-source');
    return { ...page, channel: task.channel, messages, format: 'slack-text-v1', nativeBodyHash: digest(result.content[0].text) };
}
