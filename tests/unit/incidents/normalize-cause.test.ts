import { expect, test } from 'vitest';
import { fingerprint } from '../../../server/incidents/fingerprint';
import { normalizeCause } from '../../../server/incidents/normalize-cause';
import type { IncidentCause } from '../../../src/contracts/incidents';

test('the same cause on different tickets, heads and paths normalizes to the same text', () => {
    const a = normalizeCause('Error: Worktree /Users/x/work/brain-12 for GH-12 is missing head 4f2a9c1e (attempt 3)');
    const b = normalizeCause('Error: Worktree /Users/x/work/cms-88 for CEC-154 is missing head 0b77d3aa91 (attempt 11)');
    expect(a).toBe(b);
    expect(a).toBe('worktree <path> for <key> is missing head <id> (attempt <n>)');
});

test('links, UUIDs and nested error prefixes are reduced; only the first line counts', () => {
    expect(normalizeCause('Error: CommandFailure: fetch https://api.github.com/repos/a/b/pulls/7 failed for 3f0c1c5e-7b1a-4d2e-9f00-aa11bb22cc33\nstack line')).toBe('fetch <url> failed for <id>');
});

test('different causes stay different', () => {
    expect(normalizeCause('The branch is behind main')).not.toBe(normalizeCause('The branch has conflicts with main'));
});

test('secrets are redacted before anything is kept, and the text is bounded', () => {
    expect(normalizeCause('request failed: Bearer abc.def.ghi rejected')).toBe('request failed: bearer [redacted] rejected');
    expect(normalizeCause('x'.repeat(900))).toHaveLength(200);
});

test('a time or a duration is an occurrence, not a cause', () => {
    expect(normalizeCause('Maintenance never started; tried again after 2026-11-20T10:15:00.000Z (1 of 3).')).toBe(normalizeCause('Maintenance never started; tried again after 2026-11-21T04:02:09.120Z (2 of 3).'));
    expect(normalizeCause('tried again after 2026-11-20T10:15:00.000Z (1 of 3).')).toBe('tried again after <time> (<n> of <n>).');
    expect(normalizeCause('took 1500ms, then 3 s')).toBe('took <n>ms, then <n> s');
    expect(normalizeCause('rate limit exceeded until 12:30')).toBe('rate limit exceeded until <n>');
});

test('a status code says which failure it was and is kept', () => {
    expect(normalizeCause('GitHub returned 502 for project 8')).toBe('github returned 502 for project <n>');
    expect(normalizeCause('GitHub returned 401 for project 8')).not.toBe(normalizeCause('GitHub returned 502 for project 8'));
    expect(normalizeCause('HTTP 404 from https://api.example.com/x')).toBe('http 404 from <url>');
});

test('GitHub rate-limit errors that differ only in request ID, user ID and timestamp are one cause, and one fingerprint', () => {
    const limited = (user: string, id: string, stamp: string) => `HTTP 403: API rate limit exceeded for user ID ${user}. If you reach out to GitHub Support for help, please include the request ID ${id} and timestamp ${stamp} UTC.`;
    const said = 'http 403: api rate limit exceeded for user id <n>. if you reach out to github support for help, please include the request id <id> and timestamp <time> utc.';
    const first = normalizeCause(limited('486049', 'D321:3A1B2C:47A892:E3DF94:6B05154C', '2026-11-24 13:36:36'));
    const second = normalizeCause(limited('712883', 'D192:33B27B:48AB921:F4DE951:6B06153A', '2026-11-23 08:12:09'));
    expect(first).toBe(said);
    expect(second).toBe(said);
    // A request ID of decimal groups only is the same occurrence.
    expect(normalizeCause(limited('486049', '1234:5678:9012:3456:7890', '2026-11-24 13:36:36'))).toBe(said);
    const cause = (text: string): IncidentCause => ({ source: 'provider-error', provider: 'github', stage: 'github', kind: 'read-failed', text, author: 'harness' }) as IncidentCause;
    const subject = { projectId: 'p', kind: 'provider', id: 'github' } as const;
    expect(fingerprint(cause(first), subject)).toBe(fingerprint(cause(second), subject));
});

test('a run of three or more colon-separated groups is an identifier; shorter runs and protected status codes are not', () => {
    expect(normalizeCause('peer fe80:12ab:34cd:56ef')).toBe('peer <id>');
    expect(normalizeCause('mac 3c:22:fb:12:ab:cd')).toBe('mac <id>');
    expect(normalizeCause('12:30:05')).toBe('<id>');
    // `::` breaks a run: each side is its own.
    expect(normalizeCause('peer aa:bb:cc::dd:ee:ff')).toBe('peer <id>::<id>');
    expect(normalizeCause('HTTP 403:ab:cd')).toBe('http 403:ab:cd');
    // A one-character group breaks the run, and the number rule reads what is left.
    expect(normalizeCause('fe80:0:1:ab')).toBe('fe80:<n>:ab');
});

test('a value that is not text normalizes to nothing', () => {
    expect(normalizeCause(undefined)).toBe('');
});
