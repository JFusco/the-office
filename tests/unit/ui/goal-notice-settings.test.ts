import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { GoalNoticeSettings } from '../../../src/leadership/GoalNoticeSettings';

test('goal notification settings show the named DM recipient and explain future completions and pause behavior', () => {
    const html = renderToStaticMarkup(createElement(GoalNoticeSettings, { snapshot: { mode: 'live', coordination: { notices: { policy: { goals: { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' } } } } } as any }));
    expect(html).toContain('Fixture owner'); expect(html).toContain('checked=""');
    expect(html).toContain('Earlier completions are not sent'); expect(html).toContain('Pausing this project');
});
