import { expect, test } from 'vitest';
import { packageImpact } from '../../../../server/delivery/publication/package-impact';
import { packagePaths } from '../../../../server/delivery/publication/release-marker-paths';

const cms = packagePaths('cms-field-vocabulary');
const side = (paths: string[], manifest: Record<string, unknown> = { main: './dist/index.cjs', bin: { cli: 'bin/cli.mjs' } }) => ({ paths: new Set(paths), manifest });
const impact = (changed: string[], parent: string[], commit = parent, policy = cms) => packageImpact(changed.map(path => ({ status: 'M', path })), { parent: side(parent), commit: side(commit) }, policy);

test('membership changes, shipped paths and always-shipped files are package changes', () => {
    expect(impact(['wiki/.npmignore'], ['README.md', 'docs/a.md'], ['README.md'])).toEqual({ kind: 'package-change', paths: ['wiki/.npmignore'], inventoryPaths: ['docs/a.md'] });
    expect(impact(['docs/a.md'], ['docs/a.md'])).toEqual({ kind: 'package-change', paths: ['docs/a.md'], inventoryPaths: [] });
    for (const path of ['package.json', 'README.md', 'readme', 'LICENCE.txt', 'COPYING', 'dist/index.cjs', 'bin/cli.mjs', 'profiles/.gitignore', '.npmignore'])
        expect(impact([path], []).kind).toBe('package-change');
});

test('reviewed prefixes and build inputs are the project\'s own; everything else is indeterminate', () => {
    expect(impact(['wiki/a.md', 'scripts/wiki/graph/data/graph.json'], ['README.md'])).toEqual({ kind: 'allowed' });
    expect(impact(['src/index.ts', 'sources/profiles/a.json', 'scripts/build-catalog.mjs'], [])).toMatchObject({ kind: 'package-change', paths: ['scripts/build-catalog.mjs', 'sources/profiles/a.json', 'src/index.ts'] });
    expect(impact(['tests/a.test.mjs', 'wiki/a.md'], [])).toEqual({ kind: 'unclassified', paths: ['tests/a.test.mjs'] });
    // A file under a reviewed prefix that ships is a shipped file.
    expect(impact(['wiki/published/guide.md'], ['wiki/published/guide.md']).kind).toBe('package-change');
    // Another project reviewed nothing: even its wiki is indeterminate.
    expect(impact(['wiki/a.md'], [], [], packagePaths('accessibility-standards'))).toEqual({ kind: 'unclassified', paths: ['wiki/a.md'] });
});
