import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcileRefusedCommentedPark } from '../../../../server/cec/parking/refused-commented-park';
import { CEC } from '../../../../server/office/config';
import { cecStore, ticket } from './fixtures';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const MARKER = 'Office decision attempt-1';
/** CEC-154's shape: the Blocked move sent its decision comment, Jira refused it, and the ticket's own parking record is gone. */
function setup() {
    const { store } = cecStore(), t = ticket('QA');
    store.dataRoot = mkdtempSync(join(tmpdir(), 'office-refused-park-')); roots.push(store.dataRoot);
    t.stage = 'retest'; t.activity = 'blocked';
    store.state.tickets = [t];
    const anchor = { id: '77', author: { accountId: CEC.account }, created: '2026-10-31T20:00:03Z', body: 'Office attempt-1 retest\nblocked' };
    const base = { work: { projectId: 'cec', kind: 'delivery' as const, id: t.key }, attemptId: 'attempt-1', target: t.key, authorization: t.runId, elapsedMs: 3 };
    const refused = { ...base, id: `park-transition:${MARKER}`, operation: 'jira-transition', payload: { to: 'Blocked', comment: `${MARKER}: Needs a Target DXP` }, expectedState: { assignee: CEC.account, from: 'QA' }, status: 'uncertain' as const,
        createdAt: '2026-10-31T20:00:06Z', dispatchedAt: '2026-10-31T20:00:07Z', verifiedAt: '', receipt: null,
        error: 'Error: twg exited 1: Error: Must leave a comment\n  Code: TWG_TOOL_EXECUTION_FAILED\n  HTTP status: 400\n  Request ID: 3870b71474b095cc0c70609cc93c2ced\n' };
    const qa = { ...base, id: 'qa-comment:attempt-1', operation: 'jira-qa-comment', payload: { commit: t.commit }, expectedState: { stage: t.stage, commit: t.commit }, status: 'verified' as const,
        createdAt: '2026-10-31T20:00:01Z', dispatchedAt: '2026-10-31T20:00:02Z', verifiedAt: '2026-10-31T20:00:05Z', receipt: anchor, error: '' };
    store.putEffect(refused as any); store.putEffect(qa as any);
    const jira = { status: 'QA', comments: [anchor] as any[], history: [{ id: '1', created: '2026-10-31T19:59:00Z', items: [{ fieldId: 'status', toString: 'QA' }] }] as any[], calls: [] as string[][] };
    const execute: any = async (_program: string, args: string[], options: any) => {
        expect(options.readOnly).toBe(true); jira.calls.push(args);
        if (args[2] === 'get') return JSON.stringify({ data: [{ key: t.key, status: { name: jira.status }, assignee: { accountId: CEC.account }, updated: 'stable' }] });
        if (args[2] === 'comment') return JSON.stringify({ data: jira.comments, pageInfo: { hasNextPage: false } });
        if (args[2] === 'changelog') return JSON.stringify({ data: jira.history, pageInfo: { hasNextPage: false } });
        throw new Error('A mutation is forbidden');
    };
    return { store, t, refused, jira, execute };
}

test('a refused commented park is settled as rejected when Jira shows the status unchanged and no decision comment, with no parking record needed', async () => {
    const { store, t, refused, jira, execute } = setup();
    expect(t.parked).toBeUndefined();
    expect(await reconcileRefusedCommentedPark(store, execute, t)).toBe(true);
    const saved: any = store.getEffect(refused.id);
    expect(saved).toMatchObject({ status: 'rejected', error: refused.error, dispatchedAt: refused.dispatchedAt, verifiedAt: '' });
    expect(JSON.parse(readFileSync(saved.receipt.proofPath, 'utf8'))).toMatchObject({ anchorId: '77', key: t.key, comments: 1 });
    // Reads only, and nothing left to settle afterwards.
    expect(jira.calls.every(call => ['get', 'comment', 'changelog'].includes(call[2]))).toBe(true);
    expect(await reconcileRefusedCommentedPark(store, execute, t)).toBe(false);
});

test('an unpublished parking record for the same decision is released with it', async () => {
    const { store, t, execute } = setup();
    t.parked = { marker: MARKER, stage: 'retest', reason: 'Needs a Target DXP', at: '2026-10-31T20:00:06Z', fromStatus: 'QA', published: false };
    await reconcileRefusedCommentedPark(store, execute, t);
    expect(t.parked).toBeUndefined();
    expect(t).toMatchObject({ activity: 'blocked', blocker: expect.stringContaining('not parked in Jira') });
});

test('the refusal stays uncertain whenever Jira does not prove it', async () => {
    const cases: [string, (x: ReturnType<typeof setup>) => void, string][] = [
        ['the decision comment was posted separately', x => { x.jira.comments.push({ id: '78', author: { accountId: CEC.account }, created: '2026-10-31T20:00:08Z', body: { type: 'doc', content: [{ text: `${MARKER}: Needs a Target DXP` }] } }); }, 'A comment carrying this decision exists'],
        ['Jira is already Blocked', x => { x.jira.status = 'Blocked'; }, 'no longer at the original status'],
        ['the status changed after the QA comment', x => { x.jira.history.push({ id: '2', created: '2026-10-31T20:00:09Z', items: [{ fieldId: 'status', toString: 'Blocked' }] }, { id: '3', created: '2026-10-31T20:00:10Z', items: [{ fieldId: 'status', toString: 'QA' }] }); }, 'status history changed'],
        ['the QA comment cannot be found', x => { x.jira.comments.length = 0; }, 'could not be independently bound'],
        ['the QA comment effect is not verified', x => { x.store.updateEffect('qa-comment:attempt-1', 'verified', effect => { effect.status = 'uncertain'; }); }, 'preceding verified QA comment'],
    ];
    for (const [name, arrange, reason] of cases) {
        const x = setup(); arrange(x);
        await expect(reconcileRefusedCommentedPark(x.store, x.execute, x.t), name).rejects.toThrow(reason);
        expect(x.store.getEffect(x.refused.id)?.status, name).toBe('uncertain');
    }
});

test('other effects are left alone: a comment-less refusal, another error, another ticket', async () => {
    for (const change of [(e: any) => { e.payload = { to: 'Blocked' }; }, (e: any) => { e.error = 'Error: twg exited 1: network down\n'; }, (e: any) => { e.target = 'CEC-999'; }, (e: any) => { e.status = 'dispatching'; }]) {
        const { store, t, refused, execute, jira } = setup();
        store.updateEffect(refused.id, 'uncertain', effect => change(effect));
        expect(await reconcileRefusedCommentedPark(store, execute, t)).toBe(false);
        expect(jira.calls).toEqual([]);
    }
});
