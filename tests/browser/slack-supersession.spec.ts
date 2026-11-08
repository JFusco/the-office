import { expect, test } from './fixture-test';
import { evidence } from './support';

test('verified replacement clears the chat warning while preserving unknown original history', async ({ page, request }) => {
    const state = await (await request.get('/api/office')).json();
    const base = { from: 'human', to: 'pm', ticket: '', actionId: '', body: 'Synthetic completion notification', status: 'answered', createdAt: new Date().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] };
    const receipt = { channelId: 'DFIXTURE', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/DFIXTURE/p1794105786541999' };
    state.messages = [{ ...base, id: 'old', requestId: 'old', status: 'failed', error: 'Slack delivery could not be confirmed. It will not be resent.' }, { ...base, id: 'followup', requestId: 'followup' }];
    state.slackDeliveries = [{ id: 'old-delivery', requestId: 'old', targetType: 'person', targetId: 'UFIXTURE', targetName: 'Joe Fixture', workspaceId: 'TFIXTURE', text: 'Original uncertain completion', status: 'uncertain', channelId: '', messageTs: '', permalink: '', supersession: { replacementDeliveryId: 'new-delivery', ...receipt, reason: 'Explicitly authorized verified follow-up' } }, { id: 'new-delivery', requestId: 'followup', targetType: 'person', targetId: 'UFIXTURE', targetName: 'Joe Fixture', workspaceId: 'TFIXTURE', text: 'Verified completion follow-up', status: 'confirmed', ...receipt }];
    await page.route('**/api/office', route => route.fulfill({ json: state }));
    await page.route('**/api/events', route => route.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(state)}\n\n` }));
    await page.goto('/'); await page.getByRole('button', { name: 'Chat with Morgan', exact: true }).click();
    const cards = page.getByRole('complementary', { name: 'Slack delivery' });
    await expect(cards).toHaveCount(2); await expect(cards.first()).toContainText('Superseded by verified follow-up');
    await expect(cards.first()).toContainText('original send outcome remains unknown');
    await expect(cards.first().getByRole('link', { name: 'View verified follow-up' })).toHaveAttribute('href', receipt.permalink);
    await expect(page.getByRole('log', { name: 'Team conversation' })).not.toContainText('Slack delivery needs read-back');
    await expect(page.getByRole('log', { name: 'Team conversation' })).not.toContainText('Delivery confirmed after read-back');
    await expect(cards.last()).toContainText('Sent on Slack');
    await page.screenshot({ path: evidence('office-slack-supersession.png') });
});
