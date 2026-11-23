import { expect, test } from 'vitest';
import { ownerStepsFirst } from '../../../../src/conversations/owner-steps-first';
import type { HumanAction } from '../../../../src/shared';

const steps = { why: 'Signed out.', steps: [{ text: 'Sign in.', run: 'twg login --force' }], doneWhen: 'The check passes.' };
const action = (id: string, extra: Partial<HumanAction> = {}): HumanAction => ({ id, title: id, detail: id, status: 'open', role: 'pm', ticket: '', url: '', createdAt: '', updatedAt: '', ...extra });

test('open items only the owner can clear come first; the others keep their order', () => {
    const items = [action('a'), action('sign-in-1', { ownerSteps: steps }), action('b'), action('sign-in-2', { ownerSteps: steps })];
    expect(ownerStepsFirst(items).map(item => item.id)).toEqual(['sign-in-1', 'sign-in-2', 'a', 'b']);
    expect(items.map(item => item.id)).toEqual(['a', 'sign-in-1', 'b', 'sign-in-2']);
});

test('a resolved item with steps no longer waits on the owner and keeps its place', () => {
    const items = [action('a'), action('done', { ownerSteps: steps, status: 'resolved' }), action('open', { ownerSteps: steps }), action('b')];
    expect(ownerStepsFirst(items).map(item => item.id)).toEqual(['open', 'a', 'done', 'b']);
});

test('a list with no such item is returned in the same order', () => {
    expect(ownerStepsFirst([action('a'), action('b')]).map(item => item.id)).toEqual(['a', 'b']);
    expect(ownerStepsFirst([])).toEqual([]);
});
