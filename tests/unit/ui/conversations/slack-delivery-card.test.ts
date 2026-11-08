import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlackDeliveryCard } from '../../../../src/conversations/SlackDeliveryCard';
import { projectSlackDeliveries } from '../../../../server/conversations/slack/project-deliveries';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { supersessionFixture } from '../../conversations/slack/fixture';

test('history shows a verified replacement link instead of a stale read-back warning without claiming original delivery', () => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input); const [delivery] = projectSlackDeliveries(f.store.state);
        const html = renderToStaticMarkup(createElement(SlackDeliveryCard, { delivery }));
        expect(html).toContain('Superseded by verified follow-up'); expect(html).toContain(f.replacement.permalink); expect(html).toContain('original send outcome remains unknown'); expect(html).not.toContain('Slack delivery needs read-back'); expect(html).not.toContain('Sent on Slack');
        delivery.supersession!.permalink = 'https://unrelated.invalid';
        expect(renderToStaticMarkup(createElement(SlackDeliveryCard, { delivery }))).toContain('Slack delivery needs read-back');
    } finally { f.close(); }
});
