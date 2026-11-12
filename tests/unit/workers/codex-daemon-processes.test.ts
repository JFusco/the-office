import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { codexDaemonProcesses } from '../../../server/workers/codex-daemon-processes';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const directory = (files: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), 'codex-daemon-')); roots.push(root);
    for (const [name, body] of Object.entries(files)) writeFileSync(join(root, name), body);
    return root;
};
const record = (pid: unknown, processStartTime = 'Fri Oct  9 16:27:57 2026') => JSON.stringify({ pid, processStartTime });
const live = new Map([[25572, 'Fri Oct 9 16:27:57 2026'], [25592, 'Fri Oct 9 16:27:58 2026']]);

test('names a registered daemon process only when the live process started at the recorded time', () => {
    const both = directory({ 'daemon.pid': record(25572), 'daemon-updater.pid': record(25592, 'Fri Oct  9 16:27:58 2026') });
    expect(codexDaemonProcesses(live, both)).toEqual([25572, 25592]);
    // A stale record whose process ID a later process reused names nothing.
    expect(codexDaemonProcesses(new Map([[25572, 'Thu Nov 12 09:44:08 2026']]), both)).toEqual([]);
    expect(codexDaemonProcesses(new Map(), both)).toEqual([]);
});
test('a missing or malformed record names nothing', () => {
    expect(codexDaemonProcesses(live, directory({ 'daemon.pid': 'not json', 'daemon-updater.pid': record('25592') }))).toEqual([]);
    expect(codexDaemonProcesses(live, directory({ 'daemon.pid': JSON.stringify({ pid: 25572 }) }))).toEqual([]);
    expect(codexDaemonProcesses(live, join(tmpdir(), 'codex-daemon-absent'))).toEqual([]);
});
