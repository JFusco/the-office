import { expect, test, type Page } from './fixture-test';
import { evidence, setPreferences } from './support';
// Office-wide preferences: saved by the service, applied to every project and page.

const gear = (page: Page) => page.getByRole('button', { name: 'Office settings' });
const office = (page: Page) => page.locator('[data-office-preferences]');
const live = async (page: Page) => { await page.goto('/'); await expect(page.locator('canvas')).toBeVisible(); await expect(gear(page)).toBeEnabled(); };
const preferencePosts = (page: Page) => { const posts: string[] = []; page.on('request', r => { if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/preferences') posts.push(r.postData() || ''); }); return posts; };

test('all five preferences save through the service, survive reload and are shared across projects and pages', async ({ page, request, context }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const posts = preferencePosts(page);
  await live(page); expect(posts).toEqual([]);
  await gear(page).click();
  await page.getByLabel('Graphics').selectOption('low');
  for (const label of ['Reduced motion', 'Keyboard shortcuts', 'Delivery toasts', 'Coffee-break coworkers']) {
    const box = page.getByLabel(label, { exact: true }), was = await box.isChecked();
    await box.setChecked(!was); await expect(box).toBeChecked({ checked: !was }); await expect(box).toBeEnabled();
  }
  await expect.poll(async () => { const p = await (await request.get('/api/preferences')).json(); return [p.quality, p.reducedMotion, p.keyboardShortcuts, p.deliveryToasts, p.coffeeBreaks, p.revision]; }).toEqual(['low', true, false, false, false, 5]);
  expect(posts.map(p => Object.keys(JSON.parse(p)))).toEqual([['quality'], ['reducedMotion'], ['keyboardShortcuts'], ['deliveryToasts'], ['coffeeBreaks']]);
  const expectSaved = async (target: Page) => {
    await target.getByRole('button', { name: 'Office settings' }).click();
    await expect(target.getByLabel('Graphics')).toHaveValue('low');
    await expect(target.getByLabel('Reduced motion', { exact: true })).toBeChecked();
    for (const label of ['Keyboard shortcuts', 'Delivery toasts', 'Coffee-break coworkers']) await expect(target.getByLabel(label, { exact: true })).not.toBeChecked();
    await target.keyboard.press('Escape');
  };
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced'); await expectSaved(page);
  await page.getByLabel('Office project').selectOption('brain'); await expectSaved(page);
  const second = await context.newPage(); await second.emulateMedia({ reducedMotion: 'no-preference' }); await second.goto('/'); await expectSaved(second);
  await page.screenshot({ path: evidence('office-preferences-drawer.png') });
});

test('turning shortcuts off disables M/O/C/0 while Escape and hidden phrases keep working', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await setPreferences(request, { keyboardShortcuts: false });
  await live(page);
  await page.keyboard.press('m'); await page.keyboard.press('o'); await page.keyboard.press('c');
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await gear(page).click(); await expect(page.getByRole('complementary', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('complementary')).toHaveCount(0);
  await page.keyboard.type('dance');
  await expect(page.getByRole('region', { name: 'Interactive isometric office' })).toHaveAttribute('data-party', 'active');
});

test('delivery toasts can be suppressed and re-enabled without replaying earlier changes', async ({ page, request }) => {
  await setPreferences(request, { deliveryToasts: false });
  await live(page);
  const dismiss = page.getByRole('button', { name: 'Dismiss notification' });
  const setJob = async (status: string, detail: string) => {
    const coordination = (await (await request.get('/api/office')).json()).coordination;
    coordination.jobs = [{ id: 'toast-job', key: 'CEC-101', stage: 'implement', status, detail, requestedAt: new Date().toISOString(), steps: [] }];
    expect((await request.post('/__fixture/snapshot', { data: { coordination } })).ok()).toBe(true);
  };
  await setJob('working', 'Fixture work in progress.');
  await setJob('blocked', 'Fixture stop while toasts are off.');
  await expect(page.getByText(/Fixture stop while toasts are off/).first()).toBeVisible();
  await expect(dismiss).toHaveCount(0);
  await gear(page).click(); await page.getByLabel('Delivery toasts', { exact: true }).check(); await expect(page.getByLabel('Delivery toasts', { exact: true })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dismiss).toHaveCount(0);
  await setJob('completed', 'Fixture closeout verified.');
  await expect(page.getByText('CEC-101: Delivery complete; issue and board closeout verified.')).toBeVisible();
  // Results of your own actions are unaffected by the delivery-toast preference.
  await setPreferences(request, { deliveryToasts: false });
  await dismiss.click();
  await page.getByRole('button', { name: 'Pause office' }).click();
  await expect(page.getByText('Office action accepted.')).toBeVisible();
});

test('a held save disables the Office controls and a failed save keeps the accepted value', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release!: () => void, fail = false;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/preferences', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    if (fail) return route.fulfill({ status: 500, json: { error: 'Fixture: preference storage unavailable' } });
    await held; await route.continue();
  });
  await live(page); await gear(page).click();
  const coffee = page.getByLabel('Coffee-break coworkers', { exact: true }), graphics = page.getByLabel('Graphics');
  await coffee.uncheck({ noWaitAfter: true });
  await expect(office(page).locator('[data-save-feedback="pending"]')).toBeVisible();
  await expect(graphics).toBeDisabled(); await expect(coffee).toBeDisabled();
  release();
  await expect(coffee).not.toBeChecked(); await expect(graphics).toBeEnabled();
  await expect(office(page).locator('[data-save-feedback="success"]')).toBeVisible();
  fail = true;
  await coffee.click();
  await expect(office(page).getByRole('alert')).toContainText('Fixture: preference storage unavailable');
  await expect(coffee).not.toBeChecked(); await expect(coffee).toBeEnabled();
});

