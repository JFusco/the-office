import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { archiveHistory, archiveMonth } from '../../../server/store/history-archive';

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
