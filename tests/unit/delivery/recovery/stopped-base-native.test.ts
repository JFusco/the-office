import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, renameSync, openSync, ftruncateSync, closeSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { readStoppedClaudeNative } from '../../../../server/delivery/recovery/stopped-base-native';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-stopped-native-')); roots.push(root);
    const nativeRoot = resolve(root, 'native'), cwd = resolve(root, 'candidate'), work = { id: 'original', sessionId: 'original', provider: 'claude' as const };
    const call = (id: string) => ({ type: 'tool_use', id, name: 'Bash', input: { command: 'inspect retained local evidence' } });
    const issued = (id: string) => ({ type: 'assistant', sessionId: work.id, cwd, uuid: 'issued-' + id,
        message: { id: 'message-' + id, role: 'assistant', content: [call(id)] } });
    const records: any[] = [issued('read'), { type: 'user', sessionId: work.id, cwd, uuid: 'result-read', parentUuid: 'issued-read',
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'read', content: 'Synthetic diagnostic', is_error: false }] } }, issued('pending')];
    const path = resolve(nativeRoot, cwd.replace(/[^a-zA-Z0-9-]/g, '-'), work.id + '.jsonl'); mkdirSync(dirname(path), { recursive: true });
    const save = () => writeFileSync(path, records.map(record => JSON.stringify(record)).join('\n'));
    save(); return { root, nativeRoot, cwd, work, records, path, save, run: () => readStoppedClaudeNative(work, cwd, nativeRoot) };
}

test('complete native inventory retains an unpaired invocation and never invents the missing original result', () => {
    const f = fixture(), before = readFileSync(f.path), inventory = f.run();
    expect(inventory.recordCount).toBe(3); expect(inventory.calls.size).toBe(2); expect(inventory.missingResults).toEqual(['pending']);
    expect(inventory.outputs.has('pending')).toBe(false); expect(readFileSync(f.path)).toEqual(before);
});

test('a registry-bound primary diagnostic CWD stays explicit evidence and requires a separate allowance', () => {
    const f = fixture(), primary = resolve(f.root, 'registered-primary'); f.records[2].cwd = primary; f.save();
    expect(f.run).toThrow('changed identity');
    const inventory = readStoppedClaudeNative(f.work, f.cwd, f.nativeRoot, readFileSync, primary);
    expect(inventory.recordedCwds).toEqual([f.cwd, primary]);
    expect(inventory.issued.get('pending')?.[0].cwd).toBe(primary);
    expect(inventory.missingResults).toEqual(['pending']);
    expect(() => readStoppedClaudeNative(f.work, f.cwd, f.nativeRoot, readFileSync, resolve(f.root, 'different-primary'))).toThrow('changed identity');
});

test('a repeated native UUID with changed diagnostic CWD cannot hide its original context', () => {
    const f = fixture(), primary = resolve(f.root, 'registered-primary'); f.records.push({ ...structuredClone(f.records[0]), cwd: primary }); f.save();
    expect(() => readStoppedClaudeNative(f.work, f.cwd, f.nativeRoot, readFileSync, primary)).toThrow('Conflicting stopped native record identity');
});

test.each(['session', 'cwd', 'duplicate', 'parent', 'untyped-result', 'unknown-record', 'unknown-tool', 'malformed-tail', 'orphan-result'])('stopped inventory fails closed for %s', change => {
    const f = fixture();
    if (change === 'session') f.records[0].sessionId = 'foreign';
    if (change === 'cwd') f.records[0].cwd = '/foreign';
    if (change === 'duplicate') f.records.push({ ...structuredClone(f.records[0]), uuid: 'another-invocation', message: { ...f.records[0].message, id: 'another-message' } });
    if (change === 'parent') f.records[1].parentUuid = 'foreign';
    if (change === 'untyped-result') delete f.records[1].uuid;
    if (change === 'unknown-record') f.records.push({ type: 'unrecognized-native-action' });
    if (change === 'unknown-tool') f.records[0].message.content[0].name = 'UnmappedWriter';
    if (change === 'orphan-result') f.records[1].message.content[0].tool_use_id = 'foreign';
    f.save(); if (change === 'malformed-tail') appendFileSync(f.path, '\n{"type":');
    expect(f.run).toThrow();
});

test('byte and record bounds hold before a stopped inventory can certify coverage', () => {
    const f = fixture(), handle = openSync(f.path, 'r+'); ftruncateSync(handle, 8 * 1024 * 1024 + 1); closeSync(handle);
    expect(f.run).toThrow('bounded');
    writeFileSync(f.path, Array.from({ length: 10_001 }, () => JSON.stringify({ type: 'queue-operation' })).join('\n'));
    expect(f.run).toThrow('bound');
});

test.each(['append', 'replace'])('an %s during reading preserves the original evidence and rejects the derived inventory', change => {
    const f = fixture(), original = readFileSync(f.path);
    expect(() => readStoppedClaudeNative(f.work, f.cwd, f.nativeRoot, path => {
        if (change === 'append') appendFileSync(path, '\n' + JSON.stringify({ type: 'queue-operation' }));
        else { renameSync(path, path + '.retained'); writeFileSync(path, original); }
        return original;
    })).toThrow('changed');
    if (change === 'replace') expect(readFileSync(f.path + '.retained')).toEqual(original);
});
