import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { GoalNoticeSettings } from '../../../src/leadership/GoalNoticeSettings';
import { CoordinationSettings } from '../../../src/office/CoordinationSettings';

test('goal notification settings show the named DM recipient and explain future completions and pause behavior', () => {
    const html = renderToStaticMarkup(createElement(GoalNoticeSettings, { snapshot: { mode: 'live', coordination: { notices: { policy: { goals: { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' } } } } } as any }));
    expect(html).toContain('Fixture owner'); expect(html).toContain('checked=""');
    expect(html).toContain('Earlier completions are not sent'); expect(html).toContain('Pausing this project');
});
test('recent notice headings identify completed goals and retain merge ticket keys', () => {
    const snapshot = { mode: 'live', coordination: { notices: { policy: {}, entries: [
        { id: 'goal-notice', kind: 'goal', key: '', goalTitle: 'Deliver the integration', status: 'sent', detail: 'https://fixture.slack.com/message' },
        { id: 'merge-notice', key: 'CEC-999', status: 'queued', detail: 'Recipient lookup queued.' },
    ] } } } as any;
    const html = renderToStaticMarkup(createElement(CoordinationSettings, { snapshot }));
    expect(html).toMatch(/<strong[^>]*>Deliver the integration · Slack sent<\/strong>/);
    expect(html).toMatch(/<strong[^>]*>CEC-999 · Slack queued<\/strong>/);
});