test('a restarted service is accepted at a lower revision and a late old-service response is ignored', async ({ page, request }) => {
  const original = await (await request.get('/api/office')).json();
  original.preferences = { ...original.preferences, revision: 5 };
  let current = original;
  await page.route('**/api/office', r => r.fulfill({ json: current }));
  await page.addInitScript(() => {
    class FixtureEvents extends EventTarget { static instances: FixtureEvents[] = []; constructor(_url: string) { super(); FixtureEvents.instances.push(this); } close() { } onopen: any; onerror: any; }
    (window as any).EventSource = FixtureEvents; (window as any).emitSnapshot = (s: any) => FixtureEvents.instances.forEach(e => e.dispatchEvent(new MessageEvent('snapshot', { data: JSON.stringify(s) })));
  });
  let release!: () => void, posts = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/preferences', async route => { posts++; await held; await route.fulfill({ json: { ...original.preferences, quality: 'low', revision: 6, serviceInstanceId: original.serviceInstanceId } }); });
  await live(page); await gear(page).click();
  await page.getByLabel('Graphics').selectOption('low', { noWaitAfter: true });
  await expect(office(page).locator('[data-save-feedback="pending"]')).toBeVisible();
  // The service restarts: a new instance with a lower revision and different values.
  current = { ...original, serviceInstanceId: 'fixture-restarted', snapshotSequence: 1, serverTime: new Date().toISOString(), preferences: { ...original.preferences, coffeeBreaks: false, revision: 0 } };
  await page.evaluate(s => (window as any).emitSnapshot(s), current);
  await expect(page.getByLabel('Coffee-break coworkers', { exact: true })).not.toBeChecked();
  release();
  await expect(office(page).locator('[data-save-feedback]')).toHaveCount(0);
  await expect(page.getByLabel('Graphics')).toHaveValue('high');
  expect(posts).toBe(1);
});

test('the shell stays still with no scene until saved preferences arrive, then applies them', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  for (const pattern of ['**/api/events*', '**/api/office']) await page.route(pattern, async route => { await held; await route.continue(); });
  const posts = preferencePosts(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('canvas')).toHaveCount(0); await expect(gear(page)).toBeDisabled();
  release();
  await expect(page.locator('canvas')).toBeVisible(); await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await gear(page).click(); await expect(page.getByLabel('Graphics')).toHaveValue('low'); await expect(page.getByLabel('Reduced motion', { exact: true })).toBeChecked();
  expect(posts).toEqual([]);
});

test('an unreachable Office shows no scene or writable settings until it reconnects', async ({ page }) => {
  await page.route('**/api/events*', route => route.abort());
  await page.route('**/api/office', route => route.fulfill({ status: 503, json: { error: 'Fixture: office unavailable' } }));
  await page.goto('/');
  await expect(page.getByText(/Office returned 503/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0); await expect(gear(page)).toBeDisabled();
  await page.unroute('**/api/office'); await page.unroute('**/api/events*');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 }); await expect(gear(page)).toBeEnabled();
});

test('the tour keeps saved preferences, never writes them, and shows a project notice', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await setPreferences(request, { reducedMotion: true });
  const posts = preferencePosts(page);
  await live(page);
  await page.getByRole('button', { name: 'Tour the office' }).click();
  await expect(page.getByText('ILLUSTRATIVE TOUR', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await gear(page).click();
  await expect(page.getByLabel('Reduced motion', { exact: true })).toBeChecked();
  await expect(page.getByText('Project settings are unavailable during the illustrative tour.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save pickup rule' })).toHaveCount(0);
  expect(posts).toEqual([]);
});

test('turning coffee breaks off ends an outing while the party still dances', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await setPreferences(request, { reducedMotion: false, quality: 'low' });
  await live(page);
  const coffee = page.locator('[data-office-life]');
  await expect(coffee).toContainText('Coffee break', { timeout: 25000 });
  await gear(page).click(); await page.getByLabel('Coffee-break coworkers', { exact: true }).uncheck();
  await expect(coffee).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.keyboard.type('dance');
  await expect(page.getByRole('region', { name: 'Interactive isometric office' })).toHaveAttribute('data-party', 'active');
  await expect(coffee).toHaveCount(0);
});

test('a configuration read failure affects only its block and can be retried', async ({ page }) => {
  let fail = true;
  await page.route('**/api/office-config', route => fail ? route.fulfill({ status: 503, json: { error: 'down' } }) : route.continue());
  await live(page); await gear(page).click();
  await expect(page.getByText(/Office configuration is unavailable/)).toBeVisible();
  await expect(page.getByLabel('Graphics')).toBeEnabled(); await expect(page.getByRole('button', { name: 'Save pickup rule' })).toBeEnabled();
  fail = false; await page.getByRole('button', { name: 'Retry' }).click();
  const config = page.locator('[data-office-config]');
  await expect(config).toContainText('CEC Jira board'); await expect(config).toContainText('CEC-108');
  await expect(config).toContainText('Edit office-config.json and restart the Office');
});

test('the system reduced-motion setting still wins after the saved toggle is cleared', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setPreferences(request, { reducedMotion: true });
  await live(page); await gear(page).click();
  await page.getByLabel('Reduced motion', { exact: true }).uncheck();
  await expect.poll(async () => (await (await request.get('/api/preferences')).json()).reducedMotion).toBe(false);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByText(/Your system’s reduced-motion setting also keeps it still/)).toBeVisible();
});
