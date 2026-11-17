import { expect, test } from 'vitest';
import { postDevUpdate } from '../../../server/cec/post-dev-update';
import { settleDevUpdates } from '../../../server/cec/settle-dev-update';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';

const passed = () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'The fix is committed and its checks pass.', prId: 9 });
const arrange = (issue: { status: string; assignee?: string } = { status: 'In Progress' }) => { const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': issue }); store.state.tickets = [t]; return { store, t, jira }; };
const creates = (jira: ReturnType<typeof fakeJira>) => jira.calls.filter(args => args[2] === 'comment' && args[3] === 'create');

test('the Dev update is posted once as markdown, read back, and not sent again for the same attempt', async () => {
    const { store, t, jira } = arrange();
    const id = await postDevUpdate(store, jira.execute, t, 'repair', 'attempt-1', passed());
    expect(id).toBe(jira.state['CEC-900'].comments[0].id);
    expect(creates(jira)[0]).toEqual(expect.arrayContaining(['--body-format', 'markdown']));
    expect(JSON.stringify(jira.state['CEC-900'].comments[0].body)).toContain('Dev update: fixes ready for review');
    expect(creates(jira)[0][creates(jira)[0].indexOf('--body') + 1]).toContain('[Pull request](https://');
    expect(store.getEffect('dev-update:attempt-1')).toMatchObject({ status: 'verified', operation: 'jira-dev-update' });
    expect(await postDevUpdate(store, jira.execute, t, 'repair', 'attempt-1', passed())).toBe(id);
    expect(creates(jira)).toHaveLength(1);
});

test('a lost response is settled at once by reading the ticket: found is verified, and nothing is sent twice', async () => {
    const { store, t, jira } = arrange();
    jira.faults.loseCommentResponse = true;
    const id = await postDevUpdate(store, jira.execute, t, 'draft-pr', 'attempt-1', passed());
    expect(id).toBe(jira.state['CEC-900'].comments[0].id);
    expect(store.getEffect('dev-update:attempt-1')?.status).toBe('verified');
    expect(creates(jira)).toHaveLength(1);
});

test('an update that never reached Jira, or was refused before sending, never throws and leaves nothing uncertain', async () => {
    const lost = arrange();
    lost.jira.faults.loseCommentResponse = true;
    const execute: any = async (program: string, args: string[], options: any) => { const out = lost.jira.execute(program, args, options); if (args[2] === 'comment' && args[3] === 'create') { await out.catch(() => undefined); lost.jira.state['CEC-900'].comments.length = 0; } return out; };
    expect(await postDevUpdate(lost.store, execute, lost.t, 'repair', 'attempt-1', passed())).toBe('');
    expect(lost.store.getEffect('dev-update:attempt-1')).toMatchObject({ status: 'rejected', error: expect.stringContaining('not resent') });

    const reassigned = arrange({ status: 'In Progress', assignee: 'someone-else' });
    expect(await postDevUpdate(reassigned.store, reassigned.jira.execute, reassigned.t, 'repair', 'attempt-1', passed())).toBe('');
    expect(reassigned.store.getEffect('dev-update:attempt-1')?.status).toBe('rejected');
    expect(creates(reassigned.jira)).toHaveLength(0);

    const unread = arrange();
    unread.jira.faults.loseCommentResponse = true;
    const failing: any = async (program: string, args: string[], options: any) => { if (args[2] === 'comment' && args[3] === 'query') throw new Error('Jira unavailable'); return unread.jira.execute(program, args, options); };
    expect(await postDevUpdate(unread.store, failing, unread.t, 'repair', 'attempt-1', passed())).toBe('');
    expect(unread.store.getEffect('dev-update:attempt-1')?.status).toBe('uncertain');

    // The next resume reads the ticket again: the comment is there, so the update is verified and nothing is sent.
    await settleDevUpdates(unread.store, failing, unread.t.key);
    expect(unread.store.getEffect('dev-update:attempt-1')?.status).toBe('uncertain');
    await settleDevUpdates(unread.store, unread.jira.execute, 'CEC-901');
    expect(unread.store.getEffect('dev-update:attempt-1')?.status).toBe('uncertain');
    await settleDevUpdates(unread.store, unread.jira.execute, unread.t.key);
    expect(unread.store.getEffect('dev-update:attempt-1')?.status).toBe('verified');
    expect(creates(unread.jira)).toHaveLength(1);
    expect(await postDevUpdate(lost.store, lost.jira.execute, lost.t, 'repair', 'attempt-1', passed())).toBe('');
    expect(creates(lost.jira)).toHaveLength(1);
});
