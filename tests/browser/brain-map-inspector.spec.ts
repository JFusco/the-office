import { test, expect } from './fixture-test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [1024, 1440, 390]) {
    test(`the floating inspector keeps selected titles and labels visible at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/'); await page.getByRole('button', { name: 'Brain', exact: true }).click();
        await page.getByRole('button', { name: 'Map', exact: true }).click();
        await page.getByRole('button', { name: 'Project · cec', exact: true }).click();
        const heading = page.getByRole('region', { name: 'Selected node', exact: true }).locator(':scope > h3');
        await expect(heading).toBeFocused(); await expect(heading).toBeInViewport();
        if (width > 1000) {
            const tag = page.locator('[data-map-focus-tag]'), panel = page.locator('[data-brain-list-frame]');
            await expect(tag).toBeVisible();
            const label = (await tag.boundingBox())!, aside = (await panel.boundingBox())!;
            expect(label.width).toBeGreaterThanOrEqual(120); expect(label.x+label.width).toBeLessThan(aside.x);
            const other = page.getByRole('region', { name: 'Selected node' }).getByRole('button').last();
            await other.scrollIntoViewIfNeeded(); await other.click();
            await expect(heading).toBeFocused(); await expect(heading).toBeInViewport();
            expect(await heading.evaluate(el => { const p=el.closest('[data-brain-list-frame]')!.getBoundingClientRect(),h=el.getBoundingClientRect();return h.y>=p.y&&h.bottom<=p.bottom; })).toBe(true);
        }
    });
}

test('assignment evidence uses dark surfaces and stays within the inspector', async ({ page }) => {
    await page.route('**/api/knowledge/assignment?**',async route=>{const response=await route.fetch(),data=await response.json();data.lookups=data.lookups.map((r:object)=>({...r,outcome:'A long recorded lookup outcome '.repeat(5)}));await route.fulfill({response,json:data});});
    await page.goto('/'); await page.getByRole('button',{name:'Brain',exact:true}).click(); await page.getByRole('button',{name:'Map',exact:true}).click();
    await page.getByRole('checkbox',{name:'Include employee activity'}).check();
    await page.getByRole('combobox',{name:'Show',exact:true}).selectOption('assignment');
    await page.getByRole('region',{name:'Map browser'}).getByRole('button').last().click();
    await page.getByRole('region',{name:'Map browser'}).getByRole('button').first().click();
    const panel=page.locator('[data-brain-list-frame]');
    await expect(panel.getByRole('heading',{name:'Source evidence supplied',exact:true})).toBeVisible();
    const card=panel.locator('article').first(); await expect(card).toContainText('evidence');
    expect(await card.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(await panel.evaluate(el=>{const p=document.createElement('span');p.style.color='var(--color-map-panel)';el.append(p);const color=getComputedStyle(p).color;p.remove();return color;}));
    expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await expect(page.getByRole('region',{name:'Selected node'}).locator(':scope > h3')).toBeFocused();
    expect((await new AxeBuilder({page}).include('[data-brain-list-frame]').analyze()).violations).toEqual([]);
});

test('header controls share compact tokens and subscription chip actions remain small',async({page})=>{
    for(const width of [320,390]) {
        await page.setViewportSize({width,height:844});await page.goto('/');
        const select=page.getByRole('combobox',{name:'Office project'});await expect(select).toBeVisible();
        if(width===390) expect((await select.boundingBox())!.width).toBeGreaterThanOrEqual(80);
        expect(await page.locator('header').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
        const bounds=await page.locator('header').locator('a,button,select').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};}).filter(r=>r.width>0).sort((a,b)=>a.x-b.x));
        expect(bounds.every((r,i)=>r.x>=0&&r.right<=width&&(!i||r.x>=bounds[i-1].right-.5))).toBe(true);
    }
    await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();
    const remove=page.getByRole('button',{name:'Unsubscribe CEC from #cec-team',exact:true});await expect(remove).toBeVisible();
    expect(await remove.evaluate(el=>el.parentElement!.getBoundingClientRect().height)).toBeLessThanOrEqual(32);
    await page.keyboard.press('Tab');await remove.focus();await expect(remove).toBeFocused();expect(await remove.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
});
