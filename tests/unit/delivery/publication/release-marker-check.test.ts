import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { checkReleaseMarkers } from '../../../../server/delivery/publication/release-marker-check';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { projectById } from '../../../../server/office/projects';
import { cleanupMarkerRepos, cmsPolicy, D3AE220F_MESSAGE, fakeToolchain, genuinePack, genuinePaths, markerRepo, npmRunner, simulatedPack, snapshotRevision } from '../support/marker-repo';

afterEach(cleanupMarkerRepos);

const project = { ...projectById('cms-field-vocabulary'), provider: 'github' as const };
/** A CMS-shaped tree at its target: the real release wiring and manifest, shipped files, wiki, build inputs and tests. */
function cms(extra: Record<string, string> = {}) {
    const r = markerRepo();
    const target = r.commit({ ...cmsPolicy(), 'README.md': 'readme\n', 'OPERATING.md': 'operating\n', LICENSE: 'MIT\n', 'CHANGELOG.md': '# Changelog\n', 'SECURITY.md': 'security\n',
        'bin/cms-field-vocabulary.mjs': 'export {};\n', 'catalog/catalog.json': '{}\n', 'profiles/consumers/a.json': '{}\n', 'schemas/a.schema.json': '{}\n', 'definitions/rendering-operations.json': '{}\n',
        'docs/platforms/a.md': 'platform\n', 'sources/evidence-locators.json': '{}\n', 'sources/official-sources.json': '{}\n', 'sources.lock.json': '{}\n', 'wiki/index.md': 'wiki\n',
        'scripts/wiki/graph/data/graph.json': '{}\n', 'src/index.ts': 'export {};\n', 'sources/profiles/a.json': '{}\n', 'scripts/build-catalog.mjs': '// build\n', 'tests/a.test.mjs': '// test\n', ...extra }, 'chore(repo): base');
    return { ...r, target };
}
type Repo = ReturnType<typeof cms>;
async function check(r: Repo, head: string, options: Parameters<typeof npmRunner>[1] & { target?: string; published?: string; candidateBase?: string } = {}) {
    const tool = fakeToolchain(r.root), npm = npmRunner(tool, options), target = options.target ?? r.target;
    const run = () => checkReleaseMarkers({ store: { dataRoot: r.data, project }, execute: npm.execute, job: { id: 'job-1', candidateBase: options.candidateBase ?? r.target }, head, worktree: r.repo,
        observed: { target, published: options.published ?? '' }, live: async () => ({ target, published: options.published ?? '' }), node: tool.node });
    return { run, npm, tool };
}
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('GH-189 (d3ae220f) is refused for both shipped documents, using genuine npm 11.9.0 inventories of 2c78305d and its child', async () => {
    const r = markerRepo(), shipped = genuinePaths('2c78305d');
    // Every path CMS's npm inventory lists, plus the paths only the wiki and graph tooling read.
    const files = Object.fromEntries(shipped.map(path => [path, `${path}\n`]));
    const parent = r.commit({ ...files, ...cmsPolicy(), 'package.json': cmsPolicy()['package.json'], 'scripts/wiki/graph/data/graph.json': '{}\n', 'wiki/connections.md': 'c\n', 'wiki/topics/official-source-freshness.md': 't\n' }, 'chore(repo): 2c78305d');
    const child = r.commit({ 'OPERATING.md': 'operating, now with source acceptance\n', 'README.md': 'readme, now with source acceptance\n', 'scripts/wiki/graph/data/graph.json': '{"n":1}\n',
        'wiki/connections.md': 'c2\n', 'wiki/journal/2026-11-23-require-explicit-observation-acceptance.md': 'j\n', 'wiki/topics/official-source-freshness.md': 't2\n' }, D3AE220F_MESSAGE());
    const genuine = new Map([[parent, genuinePack('2c78305d')], [child, genuinePack('d3ae220f')]]);
    const { run, npm } = await check({ ...r, target: parent } as Repo, child, { pack: cwd => genuine.get(snapshotRevision(cwd))! });
    const stop = await refusal(run());
    expect(stop).toMatchObject({ reason: 'marked-package-change', disposition: 'refusal', commit: child, paths: ['OPERATING.md', 'README.md'], inventoryPaths: [] });
    // Both revisions packed exactly once, with all four production flags and lifecycle scripts disabled in the environment too.
    const packs = npm.npmCalls().filter(call => call.args[1] === 'pack');
    expect(packs.map(call => snapshotRevision(call.options.cwd)).sort()).toEqual([parent, child].sort());
    for (const call of packs) {
        expect(call.args.slice(1)).toEqual(['pack', '--dry-run', '--json', '--ignore-scripts', '--offline']);
        expect(call.options.replaceEnv).toMatchObject({ npm_config_ignore_scripts: 'true', npm_config_offline: 'true', npm_config_workspaces: 'false' });
        expect(call.options.replaceEnv.npm_config_cache).toContain(resolve(r.data, 'ticket-work', 'job-1', 'release-marker'));
    }
    // The version probe and the pack use the same executable.
    expect(new Set(npm.npmCalls().map(call => `${call.program} ${call.args[0]}`)).size).toBe(1);
    // Scratch is removed on exit.
    expect(readdirSync(resolve(r.data, 'ticket-work', 'job-1', 'release-marker'))).toEqual([]);
});

