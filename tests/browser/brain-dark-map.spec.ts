import { test, expect, type Page, type Locator, type APIRequestContext } from './fixture-test';
import { entriesSettled, clearMapSelection } from './support';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const artifacts = process.env.OFFICE_DRAWER_SCREENSHOTS;
test.use({ video: { mode: 'on', size: { width: 1440, height: 1000 } } });
async function crowdedMap(page: Page, gate?: Promise<void>) {
    await page.route('**/api/knowledge/map?**', async route => {
        await gate;
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
const animation = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).animationName);
/** Opacity of the loaded map content on each frame after it appears. */
const revealFrames = (page: Page) => page.evaluate(() => new Promise<number[]>(resolve => {
    const values: number[] = [], start = performance.now();
    const tick = () => { const el = document.querySelector('[data-knowledge-ready]'); if (el) values.push(Number(getComputedStyle(el).opacity)); if (values.length > 20 || performance.now() - start > 4000) resolve(values); else requestAnimationFrame(tick); };
    tick();
}));
async function motionOn(page: Page, request: APIRequestContext) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
}

test('dark constellation glides between real graph identities and preserves a single renderer', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await request.post('/__fixture/preferences', { data: { reducedMotion: false } });
    await crowdedMap(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await page.locator('header').getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Brain',exact:true}).click();
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
    await entriesSettled(page);expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await canvas.hover();const drifting=await canvas.screenshot();await page.waitForTimeout(350);
    expect((await canvas.screenshot()).equals(drifting)).toBe(false);
    if (artifacts) { const video = page.video(); await page.close(); await video?.saveAs(`${artifacts}/dark-map-motion.synthetic.webm`); }
});

