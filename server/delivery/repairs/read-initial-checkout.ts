import { lstatSync, readdirSync, realpathSync, readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { ownedPath } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import type { command } from '../../workers/process';
import type { TicketJob } from '../../../src/shared';
import type { RepairCheckout } from '../../../src/contracts/ci-repair';

/** Positive proof of a private clone whose initial checkout never populated files or an index. */
export async function readInitialCheckout(store: Store, execute: typeof command, job: TicketJob, repair: RepairCheckout) {
    const path = repair.worktree, expected = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${repair.id}`, 'candidate');
    if (job.worktree || job.repairCycle || !/^[a-zA-Z0-9-]+$/.test(repair.id) || path !== expected || !repair.hooksPath) return null;
    ownedPath(store, path);
    const empty = () => {
        const git = lstatSync(resolve(path, '.git'), { throwIfNoEntry: false });
        return readdirSync(path).length === 1 && readdirSync(path)[0] === '.git' && git?.isDirectory() && !git.isSymbolicLink() &&
            !lstatSync(resolve(path, '.git/index'), { throwIfNoEntry: false }) && !lstatSync(resolve(path, '.git/index.lock'), { throwIfNoEntry: false });
    };
    if (!empty()) return null;
    ownedPath(store, resolve(path, '.git/config')); ownedPath(store, resolve(path, '.git/HEAD'));
    const read = async (...args: string[]) => (await execute('git', ['--no-optional-locks', ...args], { cwd: path, readOnly: true, timeout: 10000 })).trim();
    const gitDir = realpathSync(resolve(path, '.git'));
    const locations = (await read('rev-parse', '--path-format=absolute', '--absolute-git-dir', '--show-toplevel', '--git-path', 'index')).split('\n');
    if (locations.length !== 3 || realpathSync(locations[0]) !== gitDir || realpathSync(locations[1]) !== realpathSync(path) ||
        realpathSync(dirname(locations[2])) !== gitDir || basename(locations[2]) !== 'index') return null;
    const target = store.project.target;
    const defaultHead = () => readFileSync(resolve(path, '.git/HEAD'), 'utf8').trim() === `ref: refs/heads/${target}`;
    if (!defaultHead()) return null;
    const [origin, refsValue, configValue] = await Promise.all([
        read('remote', 'get-url', 'origin'),
        read('for-each-ref', '--format=%(refname)%00%(objectname)%00%(symref)', 'refs/heads/', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${target}`),
        read('config', '--local', '--null', '--list'),
    ]);
    if (origin !== `https://github.com/${store.project.repository}.git`) return null;
    const refs = refsValue.split('\n').map(row => row.split('\0')), heads = refs.filter(([name]) => name.startsWith('refs/heads/'));
    const remote = refs.find(([name]) => name === `refs/remotes/origin/${target}`), remoteHead = refs.find(([name]) => name === 'refs/remotes/origin/HEAD');
    if (heads.length !== 1 || heads[0][0] !== `refs/heads/${target}` || !/^[a-f0-9]{40}$/.test(heads[0][1]) || !remote || !remoteHead ||
        heads[0][1] !== remote[1] || remoteHead[1] !== remote[1] || remoteHead[2] !== `refs/remotes/origin/${target}`) return null;
    const config = configValue.split('\0').filter(Boolean).map(entry => {
        const at = entry.indexOf('\n'); return [entry.slice(0, at).toLowerCase(), entry.slice(at + 1)];
    });
    const hooks = config.filter(([key]) => key === 'core.hookspath');
    if (config.some(([key]) => key === 'core.worktree') || config.find(([key]) => key === 'core.bare')?.[1] !== 'false' ||
        hooks.length > 1 || hooks.length && hooks[0][1] !== repair.hooksPath || !empty() || !defaultHead()) return null;
    return { hooksConfigured: hooks.length === 1 };
}
