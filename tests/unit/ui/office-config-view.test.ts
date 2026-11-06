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
test('shows an empty holds list and omits the binding without an Azure project', () => {
    const html = render({ status: 'ready', config: { ...config, projects: [config.projects[1]], holds: [] } });
    expect(html).toContain('No holds are configured'); expect(html).not.toContain('Jira / Azure binding');
});
