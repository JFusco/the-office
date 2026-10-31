import { expect, test } from 'vitest';
import { projectRows } from '../../../src/work/ProjectWork';
import { initialSnapshot } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
test('GitHub project lanes, issue lifecycle, linked PRs and Office delivery remain distinct', () => {
    const s = initialSnapshot();
    s.project = projectById('brain');
    s.github = { prs: [{ number: 266, state: 'open', linkedIssues: [260] }], board: { items: [{ repository: 'JFusco/brain', number: 260, title: 'PostgreSQL references', status: 'Ready', state: 'OPEN' }, { repository: 'other/repo', number: 260, status: 'Done' }] } } as any;
    s.tickets = [{ key: 'GH-260', stage: 'mailbox', status: 'open' }] as any;
    expect(projectRows(s)).toEqual([{ key: 'GH-260', title: 'PostgreSQL references', lane: 'Ready', state: 'OPEN', pr: 266, blockedBy: [], office: 'Not started in the Office' }]);
});
test('Jira native statuses do not become mailbox or complete based on an Office stage', () => {
    const s = initialSnapshot();
    s.project = projectById('cec');
    s.tickets = [{ key: 'CEC-135', summary: 'Fix generation', stage: 'mailbox', status: 'Ready for Production' }] as any;
    expect(projectRows(s)[0]).toMatchObject({ lane: 'Ready for Production', office: 'Not started in the Office' });
});
test('Ready remains the board lane while the held prerequisite is exposed separately', () => {
    const s = initialSnapshot();
    s.project = projectById('brain');
    s.github = { prs: [], board: { items: [{ repository: 'JFusco/brain', number: 254, title: 'Refresh references', status: 'Ready', state: 'OPEN' }] } } as any;
    s.coordination = { listener: { reviews: [{ id: 'held', key: 'GH-254', status: 'held', workRequested: 'automatic', detail: 'Keep held until GH-255 completes.', prerequisites: [{ target: { projectId: 'brain', kind: 'issue', id: '255' }, condition: 'issue-closed', evidence: 'Synthetic record', observedAt: new Date().toISOString() }] }] } } as any;
    expect(projectRows(s)[0]).toMatchObject({ lane: 'Ready', blockedBy: ['GH-255'], office: 'Waiting for GH-255' });
});
