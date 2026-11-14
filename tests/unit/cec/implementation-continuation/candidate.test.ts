import { expect, test } from 'vitest';
import { readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fixture } from './fixtures';
import { savedImplementation, sourceCopyMatches } from '../../../../server/cec/implementation-continuation/candidate';
import { assertCandidateIdle } from '../../../../server/cec/implementation-continuation/process-fence';

test('captures exact Unicode source and Git identity, excludes ignored configuration, refuses later drift', async () => {
    const f = fixture(); try {
        const saved = await f.inspect(); expect(saved.proof.fileCount).toBe(1); expect(saved.patch.toString()).toContain('café 🦉');
        expect(sourceCopyMatches(f.worktree, saved.files)).toBe(true);
        const privateBytes = readFileSync(resolve(f.worktree, '.env.local'));
        writeFileSync(resolve(f.worktree, 'source.ts'), 'changed\n');
        expect((await f.inspect()).proof.fingerprint).not.toBe(saved.proof.fingerprint);
        expect(sourceCopyMatches(f.worktree, saved.files)).toBe(false);
        expect(readFileSync(resolve(f.worktree, '.env.local'))).toEqual(privateBytes);
    } finally { f.close(); }
});
test.each(['untracked', 'symlink', 'private', 'advanced', 'multiple'])('refuses unsafe candidate: %s', async why => {
    const f = fixture(); try {
        if (why === 'untracked') writeFileSync(resolve(f.worktree, 'new.ts'), 'unknown');
        if (why === 'symlink') { rmSync(resolve(f.worktree, 'source.ts')); symlinkSync(resolve(f.repo, 'source.ts'), resolve(f.worktree, 'source.ts')); }
        if (why === 'private') { writeFileSync(resolve(f.worktree, 'auth.json'), '{}'); f.git(f.worktree, 'add', 'auth.json'); }
        if (why === 'advanced') { f.git(f.worktree, 'add', 'source.ts'); f.git(f.worktree, 'commit', '-qm', 'unexpected commit'); }
        if (why === 'multiple') f.git(f.repo, 'worktree', 'add', '-qb', 'codex/cec-900-other', resolve(f.root, 'other'), f.base);
        await expect(savedImplementation(f.store, f.t.key, '', undefined, f.original())).rejects.toThrow();
    } finally { f.close(); }
});
test('process metadata fails closed for holders, missing or malformed visibility', async () => {
    await expect(assertCandidateIdle('/tmp/source', async () => 'p12\nn/tmp/elsewhere\n')).resolves.toBeUndefined();
    for (const text of ['p12\nn/tmp/source/child\n', '', 'pbad\nn/tmp/x\n'])
        await expect(assertCandidateIdle('/tmp/source', async () => text)).rejects.toThrow();
});
