import { readFile, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve, sep } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import type { LiveSession } from './session-bridge';
import { sessionScope, type SessionContext } from './session-scope';

type Project = Pick<OfficeProject, 'id' | 'repo' | 'repository'>;
type Reader = (path: string) => Promise<{ raw: string; version: string }>;
async function readRollout(path: string) {
    const root = await realpath(resolve(homedir(), '.codex/sessions')), file = await realpath(path), info = await stat(file);
    if (!file.startsWith(root + sep) || !file.endsWith('.jsonl') || !info.isFile() || info.size > 64 * 1024 * 1024)
        throw new Error('Codex session context coverage is unavailable');
    return { raw: await readFile(file, 'utf8'), version: `${info.size}:${info.mtimeMs}` };
}

/** Read context only for positively loaded identities; never search or resume historical chats. */
export async function codexSessionContext(sessions: LiveSession[], projects: Project[], read: Reader = readRollout): Promise<LiveSession[]> {
    const enriched: LiveSession[] = [];
    for (const session of sessions) {
        if (session.provider !== 'codex' || !session.rolloutPath) { enriched.push(session); continue; }
        const { raw } = await read(session.rolloutPath);
        const context: SessionContext = sessionScope(raw, session.id, projects);
        enriched.push({ ...session, context,
            source: session.status === 'loaded' && context.activity !== 'unknown' ? 'Live Codex process with explicit current-turn events' : session.source,
            // Native runtime status remains stronger; desktop status comes from explicit turn events.
            status: session.status === 'loaded' && context.activity !== 'unknown' ? context.activity : session.status });
    }
    return enriched;
}
