import { expect, test } from 'vitest';
import { wikiWorkflow, dispatchArgs } from '../../../../../server/delivery/repairs/bot-redo/wiki-regenerate';
import { renovateControl } from '../../../../../server/delivery/repairs/bot-redo/pin-courier-rebase';

const pr = (ref: string, title = '', body = '') => ({ head: { ref }, title, body });

test.each([
    ['bot/wiki-sync/138', '', '', { route: 'wiki-sync.yml', inputs: { pr_number: '138' } }],
    ['bot/wiki-maintenance', 'docs(wiki): weekly issue and merge reconciliation', 'Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation.\n\nCloses #5', { route: 'wiki-issue-sync.yml', inputs: {} }],
    ['bot/wiki-maintenance', 'docs(wiki): reconcile missed merges [skip release]', 'Automated, reviewable batch wiki reconciliation.', { route: 'wiki-sync.yml', inputs: {} }],
])('%s %s regenerates through its own workflow', (ref, title, body, expected) => {
    expect(wikiWorkflow(pr(ref, title, body))).toEqual(expected);
});

test.each([
    pr('bot/wiki-maintenance', 'docs(wiki): weekly issue and merge reconciliation', 'Automated, reviewable batch wiki reconciliation.'),
    pr('bot/wiki-maintenance', 'docs(wiki): reconcile missed merges [skip ci]', 'Automated, reviewable batch wiki reconciliation.'),
    pr('bot/wiki-sync/0'),
    pr('feature/wiki'),
])('a PR that names no canonical wiki workflow gets no dispatch', value => {
    expect(typeof wikiWorkflow(value)).toBe('string');
});

test('dispatch arguments carry the API version, the ref and only the declared inputs', () => {
    expect(dispatchArgs('o/r', 'wiki-sync.yml', 'main', { pr_number: '138' })).toEqual(['api', '-X', 'POST', '-H', 'X-GitHub-Api-Version: 2026-03-10', 'repos/o/r/actions/workflows/wiki-sync.yml/dispatches', '-f', 'ref=main', '-f', 'inputs[pr_number]=138']);
});

test.each([
    ['one unchecked box', 'a\n- [ ] <!-- rebase-check -->Rebase\nCloses #5', { route: 'renovate-checkbox', body: 'a\n- [x] <!-- rebase-check -->Rebase\nCloses #5' }],
    ['one checked box', 'a\n- [x] <!-- rebase-check -->Rebase', { route: 'renovate-requested' }],
    ['no box', 'a\n- [ ] Rebase', { route: 'renovate-unavailable' }],
    ['two boxes', '- [ ] <!-- rebase-check -->a\n- [ ] <!-- rebase-check -->b', { route: 'renovate-unavailable' }],
])('Renovate’s control with %s', (_kind, body, expected) => {
    expect(renovateControl(body)).toEqual(expected);
});
