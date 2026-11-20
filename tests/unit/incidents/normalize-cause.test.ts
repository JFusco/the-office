import { expect, test } from 'vitest';
import { normalizeCause } from '../../../server/incidents/normalize-cause';

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

test('a value that is not text normalizes to nothing', () => {
    expect(normalizeCause(undefined)).toBe('');
});
