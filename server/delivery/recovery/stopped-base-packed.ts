import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { rootArtifact } from '../../store/readback-evidence';

/** Corroborate direct native QA commands and actual terminal tool outputs, not a checks paragraph. */
export function stoppedBasePackedCommands(native: { root: string; file: { path: string; sha256: string } }, cwd: string) {
    const file = rootArtifact(native.root, native.file.path);
    if (file.sha256 !== native.file.sha256) throw new Error('QA native evidence changed');
    const records = readFileSync(file.path, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    const calls = new Map<string, { command: string; cwd: string }>(), outputs = new Map<string, string>();
    for (const record of records) {
        const p = record.type === 'response_item' && record.payload;
        if (!p) continue;
        if (p.type === 'function_call' && ['exec_command', 'functions.exec_command', 'functions.run'].includes(p.name)) {
            const input = JSON.parse(p.arguments);
            if (calls.has(p.call_id)) throw new Error('Duplicate QA command identity');
            calls.set(p.call_id, { command: input.cmd ?? input.command, cwd: input.workdir ?? input.cwd });
        }
        if (p.type === 'function_call_output') {
            if (outputs.has(p.call_id)) throw new Error('Duplicate QA command output');
            outputs.set(p.call_id, typeof p.output === 'string' ? p.output : JSON.stringify(p.output));
        }
    }
    const passed = (command: string) => [...calls].find(([id, call]) => {
        if (call.cwd !== cwd || call.command !== command) return false;
        const output = outputs.get(id);
        if (!output) return false;
        try { const value = JSON.parse(output); return value.exit_code === 0 && !value.session_id; }
        catch { return /^(?:Process exited with code 0|Exit code: 0)$/m.test(output) && !/^Process running with session ID/m.test(output); }
    });
    const packed = passed('env -u NPM_CONFIG_WORKSPACE_DIR pnpm run test:packed') || passed('pnpm run test:packed');
    const inspect = passed('npm pack --dry-run --ignore-scripts'), node = passed('node --version');
    const nodeOutput = node && outputs.get(node[0]) || '';
    const version = nodeOutput.match(/\bv(\d+)\.(\d+)\.(\d+)\b/);
    if (!packed || !inspect || !node || !version || +version[1] < 24 || +version[1] === 24 && (+version[2] < 14 || +version[2] === 14 && +version[3] < 0))
        throw new Error('Actual independent QA native completion for Node >=24.14.0, test:packed and exact npm pack --dry-run --ignore-scripts is required');
    if (!isDeepStrictEqual(rootArtifact(native.root, native.file.path), file)) throw new Error('QA native evidence changed during command readback');
    return { native: file, commands: [node, packed, inspect].map(row => ({ callId: row![0], ...row![1] })) };
}
