import { test,expect } from './fixture-test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
const artifacts = '/private/tmp/office-brain-screenshots';
test('synthetic Library, Map and Activity preserve Office navigation and scoped records', async ({ page }) => {
    mkdirSync(artifacts,{ recursive:true }); await page.goto('/'); await page.getByRole('button',{name:'Brain',exact:true}).click();
    const nav = page.getByRole('navigation',{name:'Brain views'});
    await nav.getByRole('button',{name:'Library',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Library',exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Confirm schema versions before mapping changes'})).toBeVisible();
    await page.getByRole('button',{name:'Inspect evidence'}).first().click();
    await expect(page.getByRole('region',{name:'Selected evidence'})).toContainText('Confirm the schema version');
    await page.screenshot({path:`${artifacts}/office-brain-02-library.synthetic.png`,fullPage:true});
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await nav.getByRole('button',{name:'Map',exact:true}).click();
    await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(1);
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.screenshot({path:`${artifacts}/office-brain-03-map-overview.synthetic.png`,fullPage:true});
    await page.getByLabel('Find a node').fill('schema'); await page.getByRole('button',{name:'Confirm schema versions before mapping changes · lesson',exact:true}).click();
    await expect(page.getByRole('region',{name:'Selected node'})).toContainText('citation');
    await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(1);
    await expect(page.getByRole('button',{name:'Constellation overview',exact:true})).toBeVisible();
    await page.screenshot({path:`${artifacts}/office-brain-03-map.synthetic.png`,fullPage:true});
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await nav.getByRole('button',{name:'Activity',exact:true}).click(); await expect(page.locator('[data-brain-renderer]')).toHaveCount(0);
    await expect(page.getByRole('heading',{name:'Activity',exact:true})).toBeVisible();
    await expect(page.getByRole('list',{name:'Learning timeline'})).toContainText('admitted');
    await page.screenshot({path:`${artifacts}/office-brain-04-activity.synthetic.png`,fullPage:true});
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    for(let n=0;n<3;n++) { await nav.getByRole('button',{name:'Map',exact:true}).click(); await expect(page.locator('canvas')).toHaveCount(1); await nav.getByRole('button',{name:'Library',exact:true}).click(); await expect(page.locator('canvas')).toHaveCount(0); }
});
test('node navigation animates only when Office and system motion preferences permit', async ({ page,request }) => {
    await page.emulateMedia({ reducedMotion:'no-preference' });
    for (const scenario of [{reducedMotion:false,system:false},{reducedMotion:true,system:false},{reducedMotion:false,system:true}]) {
        const {reducedMotion,system}=scenario; await page.emulateMedia({reducedMotion:system?'reduce':'no-preference'});
        await request.post('/__fixture/preferences',{data:{reducedMotion}});
        await page.goto('/'); await page.getByRole('button',{name:'Brain',exact:true}).click();
        await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Map',exact:true}).click();
        const canvas=page.locator('[data-brain-renderer] canvas'); await expect(canvas).toHaveCount(1);
        // Actual camera flight changes rendered frames; reduced motion settles immediately.
        await page.getByLabel('Find a node').fill('schema');
        await page.getByRole('button',{name:'Confirm schema versions before mapping changes · lesson',exact:true}).click();
        await page.waitForTimeout(100); const before=await canvas.screenshot(); await page.waitForTimeout(300); const after=await canvas.screenshot();
        expect(before.equals(after)).toBe(reducedMotion || system);
        await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Library',exact:true}).click(); await expect(page.locator('canvas')).toHaveCount(0);
    }
});
test('a constellation texture failure disposes the renderer and retains keyboard navigation',async({page})=>{
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type==='2d')return null;return original.apply(this,[type,...args] as Parameters<typeof original>);} as typeof original;});
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Map',exact:true}).click();
    await expect(page.getByText('The 3D map is unavailable. Use the searchable connection list below.',{exact:true})).toBeVisible();await expect(page.locator('[data-brain-renderer] canvas')).toHaveCount(0);
    await page.getByLabel('Find a node').fill('schema');await page.getByRole('button',{name:'Confirm schema versions before mapping changes · lesson',exact:true}).click();await expect(page.getByRole('region',{name:'Selected node'})).toContainText('Saved connections');
});