test('action buttons and button links share geometry, hover and focus across knowledge screens', async ({ page }) => {
    await crowdedMap(page); await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Brain', exact: true }).click();
    const controls = [page.getByRole('button', { name: 'Return to office', exact: true }),
        page.getByRole('link', { name: /^Open board:/ }), ...['Lessons', 'Library', 'Brain', 'Activity'].map(name => page.getByRole('navigation',{name:'Brain views'}).getByRole('button', { name, exact: true }))];
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
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button', { name: 'Brain', exact: true }).click(); await page.getByLabel('Include Brain notes (external, read-only)').check();
    for(const control of [page.getByRole('button',{name:'Refresh Brain',exact:true}),page.getByText('View options',{exact:true})]) {
        expect(await style(control)).toEqual(expected);
        expect(await control.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(normal);
    }
    await page.getByRole('button', { name: 'Tooling 480', exact: true }).click();
    const previous = page.getByRole('button', { name: 'Previous records', exact: true }); await expect(previous).toBeDisabled();
    const before = await previous.evaluate(el => getComputedStyle(el).backgroundColor); await previous.hover();
    expect(await previous.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(before);
});

test('Refresh Brain keeps the viewer\'s Brain-note opt-in', async ({ page }) => {
    await crowdedMap(page); await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Brain',exact:true}).click();
    const brain = page.getByLabel('Include Brain notes (external, read-only)'); await brain.check();
    const browser = page.getByRole('region', { name: 'Brain browser' });
    await expect(browser.getByRole('button', { name: 'Tooling 480', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Refresh Brain', exact: true }).click();
    await expect(brain).toBeChecked();
    await expect(browser.getByRole('button', { name: 'Tooling 480', exact: true })).toBeVisible();
});

test('reduced motion stills map content entries and paging', async ({ page, request }) => {
    await page.emulateMedia({reducedMotion:'reduce'});await request.post('/__fixture/preferences',{data:{reducedMotion:true}});
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    await crowdedMap(page, gate);
    await page.goto('/'); await page.locator('header').getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Brain',exact:true}).click();
    await expect(page.getByRole('status').filter({ hasText: 'Loading connections…' })).toBeVisible();
    const frames = revealFrames(page); release();
    // An immediate reveal jumps from hidden to shown; an eased one passes through intermediate opacities.
    const reveal = await frames; expect(reveal.at(-1)).toBe(1); expect(reveal.every(x => x === 0 || x === 1)).toBe(true);
    await page.getByLabel('Include Brain notes (external, read-only)').check();
    const browser = page.getByRole('region', { name: 'Brain browser' }), records = browser.locator('ul');
    const inspector = page.getByRole('region', { name: 'Selected node' }).locator('xpath=..');
    await browser.getByRole('button', { name: 'Tooling 480', exact: true }).click();
    await expect(browser).toContainText('1 / 12'); expect(await animation(records)).toBe('none');
    await browser.getByRole('button', { name: 'Next records', exact: true }).click();
    await expect(browser).toContainText('2 / 12'); expect(await animation(records)).toBe('none');
    await browser.getByRole('button', { name: /^Preview note .* · technical$/ }).first().click();
    await expect(inspector).toBeVisible(); expect(await animation(inspector)).toBe('none');
    await page.getByRole('button', { name: 'Back to Brain', exact: true }).click();
    await browser.getByRole('button', { name: 'Next records', exact: true }).click();
    await expect(browser).toContainText('3 / 12'); expect(await animation(records)).toBe('none');
    await browser.getByRole('button', { name: /^Preview note .* · technical$/ }).first().click();
    await expect(inspector).toBeVisible(); expect(await animation(inspector)).toBe('none');
});

test('keyboard paging keeps focus on the page controls while each page of records eases in', async ({ page, request }) => {
    await motionOn(page, request); await crowdedMap(page); await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Brain', exact: true }).click();
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Brain',exact:true}).click(); await page.getByLabel('Include Brain notes (external, read-only)').check();
    const browser = page.getByRole('region', { name: 'Brain browser' }), records = browser.locator('ul');
    await browser.getByRole('button', { name: 'Tooling 480', exact: true }).click();
    const next = browser.getByRole('button', { name: 'Next records', exact: true }), previous = browser.getByRole('button', { name: 'Previous records', exact: true });
    const turn = async (control: Locator, shown: string) => {
        const list = await records.elementHandle();
        await page.keyboard.press('Enter'); await expect(browser).toContainText(shown); await expect(control).toBeFocused();
        expect(await records.evaluate((el, before) => el !== before, list)).toBe(true);
        expect(await animation(records)).toBe('knowledge-enter');
    };
    await next.focus(); await turn(next, '2 / 12'); await turn(next, '3 / 12');
    await previous.focus(); await turn(previous, '2 / 12');
});


test('empty-space selection reset and mouse zoom work without a second renderer or motion controls',async({page})=>{
    await page.goto('/');await page.locator('header').getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Brain',exact:true}).click();
    const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);const original=await canvas.elementHandle();
    const box=(await canvas.boundingBox())!;expect(box.y).toBeLessThan(page.viewportSize()!.height/3);
    await expect(page.getByLabel('Include Brain notes (external, read-only)')).toBeChecked();
    await expect(page.getByRole('button',{name:/^(Constellation overview|Overview|Pause map motion|Resume map motion|Motion off)$/})).toHaveCount(0);
    await page.getByRole('button',{name:'Project · cec',exact:true}).click();await expect(page.getByRole('region',{name:'Selected node'})).toBeVisible();
    await entriesSettled(page);await canvas.hover();const before=await canvas.screenshot();await page.mouse.wheel(0,-400);
    await expect.poll(async()=>(await canvas.screenshot()).equals(before)).toBe(false);
    await expect(page.getByRole('region',{name:'Selected node'})).toBeVisible();
    await clearMapSelection(page);await expect(page.getByRole('region',{name:'Selected node'})).toHaveCount(0);await expect(page.getByRole('region',{name:'Brain browser'})).toBeVisible();
    expect(await canvas.evaluate((el,old)=>el===old,original)).toBe(true);
});
