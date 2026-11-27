import { expect, test } from 'vitest';
import { ghServerError, ghTooManyRequests, temporaryReadFailure } from '../../../server/scheduling/temporary-read';
import { temporaryReadFailure as shared } from '../../../server/scheduling/read-retries';

const STATUSES = ['408', '429', '499', '500', '502', '503', '504'];

test('every gh status a later read can outlast is a temporary read, in each format gh prints, including GH-376\'s exact text', () => {
    expect(shared).toBe(temporaryReadFailure);
    expect(temporaryReadFailure('Error: gh exited 1: gh: HTTP 499')).toBe(true);
    for (const status of STATUSES) {
        expect(temporaryReadFailure(`Error: gh exited 1: gh: HTTP ${status}`), status).toBe(true);
        expect(temporaryReadFailure(`gh: Something went wrong (HTTP ${status})`), status).toBe(true);
        expect(temporaryReadFailure(`gh exited 1: HTTP ${status}: Bad response (https://api.github.com/graphql)`), status).toBe(true);
        expect(temporaryReadFailure(`Error: HTTP ${status}: from gh`), status).toBe(true);
    }
    // Other statuses, and the same digits outside gh's wording, are not.
    for (const text of ['gh exited 1: gh: HTTP 404', 'gh exited 1: gh: HTTP 422', 'Error: worker returned 4990 rows', 'HTTP 4999'])
        expect(temporaryReadFailure(text), text).toBe(false);
});

test('the existing timeout, connection, capacity and generic 502-504 matches are kept', () => {
    for (const text of ['Error: gh timed out', 'git read timed out; saved observations retained; safe to retry the read', 'read ECONNRESET', 'getaddrinfo EAI_AGAIN api.github.com',
        'error connecting to api.github.com', 'HTTP 503 Service Unavailable', 'Error: codex exited 1: Selected model is at capacity. Please try a different model.'])
        expect(temporaryReadFailure(text), text).toBe(true);
});

test('a write whose outcome is unknown, a hold or a permission refusal is never a temporary read, whatever status it carries', () => {
    for (const text of ['Board transition needs read-back: gh: HTTP 499', 'github-pr-create for x is unverified after read-back; it will not be resent', 'Prior publication cannot be resent: gh: HTTP 503',
        'Previous board transition remains uncertain; gh: HTTP 502', 'Permission denied: gh: HTTP 503', 'Explicit Backlog hold: gh: HTTP 504', 'OAuth token refresh timed out'])
        expect(temporaryReadFailure(text), text).toBe(false);
});

test('server errors and bare 429s are told apart for the delivery schedule', () => {
    for (const status of ['500', '502', '503', '504']) expect(ghServerError(`gh exited 1: gh: HTTP ${status}`), status).toBe(true);
    expect(ghServerError('gh exited 1: HTTP 502')).toBe(true);
    for (const status of ['408', '429', '499']) expect(ghServerError(`gh exited 1: gh: HTTP ${status}`), status).toBe(false);
    expect(ghTooManyRequests.test('Error: gh exited 1: gh: HTTP 429')).toBe(true);
    expect(ghTooManyRequests.test('Error: gh exited 1: gh: HTTP 499')).toBe(false);
});
