import type { Store } from '../store/store';
import { command } from '../workers/process';
export async function targetObservation(store: Store, execute: typeof command = command) {
    const ref = store.project.target.startsWith('refs/heads/') ? store.project.target : 'refs/heads/' + store.project.target;
    await execute('git', ['check-ref-format', ref], { cwd: store.project.repo, readOnly: true });
    const remote = (await execute('git', ['remote', 'get-url', 'origin'], { cwd: store.project.repo, readOnly: true })).trim();
    if (!remote) throw new Error('Configured source remote is unavailable');
    const rows = (await execute('git', ['ls-remote', '--exit-code', '--', remote, ref], { cwd: store.project.repo, readOnly: true })).trim().split('\n');
    const [sha, observedRef] = rows[0]?.split(/\s+/) || [];
    if (rows.length !== 1 || observedRef !== ref || !/^[a-f0-9]{40,64}$/.test(sha)) throw new Error('One exact remote target commit is required');
    return { remote, ref, sha };
}
