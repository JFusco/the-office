import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { CEC } from '../../../server/office/config';
import { verifyAlreadyAtStatus, verifiedTransition } from '../../../server/cec/transition-readback';
import type { StageResult, Ticket } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function setup(target = 'Code Review') {
    const store = new Store(':memory:', projectById('cec')); stores.push(store);
    const ticket = { key: 'CEC-999', runId: `unit-${crypto.randomUUID()}`, stage: 'repair-review',
        commit: 'a'.repeat(40), assignee: CEC.account, subtask: false, boardMember: true } as Ticket;
    const result: StageResult = { outcome: 'passed', summary: `Already ${target}; no write`, blocker: '',
        commit: '', evidence: [], findings: [], receipts: [{ id: 'original', action: 'jira-read-only',
            target: ticket.key, verified: true, uncertain: false, detail: 'Read-only model observation' }],
        paidRuns: 0, worktree: '', branch: '', prId: 0, previewUrl: '', qaRunDir: '' };
    const issue = { key: ticket.key, status: { id: '10104', name: target }, assignee: { accountId: CEC.account },
        issuetype: { name: 'Improvement', subtask: false }, updated: '2026-11-14T05:46:04Z', description: 'Preserve authored requirements' };
    const execute = vi.fn(async (_program: string, args: string[], options: any) => {
        expect(args.slice(0, 4)).toEqual(['jira', 'workitem', 'get', ticket.key]);
        expect(options.readOnly).toBe(true);
        return JSON.stringify({ data: [issue] });
    });
    return { store, ticket, result, issue, execute };
}

test.each(['Code Review', 'QA'])('already %s requires two identical native issue reads and preserves the original receipt', async target => {
    const { store, ticket, result, execute } = setup(target), original = structuredClone(result);
    const verified = await verifyAlreadyAtStatus(store, ticket, target, result, execute as any);
    expect(verifiedTransition(verified)).toBe(true); expect(execute).toHaveBeenCalledTimes(2);
    expect(result).toEqual(original); expect(verified.receipts[0]).toEqual(original.receipts[0]);
    expect(verified.receipts[1].detail).toContain('No Jira mutation dispatched');
    const proof = JSON.parse(readFileSync(verified.evidence.at(-1)!.path, 'utf8'));
    expect(proof).toMatchObject({ key: ticket.key, runId: ticket.runId, commit: ticket.commit, target });
    expect(proof.before).toEqual(proof.after);
    expect(existsSync(verified.evidence.at(-1)!.path.replace('verified.json', 'intent.json'))).toBe(true);
});

test.each(['status', 'assignee', 'type', 'key'])('a contradictory live %s cannot normalize the model receipt', async field => {
    const { store, ticket, result, issue, execute } = setup();
    if (field === 'status') issue.status.name = 'Blocked';
    if (field === 'assignee') issue.assignee.accountId = 'someone-else';
    if (field === 'type') issue.issuetype.subtask = true;
    if (field === 'key') issue.key = 'CEC-998';
    const observed = await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any);
    expect(observed.outcome).toBe('blocked'); expect(verifiedTransition(observed)).toBe(false);
    expect(observed.receipts).toEqual(result.receipts); expect(execute).toHaveBeenCalledTimes(1);
});

test('metadata changes, even outside the status fields, keep the handoff blocked', async () => {
    const { store, ticket, result, issue, execute } = setup();
    execute.mockImplementationOnce(async () => JSON.stringify({ data: [issue] }));
    execute.mockImplementationOnce(async () => JSON.stringify({ data: [{ ...issue, description: 'Human edited requirements' }] }));
    const observed = await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any);
    expect(observed.blocker).toContain('metadata or the candidate changed'); expect(observed.outcome).toBe('blocked');
});

test('candidate changes during readback and provider failures cannot advance a stage', async () => {
    const { store, ticket, result, issue, execute } = setup();
    execute.mockImplementationOnce(async () => { ticket.commit = 'b'.repeat(40); return JSON.stringify({ data: [issue] }); });
    expect((await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any)).outcome).toBe('blocked');
    execute.mockRejectedValueOnce(new Error('provider unavailable'));
    expect((await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any)).blocker).toContain('provider unavailable');
});

test.each(['uncertain', 'failed', 'unknown-usage', 'wrong-target', 'missing-receipt'])('does not repair %s evidence or call a provider', async fault => {
    const { store, ticket, result, execute } = setup();
    if (fault === 'uncertain') result.receipts[0].uncertain = true;
    if (fault === 'failed') result.outcome = 'failed';
    if (fault === 'unknown-usage') result.paidRuns = null;
    if (fault === 'wrong-target') result.receipts[0].target = 'CEC-998';
    if (fault === 'missing-receipt') result.receipts = [];
    const observed = await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any);
    expect(observed).toBe(result); expect(execute).not.toHaveBeenCalled(); expect(verifiedTransition(observed)).toBe(false);
});

test('a verified transition uses its existing readback; no extra native read is added', async () => {
    const { store, ticket, result, execute } = setup(); result.receipts[0].action = 'jira-transition';
    expect(await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any)).toBe(result);
    expect(execute).not.toHaveBeenCalled(); expect(verifiedTransition(result)).toBe(true);
});

test('invalid artifact scope is rejected before provider calls or artifact creation', async () => {
    const { store, ticket, result, execute } = setup(); ticket.runId = '../../outside-runs';
    expect((await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any)).outcome).toBe('blocked');
    expect(execute).not.toHaveBeenCalled();
});

test('an exact configured-site issue URL also identifies the read-only handoff', async () => {
    const { store, ticket, result, execute } = setup(); result.receipts[0].target = `${CEC.site}/browse/${ticket.key}`;
    expect(verifiedTransition(await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as any))).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
});
