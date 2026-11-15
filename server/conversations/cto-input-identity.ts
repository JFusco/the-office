import { isDeepStrictEqual } from 'node:util';
import type { TeamMessage } from '../../src/shared';
import { digest } from '../store/readback-evidence';

/** Retain legacy timing mutation; require exact reconstruction of its bound original. */
export function ctoInputIdentityMatches(original: TeamMessage, request: TeamMessage): boolean {
    const bound = request.inputRecovery?.originalSha256;
    if (!bound) return false;
    if (digest(original) === bound) return true;
    const timing = original.timing;
    if (!timing || timing.length !== 2 || !isDeepStrictEqual(timing, request.timing)) return false;
    const [first, appended] = timing;
    const created = Date.parse(request.createdAt);
    if (first.stage !== 'conversation:cto' || first.enqueuedAt !== original.createdAt ||
        appended.stage !== 'conversation:cto' || appended.enqueuedAt !== request.createdAt ||
        !Number.isFinite(created) || !(created > Date.parse(original.createdAt))) return false;
    return digest({ ...original, timing: timing.slice(0, -1) }) === bound;
}
