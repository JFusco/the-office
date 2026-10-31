import {createHash} from 'node:crypto';
import {lstatSync,realpathSync,readFileSync} from 'node:fs';
import {isAbsolute,relative,resolve,sep} from 'node:path';
import {processGroupAlive} from '../workers/process';
import type {Store} from './store';
import type {WorkTime} from '../../src/shared';
export const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export const digest=(value:unknown)=>sha(JSON.stringify(value));
export function terminationObservation(store: Store, work: WorkTime) {
    if (!work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 || processGroupAlive(work.processId))
        throw new Error('Confirmed owned worker group termination required');
    return { workerId: work.id, nativeSessionId: work.sessionId, processGroupId: work.processId,
        source: 'Office WorkTime.processId; provider spawned with detached=true',
        probe: 'process.kill(-processGroupId, 0)', result: 'ESRCH', observedAt: store.clock.now().toISOString() };
}
export function ownedPath(store: Pick<Store, 'dataRoot'>, path: string) {
    const suffix = relative(resolve(store.dataRoot), path);
    if (path !== resolve(path) || !suffix || suffix === '..' || suffix.startsWith(`..${sep}`) || isAbsolute(suffix))
        throw new Error('Owned validation path required');
    let current = realpathSync(store.dataRoot);
    return suffix.split(sep).map((part, index, parts) => {
        current = resolve(current, part);
        const stat = lstatSync(current);
        if (stat.isSymbolicLink() || index < parts.length - 1 && !stat.isDirectory())
            throw new Error('Owned validation path must not contain symbolic links');
        return { path: current, dev: stat.dev, ino: stat.ino };
    });
}
export function artifact(store: Store, path: string) { return rootArtifact(store.dataRoot, path); }
/** A separately verified candidate root may contain immutable tracked source references. */
export function rootArtifact(dataRoot: string, path: string) {
    const ownership = ownedPath({dataRoot}, path), stat = lstatSync(path);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024)
        throw new Error('Owned bounded validation artifact required');
    return { path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), ownership };
}
