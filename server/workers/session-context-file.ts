import { readFile, realpath, stat } from 'node:fs/promises';
import { sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import type { OfficeProject } from '../../src/shared';
import type { SessionContext } from './session-scope';
import { ContextReadChanged, MAX_CONTEXT_READ_MS, sameContextFile, sessionContextLines, type SessionContextParser } from './session-context-lines';
import { withSessionContextSnapshot } from './session-context-snapshot';
import type { SessionContextCheckpoint } from './session-context-checkpoint';
import { SessionContextDeadline, type ContextReadPhase } from './session-context-deadline';
export type ContextProject = Pick<OfficeProject, 'id' | 'repo' | 'repository'> & Partial<Pick<OfficeProject, 'provider'>> & { jira?: { site: string; projectKey: string } };
export type ContextReader = (path: string, id: string, projects: ContextProject[]) => Promise<SessionContext>;

/** Cache derived context, never transcripts; changed files, identities or project bindings invalidate it. */
export function sessionContextFile(root: string, parse: (raw: string, id: string, projects: ContextProject[]) => SessionContext,
    createParser?: (id: string, projects: ContextProject[]) => SessionContextParser): ContextReader {
    const cache = new Map<string, { version: string; binding: string; ino: number; dev: number;
        context?: SessionContext; checkpoint?: SessionContextCheckpoint }>();
    return async (path, id, projects) => {
        const [directory, original] = await Promise.all([realpath(root), realpath(path)]), identity = await stat(original);
        const started = performance.now(), deadline = started + MAX_CONTEXT_READ_MS, loopStarted = performance.eventLoopUtilization();
        for (let attempt = 0; attempt < 2; attempt++) {
            const file = await realpath(path), info = await stat(file);
            if (file !== original || info.ino !== identity.ino || info.dev !== identity.dev)
                throw new Error('Session context file identity changed during its read');
            if (!file.startsWith(directory + sep) || !file.endsWith('.jsonl') || !info.isFile() || !createParser && info.size > 64 * 1024 * 1024)
                throw new Error('Session context coverage is unavailable');
            const version = JSON.stringify([id, info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs, projects]);
            const binding = JSON.stringify([id, projects]);
            const prior = cache.get(file);
            if (prior?.version === version && prior.context) return prior.context;
            let phase: ContextReadPhase = 'snapshot', phaseStarted = performance.now();
            let progress: SessionContextCheckpoint | undefined;
            try {
                let checkpoint: SessionContextCheckpoint | undefined;
                const context = createParser
                    ? await withSessionContextSnapshot(file, info, deadline, (snapshot, captured) => {
                        phase = 'fold'; phaseStarted = performance.now();
                        return sessionContextLines(snapshot, captured, createParser(id, projects), deadline, {
                            previous: prior?.binding === binding && prior.ino === info.ino && prior.dev === info.dev ? prior.checkpoint : undefined,
                            captured: value => { checkpoint = value; },
                            progress: value => { progress = value; },
                        });
                    })
                    : parse(await readFile(file, 'utf8'), id, projects);
                phase = 'identity'; phaseStarted = performance.now();
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
                const timedOut = error instanceof Error && error.message === 'Session context scan exceeded its read deadline';
                const current = await realpath(path), after = await stat(current);
                if (current !== original || after.ino !== identity.ino || after.dev !== identity.dev)
                    throw new Error('Session context file identity changed during its read');
                // A timeout remains unavailable. Retain only derived parser progress,
                // never a successful observation, transcript or live file handle.
                // Its prefix must match a fresh capture before the next fold uses it.
                if (timedOut && progress) {
                    if (cache.size >= 1000) cache.clear();
                    cache.set(file, { version: '', binding, ino: info.ino, dev: info.dev, checkpoint: progress });
                }
                if (!sameContextFile(info, after)) error = new ContextReadChanged('Session context file changed during its read');
                // Stable malformed records, replacements and continuing churn stay unavailable.
                if (!(error instanceof ContextReadChanged) || attempt !== 0 || performance.now() >= deadline) {
                    if (error instanceof Error && error.message === 'Session context scan exceeded its read deadline') {
                        const loop = performance.eventLoopUtilization(loopStarted);
                        throw new SessionContextDeadline(id, phase, performance.now() - started, info.size,
                            { phaseMS: performance.now() - phaseStarted, activeMS: loop.active, idleMS: loop.idle });
                    }
                    throw error;
                }
            }
        }
        throw new Error('Session context coverage is unavailable');
    };
}
