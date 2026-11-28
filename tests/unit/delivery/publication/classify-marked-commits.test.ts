import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { classifyMarkedCommits } from '../../../../server/delivery/publication/classify-marked-commits';
import { originalGit, walkCommits } from '../../../../server/delivery/publication/original-git';
import { carriesMarker } from '../../../../server/delivery/publication/release-marker-refusal';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { projectById } from '../../../../server/office/projects';
import { command } from '../../../../server/workers/process';
import { cleanupMarkerRepos, cmsPolicy, fakeToolchain, markerRepo, npmRunner, simulatedPack, snapshotRevision } from '../support/marker-repo';

afterEach(cleanupMarkerRepos);
const project = { ...projectById('cms-field-vocabulary'), provider: 'github' as const };

function repo() {
    const r = markerRepo();
    const target = r.commit({ ...cmsPolicy(), 'README.md': 'readme\n', LICENSE: 'MIT\n', 'wiki/index.md': 'wiki\n', 'tests/a.test.mjs': '// t\n' }, 'chore(repo): base');
    const classify = async (head: string, options: Parameters<typeof npmRunner>[1] & { target?: string } = {}) => {
        const tool = fakeToolchain(r.root), npm = npmRunner(tool, options);
        const marked = (await walkCommits(originalGit(command, r.repo), head, [target])).filter(commit => carriesMarker(commit.message)).reverse();
        const run = () => classifyMarkedCommits({ store: { dataRoot: r.data, project }, execute: npm.execute, jobId: 'job-1', worktree: r.repo, target: options.target ?? target, marked, node: tool.node });
        return { run, npm, marked };
    };
    return { ...r, target, classify };
}

test('each marked commit gets its own verdict, in order; an undecided commit does not hide a later proven change', async () => {
    const r = repo();
    const wiki = r.commit({ 'wiki/index.md': 'w2\n' }, 'docs(wiki): a [skip release]');
    const unknown = r.commit({ 'tests/a.test.mjs': '// t2\n' }, 'test(a): b [skip release]');
    r.commit({ 'wiki/index.md': 'w3\n' }, 'docs(wiki): unmarked');
    const readme = r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): c [skip release]');
    const { run, npm } = await r.classify(readme), verdict = await run();
    expect(verdict.allowed).toEqual([wiki]);
    expect(verdict.offending).toEqual([{ sha: readme, paths: ['README.md'], inventoryPaths: [] }]);
    expect(verdict.indeterminate?.evidence).toMatchObject({ reason: 'indeterminate', commit: unknown, paths: ['tests/a.test.mjs'], diagnostic: expect.stringContaining('unclassified paths') });
    // Every needed revision is packed exactly once: each marked commit and each one's parent, shared where they coincide.
    const packed = npm.npmCalls().filter(call => call.args[1] === 'pack').map(call => snapshotRevision(call.options.cwd));
    expect(new Set(packed).size).toBe(packed.length);
    expect(packed.sort()).toEqual([r.target, wiki, unknown, r.git(['rev-parse', `${readme}^`]).trim(), readme].sort());
    expect(readdirSync(resolve(r.data, 'ticket-work', 'job-1', 'release-marker'))).toEqual([]);
});

test('a tool failure stops every later commit; a marked root commit cannot be compared', async () => {
    const r = repo();
    const first = r.commit({ 'README.md': 'r2\n' }, 'docs(readme): a [skip release]');
    r.commit({ 'README.md': 'r3\n' }, 'docs(readme): b [skip release]');
    let packs = 0;
    const { run } = await r.classify(r.head(), { pack: cwd => { if (++packs === 2) throw new Error('npm crashed'); return simulatedPack(cwd); } });
    const verdict = await run();
    expect(verdict).toMatchObject({ allowed: [], offending: [] });
    expect(verdict.indeterminate?.evidence).toMatchObject({ diagnostic: expect.stringContaining('tool failure: npm pack'), commit: expect.stringMatching(/^[a-f0-9]{40}$/) });
    expect(first).toBeTruthy();
    const root = markerRepo();
    const only = root.commit({ ...cmsPolicy(), 'README.md': 'r\n' }, 'chore(repo): root [skip release]');
    const tool = fakeToolchain(root.root), npm = npmRunner(tool);
    const marked = await walkCommits(originalGit(command, root.repo), only, []);
    const rootVerdict = await classifyMarkedCommits({ store: { dataRoot: root.data, project }, execute: npm.execute, jobId: 'job-1', worktree: root.repo, target: only, marked, node: tool.node });
    expect(rootVerdict.indeterminate?.evidence).toMatchObject({ commit: only, diagnostic: expect.stringContaining('has no parent') });
});

test('unknown wiring at the target or an unsupported npm refuses before anything is packed', async () => {
    const r = repo();
    const wiringless = r.commit({ '.releaserc.cjs': null }, 'ci(release): drop wiring');
    const marked = r.commit({ 'wiki/index.md': 'w2\n' }, 'docs(wiki): a [skip release]');
    const atTarget = await r.classify(marked, { target: wiringless });
    await expect(atTarget.run()).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining(`.releaserc.cjs is not committed at target ${wiringless}`) } });
    expect(atTarget.npm.npmCalls()).toEqual([]);
    const version = await r.classify(marked, { version: '10.0.0' });
    const error = await version.run().then(() => undefined, failure => failure);
    expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
    expect((error as ReleaseMarkerRefusal).evidence.diagnostic).toContain('unsupported npm 10.0.0');
    expect(version.npm.npmCalls().filter(call => call.args[1] === 'pack')).toEqual([]);
});
