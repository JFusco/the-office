import { z } from 'zod';
import { command } from '../../workers/process';
import { digest } from '../digest';
import { projectById } from '../../office/projects';
const sha = z.string().regex(/^[a-f0-9]{40}$/), hash = z.string().regex(/^[a-f0-9]{64}$/);
const Note = z.object({ id: z.string(), path: z.string(), title: z.string(), contentSha256: hash, summary: z.string().optional(), citations: z.array(z.unknown()).optional(), versions: z.array(z.string()).optional(), freshness: z.unknown().optional(), applicability: z.string().optional(), limitations: z.array(z.string()).optional() });
export type BrainNote = z.infer<typeof Note>;
const GraphNode = z.object({id:z.string().max(2000),title:z.string().max(2000),kind:z.string().max(100),path:z.string().max(500).optional(),sha256:hash.optional(),summary:z.string().max(2000).optional(),domain:z.string().max(200).nullable().optional(),domains:z.array(z.string().max(200)).max(50).optional()});
const GraphPage = z.object({version:z.literal(1),snapshot:sha,nodes:z.array(GraphNode).max(500),edges:z.array(z.object({source:z.string().max(2000),target:z.string().max(2000),relation:z.string().max(500)})).max(1000),truncated:z.boolean(),nextCursor:z.string().max(200).nullable()});
export type BrainGraph = z.infer<typeof GraphPage>;
export interface BrainReader {
    graph?(snapshot:string):Promise<BrainGraph>;
    snapshot(): Promise<string>;
    search(snapshot: string, query: string, limit: number): Promise<BrainNote[]>;
    read(snapshot: string, path: string): Promise<{ text: string; contentSha256: string }>;
}
/** Finite read-only CLI transport, independent of Brain's viewer server. */
export class CommittedBrain implements BrainReader {
    constructor(private repo = projectById('brain').repo, private execute = command) {}
    private async call(args: string[], limit = 512 * 1024): Promise<unknown> {
        const controller = new AbortController(); let bytes = 0;
        const result = await this.execute('node', ['scripts/brain.mjs', ...args], { cwd: this.repo, readOnly: true, timeout: 30000, signal: controller.signal,
            onOutput: (_stream, chunk) => { bytes += Buffer.byteLength(chunk); if (bytes > limit) controller.abort(); } });
        if (bytes > limit || Buffer.byteLength(result) > limit) throw Error('Brain response exceeds its bound');
        return JSON.parse(result);
    }
    async snapshot(): Promise<string> {
        return z.object({ version: z.literal(1), snapshot: sha }).parse(await this.call(['snapshot'])).snapshot;
    }
    async graph(snapshot:string):Promise<BrainGraph> {
        sha.parse(snapshot);
        const page=GraphPage.parse(await this.call(['snapshot','--snapshot',snapshot]));
        if(page.snapshot!==snapshot)throw Error('Brain graph snapshot mismatch');
        return page;
    }
    async search(snapshot: string, query: string, limit: number): Promise<BrainNote[]> {
        sha.parse(snapshot); if (query.length > 2000 || !query.trim() || !Number.isInteger(limit) || limit < 1 || limit > 20) throw Error('Invalid Brain query');
        const response = z.object({ version: z.literal(1), snapshot: sha, results: z.array(Note).max(limit) }).parse(await this.call(['search', '--snapshot', snapshot, '--query', query, '--kind', 'note', '--limit', String(limit)]));
        if (response.snapshot !== snapshot) throw Error('Brain snapshot mismatch');
        return response.results;
    }
    async read(snapshot: string, path: string): Promise<{ text: string; contentSha256: string }> {
        sha.parse(snapshot); if (!/^knowledge\/[a-zA-Z0-9_/-]+\.md$/.test(path) || path.split('/').includes('..')) throw Error('Invalid Brain note path');
        const response = z.object({ version: z.literal(1), snapshot: sha, path: z.string(), text: z.string(), contentSha256: hash }).parse(await this.call(['read', '--snapshot', snapshot, '--path', path]));
        if (response.snapshot !== snapshot || response.path !== path || Buffer.byteLength(response.text) > 256 * 1024 || digest(response.text) !== response.contentSha256) throw Error('Brain committed content mismatch');
        return response;
    }
}
