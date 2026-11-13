import { test, expect } from './fixture-test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

for (const [view, endpoint, label] of [
    ['Library', 'search', 'Searching permitted knowledge…'],
    ['Map', 'map', 'Loading connections…'], ['Activity', 'activity', 'Loading learning activity…'],
]) {
    test(`${view} shows the shared animated SVG while its real read is pending`, async ({ page, request }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
        let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
        await page.route(`**/api/knowledge/${endpoint}?**`, async route => { await gate; await route.continue(); });
        try {
            await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
            await page.getByRole('button', { name: view, exact: true }).click();
            const status = page.getByRole('status').filter({ hasText: label }); await expect(status).toBeVisible();
            const orbit = status.locator('[data-office-loader] g').first();
            const before = await orbit.evaluate(el => getComputedStyle(el).transform);
            await expect.poll(() => orbit.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
            expect((await new AxeBuilder({ page }).include('[data-brain-drawer]').analyze()).violations).toEqual([]);
            if (process.env.OFFICE_DRAWER_SCREENSHOTS) {
                mkdirSync(process.env.OFFICE_DRAWER_SCREENSHOTS, { recursive: true });
                await page.screenshot({ path: `${process.env.OFFICE_DRAWER_SCREENSHOTS}/loading-${view.toLowerCase()}.synthetic.png` });
            }
            for (const reduced of ['system', 'office']) {
                if (reduced === 'system') await page.emulateMedia({ reducedMotion: 'reduce' });
                else {
                    await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(page.locator('html')).toHaveAttribute('data-motion','full');
                    expect((await request.post('/__fixture/preferences',{data:{reducedMotion:true}})).ok()).toBe(true);
                    await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
                }
                for (const part of await status.locator('[data-office-loader] g, [data-office-loader] > circle:last-child').all()) await expect(part).toHaveCSS('animation-name', 'none');
            }
        } finally { release(); }
        await expect(page.getByRole('status').filter({ hasText: label })).toHaveCount(0);
    });
}
