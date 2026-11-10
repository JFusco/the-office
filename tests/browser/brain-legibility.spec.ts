import {test, expect} from './fixture-test';
import AxeBuilder from '@axe-core/playwright';

test('knowledge uses shared form spacing and safe formatted documents while retaining exact history', async ({page, request})=>{
    await request.post('/__fixture/technical');
    await page.goto('/'); await page.getByRole('button',{name:'Brain',exact:true}).click();
    await page.getByRole('button',{name:'Library',exact:true}).click();
    const search = page.getByLabel('Search knowledge');
    const spacing = await search.evaluate(el=>{
        const label=el.closest('label')!, caption=label.querySelector('span')!;
        return {gap:el.getBoundingClientRect().top-caption.getBoundingClientRect().bottom,token:getComputedStyle(document.documentElement).getPropertyValue('--spacing-field-label-gap').trim()};
    });
    expect(spacing).toEqual({gap:8,token:'8px'});
    const note=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Published validation guide',exact:true})});
    await expect(note).toContainText('Keep accepted validation receipts'); await expect(note).not.toContainText('provenance:');
    await note.getByRole('button',{name:'Inspect evidence'}).click();
    const reader=page.getByRole('region',{name:'Published technical note'});
    await expect(reader.getByRole('heading',{name:'What to do'})).toBeVisible();
    await expect(reader.locator('strong')).toContainText('accepted receipts');
    await expect(reader.locator('pre code')).toContainText('const receipt');
    await expect(reader.getByRole('checkbox',{name:'Completed task'})).toBeDisabled();
    await reader.getByText('View original Markdown',{exact:true}).click(); await expect(reader.locator('pre').last()).toContainText('provenance:');
    await page.getByRole('button',{name:'Activity',exact:true}).click();
    await page.getByRole('button',{name:'Inspect assignment knowledge'}).first().click();
    const assignment=page.getByRole('region',{name:'Assignment knowledge',exact:true});
    await expect(assignment).toContainText('Guidance text was not included in this recorded section.');
    await expect(assignment.locator('pre')).not.toBeVisible();
    await assignment.getByText('Exact supplied text',{exact:true}).click();
    await expect(assignment.locator('pre')).toContainText('provenance:');
    expect((await new AxeBuilder({page}).include('[data-office-brain]').analyze()).violations).toEqual([]);
});

test('white universe keeps its renderer through selection, search and filters; labels and controls stay legible', async ({page,request})=>{
    await page.emulateMedia({reducedMotion:'no-preference'}); await request.post('/__fixture/preferences',{data:{reducedMotion:false}});
    await page.route('**/api/knowledge/map?**',async route=>{
        const response=await route.fetch(), map=await response.json();
        const synthetic=Array.from({length:450},(_,i)=>({id:`synthetic:${i}`,kind:'technical',title:`Synthetic guide ${i}`,detail:'Synthetic crowded-map legibility fixture',domains:[i%2?'tooling':'cms']}));
        await route.fulfill({response,json:{...map,nodes:[...map.nodes,...synthetic],truncated:true}});
    });
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    const canvas=page.locator('[data-brain-renderer] canvas'); await expect(canvas).toHaveCount(1);
    const original=await canvas.elementHandle(); expect(original).toBeTruthy();
    const dimensions=await canvas.boundingBox();expect(dimensions!.width).toBeGreaterThan(1000);expect(dimensions!.height).toBeGreaterThan(650);
    const scope=page.getByLabel('Map scope');
    expect(await scope.evaluate(el=>getComputedStyle(el).paddingInlineEnd)).toBe('38px');
    const inset=await scope.evaluate(el=>{const svg=el.parentElement!.querySelector('svg')!; return el.getBoundingClientRect().right-svg.getBoundingClientRect().right;});expect(inset).toBe(12);
    await page.getByLabel('Find a node').fill('Synthetic guide 12');
    await page.getByRole('button',{name:'Synthetic guide 12 · technical',exact:true}).click();
    await expect(page.getByRole('region',{name:'Selected node'})).toContainText('Synthetic crowded-map legibility fixture');
    expect(await canvas.evaluate((el, before)=>el===before,original)).toBe(true);
    await page.getByRole('button',{name:'Constellation overview',exact:true}).click();
    await page.getByLabel('Find a node').fill('unmatched-record'); await expect(page.getByRole('region',{name:'Map browser'})).toContainText('No matching records');
    expect(await canvas.evaluate((el,before)=>el===before,original)).toBe(true);
    await page.getByRole('combobox',{name:'Show',exact:true}).selectOption('technical');expect(await canvas.evaluate((el,before)=>el===before,original)).toBe(true);
    expect((await new AxeBuilder({page}).include('[data-office-brain]').analyze()).violations).toEqual([]);
});
