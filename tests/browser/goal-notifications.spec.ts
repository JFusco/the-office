import { test, expect } from './fixture-test';
import { evidence } from './support';

test('goal completion DM settings use the verified recipient and stay separate from merge notices (UI fixture)', async ({ page, request }) => {

    const state = await (await request.get('/api/office?project=cec')).json();
    state.coordination.notices.policy.goals = { enabled: false, enabledAt: '', version: 'fixture', targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' };
    await page.route('**/api/office*', route => route.fulfill({ json: state }));
    await page.route('**/api/events*', route => route.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(state)}\n\n` }));
    let submitted: any;
    await page.route('**/api/commands*', async route => { submitted = route.request().postDataJSON(); await route.fulfill({ json: { ok: true } }); });
    await page.goto('/'); await page.getByRole('button', { name: 'Office settings' }).click();
    await expect(page.getByRole('combobox', { name: 'Goal completion recipient' })).toHaveValue('TFIXTURE:UFIXTURE');
    await page.getByLabel('Send Avery’s Slack DM when a goal is completed', { exact: true }).check();
    await page.getByRole('button', { name: 'Save goal notifications', exact: true }).click();
    await expect(page.getByText('Goal notifications saved for this project.', { exact: true })).toBeVisible();
    expect(submitted).toEqual({ action: 'configure-goal-notifications', notifications: { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' } });
    await expect(page.getByLabel('Notify people when a watched PR merges', { exact: true })).not.toBeChecked();
    await page.screenshot({ path: evidence('office-goal-notifications.png') });
});
