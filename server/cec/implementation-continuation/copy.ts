import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Effects } from '../../store/effects';
import { ownedPath } from '../../store/readback-evidence';
import { nativeGitRead, patchArgs, sourceCopyMatches, type savedImplementation } from './candidate';
import type { Store } from '../../store/store';
import type { command } from '../../workers/process';

type Saved = Awaited<ReturnType<typeof savedImplementation>>;
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
function absent(path: string) {
    try { lstatSync(path); } catch (error: any) { if (error.code === 'ENOENT') return; throw error; }
    throw new Error('A previous continuation path exists; reconcile it without copying again');
}
function candidateParent(path: string) {
    try { const stat = lstatSync(path); if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Candidate parent is not a real directory'); }
    catch (error: any) { if (error.code !== 'ENOENT') throw error; }
}
/** One durable effect creates a separate linked worktree and applies only the approved source patch. */
export async function copySavedImplementation(store: Store, requestId: string, saved: Saved,
    current: () => Promise<void>, execute: typeof command) {
    const repo = realpathSync(store.project.repo), parent = resolve(repo, '.worktrees');
    candidateParent(parent);
    const worktree = resolve(parent, `${saved.proof.key.toLowerCase()}-continue-${requestId}`);
    const branch = `codex/${saved.proof.key.toLowerCase()}-continue-${requestId}`;
    const directory = resolve(store.dataRoot, 'runs', saved.proof.runId, 'implementation-continuations', requestId);
    if (!/^[a-f0-9-]{36}$/.test(requestId) || !/^cec-[1-9][0-9]*-[a-f0-9-]{36}$/.test(saved.proof.runId)) throw new Error('Invalid native continuation identity');
    const runRoot = resolve(store.dataRoot, 'runs', saved.proof.runId);
    ownedPath(store, runRoot);
    if (!lstatSync(runRoot).isDirectory()) throw new Error('Original run evidence directory is missing');
    const evidenceParent = resolve(directory, '..');
    candidateParent(evidenceParent);
    absent(worktree); absent(directory);
    if (!existsSync(evidenceParent)) mkdirSync(evidenceParent, { mode: 0o700 });
    mkdirSync(directory, { mode: 0o700 }); mkdirSync(resolve(directory, 'checks'), { mode: 0o700 });
    const patchPath = resolve(directory, 'source.patch'), proofPath = resolve(directory, 'source-intent.json');
    writeFileSync(patchPath, saved.patch, { flag: 'wx', mode: 0o600 });
    writeFileSync(proofPath, JSON.stringify({ original: saved.proof, originalResult: saved.original.result,
        originalWorker: saved.original.work, artifacts: saved.original.artifacts, files: saved.files,
        worktree, branch, patchPath, at: store.clock.now().toISOString(),
        meaning: 'Explicit forward administrative continuation. Original timeout remains uncertain, never successful or non-mutating.' }, null, 2), { flag: 'wx', mode: 0o600 });
    const id = `cec-implementation-copy:${requestId}`;
    const verify = async () => {
        const git = async (args: string[]) => (await nativeGitRead(worktree, args)).toString('utf8').trim();
        if (realpathSync(worktree) !== worktree || await git(['rev-parse', 'HEAD']) !== saved.proof.head ||
            await git(['symbolic-ref', '--short', 'HEAD']) !== branch ||
            await git(['rev-parse', '--path-format=absolute', '--git-common-dir']) !== saved.common ||
            !sourceCopyMatches(worktree, saved.files) || sha(await nativeGitRead(worktree, patchArgs)) !== saved.proof.patchSha256)
            throw new Error('Fresh source copy does not match the approved draft');
        await current();
        const remote = (await execute('git', ['ls-remote', '--heads', 'origin', 'refs/heads/staging'], { cwd: repo, readOnly: true, timeout: 30000 })).trim();
        if (remote !== `${saved.proof.head}\trefs/heads/staging`) throw new Error('Staging changed during source copy; preserve both candidates for reconciliation');
        return true;
    };
    const result = await new Effects(store).execute({ id, work: { projectId: store.project.id, kind: 'delivery', id: `ticket:${saved.proof.key}` },
        attemptId: requestId, operation: 'cec-copy-preserved-implementation', target: saved.proof.key, authorization: requestId,
        payload: { fingerprint: saved.proof.fingerprint, patchSha256: saved.proof.patchSha256, patchPath },
        expectedState: { worktree, branch, base: saved.proof.head },
        preflight: async () => {
            await current(); absent(worktree); candidateParent(parent);
            ownedPath(store, patchPath);
            if (sha(readFileSync(patchPath)) !== saved.proof.patchSha256) throw new Error('Approved source patch changed');
            const refs = (await nativeGitRead(repo, ['for-each-ref', '--format=%(objectname)', `refs/heads/${branch}`])).toString().trim();
            if (refs) throw new Error('The new branch already exists; reconcile it without recreating it');
            const remote = (await execute('git', ['ls-remote', '--heads', 'origin', 'refs/heads/staging'], { cwd: repo, readOnly: true, timeout: 30000 })).trim();
            if (remote !== `${saved.proof.head}\trefs/heads/staging`) throw new Error('Current staging changed; reconcile the preserved draft against the newer base');
        },
        dispatch: async () => {
            if (!existsSync(parent)) mkdirSync(parent, { mode: 0o700 });
            await execute('git', ['worktree', 'add', '-b', branch, worktree, saved.proof.head], { cwd: repo, timeout: 120000 });
            if ((await nativeGitRead(worktree, ['status', '--porcelain'])).length) throw new Error('Fresh worktree contains unexpected changes');
            await execute('git', ['apply', '--index', '--binary'], { cwd: worktree, input: saved.patch.toString('utf8'), timeout: 30000 });
            return { worktree, branch, head: saved.proof.head, proofPath, patchSha256: saved.proof.patchSha256 };
        }, verify: async () => verify() });
    return { ...result, effectId: id, proofSha256: sha(readFileSync(proofPath)), checksRoot: resolve(directory, 'checks') };
}
