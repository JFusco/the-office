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

test("names the daemon and updater processes Codex registered, and nothing from a missing or malformed record", () => {
    expect(codexDaemonProcesses(directory({ 'daemon.pid': '{"pid":25572,"processStartTime":"x"}', 'daemon-updater.pid': '{"pid":25592}' }))).toEqual([25572, 25592]);
    expect(codexDaemonProcesses(directory({ 'daemon.pid': 'not json', 'daemon-updater.pid': '{"pid":"7"}' }))).toEqual([]);
    expect(codexDaemonProcesses(directory({ 'daemon.pid': '{"pid":-1}' }))).toEqual([]);
    expect(codexDaemonProcesses(join(tmpdir(), 'codex-daemon-absent'))).toEqual([]);
});
