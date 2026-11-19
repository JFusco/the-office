import { afterEach, expect, test } from 'vitest';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { archiveByMonth, archiveHistory, archiveMonth } from '../../../server/store/history-archive';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const path = mkdtempSync(resolve(tmpdir(), 'office-archive-')); roots.push(path); return path; };

test('records are appended one JSON line each to the month\'s file and nothing already there is rewritten', () => {
    const data = root();
    const path = archiveHistory(data, 'it-reports', '2026-11', [{ id: 'a' }, { id: 'b' }]);
    expect(path).toBe(resolve(data, 'archive', 'it-reports-2026-11.jsonl'));
    expect(readFileSync(path, 'utf8')).toBe('{"id":"a"}\n{"id":"b"}\n');
    archiveHistory(data, 'it-reports', '2026-11', [{ id: 'c' }]);
    expect(readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line).id)).toEqual(['a', 'b', 'c']);
    expect(statSync(path).mode & 0o777).toBe(0o600);
    archiveHistory(data, 'it-reports', '2026-12', [{ id: 'd' }]);
    expect(readFileSync(resolve(data, 'archive', 'it-reports-2026-12.jsonl'), 'utf8')).toBe('{"id":"d"}\n');
});

test('a name or month that could leave the archive folder is refused before anything is written', () => {
    const data = root();
    for (const [name, month] of [['../escape', '2026-11'], ['it-reports', '2026-11/..'], ['IT', '2026-11'], ['it-reports', '202611']] as const)
        expect(() => archiveHistory(data, name, month, [{}])).toThrow('not valid');
});

test('a record goes to the month of its own time, or of now when it has none', () => {
    const now = new Date('2026-11-19T12:00:00Z');
    expect(archiveMonth('2026-10-31T23:59:59Z', now)).toBe('2026-10');
    expect(archiveMonth(undefined, now)).toBe('2026-11');
    expect(archiveMonth('not a time', now)).toBe('2026-11');
});

test('a record is archived as the store would save it: secrets in its text are redacted', () => {
    const data = root(), path = archiveHistory(data, 'it-reports', '2026-11', [{ id: 'a', detail: 'curl -H "Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123456789"' }]);
    const line = readFileSync(path, 'utf8');
    expect(line).toContain('"id":"a"');
    expect(line).not.toContain('abcdefghijklmnopqrstuvwxyz0123456789');
});

test('a write that fails part way is cut back to where the file ended, so the next record never lands on a torn line', () => {
    const data = root(), path = archiveHistory(data, 'it-reports', '2026-11', [{ id: 'a' }]), good = readFileSync(path, 'utf8');
    // The disk takes half of the line and then refuses the rest.
    const torn = ((file: string, text: string) => { appendFileSync(file, text.slice(0, Math.floor(text.length / 2))); throw new Error('ENOSPC: no space left on device'); }) as any;
    expect(() => archiveHistory(data, 'it-reports', '2026-11', [{ id: 'b' }], torn)).toThrow('ENOSPC');
    expect(readFileSync(path, 'utf8')).toBe(good);
    // A write that lands whole but cannot be confirmed (the file is not the size it should be) is undone too.
    const padded = ((file: string, text: string) => { appendFileSync(file, `${text}x`); }) as any;
    expect(() => archiveHistory(data, 'it-reports', '2026-11', [{ id: 'b' }], padded)).toThrow('could not be confirmed');
    expect(readFileSync(path, 'utf8')).toBe(good);
    archiveHistory(data, 'it-reports', '2026-11', [{ id: 'c' }]);
    expect(readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line).id)).toEqual(['a', 'c']);
});

test('months are archived one at a time: a month that fails stops the run, and the months before it are not written again', () => {
    const data = root(), records = [{ id: 'o1', month: '2026-10' }, { id: 'o2', month: '2026-10' }, { id: 'n1', month: '2026-11' }], removed: string[] = [];
    // November's file is a directory, so its write fails; October's succeeds first.
    mkdirSync(resolve(data, 'archive', 'x-2026-11.jsonl'), { recursive: true });
    const run = (list: typeof records) => archiveByMonth(data, 'x', list, record => record.month, batch => removed.push(...batch.map(record => record.id)));
    expect(run(records)).toBe(2);
    expect(removed).toEqual(['o1', 'o2']);
    // The caller has removed October's records; the retry holds only November's and October is not appended again.
    expect(run(records.slice(2))).toBe(0);
    expect(readFileSync(resolve(data, 'archive', 'x-2026-10.jsonl'), 'utf8').trim().split('\n')).toHaveLength(2);
    rmSync(resolve(data, 'archive', 'x-2026-11.jsonl'), { recursive: true });
    expect(run(records.slice(2))).toBe(1);
    expect(removed).toEqual(['o1', 'o2', 'n1']);
});
