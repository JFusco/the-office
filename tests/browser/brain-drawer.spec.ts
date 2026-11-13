import { test, expect, type Page } from './fixture-test';
import { entriesSettled } from './support';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const artifacts = process.env.OFFICE_DRAWER_SCREENSHOTS;
async function sample(page: Page) {
    return page.evaluate(async () => {
        const frames: { x: number | null; canvases: number; room: boolean; pointer: string | null }[] = [], until = performance.now() + 600;
        do {
            await new Promise(requestAnimationFrame);
            const drawer = document.querySelector('[data-brain-drawer]');
            frames.push({ x: drawer?.getBoundingClientRect().x ?? null, pointer: drawer ? getComputedStyle(drawer).pointerEvents : null,
                canvases: document.querySelectorAll('canvas').length, room: !!document.querySelector('[data-scene-overlay]') });
        } while (performance.now() < until);
        return frames;
    });
}
for (const width of [1440, 390]) {
    test(`knowledge drawer shares panel motion and cleans up before room restoration at ${width}px`, async ({ page, request }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
        const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto('/'); await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
        const opening = sample(page);
        await page.getByRole('button', { name: 'Brain', exact: true }).click();
        const frames = await opening, drawer = page.locator('[data-brain-drawer]');
        const bounds = (await drawer.boundingBox())!;
        expect(bounds.width).toBeCloseTo(width > 1000 ? width * .8 : width, 0);
        expect(bounds.x + bounds.width).toBeCloseTo(width, 0);
        expect(frames.some(frame => frame.x !== null && frame.x > bounds.x + 5)).toBe(true);
        expect(frames.at(-1)!.x).toBeCloseTo(bounds.x, 0);
        await expect(page.locator('canvas')).toHaveCount(0);
        await page.getByRole('button', { name: 'Map', exact: true }).click();
        await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(1);
        const closing = sample(page);
        await page.getByRole('button', { name: 'Return to office', exact: true }).click();
        const closeFrames = await closing;
        expect(closeFrames.some(frame => frame.x !== null && frame.x > bounds.x + 5)).toBe(true);
        expect(closeFrames.filter(frame => frame.x !== null && frame.x > bounds.x + 5).every(frame => frame.pointer === 'none')).toBe(true);
        await expect(drawer).toHaveCount(0);
        expect(closeFrames.every(frame => frame.canvases <= 1 && !(frame.x !== null && frame.room))).toBe(true);
        await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Brain', exact: true })).toBeFocused();
        expect(errors).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
}

test('all knowledge screens share the content width; map frames and checkbox stay legible', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1100 });
    await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    const nav = page.getByRole('navigation', { name: 'Brain views' });
    const widths: number[] = [];
    for (const name of ['Lessons', 'Library', 'Map', 'Activity']) {
        await nav.getByRole('button', { name, exact: true }).click();
        await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
        widths.push((await page.locator('[data-brain-content]').boundingBox())!.width);
        await expect(page.getByRole('main')).toHaveCount(1);
    }
    expect(widths).toEqual([1280, 1280, 1280, 1280]);
    await nav.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(1);
    const borderColor = await page.evaluate(() => {
        const probe = document.createElement('span'); probe.style.color = 'var(--color-secondary-line)'; document.querySelector('[data-brain-map-frame]')!.append(probe);
        const color = getComputedStyle(probe).color; probe.remove(); return color;
    });
    for (const selector of ['[data-brain-map-frame]', '[data-brain-list-frame]']) {
        expect(await page.locator(selector).evaluate(el => ({ width: getComputedStyle(el).borderLeftWidth, color: getComputedStyle(el).borderLeftColor })))
            .toEqual({ width: '1px', color: borderColor });
    }
    if (artifacts) {
        mkdirSync(artifacts, { recursive: true });
        await page.locator('[data-brain-map-frame]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${artifacts}/map-drawer.synthetic.png` });
    }
    await entriesSettled(page);expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    const activity = page.getByRole('checkbox', { name: 'Include employee activity' });
    const label = await activity.evaluate(el => { const r = el.closest('label')!.getBoundingClientRect(); const text = el.nextElementSibling!.getBoundingClientRect(); return { width: r.width, textHeight: text.height, scroll: document.querySelector('[data-office-brain]')!.scrollWidth, client: document.querySelector('[data-office-brain]')!.clientWidth }; });
    expect(label.width).toBeLessThan(342); expect(label.textHeight).toBeLessThan(24); expect(label.scroll).toBe(label.client);
    await activity.focus(); await page.keyboard.press('Space'); await expect(activity).toBeChecked();
    if (artifacts) await page.screenshot({ path: `${artifacts}/map-drawer-mobile.synthetic.png` });
    await page.keyboard.press('Escape'); await expect(page.locator('[data-brain-drawer]')).toHaveCount(0);
});

