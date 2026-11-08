import { expect, test } from './fixture-test';
import { evidence } from './support';

test('telemetry opens from the header, reports every project, drills into a project and ticket, and returns focus', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Telemetry', exact: true });
  await opener.click();
  const panel = page.getByRole('complementary', { name: 'Telemetry', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Telemetry', exact: true })).toBeVisible();
  const totals = panel.getByLabel('Telemetry totals');
  await expect(totals).toContainText('$7.09'); // 2.41 + 1.02 partial + 3.11 + 0.55 overhead; harness excluded
  await expect(totals).toContainText('Subtotal · 1 partial · 2 unpriced'); // GH-255's uncaptured run and CEC's pre-capture session
  await expect(panel.getByRole('table', { name: 'By project' })).toBeVisible();
  await expect(panel.getByText(/Overhead with no ticket .*1 run · \$0\.55/)).toBeVisible();
  await expect(panel.getByRole('table', { name: 'By model and requested effort' }).getByRole('rowheader', { name: 'claude-haiku-5-5 · effort unknown' })).toBeVisible();
  await expect(panel.getByRole('table', { name: 'By ticket (all projects)' }).getByRole('row', { name: /CEC · CEC-102/ })).toContainText('Not priced');
  await page.screenshot({ path: evidence('telemetry-office.png') });

  await panel.getByRole('table', { name: 'By project' }).getByRole('button', { name: 'Brain' }).click();
  await expect(panel.getByLabel('Telemetry scope')).toHaveValue('brain');
  await panel.getByRole('table', { name: 'By ticket' }).getByRole('button', { name: 'GH-255' }).click();
  await expect(panel.getByLabel('Telemetry ticket')).toHaveValue('GH-255');
  await expect(totals).toContainText('1 unpriced');
  await expect(panel.getByText('Est. cost is tracked in the Office; Jira sync is not enabled yet.')).toHaveCount(0); // Brain is GitHub

  await expect(panel.getByLabel('Telemetry scope')).toBeFocused(); // drilling in keeps keyboard focus in the panel
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(opener).toBeFocused();
  // The U shortcut opens it from the scene (T would start the hidden "the office" phrase).
  await page.locator('body').click({ position: { x: 5, y: 500 } });
  await page.keyboard.press('u');
  await expect(panel).toBeVisible();
});

test('a slow response for an earlier scope never replaces the selected one', async ({ page }) => {
  let releaseOffice!: () => void;
  const officeHeld = new Promise<void>(resolve => { releaseOffice = resolve; });
  await page.route('**/api/telemetry?*', async route => {
    if (route.request().url().includes('scope=office')) await officeHeld;
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Telemetry', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Telemetry', exact: true });
  await panel.getByLabel('Telemetry scope').selectOption('cec');
  await expect(panel.getByText('Est. cost is tracked in the Office; Jira sync is not enabled yet.')).toBeVisible();
  releaseOffice();
  await page.waitForTimeout(300);
  await expect(panel.getByLabel('Telemetry scope')).toHaveValue('cec');
  await expect(panel.getByRole('table', { name: 'By project' })).toHaveCount(0);
});

test('telemetry is reachable from the dock on a phone and fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Telemetry', exact: true })).toBeHidden();
  await page.getByRole('contentinfo').getByRole('button', { name: 'Telemetry', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Telemetry', exact: true });
  await expect(panel).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: evidence('telemetry-phone.png') });
});

test('publication status discloses posted subtotals and confirms policy adoption with unchanged hours', async ({ page, request }) => {
  const snapshot = await (await request.get('/api/office?project=brain')).json();
  const entry = (key: string, status: string, unpricedRuns: number) => ({ key, status, unpricedRuns, partialRuns: 0, pricedRuns: 1, revision: 1, microUsd: 1_000_000, coverageDigest: key, detail: '', effectId: null, attempt: 0, intendedUsd: 1, updatedAt: '' });
  await request.post('/__fixture/snapshot?project=brain', { data: { coordination: { ...snapshot.coordination, time: { enabled: true, githubField: true, activatedAt: snapshot.startedAt, scopePolicy: 'legacy', entries: [], cost: { githubField: true, baselines: {}, entries: [entry('GH-1', 'posted', 1), entry('GH-2', 'posted', 0), entry('GH-3', 'pending', 1)] } } } } });
  const digest = 'a'.repeat(64);
  await page.route('**/api/time/scope-preview?project=brain', route => route.fulfill({ json: { applied: false, applicable: true, expectedSha256: digest, rows: [], tickets: [], blockers: { disabled: false, liveWork: [], publications: [], manual: [] } } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Telemetry', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Telemetry', exact: true });
  await expect(panel.getByText(/Est\. cost: 2 posted .*1 posted as subtotals \(some runs unpriced\)/)).toBeVisible();
  await expect(panel.getByText(/Existing hours totals will remain unchanged/)).toBeVisible();
  await panel.getByRole('button', { name: 'Review and apply…' }).click();
  const confirmation = panel.getByRole('group', { name: 'Confirm scope correction' });
  await expect(confirmation).toContainText('Existing GitHub hours and Jira worklogs remain unchanged.');
  const scopeWrites = async () => (await (await request.get('/__fixture/writes')).json()).filter((write: any) => write.body?.action === 'apply-time-scope');
  expect(await scopeWrites()).toEqual([]);
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  expect(await scopeWrites()).toEqual([]);
  await panel.getByRole('button', { name: 'Review and apply…' }).click();
  await confirmation.getByRole('button', { name: 'Apply correction', exact: true }).click();
  await expect(panel.getByRole('status').filter({ hasText: 'Correction queued' })).toBeVisible();
  expect(await scopeWrites()).toEqual([expect.objectContaining({ path: '/api/commands?project=brain', body: { action: 'apply-time-scope', timeScope: { policy: 'model-work-v1', expectedSha256: digest } } })]);
});
