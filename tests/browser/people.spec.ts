import { test, expect } from './fixture-test';
import { evidence } from './support';

test('the People drawer finds employees, shows the org chart and opens each desk', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^PM mailbox,/ })).toBeVisible({ timeout: 30000 });
  await page.keyboard.press('p');
  const drawer = page.getByRole('complementary', { name: 'People' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('8 employees across 4 departments')).toBeVisible();
  await page.screenshot({ path: evidence('people-directory.png') });

  await drawer.getByRole('searchbox', { name: 'Search people' }).fill('qa');
  await expect(drawer.getByText('1 of 8 people')).toBeVisible();
  await expect(drawer.locator('[data-person]')).toHaveCount(1);
  await expect(drawer.locator('[data-person="qa"]')).toContainText('Riley');

  await drawer.getByRole('tab', { name: 'Directory' }).press('ArrowRight');
  await expect(drawer.getByRole('tab', { name: 'Org chart' })).toBeFocused();
  await expect(drawer.getByRole('tab', { name: 'Org chart' })).toHaveAttribute('aria-selected', 'true');
  const chart = drawer.getByRole('list', { name: 'Org chart' });
  await expect(chart).toBeVisible();
  await expect(chart.locator('[data-org-node]')).toHaveCount(9);
  await page.screenshot({ path: evidence('people-org-chart.png') });

  await chart.locator('[data-org-node="lead"]').click();
  const sam = page.getByRole('complementary', { name: 'Lead developer' });
  await expect(sam).toBeVisible();
  await expect(sam.locator('[data-reports-to]')).toContainText('Reports to Avery');
  await expect(sam.locator('[data-reports-to]')).toContainText('Direct reports: Alex, Riley');
  await sam.locator('[data-reports-to]').getByRole('button', { name: 'Avery' }).click();
  await expect(page.locator('[data-reports-to]')).toContainText('Reports to Joe');
  await expect(page.locator('[data-reports-to]')).toContainText('Direct reports: Morgan, Sam, Ellis, Harper');

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-inspector]')).toHaveCount(0);
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Org chart' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'People', exact: true })).toBeFocused();
});

test('on a phone the org chart scrolls inside the drawer and opens on the top of the hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^PM mailbox,/ })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'People', exact: true }).click();
  await page.getByRole('tab', { name: 'Org chart' }).click();
  await expect(page.locator('[data-org-node="owner"]')).toBeInViewport();
  await expect(page.locator('[data-org-node="cto"]')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: evidence('people-org-chart-phone.png') });
});

test('during the tour People only opens desks present in the sample snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^PM mailbox,/ })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Tour the office', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Office tour', exact: true })).toBeVisible();
  const drawer = page.getByRole('complementary', { name: 'People', exact: true });
  const desks = [['pm', 'Project manager'], ['developer', 'Developer'], ['lead', 'Lead developer'], ['qa', 'QA engineer']] as const;

  for (const [tab, marker] of [['Directory', 'data-person'], ['Org chart', 'data-org-node']] as const) {
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await drawer.getByRole('tab', { name: tab, exact: true }).click();
    await expect(drawer.locator(`button[${marker}]`)).toHaveCount(4);
    for (const id of ['cto', 'it', 'analyst', 'knowledge']) {
      await expect(drawer.locator(`div[${marker}="${id}"]`)).toBeVisible();
      await expect(drawer.locator(`button[${marker}="${id}"]`)).toHaveCount(0);
    }
    for (const [id, title] of desks) {
      await drawer.locator(`button[${marker}="${id}"]`).click();
      const agent = page.getByRole('complementary', { name: title, exact: true });
      await expect(agent).toBeVisible();
      await expect(page.getByRole('complementary', { name: 'Ticket', exact: true })).toHaveCount(0);
      if (id === 'lead') {
        await expect(agent.locator('[data-reports-to]')).toContainText('Reports to Avery');
        await expect(agent.locator('[data-reports-to]').getByRole('button', { name: 'Avery', exact: true })).toHaveCount(0);
      }
      await page.getByRole('button', { name: 'People', exact: true }).click();
      await expect(drawer).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Office settings', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Settings', exact: true }).getByText('Turns M, O, C, P, U and 0 on or off. Escape always closes details.', { exact: true })).toBeVisible();
});
