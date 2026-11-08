import { readFile, realpath, stat } from 'node:fs/promises';
import { sep } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import type { SessionContext } from './session-scope';
export type ContextProject = Pick<OfficeProject, 'id' | 'repo' | 'repository'>;
export type ContextReader = (path: string, id: string, projects: ContextProject[]) => Promise<SessionContext>;

/** Cache derived context, never transcripts; changed files, identities or project bindings invalidate it. */
export function sessionContextFile(root: string, parse: (raw: string, id: string, projects: ContextProject[]) => SessionContext): ContextReader {
    const cache = new Map<string, { version: string; context: SessionContext }>();
    return async (path, id, projects) => {
        const [directory, file] = await Promise.all([realpath(root), realpath(path)]), info = await stat(file);
        if (!file.startsWith(directory + sep) || !file.endsWith('.jsonl') || !info.isFile() || info.size > 64 * 1024 * 1024)
            throw new Error('Session context coverage is unavailable');
        const version = JSON.stringify([id, info.ino, info.size, info.mtimeMs, projects]);
        const prior = cache.get(file);
        if (prior?.version === version) return prior.context;
        const context = parse(await readFile(file, 'utf8'), id, projects);
        if (cache.size >= 1000) cache.clear();
        cache.set(file, { version, context });
        return context;
    };
}
