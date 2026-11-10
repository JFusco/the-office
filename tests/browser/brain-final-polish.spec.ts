import {test,expect} from './fixture-test';

test('returning from the floating inspector restores hover on the same node',async({page})=>{
    await page.goto('/');await page.getByRole('button',{name:'Brain',exact:true}).click();await page.getByRole('button',{name:'Map',exact:true}).click();
    const canvas=page.locator('[data-brain-renderer] canvas');await expect(canvas).toHaveCount(1);await canvas.scrollIntoViewIfNeeded();
    const bounds=(await canvas.boundingBox())!;
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await expect.poll(()=>canvas.evaluate(el=>getComputedStyle(el).cursor)).toBe('pointer');
    const hovered=await canvas.screenshot();await page.locator('[data-brain-list-frame]').hover();
    await expect.poll(async()=>(await canvas.screenshot()).equals(hovered)).toBe(false);
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await expect.poll(async()=>(await canvas.screenshot()).equals(hovered)).toBe(true);
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
