import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { LiveSession } from './session-bridge';
import { sessionScope, sessionScopeParser, type SessionContext } from './session-scope';
import { sessionContextFile, type ContextProject, type ContextReader } from './session-context-file';

const readRollout = sessionContextFile(resolve(homedir(), '.codex/sessions'), sessionScope, sessionScopeParser);

/** Read context only for positively loaded identities; never search or resume historical chats. */
export async function codexSessionContext(sessions: LiveSession[], projects: ContextProject[], read: ContextReader = readRollout): Promise<LiveSession[]> {
    if (process.env.VITEST && read === readRollout && sessions.some(session => session.rolloutPath))
        throw new Error('Inject a Codex context reader under unit tests');
    const enriched: LiveSession[] = [];
    for (const session of sessions) {
        if (session.provider !== 'codex' || !session.rolloutPath) { enriched.push(session); continue; }
        const context: SessionContext = await read(session.rolloutPath, session.id, projects);
        enriched.push({ ...session, context,
            source: session.status === 'loaded' && context.activity !== 'unknown' ? 'Live Codex process with explicit current-turn events' : session.source,
            // Native runtime status remains stronger; desktop status comes from explicit turn events.
            status: session.status === 'loaded' && context.activity !== 'unknown' ? context.activity : session.status });
    }
    return enriched;
}
