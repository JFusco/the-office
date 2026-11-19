import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { archiveOldTaskDetail } from '../../../server/time/ci-history-retention';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const path = mkdtempSync(resolve(tmpdir(), 'office-ci-')); roots.push(path); return path; };
const NOW = new Date('2026-11-19T12:00:00Z'), daysAgo = (days: number) => new Date(NOW.getTime() - days * 86400000).toISOString();
const stages = () => [{ id: 's', type: 'Stage', name: 'Build' }, { id: 'j', type: 'Job', name: 'Job' }, { id: 't1', type: 'Task', name: 'Restore' }, { id: 't2', type: 'Task', name: 'Test' }];
const build = (id: number, finishedAt: string | undefined, extra: Record<string, unknown> = {}) => ({ id, name: 'CI', status: finishedAt ? 'completed' : 'inProgress', result: 'succeeded', finishedAt, stages: stages(), linkedTickets: ['CEC-1'], ...extra }) as any;
const state = (builds: any[], recent: number[] = [], policy: number[] = []) => ({ ciHistory: builds, azure: { builds: recent.map(id => ({ id })), prs: [{ policies: policy.map(buildId => ({ buildId })) }] } }) as any;

test('a build finished a week ago keeps its stages and jobs; its full record, tasks included, is archived first', () => {
    const data = root(), s = state([build(1, daysAgo(8)), build(2, daysAgo(7.01)), build(3, daysAgo(6.9))]);
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(2);
    expect(s.ciHistory.map((item: any) => item.stages.map((stage: any) => stage.type))).toEqual([['Stage', 'Job'], ['Stage', 'Job'], ['Stage', 'Job', 'Task', 'Task']]);
    expect(s.ciHistory[0]).toMatchObject({ id: 1, linkedTickets: ['CEC-1'], result: 'succeeded' });
    const lines = readFileSync(resolve(data, 'archive', 'ci-builds-2026-11.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
    expect(lines.map(line => [line.id, line.stages.length])).toEqual([[1, 4], [2, 4]]);
    // Already trimmed: nothing more to archive.
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(0);
    expect(readFileSync(resolve(data, 'archive', 'ci-builds-2026-11.jsonl'), 'utf8').trim().split('\n')).toHaveLength(2);
});

test('a build Azure still lists, a pull request\'s policy build, and one that has not finished are left whole', () => {
    const data = root(), s = state([build(1, daysAgo(30)), build(2, daysAgo(30)), build(3, undefined), build(4, daysAgo(30))], [1], [2]);
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(1);
    expect(s.ciHistory.map((item: any) => item.stages.length)).toEqual([4, 4, 4, 2]);
});

test('when the archive cannot be written no build is trimmed, and the next refresh archives it', () => {
    const data = root(), s = state([build(1, daysAgo(30))]);
    // The archive folder's name is taken by a file, so nothing can be written under it.
    writeFileSync(resolve(data, 'archive'), '');
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(0);
    expect(s.ciHistory[0].stages).toHaveLength(4);
    rmSync(resolve(data, 'archive'));
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(1);
    expect(s.ciHistory[0].stages).toHaveLength(2);
});

test('a project with no CI history is untouched', () => {
    expect(archiveOldTaskDetail(root(), { azure: { builds: [], prs: [] } } as any, NOW)).toBe(0);
});

test('a record with no stage list does not stop the refresh, and builds from two months are each archived to their own file', () => {
    const data = root(), s = state([{ id: 9, finishedAt: daysAgo(30) } as any, build(1, '2026-10-20T10:00:00Z'), build(2, daysAgo(10))]);
    expect(archiveOldTaskDetail(data, s, NOW)).toBe(2);
    expect(readFileSync(resolve(data, 'archive', 'ci-builds-2026-10.jsonl'), 'utf8').trim().split('\n')).toHaveLength(1);
    expect(readFileSync(resolve(data, 'archive', 'ci-builds-2026-11.jsonl'), 'utf8').trim().split('\n')).toHaveLength(1);
});
