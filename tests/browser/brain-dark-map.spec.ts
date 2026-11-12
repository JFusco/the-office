import { test, expect, type Page, type Locator } from './fixture-test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const artifacts = process.env.OFFICE_DRAWER_SCREENSHOTS;
test.use({ video: { mode: 'on', size: { width: 1440, height: 1000 } } });
async function crowdedMap(page: Page) {
    await page.route('**/api/knowledge/map?**', async route => {
        const response = await route.fetch(), map = await response.json(), project = map.nodes.find((n: {kind: string}) => n.kind === 'project');
        const notes = Array.from({ length: 480 }, (_, i) => ({ id: `preview:${i}`, kind: 'technical', title: `Preview note ${i}`, detail: 'Synthetic motion and visual qualification fixture.', domains: ['tooling'] }));
        await route.fulfill({ response, json: { ...map, nodes: [...map.nodes, ...notes], edges: [...map.edges, ...notes.map(n => ({source: project.id, target: n.id, kind: 'publication'}))] } });
    });
}
async function style(control: Locator) {
    return control.evaluate(el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return { height: r.height, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, font: s.fontSize,
            line: s.lineHeight, border: s.borderTopWidth, radius: s.borderTopLeftRadius, transition: s.transitionDuration };
    });
}

test('dark constellation glides between real graph identities and preserves a single renderer', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
    await crowdedMap(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    const canvas = page.locator('[data-brain-renderer] canvas'); await expect(canvas).toHaveCount(1);
    const original = await canvas.elementHandle();
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scene-brain-background').trim());
    expect(Math.max(...[1, 3, 5].map(i => parseInt(background.slice(i, i + 2), 16)))).toBeLessThan(40);
    await canvas.scrollIntoViewIfNeeded();
    if (artifacts) { mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: `${artifacts}/dark-map-overview.synthetic.png` }); }
    await page.getByRole('button', { name: 'Project · cec', exact: true }).click();
    await page.waitForTimeout(1300);
    if (artifacts) await page.screenshot({ path: `${artifacts}/dark-map-focused.synthetic.png` });
    await page.getByRole('region', { name: 'Selected node' }).getByRole('button', { name: /Preview note 30$/ }).click();
    await page.waitForTimeout(1300);
    if (artifacts) await page.screenshot({ path: `${artifacts}/dark-map-note.synthetic.png` });
    expect(await canvas.evaluate((el, before) => el === before, original)).toBe(true);
    await expect(page.locator('canvas')).toHaveCount(1); expect(errors).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Pause map motion', exact: true }).click();
    await page.waitForTimeout(800); const still = await canvas.screenshot(); await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(still)).toBe(true);
    await page.getByRole('button', { name: 'Resume map motion', exact: true }).click();
    await page.waitForTimeout(3500); const orbit = await canvas.screenshot(); await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(orbit)).toBe(false);
    if (artifacts) { const video = page.video(); await page.close(); await video?.saveAs(`${artifacts}/dark-map-motion.synthetic.webm`); }
});

test('action buttons and button links share geometry, hover and focus across knowledge screens', async ({ page }) => {
    await crowdedMap(page); await page.goto('/');
    await page.getByRole('button', { name: 'Brain', exact: true }).click();
    const controls = [page.getByRole('button', { name: 'Return to office', exact: true }),
        page.getByRole('link', { name: /^Open board:/ }), ...['Library', 'Map', 'Activity'].map(name => page.getByRole('button', { name, exact: true }))];
    const expected = await style(controls[0]);
    expect(expected.height).toBe(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing-control-height'))));
    for (const control of controls) expect(await style(control)).toEqual(expected);
    const button = controls[0], link = controls[1];
    const normal = await button.evaluate(el => getComputedStyle(el).backgroundColor);
    await button.hover(); await expect.poll(() => button.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(normal);
    const hover = await button.evaluate(el => getComputedStyle(el).backgroundColor);
    await link.hover(); await expect.poll(() => link.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(hover);
    await page.keyboard.press('Tab'); await link.focus(); await expect(link).toBeFocused();
    expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.getByRole('button', { name: 'Tooling 480', exact: true }).click();
    const previous = page.getByRole('button', { name: 'Previous records', exact: true }); await expect(previous).toBeDisabled();
    const before = await previous.evaluate(el => getComputedStyle(el).backgroundColor); await previous.hover();
    expect(await previous.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(before);
});
