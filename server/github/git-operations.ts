import type { Store } from '../store/store';
import { command } from '../workers/process';
import { realpathSync } from 'node:fs';
export class GitOperations {
    constructor(private store: Store, private execute: typeof command = command) { }
    async candidate(worktree: string, head: string) {
        if (!/^[a-f0-9]{40}$/.test(head))
            throw new Error('Full immutable candidate head required');
        const read = async (...args: string[]) => (await this.execute('git', args, { cwd: worktree, readOnly: true, timeout: 30000 })).trim();
        const root = realpathSync(await read('rev-parse', '--show-toplevel'));
        if (root === realpathSync(this.store.project.repo) || await read('rev-parse', 'HEAD') !== head || await read('status', '--porcelain=v1', '--untracked-files=all'))
            throw new Error('Candidate ownership, exact head or clean isolated worktree is unverified');
        const base = await read('merge-base', `origin/${this.store.project.target}`, head);
        const diff = await read('diff', '--name-only', base, head);
        return { base, files: diff.split('\n').filter(Boolean), diff: await read('diff', '--stat', base, head) };
    }
}
