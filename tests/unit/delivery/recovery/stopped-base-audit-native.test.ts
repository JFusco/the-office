import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { readStoppedBaseAuditNative, stoppedBaseAuditMarker } from '../../../../server/delivery/recovery/stopped-base-audit-native';
import type { StoppedBaseAuditInput } from '../../../../server/delivery/recovery/stopped-base-audit';
import type { WorkTime } from '../../../../src/shared';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-stopped-audit-')); roots.push(root);
    const cwd = resolve(root, 'candidate'), nativeRoot = resolve(root, 'native');
    const work = { id: 'reader', provider: 'codex', role: 'lead', stage: 'stopped-base-update-audit', sessionId: 'native-reader',
        startedAt: '2026-11-10T23:59:59Z', endedAt: '2026-11-11T00:01:00Z' } as WorkTime;
    const input = { originalWorkId: 'original', nativeSha256: 'a'.repeat(64), nativeRecordCount: 3, originalArtifacts: [], rows: [] } as StoppedBaseAuditInput;
    const result = { outcome: 'blocked', originalWorkId: input.originalWorkId, nativeSha256: input.nativeSha256,
        noRepositorySourceOrPublicationMutation: false, summary: 'Uncertainty retained', rows: [{ id: 'call', sha256: 'b'.repeat(64), verified: false,
            semanticsComplete: false, redactionSafe: true, classification: 'unknown', continuationUnaffected: false,
            evidence: ['Synthetic reader evidence'], uncertainty: 'Unknown source effects' }] };
    const message = { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text',
        text: 'Read-only task.\n' + stoppedBaseAuditMarker + JSON.stringify(input) }] } };
    const records: any[] = [{ type: 'session_meta', payload: { id: work.sessionId, cwd } }, message,
        { type: 'event_msg', payload: { type: 'task_complete', last_agent_message: JSON.stringify(result) } }];
    const path = resolve(nativeRoot, '2026/11/11', `rollout-${work.sessionId}.jsonl`);
    mkdirSync(dirname(path), { recursive: true });
    const save = () => writeFileSync(path, records.map(record => JSON.stringify(record)).join('\n'));
    save();
    return { root, cwd, nativeRoot, work, input, result, records, path, save,
        run: () => readStoppedBaseAuditNative(work, cwd, input, result, nativeRoot) };
}

test('binds the actual issued audit input and terminal result, retaining a negative outcome', () => {
    const f = fixture(), proof = f.run();
    expect(proof.result).toEqual(f.result);
    expect(proof.result.outcome).toBe('blocked');
    expect(proof.file.path).toBe(f.path);
});

test.each(['session', 'cwd', 'input', 'duplicate-input', 'duplicate-marker', 'terminal', 'result', 'trailing-record', 'malformed-tail', 'duplicate-session'])
    ('refuses conflicting or incomplete audit completion for %s', change => {
        const f = fixture();
        if (change === 'session') f.records[0].payload.id = 'foreign';
        if (change === 'cwd') f.records[0].payload.cwd = f.root;
        if (change === 'input') f.records[1].payload.content[0].text += 'changed';
        if (change === 'duplicate-input') f.records.splice(1, 0, structuredClone(f.records[1]));
        if (change === 'duplicate-marker') f.records[1].payload.content[0].text = stoppedBaseAuditMarker + f.records[1].payload.content[0].text;
        if (change === 'terminal') f.records[2].payload.type = 'turn_aborted';
        if (change === 'result') f.result.summary = 'Different saved result';
        if (change === 'trailing-record') f.records.push({ type: 'event_msg', payload: { type: 'turn_aborted' } });
        f.save();
        if (change === 'malformed-tail') writeFileSync(f.path, '{incomplete');
        if (change === 'duplicate-session') writeFileSync(resolve(dirname(f.path), `another-${f.work.sessionId}.jsonl`), 'duplicate');
        expect(f.run).toThrow();
    });
