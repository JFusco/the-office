import { CEC } from '../../office/config';
import type { Execute } from './jira-transport';
import type { JiraCredential } from './jira-credential';

const quoted = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/**
 * One Jira REST request on the configured site, for the parking write TWG cannot make and its identity check.
 * The credential and body travel on stdin, never in the arguments; the user's curl configuration is ignored.
 * A refusal's response body goes to stderr so Jira's reason stays with the failure.
 */
export async function jiraRest(execute: Execute, credential: JiraCredential, request: { method: 'GET' | 'POST'; path: string; body?: unknown }): Promise<string> {
    const input = [`url = "${quoted(`${CEC.site}/rest/api/3/${request.path}`)}"`, `request = "${request.method}"`, `user = "${quoted(`${credential.user}:${credential.token}`)}"`, 'header = "Accept: application/json"',
        ...(request.body === undefined ? [] : ['header = "Content-Type: application/json"', `data-raw = "${quoted(JSON.stringify(request.body))}"`])].join('\n');
    const readOnly = request.method === 'GET';
    return execute('curl', ['-q', '--silent', '--show-error', '--fail-with-body', '--max-time', '60', ...(readOnly ? [] : ['--output', '/dev/stderr']), '--config', '-'], { readOnly, timeout: 70000, input });
}