test('a marked wiki and graph edit beside an unmarked README edit is allowed; only the marked commit is judged', async () => {
    const r = cms();
    r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): explain sources');
    const head = r.commit({ 'wiki/index.md': 'wiki 2\n', 'scripts/wiki/graph/data/graph.json': '{"n":2}\n' }, 'docs(wiki): reconcile [skip release]');
    const { run, npm } = await check(r, head);
    expect(await run()).toMatchObject({ kind: 'allowed', marked: [head] });
    expect(npm.npmCalls().filter(call => call.args[1] === 'pack')).toHaveLength(2);
});

test('a marked README change stays refused after a later revert, and every refused commit is named', async () => {
    const r = cms();
    const marked = r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword [skip release]');
    r.commit({ 'README.md': 'readme\n' }, 'revert: reword');
    const { run } = await check(r, r.head());
    expect(await refusal(run())).toMatchObject({ reason: 'marked-package-change', commit: marked, paths: ['README.md'] });
});

test('a marker in the message body is detected, case-sensitively', async () => {
    const r = cms();
    const marked = r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword\n\nWiki-only, so [skip release].\n');
    expect(await refusal((await check(r, marked)).run())).toMatchObject({ commit: marked, paths: ['README.md'] });
    const other = cms();
    const shouting = other.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword [SKIP RELEASE]');
    expect(await (await check(other, shouting)).run()).toEqual({ kind: 'unmarked' });
});

test('a marked merge is judged by its first-parent diff, and a marked side-branch commit is walked through an unmarked merge', async () => {
    const r = cms();
    r.git(['checkout', '-q', '-b', 'side']);
    const side = r.commit({ 'README.md': 'readme side\n' }, 'docs(readme): side [skip release]');
    r.git(['checkout', '-q', 'main']);
    r.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): main');
    r.git(['merge', '-q', '--no-ff', '--no-edit', '-m', 'chore(merge): bring side in', 'side']);
    expect(await refusal((await check(r, r.head())).run())).toMatchObject({ commit: side, paths: ['README.md'] });
    const m = cms();
    m.git(['checkout', '-q', '-b', 'side']);
    m.commit({ 'README.md': 'readme side\n' }, 'docs(readme): side');
    m.git(['checkout', '-q', 'main']);
    m.git(['merge', '-q', '--no-ff', '--no-edit', '-m', 'chore(merge): bring side in [skip release]', 'side']);
    const merge = m.head();
    expect(await refusal((await check(m, merge)).run())).toMatchObject({ commit: merge, paths: ['README.md'] });
});

test('a deleted or renamed shipped file is refused, naming both sides of the rename and the inventory change', async () => {
    const r = cms();
    const deleted = r.commit({ 'SECURITY.md': null }, 'docs(security): drop [skip release]');
    expect(await refusal((await check(r, deleted)).run())).toMatchObject({ paths: ['SECURITY.md'], inventoryPaths: ['SECURITY.md'] });
    const n = cms();
    n.git(['mv', 'docs/platforms/a.md', 'docs/platforms/b.md']);
    const renamed = n.commit({}, 'docs(platforms): rename [skip release]');
    expect(await refusal((await check(n, renamed)).run())).toMatchObject({ paths: ['docs/platforms/a.md', 'docs/platforms/b.md'], inventoryPaths: ['docs/platforms/a.md', 'docs/platforms/b.md'] });
});

