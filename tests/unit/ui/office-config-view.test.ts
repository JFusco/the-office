import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { OfficeConfigView } from '../../../src/office/settings/OfficeConfigView';

const config = { projects: [{ id: 'cec', name: 'CEC', provider: 'azure' as const, repository: 'cec-repo', target: 'staging', boardName: 'CEC Jira board', boardUrl: 'https://example.atlassian.net/board' }, { id: 'bare', name: 'Bare', provider: 'github' as const, repository: 'owner/bare', target: 'main', boardName: null, boardUrl: null }], cec: { site: 'https://example.atlassian.net', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', target: 'staging' }, holds: [{ key: 'CEC-1', reason: '<b>Hold</b> reason' }] };
const render = (state: Parameters<typeof OfficeConfigView>[0]['state']) => renderToStaticMarkup(createElement(OfficeConfigView, { state, onRetry: () => { } }));

test('distinguishes loading and failure, offering a retry', () => {
    expect(render({ status: 'loading' })).toContain('Loading the Office configuration');
    const failed = render({ status: 'error', message: 'Error: The Office returned 503' });
    expect(failed).toContain('Office configuration is unavailable: The Office returned 503'); expect(failed).toContain('Retry');
});
test('renders projects, the binding, escaped holds and the restart footer', () => {
    const html = render({ status: 'ready', config });
    for (const text of ['CEC', 'cec-repo', 'staging', 'Azure DevOps', 'GitHub', 'No board configured', 'Jira / Azure binding', 'https://dev.azure.com/example · example', 'CEC-1', 'Edit office-config.json and restart the Office']) expect(html).toContain(text);
    expect(html).toContain('href="https://example.atlassian.net/board"');
    expect(html).toContain('&lt;b&gt;Hold&lt;/b&gt;');
});
test('each Azure project shows its own Jira / Azure binding and its resolved policy', () => {
  const policy = { merge: 'human' as const, handsOff: false, checkpoint: { hour: 9, weekends: false } };
  const cec = { ...config.projects[0], policy, jira: { site: 'https://example.atlassian.net', projectKey: 'CEC', intakeStatuses: ['To Do', 'Open'], defaultPickup: 'To Do' }, azure: { organization: 'https://dev.azure.com/example', project: 'example' } };
  const acme = { id: 'acme', name: 'Acme', provider: 'azure' as const, repository: 'acme-web', target: 'develop', boardName: null, boardUrl: null, policy: { ...policy, checkpoint: { hour: 17, weekends: true } }, jira: { site: 'https://acme.example.net', projectKey: 'ACME', intakeStatuses: ['Selected', 'Ready'], defaultPickup: 'Selected' }, azure: { organization: 'https://dev.azure.com/acme', project: 'Acme' } };
  const html = render({ status: 'ready', config: { ...config, projects: [cec, acme, config.projects[1]] } });
  for (const text of ['CEC · Jira / Azure binding', 'Acme · Jira / Azure binding', 'https://acme.example.net', 'ACME', 'Selected, Ready', 'https://dev.azure.com/acme · Acme', 'Human merges · not hands-off · checkpoint 09:00, weekdays only', 'checkpoint 17:00']) expect(html).toContain(text);
  // The legacy single card is only a fallback for a summary without per-project bindings.
  expect(html.match(/Jira \/ Azure binding/g)).toHaveLength(2);
});
test('each GitHub project card shows its effective bot adoption; a legacy summary and Azure show none', () => {
  const policy = { merge: 'harness' as const, handsOff: true, checkpoint: { hour: 17, weekends: true } };
  const github = (id: string, autoAdopt?: { bots: ('dependabot' | 'pin-courier' | 'wiki-sync')[]; source: 'explicit' | 'default' | 'none' }) =>
    ({ ...config.projects[1], id, name: `Project ${id}`, policy: { ...policy, handsOff: autoAdopt?.source !== 'none' }, ...(autoAdopt ? { autoAdopt } : {}) });
  const projects = [github('default', { bots: ['dependabot', 'pin-courier', 'wiki-sync'], source: 'default' }), github('subset', { bots: ['wiki-sync', 'pin-courier'], source: 'explicit' }),
    github('empty', { bots: [], source: 'explicit' }), github('inactive', { bots: [], source: 'none' }), github('legacy'), config.projects[0]];
  const html = render({ status: 'ready', config: { ...config, projects } });
  const card = (name: string) => html.split('<article').find(article => article.includes(`>${name}</strong>`))!;
  const row = (name: string) => /<dt[^>]*>Bot adoption<\/dt><dd[^>]*>([^<]*)<\/dd>/.exec(card(name))?.[1];
  expect(row('Project default')).toBe('Dependabot, pin-courier, wiki-sync (default for hands-off)');
  expect(row('Project subset')).toBe('wiki-sync, pin-courier (explicit)');
  expect(row('Project empty')).toBe('None (explicit)');
  expect(row('Project inactive')).toBe('Inactive');
  expect(card('Project legacy')).not.toContain('Bot adoption');
  expect(card('CEC')).not.toContain('Bot adoption');
  expect(html.match(/Bot adoption/g)).toHaveLength(4);
});
test('shows an empty holds list and omits the binding without an Azure project', () => {
    const html = render({ status: 'ready', config: { ...config, projects: [config.projects[1]], holds: [] } });
    expect(html).toContain('No holds are configured'); expect(html).not.toContain('Jira / Azure binding');
});
