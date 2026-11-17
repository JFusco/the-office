import { jiraRest } from './jira-rest';
import type { Execute } from './jira-transport';
import type { JiraCredential } from './jira-credential';
import type { JiraBinding } from '../../office/project-bindings-config';

/** Plain text as an Atlassian document: blank lines separate paragraphs, single newlines break lines. */
const document = (text: string) => ({ type: 'doc', version: 1, content: text.split(/\n{2,}/).filter(Boolean).map(paragraph => ({ type: 'paragraph',
    content: paragraph.split('\n').flatMap((line, index) => [...(index ? [{ type: 'hardBreak' }] : []), ...(line ? [{ type: 'text', text: line }] : [])]) })) });

/**
 * One Jira REST transition carrying its comment in the same request, as Jira's transition dialog sends it.
 * TWG posts a transition comment separately, which a workflow that requires a comment on the transition refuses.
 */
export async function transitionWithComment(execute: Execute, binding: JiraBinding, credential: JiraCredential, key: string, transitionId: string, comment: string): Promise<void> {
    await jiraRest(execute, binding, credential, { method: 'POST', path: `issue/${encodeURIComponent(key)}/transitions`, body: { transition: { id: transitionId }, update: { comment: [{ add: { body: document(comment) } }] } } });
}
