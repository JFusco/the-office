import { test, expect } from './fixture-test';
import { setPreferences } from './support';

test.beforeEach(async ({ page, request }) => { await setPreferences(request, { reducedMotion: true }); await page.addInitScript(() => localStorage.setItem('office.floor', 'delivery')); });

for (const blocker of ['Saved implementation plan is required', 'Error: I cannot clear dispatch. The session bridge returned complete=false because a log changed.']) {
test(`saved plan follow-up survives ${blocker.startsWith('Error:') ? 'interrupted read-back' : 'artifact gap'} and never repeats a lost request`, async ({ page, request }, info) => {
    const snapshot = await (await request.get('/api/office?project=cec')).json();
    const ticket = { ...snapshot.tickets[0], key: 'CEC-154', pilot: true, stage: 'plan', activity: 'blocked', blocker, results: { plan: { outcome: 'passed', summary: 'Complete revised plan. Preserve saved Page Fields and Component references.' } } };
    snapshot.tickets = [ticket]; snapshot.outbox = [{ id: 'ticket:CEC-154:plan', role: 'developer', ticket: ticket.key, title: 'CEC-154 needs Office follow-up', detail: ticket.blocker, status: 'open', url: '', createdAt: '', updatedAt: '' }];
    await request.post('/__fixture/snapshot?project=cec', { data: snapshot });
    let posts = 0; await page.route('**/api/commands', async route => { posts++; expect(route.request().postDataJSON()).toEqual({ action: 'resume-ticket', key: 'CEC-154' }); await route.abort(); });
    await page.goto('/'); await page.getByRole('button', { name: /^Open your outbox,/ }).click();
    await page.getByRole('button', { name: /CEC-154.*Open follow-up/ }).click();
    const detail = page.locator('[data-saved-plan-followup]'); await expect(detail).toContainText('No product answer or approval is needed');
    await detail.getByText('Read Alex’s saved plan', { exact: true }).click(); await expect(detail).toContainText('Preserve saved Page Fields');
    await expect(detail.getByRole('button', { name: 'Reconcile saved plan', exact: true })).toBeInViewport();
    await page.screenshot({ path: info.outputPath('saved-plan-action.png') });
    await detail.getByRole('button', { name: 'Reconcile saved plan', exact: true }).click(); await expect(detail.getByRole('alert')).toContainText('Request not confirmed');
    await expect(detail.getByRole('button', { name: 'Reconciliation requested — check status' })).toBeDisabled();
    await detail.getByRole('button', { name: 'Refresh status' }).click(); expect(posts).toBe(1);
});
}

test('product question opens from outbox with recommendation first, three choices and an editable free-text answer', async ({ page, request }, info) => {
    const feature = await (await request.post('/api/features?project=cec', { data: { action: 'create', title: 'Preserve authored edits', intent: 'Synthetic product choice' } })).json();
    feature.rounds[0].questions = [{ id: 'q', question: 'How should revised prose be applied?', recommendation: 'Review proposed changes', options: [{ id: 'auto', label: 'Replace automatically', tradeoff: 'Fewer clicks' }, { id: 'review', label: 'Review proposed changes', tradeoff: 'Keep editorial control' }, { id: 'keep', label: 'Keep saved text', tradeoff: 'No prose update' }], choices: [], recommendedOptionId: 'review' }];
    await request.post('/__fixture/snapshot?project=cec', { data: { features: [feature], outbox: [], featurePlanning: { assessment: true, progression: 'automatic', policyDigest: 'fixture' } } });
    await page.goto('/'); const dialog = page.locator('dialog[data-office-question-dialog]'); await expect(dialog).toBeVisible(); await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Your outbox, 1 needs you', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Open your outbox,/ }).click(); await page.locator('[data-outbox-question]').click();
    const section = page.getByRole('region', { name: 'Question round' });
    await expect(section.getByRole('radio')).toHaveCount(3); await expect(section.getByRole('radio').first()).toHaveAccessibleName(/Review proposed changes.*Recommended/);
    await section.getByLabel('Your answer', { exact: true }).fill('Review proposed changes and keep all saved Page Fields.');
    await expect(section.getByRole('button', { name: 'Send answers', exact: true })).toBeInViewport();
    await page.screenshot({ path: info.outputPath('question-outbox-answer.png') });
    await section.getByRole('button', { name: 'Send answers', exact: true }).click();
    const writes = await (await request.get('/__fixture/writes')).json(); expect(writes.filter((item: any) => item.body.action === 'answer')).toMatchObject([{ path: `/api/features/${feature.id}?project=cec&officeWide=1`, body: { roundId: feature.rounds[0].id, expectedRevision: 1, answers: { q: 'Review proposed changes and keep all saved Page Fields.' } } }]);
});

