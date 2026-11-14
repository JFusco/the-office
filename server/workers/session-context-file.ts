import { readFile, realpath, stat } from 'node:fs/promises';
import { sep } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import type { SessionContext } from './session-scope';
import { ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile, sessionContextLines, type SessionContextParser } from './session-context-lines';
import { withSessionContextSnapshot } from './session-context-snapshot';
import type { SessionContextCheckpoint } from './session-context-checkpoint';
export type ContextProject = Pick<OfficeProject, 'id' | 'repo' | 'repository'> & Partial<Pick<OfficeProject, 'provider'>>;
export type ContextReader = (path: string, id: string, projects: ContextProject[]) => Promise<SessionContext>;

/** Cache derived context, never transcripts; changed files, identities or project bindings invalidate it. */
export function sessionContextFile(root: string, parse: (raw: string, id: string, projects: ContextProject[]) => SessionContext,
    createParser?: (id: string, projects: ContextProject[]) => SessionContextParser): ContextReader {
    const cache = new Map<string, { version: string; binding: string; ino: number; dev: number;
        context: SessionContext; checkpoint?: SessionContextCheckpoint }>();
    return async (path, id, projects) => {
        const [directory, original] = await Promise.all([realpath(root), realpath(path)]), identity = await stat(original);
        const deadline = performance.now() + MAX_CONTEXT_READ_MS;
        for (let attempt = 0; attempt < 2; attempt++) {
            const file = await realpath(path), info = await stat(file);
            if (file !== original || info.ino !== identity.ino || info.dev !== identity.dev)
                throw new Error('Session context file identity changed during its read');
            if (!file.startsWith(directory + sep) || !file.endsWith('.jsonl') || !info.isFile() || !createParser && info.size > 64 * 1024 * 1024)
                throw new Error('Session context coverage is unavailable');
            const version = JSON.stringify([id, info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs, projects]);
            const binding = JSON.stringify([id, projects]);
            const prior = cache.get(file);
            if (prior?.version === version) return prior.context;
            try {
                let checkpoint: SessionContextCheckpoint | undefined;
                const context = createParser
                    ? await withSessionContextSnapshot(file, info, deadline, (snapshot, captured) =>
                        sessionContextLines(snapshot, captured, createParser(id, projects), deadline, {
                            previous: prior?.binding === binding && prior.ino === info.ino && prior.dev === info.dev ? prior.checkpoint : undefined,
                            captured: value => { checkpoint = value; },
                        }))
                    : parse(await readFile(file, 'utf8'), id, projects);
                const current = await realpath(path), after = await stat(current);
                if (current !== original || after.ino !== identity.ino || after.dev !== identity.dev)
                    throw new Error('Session context file identity changed during its read');
                // Streaming reads certify the stable captured version. Later appends
                // invalidate its cache key on the next refresh, not that earlier observation.
                if (!createParser && !sameContextFile(info, after)) throw new ContextReadChanged('Session context file changed during its read');
                if (cache.size >= 1000) cache.clear();
                cache.set(file, { version, binding, ino: info.ino, dev: info.dev, context, checkpoint });
                return context;
            } catch (error) {
                // An active chat can append during a read. Discard the entire derived
                // context and try once from a fresh snapshot, within the original deadline.
                // A snapshot ending mid-record can fail parsing before the normal final
                // stat check. Classify that changed snapshot before deciding whether to retry.
                const current = await realpath(path), after = await stat(current);
                if (current !== original || after.ino !== identity.ino || after.dev !== identity.dev)
                    throw new Error('Session context file identity changed during its read');
                if (!sameContextFile(info, after)) error = new ContextReadChanged('Session context file changed during its read');
                // Stable malformed records, replacements and continuing churn stay unavailable.
                if (!(error instanceof ContextReadChanged) || attempt !== 0 || performance.now() >= deadline) throw error;
            }
        }
        throw new Error('Session context coverage is unavailable');
    };
}
