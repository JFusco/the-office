import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { readdir, access } from 'node:fs/promises';
import type { LiveSession } from './session-bridge';
import { claudeSessionScope } from './claude-session-scope';
import { sessionContextFile, type ContextReader, type ContextProject } from './session-context-file';
const root = resolve(homedir(), '.claude/projects');
const readTranscript = sessionContextFile(root, claudeSessionScope);

/** Resolve only a live inventory identity; a moved checkout may leave its transcript under the original project. */
export async function claudeTranscript(session: LiveSession, directory = root) {
    if (!/^[a-z0-9-]+$/i.test(session.id)) throw new Error('Invalid Claude session identity');
    const direct = resolve(directory, session.cwd.replace(/[^a-zA-Z0-9-]/g, '-'), `${session.id}.jsonl`);
    try { await access(direct); return direct; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const directories = await readdir(directory, { withFileTypes: true }), found: string[] = [];
    if (directories.length > 10000) throw new Error('Claude transcript lookup exceeds coverage bound');
    for (const entry of directories.filter(d => d.isDirectory())) {
        const path = resolve(directory, entry.name, `${session.id}.jsonl`);
        try { await access(path); found.push(path); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    if (found.length !== 1) throw new Error('One transcript for the live Claude session is required');
    return found[0];
}
export async function claudeSessionContext(sessions: LiveSession[], projects: ContextProject[], read: ContextReader = readTranscript, locate = claudeTranscript): Promise<LiveSession[]> {
    if (process.env.VITEST && read === readTranscript && sessions.length)
        throw new Error('Inject a Claude context reader under unit tests');
    const enriched: LiveSession[] = [];
    for (const session of sessions) {
        const context = await read(await locate(session), session.id, projects);
        enriched.push({ ...session, context: { ...context, activity: session.status === 'idle' ? 'idle' : 'active' } });
    }
    return enriched;
}
