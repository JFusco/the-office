import { expect, test } from 'vitest';
import { readReleasePolicy } from '../../../../server/delivery/publication/release-marker-policy';
import { cmsPolicy } from '../support/marker-repo';

const TARGET = 'a'.repeat(40);
const reader = (files: Record<string, string>) => (async (args: string[]) => {
    const [rev, path] = args[2].split(':');
    if (args[0] !== 'cat-file' || args[1] !== 'blob' || rev !== TARGET || !(path in files)) throw new Error('missing');
    return files[path];
}) as any;
const reason = (promise: Promise<unknown>) => promise.then(() => '', (error: any) => error.evidence?.diagnostic ?? String(error));

test('CMS\'s committed wiring at 2c78305d is recognised from the target commit, as data', async () => {
    const policy = await readReleasePolicy(reader(cmsPolicy()), TARGET);
    expect(policy).toMatchObject({ marker: '[skip release]', target: TARGET });
    expect(Object.keys(policy.sha256).sort()).toEqual(['.releaserc.cjs', 'scripts/release-commits.cjs', 'scripts/semantic-release-analyzer.cjs']);
});

test('the official analyzer selected directly, a case-changed marker or a missing file is unknown wiring', async () => {
    const files = cmsPolicy();
    expect(await reason(readReleasePolicy(reader({ ...files, '.releaserc.cjs': files['.releaserc.cjs'].replace("'./scripts/semantic-release-analyzer.cjs'", "'@semantic-release/commit-analyzer'") }), TARGET))).toContain('does not select');
    expect(await reason(readReleasePolicy(reader({ ...files, 'scripts/release-commits.cjs': files['scripts/release-commits.cjs'].replace('[skip release]', '[Skip Release]') }), TARGET))).toContain('does not drop the literal');
    const { ['scripts/release-commits.cjs']: _gone, ...rest } = files;
    expect(await reason(readReleasePolicy(reader(rest), TARGET))).toContain('is not committed at target');
});

test('the predicate must be the exported filter\'s active return expression, not text left in a comment', async () => {
    const files = cmsPolicy(), filter = files['scripts/release-commits.cjs'];
    const changed = [
        filter.replace(/return commits\.filter\([^\n]*\);/, "return commits; // commits.filter(commit => !String(commit.message || '').includes('[skip release]'))"),
        filter.replace(/return commits\.filter\([^\n]*\);/, "/* return commits.filter(commit => !String(commit.message || '').includes('[skip release]')); */ return commits;"),
        filter.replace(/return commits\.filter\([^\n]*\);/, "return commits.filter(commit => !String(commit.message || '').includes('[skip release]')) && [];"),
        `${filter}\nfunction filterReleaseCommits(commits = []) { return commits; }\n`,
    ];
    for (const text of changed) {
        expect(text).toContain("commits.filter(commit => !String(commit.message || '').includes('[skip release]'))");
        expect(await reason(readReleasePolicy(reader({ ...files, 'scripts/release-commits.cjs': text }), TARGET))).toContain('does not drop the literal');
    }
    expect(await readReleasePolicy(reader(files), TARGET)).toMatchObject({ marker: '[skip release]' });
});

// Review repair pass (run cab5a4a5): the active analyzer call, and JavaScript's line-break rule for return.
test('an analyzer call left only in a comment, or a line break right after return, is unknown wiring; the pinned wiring still passes', async () => {
    const files = cmsPolicy(), analyzer = files['scripts/semantic-release-analyzer.cjs'], filter = files['scripts/release-commits.cjs'];
    const call = 'commits: filterReleaseCommits(context.commits),';
    expect(analyzer).toContain(call);
    const analyzers = [
        analyzer.replace(call, `commits: context.commits, // ${call}`),
        analyzer.replace(call, `commits: context.commits, /* ${call} */`),
        analyzer.replace(/return official\.analyzeCommits\(/, 'return\n    official.analyzeCommits('),
        analyzer.replace(/return official\.analyzeCommits\([\s\S]*?\}\);/, `const unused = { ${call} };\n  return official.analyzeCommits(pluginConfig, context);`),
        `${analyzer}\nasync function analyzeCommits(pluginConfig, context) { return (await import('@semantic-release/commit-analyzer')).analyzeCommits(pluginConfig, context); }\n`,
    ];
    for (const text of analyzers) {
        expect(text).toContain('filterReleaseCommits(context.commits)');
        expect(await reason(readReleasePolicy(reader({ ...files, 'scripts/semantic-release-analyzer.cjs': text }), TARGET))).toContain('does not apply the committed filter');
    }
    const filters = [filter.replace(/return commits\.filter\(/, 'return\n    commits.filter('), filter.replace(/return commits\.filter\(/, 'return /*\n */ commits.filter(')];
    for (const text of filters) {
        expect(text).toContain("commits.filter(commit => !String(commit.message || '').includes('[skip release]'))");
        expect(await reason(readReleasePolicy(reader({ ...files, 'scripts/release-commits.cjs': text }), TARGET))).toContain('does not drop the literal');
    }
    // A same-line comment after return does not end the statement.
    const inline = filter.replace(/return commits\.filter\(/, 'return /* the reviewed predicate */ commits.filter(');
    expect(await readReleasePolicy(reader({ ...files, 'scripts/release-commits.cjs': inline }), TARGET)).toMatchObject({ marker: '[skip release]' });
    expect(await readReleasePolicy(reader(files), TARGET)).toMatchObject({ marker: '[skip release]', sha256: { 'scripts/semantic-release-analyzer.cjs': expect.stringMatching(/^[a-f0-9]{64}$/) } });
});
