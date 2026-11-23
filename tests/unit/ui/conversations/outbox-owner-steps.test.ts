import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { Outbox } from '../../../../src/conversations/Outbox';
import { ownerStepsFirst } from '../../../../src/conversations/owner-steps-first';
import { signInSteps } from '../../../../server/it/sign-in-steps';
import { initialSnapshot } from '../../../../server/store/store';
import type { HumanAction } from '../../../../src/shared';

const action = (id: string, extra: Partial<HumanAction> = {}): HumanAction => ({ id, title: `Title ${id}`, detail: `Detail ${id}`, status: 'open', role: 'pm', ticket: '', url: '', createdAt: '', updatedAt: '', ...extra });
const ownerSteps = signInSteps({ id: 'atlassian', name: 'Atlassian · Jira & Confluence', failure: 'Error: twg exited 77: Your OAuth session has expired.' });
function fixture() {
    const snapshot = initialSnapshot();
    snapshot.project = { id: 'brain', name: 'Brain', provider: 'github' } as never;
    snapshot.outbox = [action('it-followup'), action('only-you:login:atlassian', { title: 'Only you can do this: sign in to Atlassian · Jira & Confluence', detail: ownerSteps.why, ownerSteps })];
    return snapshot;
}
const render = (initialId?: string) => renderToStaticMarkup(createElement(Outbox, { snapshot: fixture(), initialId, sendMessage: async () => { throw Error('No chat expected'); } }));

test('an opened item with owner steps shows why, each step with its command and what shows it worked', () => {
    const html = render('only-you:login:atlassian');
    expect(html).toContain('data-outbox-owner-steps');
    expect(html).toContain('What the provider said:');
    expect(html).toContain('Your OAuth session has expired.');
    for (const text of ['Only you can do this', 'Your OAuth session has expired.', '<code', '>twg doctor</code>', '>twg login --force</code>', 'You&#x27;ll know it worked when:', 'Service health shows a fresh Connected result for Atlassian · Jira &amp; Confluence.'])
        expect(html).toContain(text);
    expect(html.match(/<li/g)).toHaveLength(ownerSteps.steps.length);
    expect(html.match(/<code/g)).toHaveLength(3);
});

test('an item only the owner can clear has no reply box: a reply would spend a run on something the team cannot do', () => {
    expect(render('it-followup')).toContain('<textarea');
    expect(render('only-you:login:atlassian')).not.toContain('<textarea');
});

test('an item without owner steps shows none', () => {
    expect(render('it-followup')).not.toContain('data-outbox-owner-steps');
});

test('in the list, items with owner steps come first and are marked', () => {
    const html = render();
    const first = html.indexOf('Only you can do this: sign in to');
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(html.indexOf('Title it-followup'));
    expect(html.match(/>Only you</g)).toHaveLength(1);
    expect(html).toContain('look for a fresh Connected result for this service in Service health.');
    expect(ownerStepsFirst([action('a'), action('b', { ownerSteps }), action('c')]).map(item => item.id)).toEqual(['b', 'a', 'c']);
});
