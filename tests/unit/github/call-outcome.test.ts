import { expect, test } from 'vitest';
import { failed, noCalls, succeeded } from '../../../server/github/call-outcome';
import { githubCall } from '../../../server/github/endpoint-family';
import { CommandFailure } from '../../../server/workers/process';

const rest = githubCall(['api', 'repos/a/b/pulls/1']), pages = githubCall(['api', 'repos/a/b/pulls', '--paginate', '--slurp']), opaque = githubCall(['pr', 'view', '1']);
const counts = (values: Partial<ReturnType<typeof noCalls>>) => ({ ...noCalls(), invocations: 1, ...values });
const failure = (stderr: string) => new CommandFailure(`gh exited 1: ${stderr}`, 'other', true);

test('a single REST read is one attempt, page and full response', () => {
    expect(succeeded(rest, '{"number":1}')).toEqual(counts({ attempts: 1, pages: 1, responses: 1, fullResponses: 1 }));
});

test('slurped pages are counted from the outer envelope before callers flatten it', () => {
    expect(succeeded(pages, JSON.stringify([[{ n: 1 }], [{ n: 2 }], []]))).toEqual(counts({ attempts: 3, pages: 3, responses: 3, fullResponses: 3 }));
    expect(succeeded(pages, '[[]]')).toEqual(counts({ attempts: 1, pages: 1, responses: 1, fullResponses: 1 }));
    // An envelope that cannot be read, or pages gh streamed without --slurp, leave the traffic unknown.
    expect(succeeded(pages, 'not json')).toEqual(counts({ unknown: 1 }));
    expect(succeeded(githubCall(['api', 'repos/a/b/pulls', '--paginate']), '[][]')).toEqual(counts({ unknown: 1 }));
});

test('a high-level command is opaque whatever its result', () => {
    expect(succeeded(opaque, '{}')).toEqual(counts({ opaque: 1, unknown: 1 }));
    expect(failed(opaque, failure('API rate limit exceeded for user ID 1. (HTTP 403)'))).toEqual(counts({ attempts: 1, refusals: 1, opaque: 1, unknown: 1 }));
    expect(failed(opaque, failure('Forbidden (HTTP 403)'))).toEqual(counts({ attempts: 1, failures: 1, opaque: 1, unknown: 1 }));
    expect(failed(opaque, failure('no pull requests found'))).toEqual(counts({ failures: 1, opaque: 1, unknown: 1 }));
});

test('GitHub’s stated rate-limit refusals are refusals; a credential failure in the same text is not', () => {
    expect(failed(rest, failure('API rate limit exceeded for user ID 1. (HTTP 403)'))).toEqual(counts({ attempts: 1, refusals: 1 }));
    expect(failed(rest, failure('You have exceeded a secondary rate limit. (HTTP 403)'))).toEqual(counts({ attempts: 1, refusals: 1 }));
    expect(failed(rest, failure('Bad credentials (HTTP 401) API rate limit exceeded'))).toEqual(counts({ attempts: 1, failures: 1 }));
    // A refused paginated read may have read earlier pages.
    expect(failed(pages, failure('API rate limit exceeded (HTTP 403)'))).toEqual(counts({ attempts: 1, refusals: 1, unknown: 1 }));
});

test('a stated 304 is a response and a revalidation; other stated answers are failures; no answer is unknown coverage', () => {
    expect(failed(rest, failure('HTTP 304'))).toEqual(counts({ attempts: 1, responses: 1, revalidations: 1 }));
    expect(failed(rest, failure('Not Found (HTTP 404)'))).toEqual(counts({ attempts: 1, failures: 1 }));
    expect(failed(githubCall(['api', 'graphql']), failure('GraphQL: Could not resolve to a Repository'))).toEqual(counts({ attempts: 1, failures: 1 }));
    expect(failed(rest, new CommandFailure('gh read timed out; saved observations retained; safe to retry the read', 'transient-read', true))).toEqual(counts({ failures: 1, unknown: 1 }));
    expect(failed(pages, failure('Server Error (HTTP 502)'))).toEqual(counts({ attempts: 1, failures: 1, unknown: 1 }));
});
