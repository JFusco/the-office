import {test,expect} from './fixture-test';

test('returning from the floating inspector restores hover on the same node',async({page})=>{
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);await canvas.scrollIntoViewIfNeeded();
    const bounds=(await canvas.boundingBox())!;
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).toBe('pointer');
    let hovered=await canvas.screenshot();await expect.poll(async()=>{const next=await canvas.screenshot(),stable=next.equals(hovered);hovered=next;return stable;}).toBe(true);
    await page.locator('[data-brain-list-frame]').hover();
    await expect.poll(async()=>(await canvas.screenshot()).equals(hovered)).toBe(false);
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await expect.poll(async()=>(await canvas.screenshot()).equals(hovered)).toBe(true);
    await page.locator('[data-brain-list-frame]').hover();await page.mouse.move(bounds.x+30,bounds.y+bounds.height-30);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).not.toBe('pointer');
});

test.describe('touch selection',()=>{
    test.use({hasTouch:true});
    test('a node tap survives the non-hover pointer leaving after pointerup',async({page})=>{
        await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
        const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);await canvas.scrollIntoViewIfNeeded();
        await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
        const box=(await canvas.boundingBox())!;
        await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await expect(page.getByRole('region',{name:'Selected node'})).toContainText('cec');
    });
});

test('a previous-project error does not replace the next project preloader',async({page})=>{
    let releaseOld!:()=>void;const oldGate=new Promise<void>(r=>releaseOld=r);
    await page.route(/\/api\/(office|events)(?:\?|$)/,async route=>{if((new URL(route.request().url()).searchParams.get('project')||'cec')!=='cec')return route.continue();if(new URL(route.request().url()).pathname==='/api/events'){await oldGate;await route.abort();}else await route.fulfill({status:500,json:{error:'Synthetic old-project error'}});});
    let release!:()=>void;const gate=new Promise<void>(r=>release=r);
    await page.route(/\/api\/(office|events)\?project=brain/,async route=>{await gate;await route.continue();});
    try{
        await page.goto('/');await expect(page.getByRole('alert')).toContainText('500');
        await page.getByRole('combobox',{name:'Office project'}).selectOption('brain');
        const overlay=page.locator('[data-project-loading]');await expect(overlay.locator('[data-office-loader]')).toBeVisible();await expect(overlay.getByRole('alert')).toHaveCount(0);await expect(overlay).toContainText('Opening Brain');
    }finally{release();releaseOld();}
    await expect(page.locator('[data-project-loading]')).toHaveCount(0);
});

test('a source write waits for an in-flight page then reads its fresh saved state',async({page})=>{
    let release!:()=>void;const gate=new Promise<void>(r=>release=r);let initial:any,reads=0;
    await page.route('**/api/knowledge/sources?**',async route=>{
        if(new URL(route.request().url()).searchParams.has('after')){await gate;await route.fulfill({json:{...initial,sources:initial.sources.slice(1),next:null}});}
        else{const response=await route.fetch(),data=await response.json();reads++;if(reads===1){const owned=data.sources.find((source:{homeProjectId:string})=>source.homeProjectId==='cec');initial={...data,sources:[owned,...data.sources.filter((source:{id:string})=>source.id!==owned.id)]};await route.fulfill({response,json:{...initial,sources:initial.sources.slice(0,1),next:'synthetic-next'}});}else await route.fulfill({response});}
    });
    try{
        await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Load more sources',exact:true}).click();
        const card=page.getByRole('article',{name:initial.sources[0].title,exact:true});await card.getByRole('button',{name:'Pause',exact:true}).click();
        await expect(page.getByText('Saving source settings…',{exact:true})).toBeVisible();await expect(page.getByText('Source settings saved. Harper uses this shared registry.',{exact:true})).toHaveCount(0);
        release();await expect(card.getByRole('button',{name:'Resume',exact:true})).toBeVisible();expect(reads).toBe(2);await expect(page.getByText('Source settings saved. Harper uses this shared registry.',{exact:true})).toBeVisible();
    }finally{release();}
});

test('a failed project switch stops its preloader and recovers through the ordinary read loop',async({page})=>{
    let failed=true;
    await page.route(/\/api\/(office|events)\?project=brain/,route=>failed?new URL(route.request().url()).pathname==='/api/events'?route.abort():route.fulfill({status:500,json:{error:'Synthetic project read failure'}}):route.continue());
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();
    await page.getByRole('combobox',{name:'Office project'}).selectOption('brain');
    const overlay=page.locator('[data-project-loading]');await expect(overlay.getByRole('alert')).toContainText('500');
    await expect(overlay.locator('[data-office-loader]')).toHaveCount(0);await expect(overlay).toContainText('retry automatically');
    failed=false;await expect(overlay).toHaveCount(0,{timeout:30000});
});

test('source pagination names its read and blocks duplicate page requests',async({page})=>{
    let releaseInitial!:()=>void,releaseMore!:()=>void,moreReads=0;
    const initial=new Promise<void>(r=>releaseInitial=r),more=new Promise<void>(r=>releaseMore=r);
    let original:any;
    await page.route('**/api/knowledge/sources?**',async route=>{
        if(new URL(route.request().url()).searchParams.has('after')){moreReads++;await more;await route.fulfill({json:{...original,sources:original.sources.slice(1),next:null}});}
        else{const response=await route.fetch();original=await response.json();await initial;await route.fulfill({response,json:{...original,sources:original.sources.slice(0,1),next:'synthetic-next'}});}
    });
    try{
        await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();
        await expect(page.getByRole('button',{name:'Refresh sources',exact:true})).toBeDisabled();
        await expect(page.getByRole('status').filter({hasText:/Loading Harper’s sources|Refreshing sources|Loading more sources/})).toHaveCount(1);
        releaseInitial();const button=page.getByRole('button',{name:'Load more sources',exact:true});await button.click();
        await expect(page.getByRole('status').filter({hasText:'Loading more sources…'})).toBeVisible();await expect(button).toBeDisabled();
        expect(moreReads).toBe(1);releaseMore();await expect(button).toHaveCount(0);
        const cards=await page.locator('article[aria-label]').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label')));
        expect(cards).toHaveLength(original.sources.length);expect(new Set(cards).size).toBe(cards.length);
        await expect(page.getByText('Loading more sources…',{exact:true})).toHaveCount(0);
    }finally{releaseInitial();releaseMore();}
});
