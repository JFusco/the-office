import { expect, test } from 'vitest';
import { slackMessageStatus } from '../../../../src/conversations/slack-message-status';
import { projectSlackDeliveries } from '../../../../server/conversations/slack/project-deliveries';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { supersessionFixture } from '../../conversations/slack/fixture';

test('an old Slack error is superseded rather than falsely confirmed; other failures are not hidden', () => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input); const deliveries = projectSlackDeliveries(f.store.state);
        const message = { ...f.human, id: 'old', actionId: 'message:notice', error: 'Slack delivery could not be confirmed' };
        expect(slackMessageStatus(message, deliveries)).toBe('superseded');
        expect(slackMessageStatus({ ...message, error: 'Unknown GitHub issue creation' }, deliveries)).toBeUndefined();
        expect(slackMessageStatus({ ...message, id: 'other', actionId: '' }, deliveries)).toBeUndefined();
    } finally { f.close(); }
});
