import { lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Ticket } from '../../../src/shared';
import type { Store } from '../../store/store';
import { command } from '../../workers/process';

/** Read-only source identity fence; no install, checkout, reset or candidate copy. */
export async function ownershipReadSource(store: Store, ticket: Ticket, execute = command) {
    const repo = realpathSync(store.project.repo), candidate = realpathSync(ticket.worktree);
    const fail = (): never => { throw new Error('The clean, registered QA candidate must retain its exact branch and head'); };
    if (repo !== resolve(store.project.repo) || candidate !== resolve(ticket.worktree) || candidate === repo ||
        lstatSync(resolve(candidate, '.git')).isSymbolicLink() || !/^codex\/[A-Za-z0-9._/-]+$/.test(ticket.branch)) return fail();
    const read = async (cwd: string, args: string[]) => (await execute('git', args, { cwd, timeout: 10000, readOnly: true })).trim();
    const common = await read(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
    if (!common || await read(candidate, ['rev-parse', '--path-format=absolute', '--git-common-dir']) !== common ||
        await read(candidate, ['remote', 'get-url', 'origin']) !== await read(repo, ['remote', 'get-url', 'origin']) ||
        await read(candidate, ['symbolic-ref', 'HEAD']) !== `refs/heads/${ticket.branch}` ||
        await read(candidate, ['rev-parse', 'HEAD']) !== ticket.commit || await read(candidate, ['status', '--porcelain'])) return fail();
    const rows = (await read(repo, ['worktree', 'list', '--porcelain'])).split('\n\n');
    if (rows.filter(r => r.split('\n').includes(`worktree ${candidate}`) && r.split('\n').includes(`HEAD ${ticket.commit}`) &&
        r.split('\n').includes(`branch refs/heads/${ticket.branch}`) && !/^locked(?: |$)|^prunable(?: |$)/m.test(r)).length !== 1) return fail();
    if (await read(candidate, ['rev-parse', 'HEAD']) !== ticket.commit || await read(candidate, ['status', '--porcelain']) ||
        await read(candidate, ['symbolic-ref', 'HEAD']) !== `refs/heads/${ticket.branch}`) return fail();
    return { worktree: candidate, branch: ticket.branch, head: ticket.commit, common };
}
