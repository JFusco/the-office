import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
/** Morgan asked about a ticket and nobody answered. */
function asked(ticket: string, status?: string) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-closed-question-')); roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.coordination = coordination();
    if (ticket && status) store.state.tickets.push({ key: ticket, summary: 'Synthetic', type: 'GitHub issue', status, statusId: '', assignee: 'JFusco', subtask: false, boardMember: true, url: '', updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    store.state.messages.push({ id: 'q1', requestId: 'r1', from: 'pm', to: 'pm', ticket, actionId: '', body: 'I cannot tell which step you approved.', question: 'What was the proposed next step?', status: 'answered', createdAt: '2026-10-28T20:34:46Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] } as any);
    const open = () => projectOutbox(store.state).filter(item => item.status === 'open').map(item => item.id);
    return { store, open };
}

test('a question about a ticket that was closed is not an outbox item; reopening the issue shows it again', () => {
    const f = asked('GH-70', 'closed');
    expect(f.open()).toEqual([]);
    f.store.state.tickets.find(t => t.key === 'GH-70')!.status = 'open';
    expect(f.open()).toEqual(['question:q1']);
});

test('a question on an open ticket, on a ticket the Office holds no record of, or with no ticket is shown as before', () => {
    expect(asked('GH-70', 'open').open()).toEqual(['question:q1']);
    expect(asked('GH-70').open()).toEqual(['question:q1']);
    expect(asked('').open()).toEqual(['question:q1']);
});