test.each([
    ['the manifest alone', { 'package.json': cmsPolicy()['package.json'].replace('deterministic coding-agent contracts', 'deterministic agent contracts') }, ['package.json']],
    ['a src/ build input', { 'src/index.ts': 'export const x = 1;\n' }, ['src/index.ts']],
    ['a catalog source', { 'sources/profiles/a.json': '{"b":1}\n' }, ['sources/profiles/a.json']],
    ['the catalog builder', { 'scripts/build-catalog.mjs': '// build 2\n' }, ['scripts/build-catalog.mjs']],
])('%s is a package change', async (_name, files, paths) => {
    const r = cms(), head = r.commit(files, 'chore(build): adjust [skip release]');
    expect(await refusal((await check(r, head)).run())).toMatchObject({ reason: 'marked-package-change', paths });
});

test('an unknown path is indeterminate, never allowed by default', async () => {
    const r = cms(), head = r.commit({ 'tests/a.test.mjs': '// test 2\n' }, 'test(a): adjust [skip release]');
    expect(await refusal((await check(r, head)).run())).toMatchObject({ reason: 'indeterminate', commit: head, paths: ['tests/a.test.mjs'], diagnostic: expect.stringContaining('unclassified paths') });
});

test('a tracked export-ignore file is still exported and packed, so its marked change is refused', async () => {
    const r = cms({ '.gitattributes': 'SECURITY.md export-ignore\n' });
    const head = r.commit({ 'SECURITY.md': 'security 2\n' }, 'docs(security): reword [skip release]');
    let seen = false;
    const { run } = await check(r, head, { pack: cwd => { seen ||= existsSync(resolve(cwd, 'SECURITY.md')); return simulatedPack(cwd); } });
    expect(await refusal(run())).toMatchObject({ paths: ['SECURITY.md'] });
    expect(seen).toBe(true);
});

test('a nested ignore edit that changes membership is refused from the paired inventories, also under a reviewed prefix', async () => {
    const r = cms();
    const head = r.commit({ 'profiles/consumers/.npmignore': 'a.json\n' }, 'chore(profiles): ignore [skip release]');
    expect(await refusal((await check(r, head)).run())).toMatchObject({ inventoryPaths: ['profiles/consumers/a.json'] });
    // Package files under a reviewed prefix are shipped files like any other.
    const w = cms({ 'package.json': cmsPolicy()['package.json'].replace('"README.md",', '"README.md",\n    "wiki/published/",'), 'wiki/published/guide.md': 'guide\n' });
    const ignored = w.commit({ 'wiki/published/.npmignore': 'guide.md\n' }, 'docs(wiki): hide [skip release]');
    expect(await refusal((await check(w, ignored)).run())).toMatchObject({ inventoryPaths: ['wiki/published/guide.md'] });
    const edited = w.commit({ 'wiki/published/guide.md': 'guide 2\n', 'wiki/published/.npmignore': null }, 'docs(wiki): guide [skip release]');
    expect(await refusal((await check(w, edited, { target: ignored, candidateBase: ignored })).run())).toMatchObject({ paths: expect.arrayContaining(['wiki/published/guide.md']) });
});

test('release wiring is read at the verified target: a README-only mention, a disconnected import and target-only differences are unknown', async () => {
    const readme = markerRepo();
    const target = readme.commit({ ...cmsPolicy(), '.releaserc.cjs': null, 'scripts/semantic-release-analyzer.cjs': null, 'scripts/release-commits.cjs': null, 'README.md': 'Mark wiki commits with [skip release].\n', 'wiki/a.md': 'a\n' }, 'chore(repo): base');
    const head = readme.commit({ 'wiki/a.md': 'b\n' }, 'docs(wiki): a [skip release]');
    expect(await refusal((await check({ ...readme, target } as Repo, head)).run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('unknown release wiring') });
    const disconnected = cms({ 'scripts/semantic-release-analyzer.cjs': cmsPolicy()['scripts/semantic-release-analyzer.cjs'].replace("require('./release-commits.cjs')", "require('./other-filter.cjs')") });
    const wiki = disconnected.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): a [skip release]');
    expect(await refusal((await check(disconnected, wiki)).run())).toMatchObject({ diagnostic: expect.stringContaining('does not apply the committed filter') });
    // The target's filter drops another marker; the candidate's own wiring is never what decides.
    const differing = cms({ 'scripts/release-commits.cjs': cmsPolicy()['scripts/release-commits.cjs'].replace("'[skip release]'", "'[no release]'") });
    const candidate = differing.commit({ 'scripts/release-commits.cjs': cmsPolicy()['scripts/release-commits.cjs'] }, 'ci(release): restore filter');
    const marked = differing.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): a [skip release]');
    expect(candidate).toBeTruthy();
    expect(await refusal((await check(differing, marked)).run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining(`at ${differing.target}`) });
});

