import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';

const FOLDER = 'knowledge-sources';
/** A path inside the project's private source folder. Traversal and symlinks are refused. */
export function privateFile(store: Pick<Store, 'dataRoot'>, relative: string): string {
    if (!/^[a-zA-Z0-9/_.-]+$/.test(relative) || relative.split('/').some(x => x === '..' || !x)) throw Error('Invalid source artifact path');
    const root = realpathSync(store.dataRoot), target = resolve(root, FOLDER, relative);
    let current = root;
    for (const part of [FOLDER, ...relative.split('/')]) {
        current = resolve(current, part);
        if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw Error('Source artifact symlink refused');
    }
    return target;
}
