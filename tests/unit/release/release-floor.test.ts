import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { RELEASE_FLOOR, readReleaseFloor } from '../../../server/release/release-floor';
import { command } from '../../../server/workers/process';
import { fakeRunner, type RunnerCall } from './deploy-world';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test' };
const scratch = () => { const root = mkdtempSync(resolve(tmpdir(), 'office-floor-')); roots.push(root); return root; };
const clone = (from: string, ...options: string[]) => { const to = scratch(); execFileSync('git', ['clone', '-q', ...options, `file://${from}`, to], { env: ENV, stdio: 'ignore' }); return to; };

/**
 * A real local history, with `main` at `merged` and `line` at `after`:
 *
 *     before ── floor ── after ── merged
 *        └───── beside ─────────────┘
 */
function history() {
    const root = scratch(), git = (...args: string[]) => execFileSync('git', args, { cwd: root, env: ENV, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const commit = (subject: string) => { git('commit', '-q', '--allow-empty', '-m', subject); return git('rev-parse', 'HEAD'); };
    git('init', '-q', '-b', 'main');
    const before = commit('before'), floor = commit('floor'), after = commit('after');
    git('branch', 'line');
    git('switch', '-q', '-c', 'side', before);
    const beside = commit('beside');
    git('switch', '-q', 'main'); git('merge', '-q', '--no-ff', '-m', 'merged', 'side');
    return { root, git, commit, before, floor, after, beside, merged: git('rev-parse', 'HEAD') };
}
const below = (reason: string) => ({ holds: false, reason: expect.stringContaining(reason) });

test('the floor, a descendant and a merge that contains it hold; an ancestor and a sibling do not', async () => {
    const { root, before, floor, after, beside, merged } = history();
    for (const commit of [floor, after, merged]) expect(await readReleaseFloor(command, root, commit, floor)).toEqual({ holds: true });
    for (const commit of [before, beside]) expect(await readReleaseFloor(command, root, commit, floor)).toEqual(below(`Release ${commit} does not descend from the release floor ${floor}`));
});

test('a commit or a floor the repository does not have, and a folder with no repository, do not hold', async () => {
    const { root, floor, after } = history(), absent = 'f'.repeat(40), bare = scratch();
    expect(await readReleaseFloor(command, root, absent, floor)).toEqual(below(`Commit ${absent} could not be read in ${root}`));
    expect(await readReleaseFloor(command, root, after, absent)).toEqual(below(`The release floor ${absent} could not be read in ${root}`));
    expect(await readReleaseFloor(command, bare, after, floor)).toEqual(below(`The history in ${bare} could not be read to compare ${after} with the release floor ${floor}`));
});

test('a shallow clone never holds: not when the floor is cut off, not for the floor itself, not for a descendant it can still see', async () => {
    const { root, floor, after, merged } = history();
    const tip = clone(root, '--depth', '1'), line = clone(root, '--depth', '2', '--branch', 'line');
    // The first clone has the newest commit alone; the second has `after` and `floor`, with the parent link between them.
    expect(execFileSync('git', ['rev-list', '--all'], { cwd: line, env: ENV, encoding: 'utf8' }).trim().split('\n')).toEqual([after, floor]);
    expect(await readReleaseFloor(command, tip, merged, floor)).toEqual(below(`The history in ${tip} is shallow, so it cannot show whether ${merged} descends from the release floor ${floor}`));
    expect(await readReleaseFloor(command, tip, merged, merged)).toEqual(below(`The history in ${tip} is shallow`));
    expect(await readReleaseFloor(command, line, floor, floor)).toEqual(below(`The history in ${line} is shallow`));
    expect(await readReleaseFloor(command, line, after, floor)).toEqual(below(`The history in ${line} is shallow`));
    // The same commits in a full clone are read as they are.
    const full = clone(root);
    expect(await readReleaseFloor(command, full, after, floor)).toEqual({ holds: true });
});

test('parents are read as committed: a replacement ref or a graft file changes no answer', async () => {
    const { root, git, before, floor, after, beside } = history();
    // `before` given the floor as its parent, and `after` given none.
    git('replace', '--graft', before, floor); git('replace', '--graft', after);
    expect(git('rev-list', '--max-count=1', floor, `^${before}`)).toBe('');
    expect(git('rev-list', '--max-count=1', floor, `^${after}`)).toBe(floor);
    expect(await readReleaseFloor(command, root, before, floor)).toEqual(below(`Release ${before} does not descend from the release floor ${floor}`));
    expect(await readReleaseFloor(command, root, after, floor)).toEqual({ holds: true });
    mkdirSync(resolve(root, '.git/info'), { recursive: true });
    writeFileSync(resolve(root, '.git/info/grafts'), `${beside} ${floor}\n`);
    expect(await readReleaseFloor(command, root, beside, floor)).toEqual(below(`Release ${beside} does not descend from the release floor ${floor}`));
});

test('a commit only a partial clone\'s remote has is not fetched: it does not hold and stays absent', async () => {
    const { root, git, commit, floor, merged } = history();
    git('config', 'uploadpack.allowFilter', 'true');
    const partial = clone(root, '--filter=blob:none', '--no-local'), later = commit('later');
    const present = () => { try { execFileSync('git', ['cat-file', '-e', later], { cwd: partial, env: { ...ENV, GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' }, stdio: 'ignore' }); return true; } catch { return false; } };
    expect(present()).toBe(false);
    expect(await readReleaseFloor(command, partial, later, floor)).toEqual(below(`Commit ${later} could not be read in ${partial}`));
    expect(present()).toBe(false);
    expect(await readReleaseFloor(command, partial, merged, floor)).toEqual({ holds: true });
});

/** A fake git: a complete history that has every commit and leaves none outside, unless told otherwise. */
const fakeGit = (over: { shallow?: string; resolved?: (sha: string) => string; outside?: string | Error } = {}) => fakeRunner(call => {
    if (call.args.includes('--is-shallow-repository')) return `${over.shallow ?? 'false'}\n`;
    if (call.args[0] === 'rev-parse') return `${(over.resolved ?? (sha => sha))(call.args.at(-1)!.slice(0, 40))}\n`;
    if (over.outside instanceof Error) throw over.outside;
    return over.outside ?? '';
});

test('it only reads: four read-only git commands in the repository, as committed and offline, against the floor this release names', async () => {
    const target = 'b'.repeat(40), { calls, execute } = fakeGit(), options: unknown[] = [];
    const recording = ((program: string, args: string[], given: unknown) => { options.push(given); return execute(program, args, given as never); }) as typeof command;
    expect(await readReleaseFloor(recording, '/repo', target)).toEqual({ holds: true });
    expect(calls.map((call: RunnerCall) => [call.program, ...call.args])).toEqual([
        ['git', 'rev-parse', '--is-shallow-repository'],
        ['git', 'rev-parse', '--verify', `${target}^{commit}`],
        ['git', 'rev-parse', '--verify', `${RELEASE_FLOOR}^{commit}`],
        ['git', 'rev-list', '--max-count=1', RELEASE_FLOOR, `^${target}`],
    ]);
    const env = { GIT_NO_REPLACE_OBJECTS: '1', GIT_GRAFT_FILE: '/dev/null', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' };
    expect(options).toEqual(calls.map(() => ({ cwd: '/repo', env, readOnly: true, timeout: 60_000 })));
    expect(RELEASE_FLOOR).toMatch(/^[0-9a-f]{40}$/);
});

test('an answer that is not proof does not hold', async () => {
    const target = 'b'.repeat(40), other = 'e'.repeat(40);
    const read = (over: Parameters<typeof fakeGit>[0]) => readReleaseFloor(fakeGit(over).execute as typeof command, '/repo', target);
    expect(await read({ shallow: 'true' })).toEqual(below('The history in /repo is shallow'));
    // A git too old to know the question echoes it; silence is no answer either.
    for (const shallow of ['--is-shallow-repository', '']) expect(await read({ shallow })).toEqual(below('The history in /repo is not known to be complete'));
    expect(await read({ resolved: () => other })).toEqual(below(`Commit ${target} could not be read`));
    expect(await read({ resolved: sha => sha === target ? sha : other })).toEqual(below(`The release floor ${RELEASE_FLOOR} could not be read`));
    expect(await read({ outside: `${RELEASE_FLOOR}\n` })).toEqual(below('does not descend'));
    expect(await read({ outside: new Error('git exited 128: fatal: bad object') }))
        .toEqual({ holds: false, reason: `The history in /repo could not be read to compare ${target} with the release floor ${RELEASE_FLOOR}: git exited 128: fatal: bad object` });
    await expect(readReleaseFloor(fakeGit().execute as typeof command, '/repo', 'main')).rejects.toThrow('40-character');
});
