import { expect, test } from 'vitest';
import { z } from 'zod';
import { stoppedBaseAuditInput, stoppedBaseAuditResponseSchema, assertStoppedBaseAudit } from '../../../../server/delivery/recovery/stopped-base-audit';
import { digest } from '../../../../server/store/readback-evidence';
import { assertStrictOutputSchema } from '../../../../server/workers/structured-output';

function fixture() {
    const original: any = { worker: { id: 'original', sessionId: 'original', requestId: 'job', startedAt: '2026-11-10T06:00:00Z' },
        claim: { work: { projectId: 'cms', kind: 'delivery', id: 'job' } }, candidate: { path: '/candidate' }, files: [] };
    const read = { command: 'git status --porcelain' }, pending = { command: 'npm view pnpm version > /tmp/diagnostic.out' };
    const issued = (id: string, wirePresent = false) => [{ index: id === 'read' ? 0 : 2, uuid: id, messageId: id, cwd: '/candidate', wirePresent, wireInput: wirePresent ? read : undefined }];
    const output = { type: 'tool_result', tool_use_id: 'read', content: 'Clean candidate; fixture only' };
    const native: any = { file: { path: '/native/-candidate/original.jsonl', sha256: 'a'.repeat(64) }, recordCount: 3,
        calls: new Map([['read', { id: 'read', name: 'Bash', input: read }], ['pending', { id: 'pending', name: 'Bash', input: pending }]]),
        issued: new Map([['read', issued('read', true)], ['pending', issued('pending')]]), outputs: new Map([['read', output]]),
        genuineResults: new Map([['read', [{ index: 1, uuid: 'result', parentUuid: 'read', cwd: '/candidate', value: output }]]]),
        missingResults: ['pending'], orphanResults: [], recordedCwds: ['/candidate'] };
    const effects: any[] = [{ id: 'prior-board', work: { projectId: 'cms', kind: 'delivery', id: 'job' }, status: 'verified',
        operation: 'github-project-status', dispatchedAt: '2026-11-10T05:00:00Z', verifiedAt: '2026-11-10T05:01:00Z', payload: { target: 'In progress' } }];
    const input = () => stoppedBaseAuditInput(original, native, effects);
    const passed = (packet = input()): any => ({ outcome: 'passed', originalWorkId: packet.originalWorkId, nativeSha256: packet.nativeSha256,
        noRepositorySourceOrPublicationMutation: true, summary: 'Synthetic positive administrative audit; never original completion',
        rows: packet.rows.map(row => ({ id: row.id, sha256: row.sha256, verified: true, semanticsComplete: true, redactionSafe: true,
            classification: row.kind === 'durable-effect' ? 'historical-verified' : row.kind === 'missing-result' ? 'bounded-local' : 'read-only',
            continuationUnaffected: true, evidence: ['Synthetic bound invocation and retained provenance'],
            uncertainty: row.kind === 'missing-result' ? 'Diagnostic output is missing; its local file is never consumed by continuation gates' : '' })) });
    return { original, native, effects, input, passed };
}

test('exact display/wire, genuine result, missing result, CWD and historical effect rows retain their source hashes', () => {
    const f = fixture(), input = f.input();
    expect(input.rows.map(r => r.kind)).toEqual(['input', 'input', 'result', 'input', 'missing-result', 'cwd', 'durable-effect']);
    expect(input.rows.find(r => r.id === 'pending:missing-result')!.view).toMatchObject({ result: null });
    for (const id of ['pending:input:display', 'pending:missing-result'])
        expect(input.rows.find(r => r.id === id)).toMatchObject({ redacted: false, redactionBlocksSemantics: false });
    expect(input.rows.find(r => r.id === 'effect:prior-board')!.historicalVerified).toBe(true);
    expect(assertStoppedBaseAudit(input, f.passed(input)).outcome).toBe('passed');
    expect(f.native.outputs.has('pending')).toBe(false); expect(f.original.worker).not.toHaveProperty('result');
    const json = z.toJSONSchema(stoppedBaseAuditResponseSchema(input), { target: 'draft-7' });
    expect(() => assertStrictOutputSchema(json)).not.toThrow();
    expect(json.properties?.rows).toMatchObject({ minItems: input.rows.length, maxItems: input.rows.length,
        items: { properties: { id: { enum: input.rows.map(row => row.id) } } } });
});

