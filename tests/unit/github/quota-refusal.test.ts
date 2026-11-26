import { expect, test } from 'vitest';
import { quotaRefusal } from '../../../server/github/quota-refusal';

const NOW = Date.parse('2026-11-26T13:00:00.000Z');

test.each([
    ['gh: API rate limit exceeded for user ID 1. (HTTP 403)', { secondary: false }],
    ['GraphQL: API rate limit exceeded for user ID 1.', { secondary: false }],
    ['gh: You have exceeded a secondary rate limit. Please wait a few minutes. (HTTP 403)', { secondary: true }],
    ['HTTP 429: rate limit, too many requests', { secondary: true }],
])('GitHub stating a refusal is one: %s', (text, expected) => {
    expect(quotaRefusal(text)).toEqual(expected);
});

test.each([
    'gh: Resource not accessible by integration (HTTP 403)',
    'HTTP 403: Forbidden',
    'Bad credentials (HTTP 401): API rate limit exceeded',
    'HTTP 403: API rate limit exceeded; invalid token',
    'status code: 401 API rate limit exceeded',
    'connection reset by peer',
])('anything else is not a refusal, a credential failure taking precedence: %s', text => {
    expect(quotaRefusal(text)).toBeUndefined();
});

test('Retry-After is read as seconds or as an HTTP date, and the zero-remaining reading is carried', () => {
    const reading = { resource: 'core' as const, limit: 5000, used: 5000, remaining: 0, reset: NOW / 1000 + 600 };
    expect(quotaRefusal('exceeded a secondary rate limit', 'HTTP/2.0 403 Forbidden\r\nretry-after: 45', undefined, NOW)).toEqual({ secondary: true, retryAfterMs: 45_000 });
    expect(quotaRefusal('exceeded a secondary rate limit', `HTTP/2.0 403 Forbidden\r\nRetry-After: ${new Date(NOW + 120_000).toUTCString()}`, undefined, NOW)).toEqual({ secondary: true, retryAfterMs: 120_000 });
    expect(quotaRefusal('API rate limit exceeded', 'HTTP/2.0 403 Forbidden\r\nRetry-After: soon', reading, NOW)).toEqual({ secondary: false, reading });
    expect(quotaRefusal('rate limit', 'HTTP/2.0 429 Too Many Requests', undefined, NOW)).toBeUndefined();
});
