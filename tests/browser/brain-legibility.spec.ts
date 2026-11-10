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
    const dimensions=await canvas.boundingBox(),frame=(await page.locator('[data-brain-map-frame]').boundingBox())!,list=(await page.locator('[data-brain-list-frame]').boundingBox())!;
    expect(dimensions!.width).toBeCloseTo(frame.width-2,0);expect(dimensions!.height).toBeGreaterThan(450);expect(dimensions!.height).toBeLessThanOrEqual(600);
    expect(frame.width).toBeGreaterThan(list.width);expect(list.width).toBeCloseTo(1440*.28,0);
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

test('map labels do not steal marker clicks and explicit connections reveal filtered targets',async({page})=>{
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);await canvas.scrollIntoViewIfNeeded();
    const box=(await canvas.boundingBox())!;
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).toBe('pointer');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2-20);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).not.toBe('pointer');
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2-20);await expect(page.getByRole('region',{name:'Selected node'})).toHaveCount(0);
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).toBe('pointer');
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await expect(page.getByRole('region',{name:'Selected node'})).toBeVisible();
    await page.getByRole('combobox',{name:'Show',exact:true}).selectOption('lesson');
    await page.getByLabel('Find a node').fill('schema');await page.getByRole('button',{name:'Confirm schema versions before mapping changes · lesson',exact:true}).click();
    await page.getByRole('region',{name:'Selected node'}).getByRole('button',{name:/^citation ·/}).first().click();
    await expect(page.getByRole('region',{name:'Selected evidence'})).toBeVisible();await expect(page.getByRole('combobox',{name:'Show',exact:true})).toHaveValue('all');
    const selected=page.getByRole('region',{name:'Selected node'});
    await expect(selected.locator(':scope > h3')).toHaveText(/^#cec-team · Confirm the schema version/);
    await expect(selected).toContainText('Source record CCEC1:1');
    const activity=page.getByRole('checkbox',{name:'Include employee activity'});await expect(activity).toHaveClass(/accent-checkbox/);await activity.focus();await expect(activity).toBeFocused();
});

test('failed lazy knowledge chunk retains the Office shell and room camera',async({page})=>{
    await page.route('**/assets/BrainWorkspace-*.js',route=>route.fulfill({status:404,body:'Synthetic chunk failure'}));
    await page.goto('/');const canvas=page.locator('canvas');await expect(canvas).toHaveCount(1);
    const positions=()=>page.locator('[data-scene-label="mail"]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width};}).filter(r=>r.w>0));
    await expect.poll(async()=>(await positions()).length).toBeGreaterThan(0);const box=(await canvas.boundingBox())!;
    await page.mouse.move(box.x+box.width*.65,box.y+box.height*.7);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.65,{steps:12});await page.mouse.up();await page.waitForTimeout(700);
    const before=await positions();await page.getByRole('button',{name:'Brain',exact:true}).click();
    await expect(page.getByRole('status').filter({hasText:'Office Brain could not load.'})).toBeVisible();await expect(page.getByRole('button',{name:'Office settings'})).toBeVisible();
    await page.getByRole('button',{name:'Return to office',exact:true}).click();await expect(page.locator('canvas')).toHaveCount(1);
    await expect.poll(async()=>{const after=await positions();return after.length===before.length && after.every((r,i)=>Math.abs(r.x-before[i].x)<3&&Math.abs(r.y-before[i].y)<3);}).toBe(true);
});

test('unformatted historical assignment and lookup entries retain every receipt identity',async({page})=>{
    let recorded:{id:string;version?:string;sha:string}|undefined;
    await page.route('**/api/knowledge/assignment?**',async route=>{
        const response=await route.fetch(),data=await response.json(),entry=data.supplied.evidence[0];
        recorded={id:entry.reference.id,version:entry.reference.version,sha:entry.excerptSha256};
        data.supplied.sourceEvidenceText='Synthetic historical packet with unreadable formatting';
        if(data.lookup)data.lookup.response.text='Synthetic malformed historical lookup';
        await route.fulfill({response,json:data});
    });
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Activity',exact:true}).click();await page.getByRole('button',{name:'Inspect assignment knowledge'}).first().click();
    const detail=page.getByRole('region',{name:'Assignment knowledge',exact:true});await expect(detail).toContainText('Some excerpts could not be formatted');
    await detail.getByText('Assignment receipt',{exact:true}).click();const supplied=detail.locator('li').filter({has:page.getByText(`Recorded reference: ${recorded!.id}`,{exact:true})});await expect(supplied).toBeVisible();await expect(supplied.getByText(`Version: ${recorded!.version}`,{exact:true})).toBeVisible();await expect(supplied.getByText(`Excerpt SHA-256: ${recorded!.sha}`,{exact:true})).toBeVisible();
    await detail.getByRole('button',{name:'Lookup 1 · served',exact:true}).click();const lookup=page.getByRole('region',{name:'Selected lookup',exact:true});await expect(lookup).toContainText('Some excerpts could not be formatted');
    await lookup.getByText('Lookup receipt',{exact:true}).click();const retrieved=lookup.locator('li').filter({has:page.getByText(`Recorded reference: ${recorded!.id}`,{exact:true})});await expect(retrieved).toBeVisible();await expect(retrieved.getByText(`Version: ${recorded!.version}`,{exact:true})).toBeVisible();await expect(retrieved.getByText(`Excerpt SHA-256: ${recorded!.sha}`,{exact:true})).toBeVisible();
});

test('group and search context survive inspecting a record, with a concise introduction above the map',async({page})=>{
    await page.route('**/api/knowledge/map?**',async route=>{const response=await route.fetch(),map=await response.json();await route.fulfill({response,json:{...map,nodes:[...map.nodes,...Array.from({length:100},(_,i)=>({id:`synthetic:${i}`,title:`Synthetic note ${i}`,kind:'technical',domains:['cms'],detail:'Synthetic group context fixture'}))]}});});
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    const browser=page.getByRole('region',{name:'Map browser'});await browser.getByRole('button',{name:'CMS 100',exact:true}).click();
    await browser.getByRole('button',{name:'Next records',exact:true}).click();await expect(browser).toContainText('2 / 3');
    const record=browser.getByRole('button',{name:/Synthetic note .* · technical/}).first(),name=await record.innerText();await record.click();
    await expect(page.getByRole('navigation',{name:'Map location'}).getByRole('button',{name:'CMS',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Back to map',exact:true}).click();await expect(browser).toContainText('2 / 3');await expect(browser.getByRole('button',{name,exact:true})).toBeVisible();
    const caption=page.getByText('See how notes, source evidence and team lessons connect.',{exact:false});const bounds=await caption.boundingBox(),canvas=await page.locator('[data-brain-renderer] canvas').boundingBox();
    expect(bounds!.width).toBeLessThan((await page.locator('[data-brain-content]').boundingBox())!.width*.65);expect(bounds!.y+bounds!.height).toBeLessThan(canvas!.y);expect(await caption.evaluate(el=>getComputedStyle(el).maxWidth)).not.toBe('none');
    await page.getByText('Controls and source details',{exact:true}).click();await expect(page.getByText('Drag to orbit and scroll to zoom, or use the list to browse with a keyboard.',{exact:true})).toBeVisible();
});
