import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { command } from '../../../../server/workers/process';

const FIXTURES = resolve(import.meta.dirname, '../../../fixtures/release-marker');
const cleanup: (() => void)[] = [];
export function cleanupMarkerRepos() { cleanup.splice(0).forEach(fn => fn()); }

/** The committed CMS release wiring and manifest at 2c78305d, as fixture text. */
export function cmsPolicy(): Record<string, string> {
    const read = (name: string) => readFileSync(resolve(FIXTURES, 'cms-2c78305d', name), 'utf8');
    return { '.releaserc.cjs': read('.releaserc.cjs'), 'scripts/semantic-release-analyzer.cjs': read('semantic-release-analyzer.cjs'),
        'scripts/release-commits.cjs': read('release-commits.cjs'), 'package.json': read('package.json'), 'pnpm-workspace.yaml': read('pnpm-workspace.yaml') };
}
/** GH-189's marked message, d3ae220f. */
export const D3AE220F_MESSAGE = () => readFileSync(resolve(FIXTURES, 'cms-2c78305d', 'd3ae220f.message'), 'utf8');
/** A genuine npm 11.9.0 `pack --dry-run --json` result captured from CMS. */
export const genuinePack = (revision: '2c78305d' | 'd3ae220f') => readFileSync(resolve(FIXTURES, `npm-pack-${revision}.json`), 'utf8');
export const genuinePaths = (revision: '2c78305d' | 'd3ae220f') => (JSON.parse(genuinePack(revision))[0].files as { path: string }[]).map(file => file.path);

/** A standalone repository with real Git; commits are made with a fixed identity and dates. */
export function markerRepo() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-marker-'));
    cleanup.push(() => rmSync(root, { recursive: true, force: true }));
    const repo = resolve(root, 'repo'), data = resolve(root, 'data');
    mkdirSync(repo); mkdirSync(data);
    const env = { ...process.env, GIT_AUTHOR_NAME: 'Office Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Office Test', GIT_COMMITTER_EMAIL: 'test@example.com',
        GIT_AUTHOR_DATE: '2026-11-20T10:00:00Z', GIT_COMMITTER_DATE: '2026-11-20T10:00:00Z', GIT_CONFIG_NOSYSTEM: '1', HOME: root };
    const git = (args: string[], input?: string) => execFileSync('git', args, { cwd: repo, env, encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });
    git(['init', '-q', '-b', 'main']);
    git(['config', 'commit.gpgsign', 'false']);
    let tick = 0;
    /** Write (or with null, delete) files and commit them; returns the new commit. */
    const commit = (files: Record<string, string | null>, message: string) => {
        for (const [path, content] of Object.entries(files)) {
            const full = resolve(repo, path);
            if (content === null) { rmSync(full, { force: true }); continue; }
            mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, content);
        }
        git(['add', '-A']);
        const date = `2026-11-20T10:${String(++tick).padStart(2, '0')}:00Z`;
        execFileSync('git', ['commit', '-q', '--allow-empty', '-F', '-'], { cwd: repo, env: { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }, input: message });
        return git(['rev-parse', 'HEAD']).trim();
    };
    return { root, repo, data, git, commit, head: () => git(['rev-parse', 'HEAD']).trim() };
}

/** A Node toolchain directory whose `npm` exists, so resolution works without the machine's own npm. */
export function fakeToolchain(root: string) {
    const dir = resolve(root, 'toolchain');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'node'), '#!/bin/sh\nexit 0\n'); chmodSync(resolve(dir, 'node'), 0o755);
    writeFileSync(resolve(dir, 'npm-cli.js'), '// fixture npm\n');
    execFileSync('ln', ['-sf', resolve(dir, 'npm-cli.js'), resolve(dir, 'npm')]);
    return { node: resolve(dir, 'node'), cli: realpathSync(resolve(dir, 'npm-cli.js')) };
}

const walk = (root: string, at = ''): string[] => readdirSync(resolve(root, at)).flatMap(name => {
    const path = at ? `${at}/${name}` : name;
    return statSync(resolve(root, path)).isDirectory() ? walk(root, path) : [path];
});

/**
 * A small model of npm's selection for synthetic trees: the manifest's `files` entries (a trailing `/` covers a
 * directory), the files npm always ships, minus names listed in a `.npmignore` in the same directory. Ignore files
 * themselves never ship. Real npm output is the genuine CMS capture.
 */
export function simulatedPack(dir: string) {
    const manifest = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')), files: string[] = manifest.files ?? [];
    const ignored = (path: string) => {
        const ignore = resolve(dir, dirname(path), '.npmignore');
        return existsSync(ignore) && readFileSync(ignore, 'utf8').split('\n').map(line => line.trim()).filter(Boolean).includes(basename(path));
    };
    const paths = walk(dir).filter(path => !/(^|\/)\.(npm|git)ignore$/.test(path) && !ignored(path) &&
        (/^(package\.json|readme[^/]*|license[^/]*|licence[^/]*)$/i.test(path) || files.some(entry => entry.endsWith('/') ? path.startsWith(entry) : path === entry)));
    return JSON.stringify([{ id: `${manifest.name}@${manifest.version}`, name: manifest.name, version: manifest.version, size: 1, unpackedSize: 1, shasum: 'x', integrity: 'x',
        filename: `${manifest.name}-${manifest.version}.tgz`, files: paths.sort().map(path => ({ path, size: 1, mode: 420 })), entryCount: paths.length, bundled: [] }]);
}

/** The revision a snapshot directory was exported for (`rev-<sha>`). */
export const snapshotRevision = (cwd: string) => basename(cwd).replace(/^rev-/, '');

/**
 * A runner that executes real Git (so the repository is real) and answers npm itself: `--version` with `version`, and
 * `pack` with `pack(cwd)`. Every call is recorded with its exact argv.
 */
export function npmRunner(toolchain: { node: string; cli: string }, options: { version?: string; pack?: (cwd: string) => string; execute?: typeof command } = {}) {
    const calls: { program: string; args: string[]; options: any }[] = [];
    const base = options.execute ?? command;
    const execute = (async (program: string, args: string[], opts: any = {}) => {
        calls.push({ program, args, options: opts });
        if (program === toolchain.node && args[0] === toolchain.cli) {
            if (args[1] === '--version') return `${options.version ?? '11.9.0'}\n`;
            if (args[1] === 'pack') return (options.pack ?? simulatedPack)(opts.cwd);
        }
        return base(program, args, opts);
    }) as typeof command;
    return { execute, calls, npmCalls: () => calls.filter(call => call.program === toolchain.node) };
}

/**
 * For a synthetic runner: the release-marker walk's local reads of a complete history with no commit in range
 * (`rev-parse --is-shallow-repository`, `cat-file -e`, `log -z`). Undefined for every other command.
 */
export function unmarkedHistory(program: string, args: string[]): string | undefined {
    if (program !== 'git') return undefined;
    if (args[0] === 'rev-parse' && args[1] === '--is-shallow-repository') return 'false\n';
    if (args[0] === 'cat-file' && args[1] === '-e') return '';
    if (args[0] === 'log' && args[1] === '-z') return '';
    return undefined;
}
