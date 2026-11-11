import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { CEC } from '../../../server/office/config';
import { ingest, eligibility } from '../../../server/cec/workflow';
import { MISSING_INTAKE } from '../../../server/cec/reconcile-mailbox';

test.each([false, true])('a fresh complete intake read reconciles board metadata and retains delivery ownership (pilot=%s)', async pilot => {
    const store = new Store(':memory:', projectById('cec'));
    try {
        const ticket: any = { key: 'CEC-154', summary: 'Previous', assignee: CEC.account,
            status: 'To Do', statusId: '10000', boardMember: false, type: 'Epic', subtask: false,
            updated: 'old', observedAt: 'old', stage: pilot ? 'implement' : 'mailbox',
            activity: 'idle', blocker: pilot ? '' : MISSING_INTAKE, pilot,
            runId: pilot ? 'retained-owner' : '', branch: 'retained-branch', results: { understand: { summary: 'Retained evidence' } }, attempt: 1 };
        store.state.tickets.push(ticket);
        const original = structuredClone(ticket);
        const execute = async () => [{ ...ticket, summary: 'Current', type: 'Improvement', boardMember: true, updated: 'new' }];
        ingest(store.state, await execute(), '2026-11-11T12:00:00Z');
        expect(ticket).toMatchObject({ summary: 'Current', type: 'Improvement', boardMember: true, updated: 'new', observedAt: '2026-11-11T12:00:00Z' });
        expect(eligibility(ticket)).toBe('');
        expect(ticket.runId).toBe(original.runId);
        expect(ticket.stage).toBe(original.stage);
        expect(ticket.branch).toBe(original.branch);
        expect(ticket.results).toEqual(original.results);
        if (!pilot) expect(ticket).toMatchObject({ activity: 'waiting', blocker: '' });
    } finally { store.close(); }
});
