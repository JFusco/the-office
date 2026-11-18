import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { CEC } from '../../../../server/office/config';
import { statusHeld } from '../../../../server/cec/qa/status-held';
import type { Ticket } from '../../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function setup(live = 'QA') {
    const store = new Store(':memory:', projectById('cec')); stores.push(store);
    const ticket = { key: 'CEC-999', runId: `unit-${crypto.randomUUID()}`, stage: 'retest', commit: 'a'.repeat(40), assignee: CEC.account, subtask: false, boardMember: true,
        previewUrl: '', worktree: '', branch: '', prId: 0 } as Ticket;
    const issue = { key: ticket.key, status: { id: '10104', name: live }, assignee: { accountId: CEC.account }, issuetype: { name: 'Bug', subtask: false }, updated: '2026-11-18T05:00:00Z' };
    const execute = vi.fn(async (program: string, args: string[], options: any) => {
        expect([program, ...args.slice(0, 4), options.readOnly]).toEqual(['twg', 'jira', 'workitem', 'get', ticket.key, true]);
        return JSON.stringify({ data: [issue] });
    });
    return { store, ticket, issue, execute };
}

test('a ticket Jira already shows in the status is confirmed by two reads and no write', async () => {
    const { store, ticket, execute } = setup();
    const held = await statusHeld(store, ticket, 'QA', execute as any);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(held).toMatchObject({ outcome: 'passed', blocker: '', paidRuns: 0 });
    expect(held!.receipts.map(receipt => [receipt.action, receipt.verified, receipt.uncertain])).toEqual([['jira-read-only', true, false], ['jira-transition', true, false]]);
    expect(held!.receipts[1].detail).toContain('No Jira mutation dispatched');
});

test('a ticket in another status, reassigned, or unreadable is not held: the status is moved the usual way', async () => {
    const elsewhere = setup('Blocked');
    expect(await statusHeld(elsewhere.store, elsewhere.ticket, 'QA', elsewhere.execute as any)).toBeUndefined();
    const reassigned = setup(); reassigned.issue.assignee.accountId = 'someone-else';
    expect(await statusHeld(reassigned.store, reassigned.ticket, 'QA', reassigned.execute as any)).toBeUndefined();
    const down = setup(); down.execute.mockRejectedValue(new Error('Jira unavailable'));
    expect(await statusHeld(down.store, down.ticket, 'QA', down.execute as any)).toBeUndefined();
});
