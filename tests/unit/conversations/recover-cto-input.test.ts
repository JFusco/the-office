import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { recoverCTOInput } from '../../../server/conversations/recover-cto-input';

function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'cto-input-')), store = new Store(':memory:', projectById('cec'), root);
    const error = 'Error: codex exited 1: Error: turn/start: turn/start failed: Input exceeds the maximum length of 1048576 characters. {"input_error_code":"input_too_large","actual_chars":1298583}';
    const source: any = { id: 'original', requestId: 'original', from: 'human', to: 'cto', body: 'The Design Passport videos are complete; mark that goal done.', ticket: '', actionId: '', status: 'failed', createdAt: 'before', sessionId: '', error, recheck: false, recipients: [], receipts: [] }; store.state.messages = [source];
    const claim = store.claimWork({ projectId: 'cec', kind: 'conversation', id: source.id }, 'cto', 'conversation:cto', 'cto')!; store.finishClaim(claim.id, 'completed');
    const work: any = { id: 'worker', claimId: claim.id, requestId: source.id, role: 'cto', stage: 'conversation', provider: 'codex', sessionId: 'session', status: 'failed', endedAt: 'after', processId: 12345 }; store.state.workLog = [work];
    const dir = resolve(root, 'sessions', work.id); mkdirSync(dir, { recursive: true });
    const write = (name: string, value: unknown) => writeFileSync(resolve(dir, name), JSON.stringify(value));
    write('assignment.json', { id: work.id, claimId: claim.id, lane: 'cto', work: claim.work, role: 'cto', stage: 'conversation', profile: 'reader', scope: { repository: store.project.repository, artifacts: dir } });
    write('capabilities.json', { name: 'reader', readOnly: true, cutover: 'verified' });
    write('error.json', { provider: 'codex', session: work.sessionId, error });
    return { root, store, source, work, write, close() { store.close(); rmSync(root, { recursive: true, force: true }); } };
}
test('queues one linked bounded-context continuation while preserving the failed original and history', () => {
    const f = fixture(); try {
        const before = structuredClone(f.source), accepted = recoverCTOInput(f.store, f.source.id, f.root, () => false);
        expect(accepted.status).toBe('queued'); expect(f.source).toEqual(before);
        const linked = f.store.state.messages[1]; expect(linked.body).toBe(f.source.body); expect(linked.inputRecovery?.originalMessageId).toBe(f.source.id);
        expect(recoverCTOInput(f.store, f.source.id, f.root, () => false)).toEqual(accepted); expect(f.store.state.messages).toHaveLength(2);
        linked.status = 'failed'; expect(recoverCTOInput(f.store, f.source.id, f.root, () => false).status).toBe('failed'); expect(f.store.state.messages).toHaveLength(2);
    } finally { f.close(); }
});
test.each(['different-error', 'live-group', 'completed-output', 'answer', 'changed-native-error', 'goal-change'])('rejects %s without queuing another CTO message', reason => {
    const f = fixture(); try {
        if (reason === 'different-error') f.source.error = 'OAuth metadata unavailable';
        if (reason === 'completed-output') f.write('result.json', { reply: 'already answered' });
        if (reason === 'answer') f.store.state.messages.push({ ...f.source, id: 'answer', from: 'cto' });
        if (reason === 'changed-native-error') f.write('error.json', { provider: 'codex', session: 'session', error: 'different' });
        if (reason === 'goal-change') f.store.state.goals = [{ requestId: f.source.id } as any];
        const before = f.store.state.messages.length;
        expect(() => recoverCTOInput(f.store, f.source.id, f.root, () => reason === 'live-group')).toThrow(); expect(f.store.state.messages).toHaveLength(before); expect(f.source.status).toBe('failed');
    } finally { f.close(); }
});
