import { afterEach } from 'vitest';
import { fenceTokenDigest } from '../../../server/office/deployment-fence';
import { createDeployToken } from '../../../server/release/deploy-token';
import { world, type Behaviour, type World } from './deploy-world';

export const OP = 'deploy-20261120t030000z-0a0b0c0d';
const worlds: World[] = [];
afterEach(() => worlds.splice(0).forEach(w => w.close()));

/** A fresh fake machine that is closed after the test. */
export function make(behaviour: Behaviour = {}): World { const w = world(behaviour); worlds.push(w); return w; }

/** A machine whose operation `OP` already has its fence token, with the token and its digest. */
export function tokened(behaviour: Behaviour = {}) {
    const w = make(behaviour), token = createDeployToken(w.dataRoot, OP);
    return { w, token, digest: fenceTokenDigest(token) };
}
