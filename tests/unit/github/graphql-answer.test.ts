import { expect, test } from 'vitest';
import { graphqlAnswer, responseBody } from '../../../server/github/graphql-answer';

const RESET = '2026-11-26T14:00:00Z', EPOCH = Date.parse(RESET) / 1000;
const body = (value: unknown) => JSON.stringify(value);
const rate = { cost: 2, limit: 5000, used: 120, remaining: 4880, resetAt: RESET };

test('the body follows an included header block; without --include stdout is the body', () => {
    expect(responseBody('HTTP/2.0 200 OK\r\nX-Ratelimit-Resource: graphql\r\n\r\n{"data":1}', true)).toBe('{"data":1}');
    expect(responseBody('HTTP/2.0 200 OK\nA: b\n\n{"data":1}', true)).toBe('{"data":1}');
    expect(responseBody('{"data":1}', true)).toBe('{"data":1}');
    expect(responseBody('HTTP/2.0 200 OK\r\nA: b', true)).toBe('');
    expect(responseBody('HTTP/2.0 200 OK\r\n\r\n{}', false)).toBe('HTTP/2.0 200 OK\r\n\r\n{}');
});

test('rateLimit gives the cost and a GraphQL reading whose ISO reset is integer epoch seconds', () => {
    expect(graphqlAnswer(body({ data: { rateLimit: rate, repository: {} } }), false)).toEqual({ cost: 2, reading: { resource: 'graphql', limit: 5000, used: 120, remaining: 4880, reset: EPOCH } });
    expect(graphqlAnswer(`HTTP/2.0 200 OK\r\n\r\n${body({ data: { rateLimit: { ...rate, resetAt: '2026-11-26T14:00:00.750Z' } } })}`, true).reading?.reset).toBe(EPOCH);
});

test('a missing or invalid value is left out, so the cost is unknown; errors are carried for the refusal rule', () => {
    expect(graphqlAnswer('not json', false)).toEqual({});
    expect(graphqlAnswer(body({ data: { repository: {} } }), false)).toEqual({});
    expect(graphqlAnswer(body({ data: { rateLimit: { ...rate, cost: -1, remaining: 1.5 } } }), false)).toEqual({});
    expect(graphqlAnswer(body({ data: { rateLimit: { ...rate, resetAt: 'soon' } } }), false)).toEqual({ cost: 2 });
    expect(graphqlAnswer(body({ data: null, errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded for user ID 1.' }, { message: 7 }] }), false))
        .toEqual({ errors: 'API rate limit exceeded for user ID 1.; GraphQL error' });
    expect(graphqlAnswer(body({ data: { rateLimit: rate }, errors: [] }), false).errors).toBeUndefined();
});
