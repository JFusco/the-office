import { expect, test } from 'vitest';
import { digest } from '../../../server/store/readback-evidence';
import { ctoInputIdentityMatches } from '../../../server/conversations/cto-input-identity';
function fixture() {
    const original: any = { id: 'original', createdAt: '2026-11-13T20:52:08.679Z', error: 'retained', body: 'request', timing: [{ stage: 'conversation:cto', enqueuedAt: '2026-11-13T20:52:08.679Z' }] };
    const request: any = { createdAt: '2026-11-13T23:08:53.532Z', inputRecovery: { originalSha256: digest(original) } };
    original.timing.push({ stage: 'conversation:cto', enqueuedAt: request.createdAt });
    request.timing = structuredClone(original.timing);
    return { original, request };
}
test('accounts for exactly one legacy shared-array append without rewriting either record', () => {
    const { original, request } = fixture(), before = structuredClone({ original, request });
    expect(ctoInputIdentityMatches(original, request)).toBe(true);
    expect({ original, request }).toEqual(before);
});
test.each(['body', 'error', 'old-timing', 'stage', 'date', 'extra', 'different-array', 'missing-binding'])('rejects unaccounted %s drift', reason => {
    const { original, request } = fixture();
    if (reason === 'body') original.body += ' changed';
    if (reason === 'error') original.error += ' changed';
    if (reason === 'old-timing') original.timing[0].enqueuedAt = 'changed';
    if (reason === 'stage') original.timing[1].stage = 'implementation';
    if (reason === 'date') request.createdAt = 'invalid';
    if (reason === 'extra') original.timing.push({ ...original.timing[1] });
    if (reason === 'different-array') request.timing = [];
    if (reason === 'missing-binding') delete request.inputRecovery;
    expect(ctoInputIdentityMatches(original, request)).toBe(false);
});
