import { expect, test } from 'vitest';
import { intakeEnumeration, intakeJql, intakeLocation, intakeMembership, projectListScope } from '../../../server/cec/intake-scope';
const binding = { site: 'https://example.atlassian.net', board: 9121, account: '557058:joe' };
const list = (jql = 'project = CEC AND assignee = 557058:joe ORDER BY cf[10011] ASC') => binding.site + '/jira/software/c/projects/CEC/list?jql=' + encodeURIComponent(jql);
test('explicit project list replaces the deleted board across intake and membership without reading it', async () => {
    const configured = { ...binding, intakeListUrl: list() };
    expect(projectListScope(configured)?.jql).toBe('project = CEC AND assignee = "557058:joe"');
    expect(intakeLocation(configured)).toEqual({ name: 'CEC Jira list', url: list() });
    expect(intakeEnumeration(configured)).toContain('full pagination');
    expect(intakeMembership(configured)).toContain('boardMember=true only after this membership is verified');
    let reads = 0;
    expect(await intakeJql(configured, async () => { reads++; throw new Error('deleted board'); })).toContain('assignee');
    expect(reads).toBe(0);
});
test('board mode retains current filter membership and full board/backlog coverage without a fallback', async () => {
    expect(projectListScope(binding)).toBeUndefined();
    expect(intakeLocation(binding).url).toContain('rapidView=9121');
    expect(intakeEnumeration(binding)).toContain('board AND backlog');
    expect(await intakeJql(binding, async () => '123')).toBe('filter = 123');
    await expect(intakeJql(binding, async () => { throw new Error('404'); })).rejects.toThrow('404');
});
test.each([
    list().replace('example.atlassian.net', 'other.atlassian.net'),
    list().replace('/CEC/list', '/OTHER/list'),
    list('project = CEC OR assignee = 557058:joe ORDER BY cf[10011] ASC'),
    list('project = CEC AND assignee = someone-else ORDER BY cf[10011] ASC'),
    list('project = OTHER AND assignee = 557058:joe ORDER BY cf[10011] ASC'),
    list() + '&jql=project%3DOTHER',
    list().replace('https:', 'http:'),
    list() + '#fragment',
    list() + '&extra=value',
])('rejects changed or broadened list scope before any provider read: %s', async intakeListUrl => {
    let reads = 0;
    await expect(intakeJql({ ...binding, intakeListUrl }, async () => { reads++; return '123'; })).rejects.toThrow();
    expect(reads).toBe(0);
});
