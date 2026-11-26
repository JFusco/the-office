import { randomUUID } from 'node:crypto';
import { linkSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { EVENT_ID } from '../../../server/incidents/record-event';
import { appendFailureLine, failureLine, JournalRefused, readFailures, type FailureEvent } from '../../../server/overseer/failure-journal';
import { runnerRoot, tempDir } from './runner-world';

const event = (kind: FailureEvent['kind'] = 'service-down', episode = randomUUID(), detail = 'no answer'): FailureEvent =>
    ({ version: 1, id: `overseer:${kind}:${episode}`, kind, at: '2026-11-25T12:05:00.000Z', episode, detail, evidence: { since: '2026-11-25T12:00:00.000Z', failures: 3 } });
const fill = (path: string, count: number) => {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, Array.from({ length: count }, () => failureLine(event())).join(''));
};

test('event IDs are Office event IDs', () => {
    for (const kind of ['service-down', 'service-restored'] as const) {
        const { id } = event(kind);
        expect(id).toMatch(EVENT_ID);
        expect(id.length).toBeLessThanOrEqual(100);
    }
});

test('an event is appended once; the same line again is a no-op and other content under its ID is refused', () => {
    const paths = runnerRoot(), down = event(), line = failureLine(down);
    expect(appendFailureLine(paths, line, 1000)).toBe('appended');
    expect(appendFailureLine(paths, line, 1000)).toBe('present');
    const changed = failureLine({ ...down, detail: 'other words' });
    expect(() => appendFailureLine(paths, changed, 1000)).toThrow(JournalRefused);
    expect(readFileSync(paths.failures, 'utf8')).toBe(line);
    expect(readFailures(paths, 1000)).toEqual({ entries: [{ event: down, line }], problem: null });
});

test('only the exact serialized event is accepted as a line', () => {
    const paths = runnerRoot(), line = failureLine(event());
    expect(() => appendFailureLine(paths, line.trimEnd(), 1000)).toThrow('exactly the serialized event');
    expect(() => appendFailureLine(paths, JSON.stringify(JSON.parse(line), null, 1) + '\n', 1000)).toThrow('exactly the serialized event');
});

test('a torn tail, a malformed record or a repeated ID stops appends and leaves the bytes', () => {
    const torn = failureLine(event()) + '{"version":1,"id"';
    const malformed = failureLine(event()) + '{"version":1}\n' + failureLine(event());
    const twice = failureLine(event('service-down', '11111111-1111-4111-8111-111111111111'));
    for (const [text, problem] of [[torn, 'cut-short line'], [malformed, 'line 2 is not a failure event'], [twice + twice, 'twice']] as const) {
        const paths = runnerRoot();
        mkdirSync(paths.journal, { recursive: true });
        writeFileSync(paths.failures, text);
        expect(readFailures(paths, 1000).problem).toContain(problem);
        expect(() => appendFailureLine(paths, failureLine(event()), 1000)).toThrow(problem);
        expect(readFileSync(paths.failures, 'utf8')).toBe(text);
    }
});

test('a linked or hard-linked journal is refused', () => {
    const linked = runnerRoot(), target = join(tempDir(), 'elsewhere.jsonl');
    writeFileSync(target, '');
    mkdirSync(linked.journal, { recursive: true });
    symlinkSync(target, linked.failures);
    expect(readFailures(linked, 1000).problem).toContain('cannot be read (symlink)');
    expect(() => appendFailureLine(linked, failureLine(event()), 1000)).toThrow(JournalRefused);
    const hard = runnerRoot();
    mkdirSync(hard.journal, { recursive: true });
    writeFileSync(hard.failures, '');
    linkSync(hard.failures, join(tempDir(), 'second-name.jsonl'));
    expect(() => appendFailureLine(hard, failureLine(event()), 1000)).toThrow('a single link');
    expect(readFileSync(hard.failures, 'utf8')).toBe('');
});

test('capacity: a new outage needs room for its restoration, a restoration needs one slot, and a replay always fits', () => {
    const pair = runnerRoot();
    fill(pair.failures, 998);
    const episode = randomUUID();
    expect(appendFailureLine(pair, failureLine(event('service-down', episode)), 1000)).toBe('appended');
    expect(appendFailureLine(pair, failureLine(event('service-restored', episode)), 1000)).toBe('appended');
    expect(readFailures(pair, 1000).entries).toHaveLength(1000);
    expect(appendFailureLine(pair, failureLine(event('service-restored', episode)), 1000)).toBe('present');

    const full = runnerRoot();
    fill(full.failures, 999);
    const before = readFileSync(full.failures, 'utf8');
    expect(() => appendFailureLine(full, failureLine(event()), 1000)).toThrow('is full (999 of 1000 events)');
    expect(readFileSync(full.failures, 'utf8')).toBe(before);
    expect(appendFailureLine(full, failureLine(event('service-restored')), 1000)).toBe('appended');
});

test('a journal with more records than its limit, or a line longer than an event can be, is not trusted and nothing in it is offered for forwarding', () => {
    const counted = runnerRoot();
    fill(counted.failures, 4);
    expect(readFailures(counted, 3)).toEqual({ entries: null, problem: expect.stringContaining('holds 4 records, more than its limit of 3') });
    const long = runnerRoot();
    mkdirSync(join(long.failures, '..'), { recursive: true });
    // Valid JSON for no event, but longer than any event line can be.
    writeFileSync(long.failures, `${JSON.stringify({ padding: 'x'.repeat(5000) })}\n`);
    expect(readFailures(long, 1000)).toEqual({ entries: null, problem: expect.stringContaining('line 1 is longer than 4096 bytes') });
    const linked = runnerRoot();
    fill(linked.failures, 1);
    linkSync(linked.failures, join(tempDir(), 'second-name.jsonl'));
    expect(readFailures(linked, 1000)).toEqual({ entries: null, problem: expect.stringContaining('a single link') });
});

test('a journal exactly at its limit is still read whole, so its events can be forwarded', () => {
    const paths = runnerRoot();
    fill(paths.failures, 3);
    const view = readFailures(paths, 3);
    expect(view.problem).toBeNull();
    expect(view.entries).toHaveLength(3);
});
