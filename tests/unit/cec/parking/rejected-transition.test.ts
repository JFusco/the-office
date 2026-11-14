import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcileRejectedParking } from '../../../../server/cec/parking/rejected-transition';
import { CEC } from '../../../../server/office/config';
import { Engine } from '../../../../server/scheduling/engine';
import { JiraOperations } from '../../../../server/cec/jira-operations';
import { cecStore, ticket } from './fixtures';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function setup() {
    const { store } = cecStore(), t = ticket('QA');
    store.dataRoot = mkdtempSync(join(tmpdir(), 'office-park-rejection-')); roots.push(store.dataRoot);
    t.stage = 'retest'; t.activity = 'blocked'; t.attempt = 4;
    t.parked = { marker: 'Office decision original-attempt', stage: t.stage, reason: 'Needs staff SSO', at: '2026-10-31T20:00:06Z', fromStatus: 'QA', published: false };
    store.state.tickets = [t];
    const anchor = { id: '77', author: { accountId: CEC.account }, created: '2026-10-31T20:00:03Z', body: 'Office QA blocked: Needs staff SSO' };
    const base = { work: { projectId: 'cec', kind: 'delivery' as const, id: t.key }, attemptId: 'original-attempt', target: t.key, authorization: t.runId, elapsedMs: 3 };
    const original = { ...base, id: 'park-transition:Office decision original-attempt', operation: 'jira-transition', payload: { to: 'Blocked' }, expectedState: { assignee: CEC.account, from: 'QA' }, status: 'uncertain' as const,
        createdAt: '2026-10-31T20:00:06Z', dispatchedAt: '2026-10-31T20:00:07Z', verifiedAt: '', receipt: null,
        error: 'Error: twg exited 1: Error: Must leave a comment\n  Code: TWG_TOOL_EXECUTION_FAILED\n  HTTP status: 400\n  Request ID: 3870b71474b095cc0c70609cc93c2ced\n' };
    const qa = { ...base, id: 'qa-comment:original-attempt', operation: 'jira-qa-comment', payload: { commit: t.commit }, expectedState: { stage: t.stage, commit: t.commit }, status: 'verified' as const,
        createdAt: '2026-10-31T20:00:01Z', dispatchedAt: '2026-10-31T20:00:02Z', verifiedAt: '2026-10-31T20:00:05Z', receipt: anchor, error: '' };
    store.putEffect(original); store.putEffect(qa);
    const state = { anchor, history: [{ id: '1', created: '2026-10-31T19:59:00Z', items: [{ fieldId: 'status', toString: 'QA' }] }], updated: 'stable', calls: [] as string[][], afterRead: undefined as (() => void) | undefined };
    const execute: any = async (_program: string, args: string[], options: any) => {
        expect(options.readOnly).toBe(true); state.calls.push(args);
        if (args[2] === 'get') {
            const response = { data: [{ key: t.key, status: { name: 'QA' }, assignee: { accountId: CEC.account }, updated: state.updated }] };
            state.afterRead?.(); return JSON.stringify(response);
        }
        if (args[2] === 'comment') return JSON.stringify({ data: [state.anchor], pageInfo: { hasNextPage: false } });
        if (args[2] === 'changelog') return JSON.stringify({ data: state.history, pageInfo: { hasNextPage: false } });
        throw new Error('A mutation is forbidden');
    };
    return { store, t, original, qa, state, execute };
}

test('positive rejection, verified provider anchor and complete status audit settle only the selected old effect as rejected', async () => {
    const { store, t, original, qa, execute } = setup();
    await reconcileRejectedParking(store, execute, t);
    const saved: any = store.getEffect(original.id);
    expect(saved).toMatchObject({ status: 'rejected', error: original.error, dispatchedAt: original.dispatchedAt, verifiedAt: '' });
    const proof = JSON.parse(readFileSync(saved.receipt.proofPath, 'utf8'));
    expect(proof).toMatchObject({ anchorId: '77', binding: { key: t.key, runId: t.runId, commit: t.commit } });
    expect(JSON.parse(readFileSync(saved.receipt.proofPath.replace('rejected.json', 'intent.json'), 'utf8')).originalEffect).toEqual(original);
    expect(t.parked).toBeUndefined(); expect(t.activity).toBe('blocked'); expect(t.attempt).toBe(4);
    expect(t.blocker).toContain('Needs staff SSO'); expect(store.getEffect(qa.id)).toEqual(qa);
    await expect(reconcileRejectedParking(store, execute, t)).rejects.toThrow();
});

test.each(['transport', 'different-target', 'different-run', 'new-commented-transition', 'unverified-anchor', 'other-stage'])('%s cannot establish provider rejection', async kind => {
    const { store, t, original, qa, state, execute } = setup();
    if (kind === 'transport') original.error = 'transport lost; Must leave a comment';
    if (kind === 'different-target') original.target = 'CEC-901';
    if (kind === 'different-run') original.authorization = 'another-run';
    if (kind === 'new-commented-transition') (original.payload as any).comment = 'already attached';
    if (kind === 'unverified-anchor') (qa as any).status = 'uncertain';
    if (kind === 'other-stage') (qa.expectedState as any).stage = 'qa';
    store.putEffect(original); store.putEffect(qa);
    await expect(reconcileRejectedParking(store, execute, t)).rejects.toThrow();
    expect(state.calls).toHaveLength(0); expect(store.getEffect(original.id)?.status).toBe('uncertain'); expect(t.parked).toBeDefined();
});

test('ordinary selected-ticket resume reconciles only the rejected parking before its normal ownership read-back', async () => {
    const { store, t, original, execute } = setup();
    const engine = new Engine(store);
    engine.jira = new JiraOperations(store, execute);
    let calls = 0;
    engine.agents.readback = async () => {
        calls++;
        expect(store.getEffect(original.id)?.status).toBe('rejected');
        expect(t.parked).toBeUndefined();
        throw new Error('Staff SSO is still required');
    };
    await expect(engine.resume(t.key)).rejects.toThrow('Staff SSO is still required');
    expect(calls).toBe(1); expect(t.activity).toBe('blocked'); expect(t.attempt).toBe(4);
    expect(engine.busy).toBe(false);
});

test.each(['changed-anchor', 'status-roundtrip', 'missing-history', 'metadata-drift', 'candidate-drift', 'effect-drift'])('%s keeps the old operation uncertain', async kind => {
    const { store, t, original, state, execute } = setup();
    if (kind === 'changed-anchor') state.anchor = { ...state.anchor, body: 'changed' };
    if (kind === 'status-roundtrip') state.history.push({ id: '2', created: '2026-10-31T20:00:08Z', items: [{ fieldId: 'status', toString: 'Blocked' }] });
    if (kind === 'missing-history') state.history = [];
    if (kind === 'metadata-drift') state.afterRead = () => { state.updated += 'changed'; };
    if (kind === 'candidate-drift') state.afterRead = () => { t.commit = 'b'.repeat(40); };
    if (kind === 'effect-drift') state.afterRead = () => { const e = store.getEffect(original.id)!; e.error += ' changed'; store.putEffect(e); };
    await expect(reconcileRejectedParking(store, execute, t)).rejects.toThrow();
    expect(store.getEffect(original.id)?.status).toBe('uncertain'); expect(t.parked).toBeDefined();
});
