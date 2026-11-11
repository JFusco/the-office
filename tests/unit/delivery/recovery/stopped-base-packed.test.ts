import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { rootArtifact } from '../../../../server/store/readback-evidence';
import { stoppedBasePackedCommands } from '../../../../server/delivery/recovery/stopped-base-packed';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-packed-proof-')); roots.push(root);
    const path = resolve(root, 'native.jsonl'), cwd = resolve(root, 'candidate');
    const commands = ['node --version','env -u NPM_CONFIG_WORKSPACE_DIR pnpm run test:packed','npm pack --dry-run --ignore-scripts'];
    const records = commands.flatMap((cmd, i) => [
        { type: 'response_item', payload: { type: 'function_call', name: 'exec_command', call_id: `call-${i}`, arguments: JSON.stringify({ cmd, workdir: cwd }) } },
        { type: 'response_item', payload: { type: 'function_call_output', call_id: `call-${i}`, output: JSON.stringify({ exit_code: 0, output: i ? 'Actual synthetic command stdout' : 'v24.14.0' }) } },
    ]);
    const save = () => { writeFileSync(path, records.map(r => JSON.stringify(r)).join('\n')); return { root, file: rootArtifact(root, path) }; };
    return { path, cwd, records, save, run: () => stoppedBasePackedCommands(save(), cwd) };
}
test('corroborates the three direct native terminal commands on the owned QA CWD', () => {
    const f = fixture(); expect(f.run().commands.map(c => c.callId)).toEqual(['call-0','call-1','call-2']);
});
test.each(['failed','running','old-node','wrong-cwd','missing-output','wrapped','unknown-tool','summary-only','duplicate'])('rejects %s native package evidence', change => {
    const f = fixture();
    if (change === 'failed') f.records[3].payload.output = JSON.stringify({ exit_code: 1 });
    if (change === 'running') f.records[3].payload.output = JSON.stringify({ exit_code: 0, session_id: 91 });
    if (change === 'old-node') f.records[1].payload.output = JSON.stringify({ exit_code: 0, output: 'v24.13.9' });
    if (change === 'wrong-cwd') f.records[4].payload.arguments = JSON.stringify({ cmd: 'npm pack --dry-run --ignore-scripts', workdir: '/unrelated' });
    if (change === 'missing-output') f.records.splice(5,1);
    if (change === 'wrapped') f.records[4].payload.arguments = JSON.stringify({ cmd: 'echo ok; npm pack --dry-run --ignore-scripts', workdir: f.cwd });
    if (change === 'unknown-tool') f.records[4].payload.name = 'unrecognized_executor';
    if (change === 'summary-only') f.records.splice(2,4);
    if (change === 'duplicate') f.records.push(f.records[0]);
    expect(f.run).toThrow();
});
test('a changed native file cannot be accepted from its prior identity', () => {
    const f = fixture(), native = f.save(); writeFileSync(f.path, '{}');
    expect(() => stoppedBasePackedCommands(native, f.cwd)).toThrow('changed');
});
