import { createHash } from 'node:crypto';

const sha = (text: string) => createHash('sha1').update(text).digest('hex');

/**
 * The local Git a worktree salvage reads and writes, held in memory: the worktree's head and its
 * contents, the refs, the objects the harness makes from the index and the pre-reset head. A ref
 * created against an empty old value fails when it exists, as Git's does. Never touches a real
 * repository. `answer` returns the reply to a salvage command, or undefined for any other one.
 */
export function salvageGit(start: { head: string; branch: string; contents?: string }) {
    const git = {
        head: start.head, branch: start.branch,
        /** What `git status --porcelain` prints for the worktree; empty when clean. */
        contents: start.contents ?? '',
        origHead: '',
        refs: new Map<string, string>(),
        commits: new Map<string, { parents: string[]; subject: string; tree: string }>(),
        /** Every write the salvage sent, as its arguments. */
        writes: [] as string[],
        /** Runs before a write is applied; throw to make it fail. */
        onWrite: undefined as ((command: string, args: string[]) => void) | undefined,
    };
    const tree = () => `tree-${sha(`${git.head}|${git.contents}`)}`;
    const answer = (program: string, args: string[]): string | undefined => {
        if (program !== 'git') return undefined;
        const [command, ...rest] = args;
        // The accepted commit's check is listed with the writes: a test can act at the moment the salvage begins.
        if (['cat-file', 'add', 'write-tree', 'commit-tree', 'update-ref', 'reset', 'clean'].includes(command)) {
            git.writes.push(args.join(' '));
            git.onWrite?.(command, args);
        }
        switch (command) {
            case 'branch': return rest[0] === '--show-current' ? git.branch : undefined;
            case 'cat-file': return '';
            case 'submodule': return '';
            case 'status': return git.contents;
            case 'rev-parse': {
                const name = rest.filter(arg => arg !== '--verify').at(-1)!;
                if (name === 'HEAD') return git.head;
                if (name === 'ORIG_HEAD^{commit}') { if (!git.origHead) throw new Error('fatal: Needed a single revision'); return git.origHead; }
                if (name.endsWith('^{tree}')) { const object = name.slice(0, -'^{tree}'.length); return git.commits.get(object)?.tree ?? `tree-of-${object}`; }
                return undefined;
            }
            case 'for-each-ref': {
                const ref = rest.at(-1)!, object = git.refs.get(ref);
                return object ? `${ref} ${object}` : '';
            }
            case 'show': {
                const object = rest.at(-1)!, made = git.commits.get(object);
                return made ? `P:${made.parents.join(' ')}\nS:${made.subject}` : `P:${'0'.repeat(40)}\nS:work of the stopped run`;
            }
            case 'add': return '';
            case 'write-tree': return tree();
            case 'commit-tree': {
                const object = sha(args.join(' '));
                git.commits.set(object, { parents: [rest[rest.indexOf('-p') + 1]], subject: rest[rest.indexOf('-m') + 1], tree: rest[0] });
                return object;
            }
            case 'update-ref': {
                const [ref, object, old] = rest;
                if (old === '' && git.refs.has(ref)) throw new Error(`fatal: update_ref failed for ref '${ref}': reference already exists`);
                git.refs.set(ref, object);
                return '';
            }
            case 'reset': git.origHead = git.head; git.head = rest[1]; git.contents = ''; return '';
            case 'clean': return '';
        }
        return undefined;
    };
    return { git, answer };
}