test('synthetic Activity opens immutable supplied knowledge and recorded lookup pages',async({page})=>{
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Activity',exact:true}).click();
    await page.getByRole('button',{name:'Inspect assignment knowledge',exact:true}).first().click();const detail=page.getByRole('region',{name:'Assignment knowledge',exact:true});await expect(detail).toContainText('Supplied at dispatch');await expect(detail).toContainText('Confirm the schema version');await detail.getByRole('button',{name:'Lookup 1 · served',exact:true}).click();await expect(page.getByRole('region',{name:'Selected lookup',exact:true})).toContainText('schema validation receipts');await page.locator('[data-office-brain]').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${artifacts}/office-brain-04-assignment-knowledge.synthetic.png`,fullPage:true});await expect(detail).toContainText('Accepted outcome citations');await expect(detail).toContainText('Accepted result SHA-256');await page.getByRole('region',{name:'Selected lookup',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`${artifacts}/office-brain-04-lookup-outcome.synthetic.png`,fullPage:true});expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await page.getByRole('button',{name:'Inspect weekly review',exact:true}).click();await expect(page.getByRole('region',{name:'Weekly knowledge review',exact:true})).toContainText('CEC · weekly knowledge review');await page.getByRole('heading',{name:'Morgan’s weekly knowledge review',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`${artifacts}/office-brain-04-morgan-review.synthetic.png`,fullPage:true});expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('synthetic assignment with no lookups retains an accessible and honest empty state',async({page},testInfo)=>{
    testInfo.annotations.push({type:'evidence',description:'Synthetic empty lookup response; no live assignment or accepted outcome'});
    await page.route('**/api/knowledge/assignment?**',async route=>{
        const response=await route.fetch();
        const data=await response.json();
        await route.fulfill({response,json:{...data,lookups:[],lookup:undefined,outcomes:[]}});
    });
    await page.goto('/');
    await page.getByRole('button',{name:'Brain',exact:true}).click();
    await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Activity',exact:true}).click();
    await page.getByRole('button',{name:'Inspect assignment knowledge',exact:true}).first().click();
    const detail=page.getByRole('region',{name:'Assignment knowledge',exact:true});
    await expect(detail).toContainText('No recorded lookups for this assignment.');
    await expect(detail).toContainText('No accepted outcome citation is recorded. Application remains unknown.');
    await expect(detail.getByRole('group',{name:'Recorded lookup pages'})).toHaveCount(0);
    expect((await new AxeBuilder({page}).include('[data-office-brain]').analyze()).violations).toEqual([]);
});

test('room orbit and zoom survive renderer disposal while visiting the Brain map',async({page})=>{
    await page.goto('/');await expect(page.locator('canvas')).toHaveCount(1);const canvas=page.locator('canvas');
    const positions=()=>page.locator('[data-scene-label="mail"]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width};}).filter(r=>r.w>0));
    await expect.poll(async()=>(await positions()).length).toBeGreaterThan(0);const initial=await positions(),box=(await canvas.boundingBox())!;
    await page.mouse.move(box.x+box.width*.65,box.y+box.height*.7);await page.mouse.down();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.65,{steps:12});await page.mouse.up();await page.mouse.wheel(0,-100);await page.waitForTimeout(700);
    let prior=await positions(),stable=0;await expect.poll(async()=>{await page.waitForTimeout(100);const next=await positions();stable=next.length===prior.length&&next.every((r,i)=>Math.abs(r.x-prior[i].x)<.1&&Math.abs(r.y-prior[i].y)<.1)?stable+1:0;prior=next;return stable>=2;}).toBe(true);const orbited=await positions();expect(orbited.some((r,i)=>Math.abs(r.x-initial[i].x)>5||Math.abs(r.y-initial[i].y)>5)).toBe(true);
    for(let i=0;i<2;i++){await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('navigation',{name:'Brain views'}).getByRole('button',{name:'Map',exact:true}).click();await expect(page.locator('canvas')).toHaveCount(1);await page.getByRole('button',{name:'Return to office',exact:true}).click();await expect(page.locator('canvas')).toHaveCount(1);await expect.poll(async()=>{const after=await positions();return after.length===orbited.length&&after.every((r,j)=>Math.abs(r.x-orbited[j].x)<2&&Math.abs(r.y-orbited[j].y)<2);}).toBe(true);}
});
