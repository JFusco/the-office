import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlackNoticeCard } from '../../../../src/work/SlackNoticeCard';
import { projectSlackDeliveries } from '../../../../server/conversations/slack/project-deliveries';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { supersessionFixture } from '../../conversations/slack/fixture';

test('checkpoint notice uses verified closeout and keeps the original uncertain notice as history', () => {
    const f = supersessionFixture(); try {
        const notice = f.store.state.coordination!.notices!.entries[0];
        const render = () => renderToStaticMarkup(createElement(SlackNoticeCard, { notice, deliveries: projectSlackDeliveries(f.store.state) }));
        expect(render()).toContain('Slack uncertain');
        supersedeSlackDelivery(f.store, f.input);
        expect(render()).toContain('Slack superseded by verified follow-up'); expect(render()).toContain(f.replacement.permalink); expect(render()).toContain('Original send outcome unknown'); expect(render()).not.toContain('Slack uncertain'); expect(notice.status).toBe('uncertain');
        f.replacement.status = 'uncertain'; expect(render()).toContain('Slack uncertain');
    } finally { f.close(); }
});
