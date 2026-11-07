import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { configureNotices, queueMergeNotice } from '../../../server/conversations/notifications';
import { plainSlackText, shippedSummary } from '../../../server/conversations/merge-summary';
import { comparableSlackText } from '../../../server/conversations/slack';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));

const body = [
    '## Summary', '', 'Publish SQLite guidance with **explicit** evidence limits.', 'Revalidate `next` route params.', '', 'Second paragraph is left out.', '',
    '## Linked issue', '', 'Closes #339', '',
    '## Changes', '', '- Add six playbooks.', '  - nested detail is skipped', '* Extend [Graphify](https://example.invalid/g) hooks.', '1. Regenerate hubs.', '- Correct claims.', '- Fifth bullet is left out.', '',
    '## Verification', '', '- Not a change.',
].join('\n');

test('takes the first Summary paragraph and up to three top-level Changes bullets as plain text', () => {
    expect(shippedSummary({ title: 'docs(knowledge): clarify `workflow` contracts', body })).toEqual({
        title: 'docs(knowledge): clarify workflow contracts',
        summary: 'Publish SQLite guidance with explicit evidence limits. Revalidate next route params.',
        changes: ['Add six playbooks.', 'Extend Graphify hooks.', 'Regenerate hubs.'],
    });
});

test('missing or unstructured bodies fall back to the title alone', () => {
    expect(shippedSummary()).toEqual({ title: '', summary: '', changes: [] });
    expect(shippedSummary({ title: 'Fix it', body: 'Just some prose.' })).toEqual({ title: 'Fix it', summary: '', changes: [] });
});

test('PR text can never ping anyone and long text is clamped', () => {
    expect(plainSlackText('Hi <!here> <!channel> @everyone <@U123ABC> <@W1|joe> <#C123|general> done')).toBe('Hi everyone done');
    expect(plainSlackText('a <!he<!here>re> b <@U1<@U2>23> c @@here d <!subteam^S0123ABC|@devs> e <`!here> f [<!he](https://x.invalid)re>')).toBe('a b c here d e f');
    expect(plainSlackText('split <!here\nand >tail, a -> b')).toBe('split tail, a - b');
    expect(plainSlackText('unclosed <!here and <@U123')).toBe('unclosed !here and @U123');
    expect(shippedSummary({ title: `${'w '.repeat(80)}${'('.repeat(34)}@here${'a'.repeat(60)}` }).title).not.toMatch(/@here/);
    expect(shippedSummary({ body: '## Changes\n\n```\n- not a change\n## Summary\n```\n- Real change.' }).changes).toEqual(['Real change.']);
    const long = shippedSummary({ body: `## Summary\n\n${'word '.repeat(300)}\n\n## Changes\n\n- ${'x'.repeat(400)}` });
    expect(long.summary.length).toBeLessThanOrEqual(280);
    expect(long.summary.endsWith('…')).toBe(true);
    expect(long.changes[0].length).toBeLessThanOrEqual(120);
    const clipped = shippedSummary({ body: `## Summary\n\n${'First sentence is here. '.repeat(15)}Tail\n\n## Changes\n\n- Extend hook coordination and refusal assertions for the agent; revalidate the existing route-parameter note in the knowledge base.` });
    expect(clipped.summary).toMatch(/here\.$/);
    expect(clipped.changes).toEqual(['Extend hook coordination and refusal assertions for the agent']);
});

test('the queued notice separates headline, summary, changes and footer, and survives Slack read-back normalization', () => {
    const store = new Store(':memory:'); stores.push(store); store.state.coordination = coordination();
    configureNotices(store, { enabled: true, recipients: 'assignee', workspace: 'Fixture', mappings: '' });
    queueMergeNotice(store, { key: 'GH-339', prUrl: 'https://github.com/JFusco/brain/pull/340', mergeCommit: '1290978bdf3a0003feac812d8520341e779b3ae6', mergedAt: '2099-01-01T00:00:00Z',
        summary: 'GitHub Actions are monitored separately by the Office.', pr: { title: 'docs(knowledge): clarify workflow contracts', body }, assignees: [{ id: 'assignee' }] });
    const text = store.state.coordination!.notices!.entries[0].text;
    expect(text).toBe([
        `${store.project.name} · GH-339 shipped: docs(knowledge): clarify workflow contracts`,
        'Publish SQLite guidance with explicit evidence limits. Revalidate next route params.',
        '- Add six playbooks.\n- Extend Graphify hooks.\n- Regenerate hubs.',
        'PR: https://github.com/JFusco/brain/pull/340 · merge 1290978\nGitHub Actions are monitored separately by the Office.',
    ].join('\n\n'));
    expect(comparableSlackText(text)).toBe(text);
});

test('a notice without PR content keeps a short headline and footer', () => {
    const store = new Store(':memory:'); stores.push(store); store.state.coordination = coordination();
    configureNotices(store, { enabled: true, recipients: 'assignee', workspace: 'Fixture', mappings: '' });
    queueMergeNotice(store, { key: 'CEC-1', prUrl: 'https://example.invalid/pr/1', mergeCommit: 'a'.repeat(40), mergedAt: '2099-01-01T00:00:00Z', summary: 'Build observation separate.', assignees: [{ id: 'assignee' }] });
    expect(store.state.coordination!.notices!.entries[0].text).toBe(`${store.project.name} · CEC-1 shipped\n\nPR: https://example.invalid/pr/1 · merge aaaaaaa\nBuild observation separate.`);
});
