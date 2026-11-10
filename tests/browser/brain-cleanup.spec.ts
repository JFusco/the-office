import { test, expect } from './fixture-test';
import { writeFileSync } from 'node:fs';

for (const reduced of [true, false]) {
test(`loaded Office overlays and Brain views clean up with ${reduced ? 'reduced' : 'animated'} motion`, async ({ page, request }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
        const trace: { parent: string; child: string; actualParent: string; stack?: string }[] = [];
        Object.assign(window, { cleanupTrace: trace });
        const remove = Node.prototype.removeChild;
        Node.prototype.removeChild = function<T extends Node>(child: T): T {
            if (child.parentNode !== this) {
                const describe = (node: Node | null) => node instanceof Element ? node.outerHTML.slice(0, 1500) : String(node);
                trace.push({ parent: describe(this), child: describe(child), actualParent: describe(child.parentNode), stack: new Error().stack });
            }
            return remove.call(this, child) as T;
        };
    });
    try {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await request.post('/__fixture/preferences', { data: { reducedMotion: reduced } });
        await page.goto('/');
        for (const project of ['cec', 'brain', 'cec']) {
            await page.getByLabel('Office project').selectOption(project);
            // Waiting for actual overlays matters: entering Brain before the lazy room
            // mounts never exercises the DOM cleanup that failed in the live session.
            await expect(page.getByRole('button', { name: 'DEVELOPMENT Implementation', exact: true })).toBeVisible();
            await expect(page.locator('[data-scene-overlay]').first()).toBeAttached();
            await page.getByRole('button', { name: 'Brain', exact: true }).click();
            await expect(page.locator('[data-scene-overlay]')).toHaveCount(0);
            await page.getByRole('button', { name: 'Map', exact: true }).click();
            await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(1);
            await expect(page.locator('canvas')).toHaveCount(1);
            await page.getByRole('button', { name: 'Library', exact: true }).click();
            await expect(page.locator('canvas')).toHaveCount(0);
            await page.getByRole('button', { name: 'Return to office', exact: true }).click();
            await expect(page.getByRole('button', { name: 'DEVELOPMENT Implementation', exact: true })).toBeVisible();
            await expect(page.locator('canvas')).toHaveCount(1);
        }
        expect(errors).toEqual([]);
        expect(await page.evaluate(() => (window as typeof window & { cleanupTrace: unknown[] }).cleanupTrace)).toEqual([]);
    } finally {
        const path = testInfo.outputPath('cleanup-errors.json');
        writeFileSync(path, JSON.stringify({ errors, trace: await page.evaluate(() => (window as typeof window & { cleanupTrace: unknown[] }).cleanupTrace) }, null, 2));
        await testInfo.attach('cleanup-errors', { path, contentType: 'application/json' });
    }
});
}
