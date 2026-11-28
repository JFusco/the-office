import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { AS_COMMITTED } from '../../release/release-floor';
import type { command } from '../../workers/process';
import { indeterminate } from './release-marker-stop';

export type Execute = typeof command;
type Options = NonNullable<Parameters<Execute>[2]>;
export type Git = (args: string[], options?: Pick<Options, 'env' | 'input' | 'timeout'>) => Promise<string>;

const SHA = /^[a-f0-9]{40}$/;
export const isSha = (value: unknown): value is string => typeof value === 'string' && SHA.test(value);

/**
 * Git that reads commits as they were made (`server/release/release-floor.ts`): no replacement refs or grafts,
 * which give a commit other parents under the same name, and no lazy fetch of a missing object. Read-only.
 */
export function originalGit(execute: Execute, cwd: string): Git {
    return (args, options = {}) => execute('git', args, { cwd, readOnly: true, timeout: options.timeout ?? 60_000, input: options.input, env: { ...AS_COMMITTED, ...options.env } });
}

/** The same settings for an existing helper that takes a runner, such as `rewordCommits`. */
export function localGitRunner(execute: Execute): Execute {
    return (program, args, options = {}) => program === 'git' ? execute(program, args, { ...options, env: { ...AS_COMMITTED, ...options.env } }) : execute(program, args, options);
}

/**
 * The commits a shallow history cuts off below, or an empty set for a complete one. Only an explicit `false` is
 * complete (`release-floor.ts`); a walk that reaches one of these cannot establish what lies beyond it.
 */
/** A local history read that failed is incomplete coverage, never an untyped stop. */
const unreadable = (what: string) => (error: unknown): never => { throw indeterminate(`incomplete coverage: ${what} could not be read: ${String(error).replace(/^Error:\s*/, '').slice(0, 300)}`); };

export async function shallowBoundaries(git: Git, cwd: string): Promise<Set<string>> {
    const shallow = (await git(['rev-parse', '--is-shallow-repository']).catch(unreadable(`whether the history in ${cwd} is shallow`))).trim();
    if (shallow === 'false') return new Set();
    if (shallow !== 'true') throw indeterminate(`incomplete coverage: the history in ${cwd} is not known to be complete`);
    const path = (await git(['rev-parse', '--git-path', 'shallow']).catch(unreadable(`the shallow boundary of ${cwd}`))).trim();
    let text: string;
    try { text = readFileSync(isAbsolute(path) ? path : resolve(cwd, path), 'utf8'); } catch (error) { return unreadable(`the shallow boundary file of ${cwd}`)(error); }
    const lines = text.split('\n').filter(Boolean);
    if (!lines.every(isSha)) throw indeterminate('incomplete coverage: the shallow boundary list is unreadable');
    return new Set(lines);
}

/** Whether this repository holds the commit itself, without fetching it. */
export async function hasCommit(git: Git, oid: string): Promise<boolean> {
    if (!isSha(oid)) return false;
    return git(['cat-file', '-e', `${oid}^{commit}`]).then(() => true, () => false);
}

/** One commit of a walk: its identity, every parent and its complete message. */
export interface WalkedCommit { sha: string; parents: string[]; message: string }

/**
 * Every commit reachable from `head` and from none of `exclude`, across every parent, with its full raw message.
 * A record that does not parse exactly is never guessed at.
 */
export async function walkCommits(git: Git, head: string, exclude: string[]): Promise<WalkedCommit[]> {
    if (!isSha(head) || !exclude.every(isSha)) throw indeterminate('incomplete coverage: an exact commit identity is required for the walk');
    const out = await git(['log', '-z', '--no-show-signature', '--no-color', '--no-decorate', '--no-mailmap', '--format=%H%n%P%n%B', head, ...exclude.map(sha => `^${sha}`), '--'], { timeout: 120_000 })
        .catch(unreadable(`the local history of ${head}`));
    const records = out.split('\0');
    if (records.at(-1)?.replace(/\n/g, '') === '') records.pop();
    return records.map((record, index) => {
        const text = index ? record.replace(/^\n/, '') : record, first = text.indexOf('\n'), second = text.indexOf('\n', first + 1);
        const sha = text.slice(0, first), parents = text.slice(first + 1, second).split(' ').filter(Boolean);
        if (first !== 40 || second < 0 || !isSha(sha) || !parents.every(isSha)) throw indeterminate('incomplete coverage: a commit record in the walk is ambiguous');
        return { sha, parents, message: text.slice(second + 1) };
    });
}
