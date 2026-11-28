import { chmodSync, existsSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { originalGit } from '../../../../server/delivery/publication/original-git';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { exportSnapshot, verifySnapshot, withMarkerScratch } from '../../../../server/delivery/publication/shipped-paths';
import { command } from '../../../../server/workers/process';
import { cleanupMarkerRepos, markerRepo } from '../support/marker-repo';

afterEach(cleanupMarkerRepos);
const refusal = async (run: () => unknown) => { try { await run(); } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('a revision exports exactly through its own index: dotfiles, export-ignore files, modes and links, verified against the tree', async () => {
    const r = markerRepo();
    r.commit({ '.gitattributes': 'secret.md export-ignore\n', '.npmrc': 'x=1\n', 'secret.md': 's\n', 'bin/run.mjs': '#!/usr/bin/env node\n' }, 'chore(repo): base');
    chmodSync(resolve(r.repo, 'bin/run.mjs'), 0o755);
    symlinkSync('secret.md', resolve(r.repo, 'link.md'));
    const head = r.commit({}, 'chore(repo): link');
    const index = resolve(r.root, 'index'), dir = resolve(r.root, 'snapshot');
    const entries = await exportSnapshot(originalGit(command, r.repo), head, dir, index);
    expect(entries.map(entry => `${entry.mode} ${entry.path}`).sort()).toEqual(['100644 .gitattributes', '100644 .npmrc', '100644 secret.md', '100755 bin/run.mjs', '120000 link.md']);
    expect(existsSync(resolve(dir, 'secret.md'))).toBe(true);
    // The worktree's own index is untouched.
    expect(r.git(['status', '--porcelain']).trim()).toBe('');
    // Extra, missing, transformed and mode-changed files are each refused.
    writeFileSync(resolve(dir, 'extra.md'), 'x');
    expect(await refusal(() => verifySnapshot(dir, entries, head))).toMatchObject({ diagnostic: expect.stringContaining('extra.md is not tracked') });
    expect(await refusal(() => verifySnapshot(dir, entries.filter(entry => entry.path !== '.npmrc'), head))).toMatchObject({ diagnostic: expect.stringContaining('.npmrc is not tracked') });
    const tampered = resolve(r.root, 'tampered');
    await exportSnapshot(originalGit(command, r.repo), head, tampered, resolve(r.root, 'index-2'));
    writeFileSync(resolve(tampered, 'secret.md'), 's\r\n');
    expect(await refusal(() => verifySnapshot(tampered, entries, head))).toMatchObject({ diagnostic: expect.stringContaining('transformed snapshot: secret.md') });
});

test('an eol filter that rewrites content on checkout is a transformed snapshot; a submodule cannot be packed', async () => {
    const r = markerRepo();
    const head = r.commit({ '.gitattributes': '*.txt text eol=crlf\n', 'a.txt': 'one\ntwo\n' }, 'chore(repo): crlf');
    expect(await refusal(() => exportSnapshot(originalGit(command, r.repo), head, resolve(r.root, 's'), resolve(r.root, 'i')))).toMatchObject({ diagnostic: expect.stringContaining('transformed snapshot: a.txt') });
    const s = markerRepo(), inner = s.commit({ 'x': 'x\n' }, 'chore(sub): x');
    s.git(['update-index', '--add', '--cacheinfo', `160000,${inner},vendor/sub`]);
    s.git(['commit', '-q', '-m', 'chore(repo): submodule']);
    const linked = s.head();
    expect(await refusal(() => exportSnapshot(originalGit(command, s.repo), linked, resolve(s.root, 's2'), resolve(s.root, 'i2')))).toMatchObject({ diagnostic: expect.stringContaining('vendor/sub') });
});

test('release-marker scratch lives under the job\'s ticket work and is removed on every exit', async () => {
    const r = markerRepo();
    const root = resolve(r.data, 'ticket-work', 'job-1', 'release-marker');
    await withMarkerScratch({ dataRoot: r.data }, 'job-1', async scratch => { expect(scratch.startsWith(root)).toBe(true); writeFileSync(resolve(scratch, 'x'), 'x'); });
    await expect(withMarkerScratch({ dataRoot: r.data }, 'job-1', async () => { throw new Error('stop'); })).rejects.toThrow('stop');
    expect(readdirSync(root)).toEqual([]);
});
