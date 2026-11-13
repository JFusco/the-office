import {test,expect} from './fixture-test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync} from 'node:fs';
const artifacts='/private/tmp/office-knowledge-ui-evidence/browser';

for(const width of [1440,390])test(`shared alignment, bounded inputs, Slack routing and Activity hierarchy at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();
    const lefts:number[]=[];
    for(const name of ['Lessons','Library','Map','Activity']){
        await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name,exact:true}).click();
        const heading=page.getByRole('heading',{name,exact:true});await expect(heading).toBeVisible();lefts.push((await heading.boundingBox())!.x);
        expect(await page.locator('[data-brain-content]').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    }
    expect(Math.max(...lefts)-Math.min(...lefts)).toBeLessThan(1);
    await expect(page.getByRole('heading',{name:'Knowledge use',exact:true})).toBeVisible();
    const history=page.getByRole('region',{name:'Recent history'});await expect(history.getByRole('list',{name:'Learning timeline'})).toBeVisible();
    expect((await new AxeBuilder({page}).include('[data-office-brain]').analyze()).violations).toEqual([]);
    mkdirSync(artifacts,{recursive:true});await page.screenshot({path:`${artifacts}/activity-${width}.png`});
});

test('selecting a node shows its persisted cross-filter neighbors, bright edges and honest partial coverage',async({page})=>{
    await page.setViewportSize({width:1440,height:1000});
    await page.route('**/api/knowledge/map?**',route=>route.fulfill({json:{nodes:[
        {id:'lesson-selected',kind:'lesson',title:'Connection example',detail:'Selected record'},
        {id:'note-neighbor',kind:'technical',title:'Connected note',detail:'Saved technical note'},
        {id:'assignment-neighbor',kind:'assignment',title:'Connected assignment',detail:'Saved assignment'},
        {id:'isolated',kind:'lesson',title:'Isolated record',detail:'No saved relationships in this partial fixture'}],
        edges:[{source:'lesson-selected',target:'note-neighbor',kind:'promotion'},{source:'assignment-neighbor',target:'lesson-selected',kind:'supplied'},{source:'lesson-selected',target:'not-loaded',kind:'verified'}],truncated:true}}));
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    await page.getByRole('combobox',{name:'Show',exact:true}).selectOption('lesson');await page.getByLabel('Find a node').fill('Connection example');
    await page.getByRole('button',{name:'Connection example · lesson',exact:true}).click();
    const panel=page.getByRole('region',{name:'Selected node'});await expect(panel).toContainText('Saved connections · 2 records');await expect(panel).toContainText('1 connected record(s) are not loaded');
    await expect(panel.getByRole('button',{name:'promotion · Connected note',exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'supplied · Connected assignment',exact:true})).toBeVisible();
    await expect(page.getByText('Showing 2 connected record(s) outside the display filters. Back restores the filtered view.',{exact:true})).toBeVisible();
    const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);const original=await canvas.elementHandle();
    await canvas.scrollIntoViewIfNeeded();mkdirSync(artifacts,{recursive:true});await page.screenshot({path:`${artifacts}/selected-connections.png`});
    const frame=(await canvas.boundingBox())!,aside=(await page.locator('[data-brain-list-frame]').boundingBox())!;expect(frame.x+frame.width).toBeLessThanOrEqual(aside.x+1);
    await panel.getByRole('button',{name:'promotion · Connected note',exact:true}).click();await expect(panel.locator(':scope > h3')).toHaveText('Connected note');
    expect(await canvas.evaluate((el,before)=>el===before,original)).toBe(true);
    await page.getByRole('button',{name:'Constellation overview',exact:true}).click();await page.getByLabel('Find a node').fill('Isolated');await page.getByRole('button',{name:'Isolated record · lesson',exact:true}).click();
    await expect(panel).toContainText('No saved connections in the loaded map.');await expect(panel).toContainText('Missing connections do not establish that this record is isolated.');
});

test('loaded results animate once and remain visible during refresh',async({page,request})=>{
    await page.emulateMedia({reducedMotion:'no-preference'});await request.post('/__fixture/preferences',{data:{reducedMotion:false}});
    let release!:()=>void;let gate=new Promise<void>(r=>release=r);let reads=0;
    await page.route('**/api/knowledge/search?**',async route=>{reads++;await gate;await route.continue();});
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Library',exact:true}).click();
    await expect(page.getByText('Searching permitted knowledge…',{exact:true})).toBeVisible();
    const samples=page.evaluate(()=>new Promise<number[]>(resolve=>{const values:number[]=[];const start=performance.now();const tick=()=>{const el=document.querySelector('[data-knowledge-ready]');if(el)values.push(Number(getComputedStyle(el).opacity));if(el&&values.length>20)resolve(values);else if(performance.now()-start>4000)resolve(values);else requestAnimationFrame(tick);};tick();}));
    release();const frames=await samples;expect(frames.some(x=>x<.95)).toBe(true);expect(frames.at(-1)).toBe(1);
    const results=page.locator('[data-knowledge-ready]');const before=await results.elementHandle();gate=new Promise<void>(r=>release=r);
    try{await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByText('Updating search results…',{exact:true})).toBeVisible();expect(await results.evaluate((el,original)=>el===original,before)).toBe(true);expect(await results.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);}finally{release();}
    await expect(page.getByText('Updating search results…',{exact:true})).toHaveCount(0);expect(reads).toBe(2);
});
