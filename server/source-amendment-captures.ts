import { isDeepStrictEqual } from 'node:util';
import { RELEASE_SOURCE_IDS, sourceHash, sourceJson } from './source-amendment-scope';

const officialUrls: Record<string, string> = {
    'optimizely-saas.release-notes-index': 'https://docs.optimizely.com/cms-saas/release-notes',
    'optimizely-paas.release-notes-index': 'https://docs.optimizely.com/cms-12/release-notes',
    'optimizely-paas.cms13-release-notes-index': 'https://docs.optimizely.com/cms-13/release-notes',
};
function assert(condition: unknown, detail: string): asserts condition { if (!condition) throw new Error(detail); }
/** Matches the pinned native index normalizer; QA also reproduces this using that native scanner. */
function normalize(value: string): string {
    return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--([\s\S]*?)-->/g, ' ')
        .replace(/\b(?:nonce|data-request-id|data-build-id|data-timestamp|data-cfemail)=(['"])[\s\S]*?\1/gi, ' ')
        .replace(/\s+/g, ' ').trim();
}
export interface ReleaseCapture { sourceId: string; url: string; body: string; observation: Record<string, any> }

/** Every accepted fingerprint must derive from the same retained response body. */
export function verifyReleaseCaptures(registrations: Record<string, any>[], locks: Record<string, any>[], captures: ReleaseCapture[]): string {
    assert(captures.length === 3 && new Set(captures.map(capture => capture.sourceId)).size === 3, 'Exactly three unique retained captures are required');
    for (const sourceId of RELEASE_SOURCE_IDS) {
        const selected = registrations.filter(source => source.id === sourceId), records = locks.filter(source => source.sourceId === sourceId), found = captures.filter(capture => capture.sourceId === sourceId);
        assert(selected.length === 1 && records.length === 1 && found.length === 1, `Capture/source identity is incomplete: ${sourceId}`);
        const source = selected[0], locked = records[0], capture = found[0], observation = capture.observation;
        assert(source.url === officialUrls[sourceId] && capture.url === source.url && observation.url === source.url &&
            observation.sourceId === sourceId && source.role === 'release-index' && observation.reviewStatus === 'reviewed' && !observation.removed,
            `Capture did not verify the exact official release index: ${sourceId}`);
        assert(capture.body.length > 0 && Buffer.byteLength(capture.body) <= 16000000, 'Retained capture is empty or exceeds its bound');
        const normalized = normalize(capture.body), extraction = source.extract;
        assert(typeof extraction?.identityPattern === 'string' && extraction.identityPattern.length <= 2000, 'Bounded native release extraction is required');
        const flags = extraction.identityFlags || 'g', expression = new RegExp(extraction.identityPattern, flags.includes('g') ? flags : `${flags}g`);
        const identities = new Set<string>();
        for (const match of normalized.matchAll(expression)) {
            const value = match[extraction.identityCapture || 0];
            if (typeof value === 'string' && value.trim()) identities.add(value.trim());
            assert(identities.size < 2000, 'Release identity extraction exceeded its bound');
        }
        const actual = [...identities].sort();
        assert(actual.length > 0 && isDeepStrictEqual(observation.identities, actual) && isDeepStrictEqual(locked.identities, actual), `Empty, sign-in or unrelated capture cannot supply release identities: ${sourceId}`);
        for (const [key, value] of Object.entries({ rawSha256: sourceHash(capture.body), normalizedSha256: sourceHash(normalized), fragmentSha256: sourceHash(sourceJson(actual)) }))
            assert(observation[key] === value && locked[key] === value, `Retained response and locked ${key} disagree: ${sourceId}`);
        assert(Number.isFinite(Date.parse(observation.observedAt)) && observation.observedAt === locked.observedAt && locked.reviewedAt === observation.observedAt &&
            Array.isArray(observation.missingRequiredTokens) && observation.missingRequiredTokens.length === 0 &&
            Array.isArray(observation.missingObservedTokens) && observation.missingObservedTokens.length === 0 &&
            Array.isArray(observation.requiredTokens) && observation.requiredTokens.length === 0 &&
            observation.observedTokens === null && observation.observedTokenSetSha256 === null &&
            locked.requiredTokenSetSha256 === sourceHash(sourceJson([])), `Native observation is incomplete or inconsistent: ${sourceId}`);
    }
    return sourceHash(sourceJson(captures.map(capture => ({ sourceId: capture.sourceId, url: capture.url, rawSha256: sourceHash(capture.body), observation: capture.observation }))));
}
