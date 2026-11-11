import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { activeEffectId } from '../harness/effect';
import { artifact, digest, ownedPath } from '../../store/readback-evidence';
import { sanitize } from '../../office/security';
import { settledPushBoundary } from './settled-push-boundary';
import type { command } from '../../workers/process';
import type { LifecycleDiagnostic } from '../../workers/lifecycle/contract';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;

/** Records the one ordinary push already owned by Effects. No retry, status change or recovery admission. */
export async function recordedPush(store: Store, execute: typeof command, job: Pick<TicketJob, 'id' | 'packedPublicationRepair'>, candidate: Candidate,
    guard: () => void, timeout: number) {
    guard();
    if (!/^[a-f0-9]{40}$/.test(candidate.head) || !/^[\w-]{1,100}$/.test(job.id)) throw new Error('Exact push capture identity is required');
    const id = activeEffectId(store, `harness:${job.id}:push:${candidate.head}`), effect = store.getEffect(id);
    if (!effect || effect.status !== 'dispatching' || effect.operation !== 'git-push' || effect.work.kind !== 'delivery' ||
        effect.work.id !== job.id || effect.work.projectId !== store.project.id || effect.attemptId !== job.id ||
        effect.target !== `${store.project.repository}:${candidate.branch}` ||
        digest(effect.payload) !== digest({ head: candidate.head, branch: candidate.branch }))
        throw new Error('The original dispatching push Effect is required before native capture');
    const root = resolve(store.dataRoot, 'ticket-work', job.id);
    ownedPath(store, root);
    const directory = resolve(root, `push-${candidate.head}`);
    mkdirSync(directory, { mode: 0o700 }); // Existing capture requires read-back, never a second command.
    ownedPath(store, directory);
    const trace = resolve(directory, 'git-trace.jsonl'), intent = resolve(directory, 'intent.json');
    writeFileSync(trace, '', { flag: 'wx', mode: 0o600 });
    const traceOwnership = ownedPath(store, trace), cwd = realpathSync(candidate.worktree);
    const save = (name: string, value: unknown) => writeFileSync(resolve(directory, name), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
    save('intent.json', { version: 1, effectId: id, effectSha256: digest(effect), work: effect.work, candidate,
        command: ['git', 'push', 'origin', `${candidate.head}:refs/heads/${candidate.branch}`], cwd,
        trace, traceOwnership, at: store.clock.now().toISOString() });
    const intentProof = artifact(store, intent);
    let pid: number | undefined, lifecycle: LifecycleDiagnostic | undefined;
    let spawnProof: ReturnType<typeof artifact> | undefined, lifecycleProof: ReturnType<typeof artifact> | undefined;
    const finish = (error?: unknown) => {
        const savedTrace = artifact(store, trace), savedIntent = artifact(store, intent);
        if (digest(savedTrace.ownership) !== digest(traceOwnership) || digest(savedIntent) !== digest(intentProof) ||
            digest(store.getEffect(id)) !== digest(effect) ||
            spawnProof && digest(artifact(store, spawnProof.path)) !== digest(spawnProof) ||
            lifecycleProof && digest(artifact(store, lifecycleProof.path)) !== digest(lifecycleProof))
            throw new Error('Native push capture identity changed; reconcile the original command');
        let boundary: ReturnType<typeof settledPushBoundary> | undefined, unavailable = '';
        if (error && pid && lifecycle && spawnProof && lifecycleProof) {
            try { boundary = settledPushBoundary(readFileSync(trace, 'utf8'), { ...candidate, cwd, pid, lifecycle }); }
            catch (failure) { unavailable = sanitize(String(failure)); }
        }
        save('completion.json', { version: 1, effectId: id, intent: intentProof, trace: savedTrace, pid,
            spawn: spawnProof, lifecycle: lifecycleProof,
            disposition: error ? 'command-failed' : 'command-completed', error: error ? sanitize(String(error)) : '',
            boundary, boundaryUnavailable: unavailable, at: store.clock.now().toISOString(),
            meaning: 'Diagnostic evidence only. The original Effect, hook side effects and publication read-back retain their existing gates.' });
    };
    guard();
    let result: string;
    try {
        result = await execute('git', ['push', 'origin', `${candidate.head}:refs/heads/${candidate.branch}`], {
            cwd: candidate.worktree, timeout, env: { GIT_TRACE2_EVENT: trace, GIT_TRACE2_ENV_VARS: '', GIT_TRACE2_CONFIG_PARAMS: '', GIT_TRACE2_PARENT_SID: '',
                ...(job.packedPublicationRepair ? { HUSKY: '1' } : {}) },
            onSpawn: value => { if (pid || !Number.isSafeInteger(value) || value < 1) throw new Error('Native push PID changed'); pid = value; save('spawn.json', { pid, effectId: id, at: store.clock.now().toISOString() }); spawnProof = artifact(store, resolve(directory, 'spawn.json')); },
            onLifecycle: value => { save('lifecycle.json', value); lifecycle = value; lifecycleProof = artifact(store, resolve(directory, 'lifecycle.json')); },
        });
    } catch (error) {
        try { finish(error); }
        catch (captureError) { throw new Error(`${String(error)}; native push capture failed: ${String(captureError)}`, { cause: error }); }
        throw error; // Never turn a failed push into success or clear an uncertain Effect.
    }
    finish();
    return result;
}
