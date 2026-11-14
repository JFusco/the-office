import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { digest } from '../../store/readback-evidence';
import { interruptedImplementation } from './original';
import type { Store } from '../../store/store';
import type { SavedImplementationProof } from '../../../src/contracts/cec-implementation-continuation';

export type GitRead = (cwd: string, args: string[]) => Promise<Buffer>;
/** Buffer output preserves UTF-8 boundaries in binary-capable source patches. No shell or text conversion. */
export const nativeGitRead: GitRead = (cwd, args) => new Promise((done, fail) => {
    execFile('git', args, { cwd, encoding: 'buffer', timeout: 15000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_PAGER: 'cat' } }, (error, stdout) => {
        if (error) fail(new Error('Saved implementation Git read could not finish'));
        else done(stdout);
    });
});
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
export const patchArgs = ['diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-color', 'HEAD'];

/** Only explicitly tracked source changes; ignored configuration, runtimes and symlinks are never copied. */
function sourceFiles(worktree: string, names: string[]) {
    if (!names.length || names.length > 256 || new Set(names).size !== names.length) throw new Error('A bounded saved source draft is required');
    let total = 0;
    return names.map(name => {
        if (isAbsolute(name) || /[\x00-\x1f]/.test(name) || name.split('/').some(p => !p || p === '.' || p === '..') ||
            /(?:^|\/)(?:\.git|\.local|node_modules|dist|\.next|\.env[^/]*|auth[^/]*|credentials[^/]*)(?:\/|$)|\.(?:pem|key|p12|sqlite|db)$/i.test(name))
            throw new Error('Private or runtime files cannot be included in a source continuation');
        let at = worktree;
        for (const part of name.split('/')) { at = resolve(at, part); if (lstatSync(at).isSymbolicLink()) throw new Error('Symlinked source is not eligible'); }
        const path = resolve(worktree, name), stat = lstatSync(path);
        if (!stat.isFile() || !realpathSync(path).startsWith(worktree + sep) || stat.size > 8 * 1024 * 1024 || (total += stat.size) > 32 * 1024 * 1024)
            throw new Error('Saved source exceeds the bounded continuation contract');
        return { path: name, mode: stat.mode & 0o111 ? 0o755 : 0o644, bytes: stat.size, sha256: sha(readFileSync(path)) };
    });
}
export async function savedImplementation(store: Store, key: string, requestId = '', git: GitRead = nativeGitRead,
    original = interruptedImplementation(store, key, requestId), pinnedWorktree = '') {
    const repo = realpathSync(store.project.repo);
    if (repo !== resolve(store.project.repo)) throw new Error('Configured source repository is aliased');
    const text = async (cwd: string, args: string[]) => (await git(cwd, args)).toString('utf8').trim();
    const rows = (await text(repo, ['worktree', 'list', '--porcelain'])).split('\n\n').map(block => Object.fromEntries(block.split('\n').map(line => {
        const at = line.indexOf(' '); return at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at + 1)];
    })));
    const prefix = `refs/heads/codex/${key.toLowerCase()}-`, matches = rows.filter(r => r.branch?.startsWith(prefix) && (!pinnedWorktree || resolve(r.worktree) === pinnedWorktree));
    if (matches.length !== 1) throw new Error('One original ticket worktree must be identified; no candidate was chosen automatically');
    const row = matches[0], worktree = realpathSync(row.worktree);
    if (worktree !== resolve(row.worktree) || worktree === repo || row.locked !== undefined || row.prunable !== undefined ||
        !/^[a-f0-9]{40}$/.test(row.HEAD)) throw new Error('Saved worktree identity is unavailable or changed');
    const born = lstatSync(resolve(worktree, '.git')).birthtimeMs;
    if (!Number.isFinite(born) || born < Date.parse(original.work.startedAt) - 1000 || born > Date.parse(original.work.endedAt))
        throw new Error('Worktree creation is not bound to the interrupted writer');
    const common = await text(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
    const origin = await text(repo, ['remote', 'get-url', 'origin']);
    if (await text(worktree, ['rev-parse', '--path-format=absolute', '--git-common-dir']) !== common ||
        await text(worktree, ['remote', 'get-url', 'origin']) !== origin ||
        await text(worktree, ['symbolic-ref', 'HEAD']) !== row.branch || await text(worktree, ['rev-parse', 'HEAD']) !== row.HEAD)
        throw new Error('Saved source repository, branch or head changed');
    if (await text(worktree, ['ls-files', '--others', '--exclude-standard'])) throw new Error('Untracked source must be reconciled before copying the draft');
    // No candidate commit was returned. A commit made after the base would need its own recovery contract.
    if (await text(worktree, ['rev-parse', 'origin/staging']) !== row.HEAD) throw new Error('Saved draft no longer matches its original staging base');
    const names = (await git(worktree, ['diff', '--name-only', '-z', 'HEAD'])).toString('utf8').split('\0').filter(Boolean);
    const files = sourceFiles(worktree, names), patch = await git(worktree, patchArgs);
    if (!patch.length || patch.length > 8 * 1024 * 1024) throw new Error('Saved source patch is empty or too large');
    const proof: SavedImplementationProof = { key, runId: original.ticket.runId, workerId: original.work.id,
        originalDigest: original.originalDigest, worktree, branch: row.branch.slice('refs/heads/'.length), head: row.HEAD,
        patchSha256: sha(patch), originSha256: sha(Buffer.from(origin)), fileCount: files.length, fingerprint: '' };
    proof.fingerprint = digest({ ...proof, files, common });
    if (await text(worktree, ['rev-parse', 'HEAD']) !== proof.head || sha(await git(worktree, patchArgs)) !== proof.patchSha256 ||
        digest(sourceFiles(worktree, names)) !== digest(files)) throw new Error('Saved source changed during the read');
    return { original, proof, files, patch, common };
}
export function sourceCopyMatches(worktree: string, files: Awaited<ReturnType<typeof savedImplementation>>['files']) {
    return digest(sourceFiles(worktree, files.map(f => f.path))) === digest(files);
}