test('ordinary follow-up exposes its reply field above history and sends to the displayed owner', async ({ page, request }) => {
    await request.post('/__fixture/snapshot?project=cec', { data: { outbox: [{ id: 'question:clarification', role: 'lead', ticket: '', title: 'Sam has a question', detail: 'Which environment should be used?', status: 'open', url: '', createdAt: '', updatedAt: '' }] } });
    await page.goto('/'); await page.getByRole('button', { name: /^Open your outbox,/ }).click(); await page.locator('[data-outbox-item]').click();
    await expect(page.getByRole('textbox', { name: 'Your reply to Sam' })).toBeInViewport(); await page.getByRole('textbox', { name: 'Your reply to Sam' }).fill('Use the lower environment only.');
    await page.getByRole('button', { name: 'Send reply', exact: true }).click();
    const writes = await (await request.get('/__fixture/writes')).json(); expect(writes.some((item: any) => item.body.role === 'lead' && item.body.actionId === 'question:clarification' && item.body.body === 'Use the lower environment only.')).toBe(true);
});

test('Avery input failure offers original-message recovery instead of a duplicate chat send', async ({ page, request }) => {
    const message = { id: 'avery-original', requestId: 'avery-original', from: 'human', to: 'cto', status: 'failed', body: 'The walkthrough videos are complete.', error: '{"input_error_code":"input_too_large"}', ticket: '', actionId: '', receipts: [], recipients: [], createdAt: '', sessionId: '', recheck: false };
    await request.post('/__fixture/snapshot?project=cec', { data: { messages: [message], outbox: [{ id: 'message:avery-original', role: 'cto', ticket: '', title: 'Avery’s reply needs Office recovery', detail: 'Context exceeded the input limit', status: 'open', url: '', createdAt: '', updatedAt: '' }] } });
    let posts = 0; await page.route('**/api/commands', async route => { posts++; expect(route.request().postDataJSON()).toEqual({ action: 'recover-cto-input', messageId: message.id }); await route.abort(); });
    await page.goto('/'); await page.getByRole('button', { name: /^Open your outbox,/ }).click(); await page.locator('[data-outbox-item]').click();
    const followup = page.locator('[data-cto-input-followup]'); await expect(followup).toContainText('Your message was retained');
    await followup.getByRole('button', { name: 'Recover original message' }).click(); await expect(followup.getByRole('alert')).toContainText('do not send your original message again');
    await expect(followup.getByRole('button', { name: 'Recovery requested — check status' })).toBeDisabled(); expect(posts).toBe(1);
});

test('a stale outbox answer refreshes its question without losing the typed draft or submitting again', async ({ page, request }) => {
    const feature = await (await request.post('/api/features?project=cec', { data: { action: 'create', title: 'Changed intake', intent: 'Synthetic stale answer' } })).json();
    await request.post('/__fixture/snapshot?project=cec', { data: { features: [feature], outbox: [], featurePlanning: { assessment: true, progression: 'automatic', policyDigest: 'fixture' } } });
    await page.goto('/'); const dialog = page.locator('dialog[data-office-question-dialog]'); await expect(dialog).toBeVisible(); await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Open your outbox,/ }).click(); await page.locator('[data-outbox-question]').click();
    const form = page.getByRole('region', { name: 'Question round' }); await form.getByLabel('Your answer', { exact: true }).fill('Keep the authored Page Fields.');
    let posts = 0; await page.route(`**/api/features/${feature.id}?project=cec&officeWide=1`, async route => { posts++; feature.paused = true; await request.post('/__fixture/snapshot?project=cec', { data: { features: [feature] } }); await route.fulfill({ status: 409, json: { code: 'changed-precondition', error: 'Ticket left Ready intake' } }); });
    await form.getByRole('button', { name: 'Send answers', exact: true }).click(); await expect(form).toHaveCount(0);
    expect(await page.evaluate(() => Object.values(localStorage).includes('Keep the authored Page Fields.'))).toBe(true); expect(posts).toBe(1);
});