test('npm is resolved and probed before packing: a wrong version, a malformed or incomplete inventory and bundled dependencies are indeterminate', async () => {
    const r = cms(), head = r.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): a [skip release]');
    const wrong = await check(r, head, { version: '10.9.2' });
    expect(await refusal(wrong.run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('unsupported npm 10.9.2') });
    expect(wrong.npm.npmCalls().some(call => call.args[1] === 'pack')).toBe(false);
    const variants: [string, (cwd: string) => string, string][] = [
        ['malformed', () => 'not json', 'malformed npm pack result'],
        ['two packages', cwd => JSON.stringify([...JSON.parse(simulatedPack(cwd)), ...JSON.parse(simulatedPack(cwd))]), '2 packages'],
        ['wrong name', cwd => simulatedPack(cwd).replace('"name":"cms-field-vocabulary"', '"name":"other"'), 'not the committed package'],
        ['short count', cwd => { const pack = JSON.parse(simulatedPack(cwd)); pack[0].entryCount += 1; return JSON.stringify(pack); }, 'incomplete npm inventory'],
        ['absolute path', cwd => { const pack = JSON.parse(simulatedPack(cwd)); pack[0].files[0].path = '/etc/passwd'; return JSON.stringify(pack); }, 'unusable file path'],
        ['missing file', cwd => { const pack = JSON.parse(simulatedPack(cwd)); pack[0].files[0].path = 'dist/index.js'; return JSON.stringify(pack); }, 'is not in the snapshot'],
        ['bundled', cwd => { const pack = JSON.parse(simulatedPack(cwd)); pack[0].bundled = ['left-pad']; return JSON.stringify(pack); }, 'uncovered bundled dependencies'],
    ];
    for (const [, pack, diagnostic] of variants)
        expect(await refusal((await check(r, head, { pack })).run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining(diagnostic) });
});

test('single-root coverage: settings-only pnpm configuration is accepted; workspace members and bundled dependencies are not', async () => {
    const r = cms(), head = r.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): a [skip release]');
    expect(cmsPolicy()['pnpm-workspace.yaml']).toContain('allowBuilds');
    expect(await (await check(r, head)).run()).toMatchObject({ kind: 'allowed' });
    for (const extra of <Record<string, string>[]>[{ 'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n" },
        { 'package.json': cmsPolicy()['package.json'].replace('"private": false,', '"private": false,\n  "workspaces": ["packages/*"],') },
        { 'package.json': cmsPolicy()['package.json'].replace('"private": false,', '"private": false,\n  "bundleDependencies": ["ajv"],') }]) {
        const w = cms(extra), marked = w.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): a [skip release]');
        expect(await refusal((await check(w, marked)).run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringMatching(/uncovered (workspace members|bundled dependencies)/) });
    }
});

test('an unmarked range, or a marker reachable from the observed target, packs nothing', async () => {
    const r = cms(), plain = r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword');
    const unmarked = await check(r, plain);
    expect(await unmarked.run()).toEqual({ kind: 'unmarked' });
    expect(unmarked.npm.npmCalls()).toHaveLength(0);
    // The target carries a marked commit; an update-base merge brings it into the candidate.
    const t = cms();
    t.git(['checkout', '-q', '-b', 'candidate']);
    t.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): candidate');
    t.git(['checkout', '-q', 'main']);
    const advanced = t.commit({ 'OPERATING.md': 'operating 2\n' }, 'docs(operating): target-only [skip release]');
    t.git(['checkout', '-q', 'candidate']);
    t.git(['merge', '-q', '--no-edit', '-m', 'chore(merge): update base', 'main']);
    const merged = await check(t, t.head(), { target: advanced });
    expect(await merged.run()).toEqual({ kind: 'unmarked' });
    expect(merged.npm.npmCalls()).toHaveLength(0);
});

test('a shallow history that cuts the walk short cannot establish absence', async () => {
    const r = cms(), head = r.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword');
    const clone = markerRepo();
    clone.git(['fetch', '-q', '--depth=1', `file://${r.repo}`, 'main']);
    clone.git(['checkout', '-q', 'FETCH_HEAD']);
    const tool = fakeToolchain(clone.root), npm = npmRunner(tool);
    const stop = await refusal(checkReleaseMarkers({ store: { dataRoot: clone.data, project }, execute: npm.execute, job: { id: 'job-1' }, head, worktree: clone.repo,
        observed: { target: r.target, published: '' }, live: async () => ({ target: r.target, published: '' }), node: tool.node }));
    expect(stop).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('incomplete coverage') });
    expect(npm.npmCalls()).toHaveLength(0);
});