test.each(['duplicate', 'omission', 'invented-id', 'hash', 'worker', 'native', 'blocked', 'source', 'publication', 'unknown',
    'incomplete-semantics', 'gate-uncertainty', 'missing-result-empty', 'missing-result-read-only', 'historical-input'])('positive audit rejects %s without converting missing evidence to acceptance', change => {
    const f = fixture(), input = f.input(), response = f.passed(input), row = response.rows[0];
    if (change === 'duplicate') response.rows[1] = { ...row };
    if (change === 'omission') response.rows.pop();
    if (change === 'invented-id') row.id = 'not-issued';
    if (change === 'hash') row.sha256 = 'b'.repeat(64);
    if (change === 'worker') response.originalWorkId = 'foreign';
    if (change === 'native') response.nativeSha256 = 'b'.repeat(64);
    if (change === 'blocked') response.outcome = 'blocked';
    if (change === 'source') row.classification = 'repository-source';
    if (change === 'publication') row.classification = 'publication';
    if (change === 'unknown') row.classification = 'unknown';
    if (change === 'incomplete-semantics') row.semanticsComplete = false;
    if (change === 'gate-uncertainty') row.continuationUnaffected = false;
    if (change === 'missing-result-empty') response.rows.find((r: any) => r.id === 'pending:missing-result').uncertainty = '';
    if (change === 'missing-result-read-only') response.rows.find((r: any) => r.id === 'pending:missing-result').classification = 'read-only';
    if (change === 'historical-input') row.classification = 'historical-verified';
    expect(() => assertStoppedBaseAudit(input, response)).toThrow();
});

test.each(['uncertain', 'after-original', 'unbound-job', 'duplicate'])('durable %s cannot silently become historical safety proof', change => {
    const f = fixture();
    if (change === 'uncertain') f.effects[0].status = 'uncertain';
    if (change === 'after-original') f.effects[0].dispatchedAt = '2026-11-10T07:00:00Z';
    if (change === 'unbound-job') f.effects[0].work.id = 'foreign';
    if (change === 'duplicate') f.effects.push(structuredClone(f.effects[0]));
    expect(() => { const input = f.input(); assertStoppedBaseAudit(input, f.passed(input)); }).toThrow();
});

test.each(['2026-11-10T06:00:00Z', '2026-11-10T07:00:00Z', undefined, 'invalid', '2026-11-10T04:59:00Z'])(
    'durable verification at %s cannot become earlier verified history', verifiedAt => {
        const f = fixture(); f.effects[0].verifiedAt = verifiedAt;
        const input = f.input();
        expect(input.rows.find(r => r.id === 'effect:prior-board')!.historicalVerified).toBe(false);
        expect(() => assertStoppedBaseAudit(input, f.passed(input))).toThrow('Positive complete original effects audit required');
    });

test('semantic output views remove credentials while their original source hash remains bound', () => {
    const f = fixture(), output = f.native.outputs.get('read');
    output.content = 'NPM_TOKEN=opaque-value\nHTTPS_PROXY=http://user:private-pass@proxy.invalid\naccess=AKIAABCDEFGHIJKLMNOP\ngithub_pat_11ABCDEF_xyz\nghu_abcdef123\nxoxb-123-abc';
    const input = f.input(), encoded = JSON.stringify(input);
    for (const secret of ['opaque-value', 'private-pass', 'AKIAABCDEFGHIJKLMNOP', 'github_pat_11ABCDEF_xyz', 'ghu_abcdef123', 'xoxb-123-abc'])
        expect(encoded).not.toContain(secret);
    const row = input.rows.find(r => r.id === 'read:result')!;
    expect(row.redacted).toBe(true); expect(row.redactionBlocksSemantics).toBe(false);
    expect(row.sha256).toBe(digest({ callId: 'read', result: output, records: f.native.genuineResults.get('read') }));
    const response = f.passed(input); response.rows.find((r: any) => r.id === row.id).redactionSafe = false;
    expect(() => assertStoppedBaseAudit(input, response)).toThrow();
});

test.each(['Bash', 'Write'])('redaction of %s executable text fails closed even when a model asserts it is safe', name => {
    const f = fixture(), call = f.native.calls.get('pending'); call.name = name;
    const executable = 'TOKEN=private-value; git push origin HEAD';
    call.input = name === 'Bash' ? { command: executable } : { file_path: '/tmp/script.sh', content: executable };
    const input = f.input(), row = input.rows.find(r => r.id === 'pending:input:display')!;
    expect(JSON.stringify(input)).not.toContain('private-value'); expect(row.redactionBlocksSemantics).toBe(true);
    expect(() => assertStoppedBaseAudit(input, f.passed(input))).toThrow();
});

test('oversized semantic context stops before dispatch without truncating a result', () => {
    const f = fixture(); f.native.outputs.get('read').content = 'x'.repeat(1024 * 1024);
    expect(f.input).toThrow('none was truncated');
});

test('a same-session filename under another candidate cannot supply the original inventory', () => {
    const f = fixture(); f.native.file.path = '/native/-another-candidate/original.jsonl';
    expect(f.input).toThrow('exact original native');
});
