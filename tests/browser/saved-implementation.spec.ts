import { test, expect } from './fixture-test';
import { setPreferences } from './support';

for (const decision of ['continue', 'hold', 'lost']) {
    test(`saved implementation: ${decision} is explicit and never blindly repeated`, async ({ page, request }, info) => {
        await setPreferences(request, { reducedMotion: true });
        await page.addInitScript(() => localStorage.setItem('office.floor', 'delivery'));
        const snapshot = await (await request.get('/api/office?project=cec')).json();
        const ticket = { ...snapshot.tickets[0], key: 'CEC-154', pilot: true, stage: 'implement', activity: 'blocked', commit: '', branch: '', worktree: '', prId: 0,
            blocker: 'Interrupted implementation; claude timed out', results: { implement: { outcome: 'blocked', receipts: [{ action: 'implement', uncertain: true, verified: false }] } } };
        const workerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fingerprint = 'a'.repeat(64);
        await request.post('/__fixture/snapshot?project=cec', { data: { tickets: [ticket], deliveryQueue: [], workLog: [{ id: workerId, ticket: ticket.key, stage: 'implement', status: 'failed', provider: 'claude', failure: { category: 'uncertain-effect' } }], outbox: [{ id: 'ticket:CEC-154:implement', role: 'developer', ticket: ticket.key, title: 'CEC-154 needs follow-up', detail: ticket.blocker, status: 'open', url: '', createdAt: '', updatedAt: '' }] } });
        let reads = 0, posts = 0;
        await page.route('**/api/cec/saved-implementation?*', async route => { reads++; await route.fulfill({ json: { available: true, proof: { workerId, fingerprint, fileCount: 76, branch: 'codex/cec-154-original', head: 'b'.repeat(40) } } }); });
        await page.route('**/api/commands*', async route => {
            posts++; expect(route.request().postDataJSON()).toEqual({ action: 'continue-saved-implementation', key: ticket.key,
                implementationContinuation: { workerId, fingerprint, decision: decision === 'hold' ? 'hold' : 'continue', acknowledgeUncertainHistory: decision !== 'hold', note: 'Preserve saved edits.' } });
            if (decision === 'lost') await route.abort(); else await route.fulfill({ status: 202, json: decision === 'hold' ? { accepted: true, held: true } : { accepted: true, request: { id: 'same-request' } } });
        });
        await page.goto('/'); await page.getByRole('button', { name: /^Open your outbox,/ }).click(); await page.locator('[data-outbox-item]').click();
        const form = page.locator('[data-saved-implementation-followup]');
        expect(reads).toBe(0); await form.getByRole('button', { name: 'Review saved work', exact: true }).click();
        await expect(form).toContainText('76 changed files saved'); await expect(form.getByRole('radio')).toHaveCount(2);
        await expect(form.getByRole('radio').first()).toHaveAccessibleName('Continue saved work (Recommended)'); await expect(form.getByRole('radio').first()).toBeChecked();
        if (decision === 'hold') await form.getByRole('radio', { name: 'Keep paused', exact: true }).check();
        await form.getByRole('textbox', { name: 'Guidance (optional)' }).fill('Preserve saved edits.');
        await page.screenshot({ path: info.outputPath(`saved-work-${decision}.png`) });
        await form.getByRole('button', { name: 'Apply decision', exact: true }).click();
        await expect(form).toContainText(decision === 'lost' ? 'Decision not confirmed' : decision === 'hold' ? 'Kept paused' : 'Continuation requested');
        await expect(form.getByRole('button', { name: 'Apply decision', exact: true })).toBeDisabled();
        await form.getByRole('button', { name: 'Refresh status' }).click(); expect(posts).toBe(1); expect(reads).toBe(1);
    });
}
