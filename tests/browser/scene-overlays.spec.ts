import { expect, test } from '@playwright/test';
import { evidence } from './support';

test('room labels stay near their desks and arrive from above in screen order', async ({page}) => {
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.addInitScript(()=>{localStorage.setItem('office.motion','full');localStorage.setItem('office.quality','low');localStorage.setItem('office.floor','delivery');});
    await page.goto('/');
    const label=page.getByRole('button',{name:'DEVELOPMENT Implementation',exact:true});
    await expect(label).toBeVisible();
    const name=page.getByRole('button',{name:/^Alex, .*Developer/});
    const labelBox=(await label.boundingBox())!,nameBox=(await name.boundingBox())!;
    expect(Math.abs(labelBox.x+labelBox.width/2-nameBox.x-nameBox.width/2)).toBeLessThan(65);
    expect(labelBox.y-nameBox.y).toBeGreaterThan(15);
    expect(labelBox.y-nameBox.y).toBeLessThan(100);
    await page.screenshot({path:evidence('office-development-label.png')});
    const frames=await page.evaluate(async()=>{
        const frames:{top:number;opacity:number;y:number;delay:number;cssDelay:number}[][]=[];
        const start=performance.now();
        (document.querySelector('button[aria-label^="Go to Floor 2"]') as HTMLButtonElement).click();
        let arrived=0;
        while(performance.now()-start<8000){
            await new Promise(requestAnimationFrame);
            const rows=[...document.querySelectorAll<HTMLElement>('[data-scene-overlay][data-floor-active="true"]')].map(el=>{
                const style=getComputedStyle(el),translate=style.translate.split(' ');
                return {top:el.getBoundingClientRect().top,opacity:Number(style.opacity),y:translate.length>1?parseFloat(translate[1]):0,delay:Number(el.dataset.entranceDelay),cssDelay:parseFloat(style.transitionDelay)*1000};
            });
            if(document.querySelector('h1')?.textContent==='CTO Office')frames.push(rows);
            if(document.querySelector('[data-elevator-doors]')?.getAttribute('data-phase')==='idle'&&document.querySelector('h1')?.textContent==='CTO Office'){
                arrived ||= performance.now();if(performance.now()-arrived>800)break;
            }
        }
        return frames;
    });
    expect(frames.some(rows=>rows.some(row=>row.opacity>0&&row.opacity<1&&row.y<0&&row.y>=-6))).toBe(true);
    const settled=frames.at(-1)!;
    expect(settled.length).toBeGreaterThan(2);
    expect(settled.every(row=>row.opacity===1&&row.y===0)).toBe(true);
    expect(settled.every(row=>Math.abs(row.cssDelay-row.delay)<1)).toBe(true);
    const sorted=[...settled].sort((a,b)=>a.top-b.top);
    expect(sorted.every((row,index)=>index===0||row.delay>=sorted[index-1].delay)).toBe(true);
    expect(new Set(sorted.map(row=>row.delay)).size).toBeGreaterThan(1);
    expect(Math.max(...sorted.map(row=>row.delay))).toBeLessThanOrEqual(280);
    const overlay=page.locator('[data-scene-overlay][data-floor-active="true"]').first();
    await expect(overlay).toHaveCSS('transition-timing-function','cubic-bezier(0.22, 1, 0.36, 1)');
    await page.getByRole('button',{name:'Office help',exact:true}).click();
    await expect(overlay).toHaveCSS('opacity','1');
    await expect(overlay).toHaveCSS('translate','0px');
    await page.getByRole('button',{name:'Close help',exact:true}).click();
});
