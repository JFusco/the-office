import { readFile, realpath, stat } from 'node:fs/promises';
import { sep } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import type { SessionContext } from './session-scope';
import { sameContextFile, sessionContextLines, type SessionContextParser } from './session-context-lines';
export type ContextProject = Pick<OfficeProject, 'id' | 'repo' | 'repository'>;
export type ContextReader = (path: string, id: string, projects: ContextProject[]) => Promise<SessionContext>;

/** Cache derived context, never transcripts; changed files, identities or project bindings invalidate it. */
export function sessionContextFile(root: string, parse: (raw: string, id: string, projects: ContextProject[]) => SessionContext,
    createParser?: (id: string, projects: ContextProject[]) => SessionContextParser): ContextReader {
    const cache = new Map<string, { version: string; context: SessionContext }>();
    return async (path, id, projects) => {
        const [directory, file] = await Promise.all([realpath(root), realpath(path)]), info = await stat(file);
        if (!file.startsWith(directory + sep) || !file.endsWith('.jsonl') || !info.isFile() || !createParser && info.size > 64 * 1024 * 1024)
            throw new Error('Session context coverage is unavailable');
        const version = JSON.stringify([id, info.ino, info.size, info.mtimeMs, info.ctimeMs, projects]);
        const prior = cache.get(file);
        if (prior?.version === version) return prior.context;
        const context = createParser ? await sessionContextLines(file, info, createParser(id, projects)) : parse(await readFile(file, 'utf8'), id, projects);
        if (await realpath(path) !== file || !sameContextFile(info, await stat(file))) throw new Error('Session context file changed during its read');
        if (cache.size >= 1000) cache.clear();
        cache.set(file, { version, context });
        return context;
    };
}
