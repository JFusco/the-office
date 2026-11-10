import { test, expect } from './fixture-test';
import { mkdirSync } from 'node:fs';
test('Office panels share the icon-led title treatment', async ({ page }) => {
    await page.goto('/');
    const folder = process.env.OFFICE_BRAIN_SCREENSHOTS || '/private/tmp/office-brain-screenshots'; mkdirSync(folder, { recursive: true });
    for (const [button, title, slug] of [['People', 'People', 'people'], ['Telemetry', 'Telemetry', 'telemetry'], ['Service health', 'Service health', 'health'], ['Office settings', 'Settings', 'settings']] as const) {
        await page.getByRole('button', { name: button, exact: true }).click();
        const panel = page.getByRole('complementary', { name: title, exact: true });
        await expect(panel.locator('[data-panel-header] svg')).toBeVisible();
        await expect(panel.locator('[data-panel-header]').getByRole('heading', { name: title, exact: true })).toHaveClass(/text-29/);
        await panel.screenshot({ path: `${folder}/office-panel-${slug}.synthetic.png` });
        await page.keyboard.press('Escape'); await expect(panel).not.toBeVisible();
    }
});
