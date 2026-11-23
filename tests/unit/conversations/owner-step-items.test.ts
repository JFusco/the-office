import { expect, test } from 'vitest';
import { projectOutbox } from '../../../server/conversations/outbox';
import { ownerStepItems, sameOwnerSteps } from '../../../server/conversations/owner-step-items';
import { signInSteps } from '../../../server/it/sign-in-steps';
import { initialSnapshot } from '../../../server/store/store';
import type { ITFollowUp, OfficeSnapshot } from '../../../src/shared';

const NAME = 'Atlassian · Jira & Confluence', TITLE = `Only you can do this: sign in to ${NAME}`;
const signIn = (failure?: string): ITFollowUp => ({ id: 'login:atlassian', owner: 'You', detail: 'Run twg doctor in your terminal to inspect the active connection and authentication.', title: TITLE, ownerSteps: signInSteps({ id: 'atlassian', name: NAME, failure }) });
const plain: ITFollowUp = { id: 'other', owner: 'You', detail: 'Check the office printer.' };
/** A snapshot whose latest IT report holds the given follow-ups; the outbox it saved before is kept. */
function withReport(followUps: ITFollowUp[], outbox: OfficeSnapshot['outbox'] = []): OfficeSnapshot {
    const state = initialSnapshot();
    state.outbox = outbox;
    state.it = { reports: [{ id: 'older', followUps: [plain] }, { id: 'latest', followUps }] } as never;
    return state;
}
const byId = (outbox: OfficeSnapshot['outbox'], id: string) => outbox.find(action => action.id === id);

test('a sign-in only the owner can do is its own open item with its steps, not part of the joined one', () => {
    const outbox = projectOutbox(withReport([signIn('Error: twg exited 77: Your OAuth session has expired.')]));
    const item = byId(outbox, 'only-you:login:atlassian')!;
    expect(item).toMatchObject({ status: 'open', title: TITLE, role: 'pm' });
    expect(item.detail).toBe(item.ownerSteps!.why);
    expect(item.ownerSteps!.providerSaid).toBe('Error: twg exited 77: Your OAuth session has expired.');
    expect(item.ownerSteps!.steps.flatMap(step => step.run || [])).toEqual(['twg doctor', 'twg login --force', 'twg doctor']);
    expect(byId(outbox, 'it-followup')).toBeUndefined();
});

test('the item is resolved when the next report no longer holds the follow-up', () => {
    const first = projectOutbox(withReport([signIn(), plain]));
    expect(first.filter(action => action.status === 'open').map(action => action.id).sort()).toEqual(['it-followup', 'only-you:login:atlassian']);
    const next = projectOutbox(withReport([], first), new Date('2026-11-23T12:00:00Z'));
    expect(byId(next, 'only-you:login:atlassian')).toMatchObject({ status: 'resolved', updatedAt: '2026-11-23T12:00:00.000Z' });
    expect(byId(next, 'it-followup')).toMatchObject({ status: 'resolved' });
});

test('a follow-up for the owner without steps still lands in the joined item as before', () => {
    const outbox = projectOutbox(withReport([signIn(), plain, { ...plain, id: 'second', detail: 'Second line.' }, { ...plain, id: 'team', owner: 'Morgan' }]));
    expect(byId(outbox, 'it-followup')).toMatchObject({ status: 'open', title: 'Ellis needs your help', detail: 'Check the office printer.\nSecond line.', role: 'pm' });
    expect(byId(outbox, 'it-followup')).not.toHaveProperty('ownerSteps');
});

test('changed steps update the saved item; unchanged steps leave it alone', () => {
    const at = new Date('2026-11-23T12:00:00Z'), first = projectOutbox(withReport([signIn()]), new Date('2026-11-23T11:00:00Z'));
    const same = projectOutbox(withReport([signIn()], first), at);
    expect(byId(same, 'only-you:login:atlassian')!.updatedAt).toBe('2026-11-23T11:00:00.000Z');
    const steps = signIn().ownerSteps!, changed = projectOutbox(withReport([{ ...signIn(), ownerSteps: { ...steps, doneWhen: 'Something else.' } }], first), at);
    expect(byId(changed, 'only-you:login:atlassian')).toMatchObject({ updatedAt: at.toISOString(), ownerSteps: { doneWhen: 'Something else.' } });
});

test('the split keeps order and a missing title has a plain fallback', () => {
    const { items, rest } = ownerStepItems([plain, { ...signIn(), title: undefined }]);
    expect(items.map(item => [item.id, item.title])).toEqual([['only-you:login:atlassian', 'Only you can do this']]);
    expect(rest).toEqual([plain]);
    expect(sameOwnerSteps(undefined, undefined)).toBe(true);
    expect(sameOwnerSteps(signIn().ownerSteps, undefined)).toBe(false);
});

test('only a sign-in becomes its own item: another follow-up that carries steps stays in the joined one, in order', () => {
    const other: ITFollowUp = { id: 'approval:budget', owner: 'You', detail: 'Approve the budget.', ownerSteps: signInSteps({ id: 'elsewhere', name: 'Budget' }) };
    const split = ownerStepItems([plain, signIn(), other]);
    expect(split.items.map(item => item.id)).toEqual(['only-you:login:atlassian']);
    expect(split.rest.map(f => f.id)).toEqual(['other', 'approval:budget']);
    const outbox = projectOutbox(withReport([plain, signIn(), other]));
    expect(byId(outbox, 'it-followup')!.detail).toBe('Check the office printer.\nApprove the budget.');
    expect(byId(outbox, 'only-you:approval:budget')).toBeUndefined();
});
