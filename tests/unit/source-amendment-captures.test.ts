import { expect, test } from 'vitest';
import { verifyReleaseCaptures } from '../../server/source-amendment-captures';
import { RELEASE_SOURCE_IDS, sourceHash, sourceJson } from '../../server/source-amendment-scope';

function fixture() {
    const urls = ['https://docs.optimizely.com/cms-saas/release-notes', 'https://docs.optimizely.com/cms-12/release-notes', 'https://docs.optimizely.com/cms-13/release-notes'];
    const registrations = RELEASE_SOURCE_IDS.map((id, index) => ({ id, url: urls[index], role: 'release-index', extract: { identityPattern: '(2026\\.\\d+)', identityCapture: 1 } }));
    const captures = registrations.map(source => {
        const body = '<script>ignored</script>  Release 2026.1 <!-- private -->', normalized = 'Release 2026.1';
        const observation = { sourceId: source.id, url: source.url, reviewStatus: 'reviewed', removed: false, identities: ['2026.1'],
            rawSha256: sourceHash(body), normalizedSha256: sourceHash(normalized), fragmentSha256: sourceHash(sourceJson(['2026.1'])),
            observedAt: '2026-10-29T20:00:00Z', missingRequiredTokens: [], missingObservedTokens: [], requiredTokens: [], observedTokens: null, observedTokenSetSha256: null };
        return { sourceId: source.id, url: source.url, body, observation };
    });
    const locks = captures.map(capture => ({ ...capture.observation, reviewedAt: capture.observation.observedAt, requiredTokenSetSha256: sourceHash(sourceJson([])) }));
    return { registrations, captures, locks };
}
test('consistent retained native observations pass without a vendor fetch', () => {
    const a = fixture(); expect(verifyReleaseCaptures(a.registrations, a.locks, a.captures)).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['raw', 'normalized', 'fragment', 'url', 'empty', 'signin', 'tokens', 'timestamp', 'missing', 'duplicate'] as const)('rejects retained capture %s', mutation => {
    const a = fixture(), capture = a.captures[0];
    const errors = { raw: 'rawSha256 disagree', normalized: 'normalizedSha256 disagree', fragment: 'fragmentSha256 disagree', url: 'exact official release index',
        empty: 'empty or exceeds', signin: 'Empty, sign-in or unrelated', tokens: 'Native observation is incomplete', timestamp: 'Native observation is incomplete', missing: 'Exactly three unique', duplicate: 'Exactly three unique' };
    if (mutation === 'raw') capture.body += ' ';
    if (mutation === 'normalized') capture.observation.normalizedSha256 = 'wrong';
    if (mutation === 'fragment') a.locks[0].fragmentSha256 = 'wrong';
    if (mutation === 'url') capture.url = 'https://example.com/signin';
    if (mutation === 'empty') capture.body = '';
    if (mutation === 'signin') capture.body = '<html>Sign in to continue</html>';
    if (mutation === 'tokens') (capture.observation.missingObservedTokens as string[]).push('required');
    if (mutation === 'timestamp') a.locks[0].reviewedAt = '2026-10-28T20:00:00Z';
    if (mutation === 'missing') a.captures.pop();
    if (mutation === 'duplicate') a.captures[2] = capture;
    expect(() => verifyReleaseCaptures(a.registrations, a.locks, a.captures)).toThrow(errors[mutation]);
});
