import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { GoalNoticeForm } from '../../../src/office/settings/GoalNoticeForm';
import { Checkpoints } from '../../../src/work/Checkpoints';

test('goal notification settings show the named DM recipient and explain future completions and pause behavior', () => {
    const html = renderToStaticMarkup(createElement(GoalNoticeForm, { snapshot: { mode: 'live', project: { id: 'cec' }, coordination: { notices: { policy: { goals: { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' } } } } } as any }));
    expect(html).toContain('Fixture owner'); expect(html).toContain('checked=""');
    expect(html).toContain('Earlier completions are not sent'); expect(html).toContain('Pausing this project');
});
test('recent notice headings identify completed goals and retain merge ticket keys in the status-only checkpoints', () => {
    const snapshot = { mode: 'live', project: { id: 'cec', provider: 'azure' }, coordination: { enabled: true, checkpoints: [], listener: { lastCheckedAt: '', nextCheckAt: '', error: '', assigned: [], reviews: [] }, notices: { policy: {}, entries: [
        { id: 'goal-notice', kind: 'goal', key: '', goalTitle: 'Deliver the integration', status: 'sent', detail: 'https://fixture.slack.com/message' },
        { id: 'merge-notice', key: 'CEC-999', status: 'queued', detail: 'Recipient lookup queued.' },
    ] }, time: { entries: [{ id: 't1', key: 'CEC-1', date: '2026-11-01', seconds: 3600, status: 'posted', detail: 'Fixture worklog.' }] } } } as any;
    const html = renderToStaticMarkup(createElement(Checkpoints, { snapshot }));
    expect(html).toMatch(/<strong[^>]*>Deliver the integration · Slack sent<\/strong>/);
    expect(html).toMatch(/<strong[^>]*>CEC-999 · Slack queued<\/strong>/);
    expect(html).toMatch(/<strong[^>]*>CEC-1 · 2026-11-01 · 1\.000h · posted<\/strong>/);
    expect(html).not.toContain('<form');
});