test('Brain cannot interrupt an animated elevator trip', async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
    await page.goto('/'); await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
    await page.getByRole('button', { name: /^Go to Floor 2/ }).click();
    await expect(page.getByRole('button', { name: 'Brain', exact: true })).toBeDisabled();
    await expect(page.locator('[data-elevator-doors]')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByRole('button', { name: 'Brain', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await expect(page.getByRole('main', { name: 'Office Brain', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'CTO Office', exact: true })).toBeVisible();
    await expect(page.locator('[data-surface="dock"]')).not.toHaveAttribute('inert');
    await expect(page.locator('[data-elevator-doors]')).not.toBeVisible();
});

for (const width of [1440, 390]) {
    test(`project-switch loading covers and disables the knowledge drawer at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Lessons', exact: true })).toBeVisible();
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        await page.route(/\/api\/(office|events)\?project=brain/, async route => { await gate; await route.continue(); });
        try {
            await page.getByRole('combobox', { name: 'Office project' }).selectOption('brain');
            const loading = page.locator('[data-project-loading]');
            await expect(loading).toBeVisible(); await expect(loading).toContainText('Opening Brain');
            await expect(page.locator('[data-brain-drawer]')).toHaveAttribute('inert');
            expect(await loading.evaluate(el => {
                const r = el.getBoundingClientRect(); return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('[data-project-loading]');
            })).toBe(true);
        } finally { release(); }
        await expect(page.locator('[data-project-loading]')).toHaveCount(0);
        await expect(page.locator('[data-brain-drawer]')).not.toHaveAttribute('inert');
    });
}

test('rapid reopen and switching from Brain to another panel keep one drawer', async ({ page }) => {
    await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await expect(page.locator('[data-brain-drawer]')).toBeVisible();
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await expect(page.locator('[data-brain-drawer]')).toHaveCount(1);
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.locator('[data-brain-drawer]')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'People', exact: true })).toBeVisible();
    await expect(page.locator('[data-inspector]')).toHaveCount(1);
    await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
});

test('a late Inspector exit cannot restore the room underneath Brain', async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
    await page.goto('/'); await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
    await page.getByRole('button', { name: 'People', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'People', exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Lessons', exact: true })).toBeVisible();
    await expect(page.locator('[data-scene-label="room"]')).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-scene-label="room"]').first()).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
});

for (const viewport of [{ width: 1440, height: 800 }, { width: 390, height: 844 }]) {
    test(`selected map content stays below navigation at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
        await page.getByRole('button', { name: 'Map', exact: true }).click();
        await page.getByLabel('Find a node').fill('schema');
        await page.getByRole('button', { name: 'Confirm schema versions before mapping changes · lesson', exact: true }).click();
        const nav = (await page.getByRole('navigation', { name: 'Brain views' }).boundingBox())!;
        const frame = (await page.locator('[data-brain-map-frame]').boundingBox())!;
        if (viewport.width > 1000) expect(frame.y).toBeGreaterThanOrEqual(nav.y + nav.height);
        else {
            const canvas = (await page.locator('[data-brain-renderer]').boundingBox())!, list = (await page.locator('[data-brain-list-frame]').boundingBox())!;
            expect(list.y).toBeGreaterThanOrEqual(canvas.y + canvas.height);
        }
        const back = page.getByRole('button', { name: 'Back to map', exact: true }); await back.scrollIntoViewIfNeeded();
        expect((await back.boundingBox())!.y).toBeGreaterThanOrEqual(nav.y + nav.height);
        expect(await back.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    });
}

test('the activity checkbox reflows at narrow widths and large text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    const label = await page.getByRole('checkbox', { name: 'Include employee activity' }).evaluate(el => {
        const label = el.closest('label')!; label.style.fontSize = '24px';
        const text = label.querySelector('span')!, bounds = label.getBoundingClientRect(), content = document.querySelector('[data-brain-content]')!;
        return { right: bounds.right, contentRight: content.getBoundingClientRect().right, fits: text.scrollWidth <= text.clientWidth, height: text.getBoundingClientRect().height };
    });
    expect(label.right).toBeLessThanOrEqual(label.contentRight); expect(label.fits).toBe(true); expect(label.height).toBeGreaterThan(30);
});
