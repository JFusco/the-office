import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { pushHookChain } from '../../github/identity/push-destination';
import type { command } from '../../workers/process';
import type { PushHookBaseline } from '../../../src/shared';

type Execute = typeof command;

/**
 * What a push from this checkout would run and where it would go: every effective push destination of origin, the
 * resolved hook directory and the digest of the hook chain with its executable delegates (`push-destination.ts`).
 * Read from the fetched target before any editing, it is the trusted baseline a maintenance push is compared with
 * on both the operator and App routes. A chain whose delegates cannot be established holds the publication.
 */
export async function pushHookBaseline(execute: Execute, worktree: string): Promise<PushHookBaseline> {
    const destinations = (await execute('git', ['remote', 'get-url', '--push', '--all', 'origin'], { cwd: worktree, readOnly: true, timeout: 30000 }))
        .split('\n').map(line => line.trim()).filter(Boolean);
    const raw = (await execute('git', ['rev-parse', '--git-path', 'hooks'], { cwd: worktree, readOnly: true, timeout: 30000 })).trim();
    let hooksPath: string;
    try { hooksPath = realpathSync(resolve(worktree, raw)); } catch { hooksPath = resolve(worktree, raw); }
    let chain: string;
    try { chain = await pushHookChain(execute, worktree); }
    catch { throw new Error('The candidate push hook chain cannot be established from the fetched target; maintenance publication is held (cutover blocker)'); }
    return { destinations, hooksPath, chain };
}

/** Before a push: the destination, hook directory and delegate chain are still exactly the trusted baseline. */
export async function assertPushHooksUnchanged(execute: Execute, worktree: string, baseline: PushHookBaseline): Promise<void> {
    let now: PushHookBaseline;
    try { now = await pushHookBaseline(execute, worktree); }
    catch { throw new Error('The candidate push hook chain changed and cannot be established; nothing was pushed'); }
    if (!isDeepStrictEqual(now.destinations, baseline.destinations)) throw new Error('The candidate push destination changed after editing; nothing was pushed');
    if (now.hooksPath !== baseline.hooksPath) throw new Error('The candidate hook path changed after editing; nothing was pushed');
    if (now.chain !== baseline.chain) throw new Error('The candidate push hook chain changed after editing; nothing was pushed');
}
