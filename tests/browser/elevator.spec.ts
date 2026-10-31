import { expect, test } from '@playwright/test';

for(const busy of [false,true])test(`doors paint closed before switching and finish opening${busy?' after a slow frame':''}`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{localStorage.setItem('office.floor','delivery');localStorage.setItem('office.motion','full');localStorage.setItem('office.quality','low');});
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  for(const target of ['CTO Office','Delivery Team','CTO Office','Delivery Team']){
    const frames=await page.evaluate(async({target,busy})=>{
      const doors=document.querySelector<HTMLElement>('[data-elevator-doors]')!,left=doors.querySelector('[data-door=left]')!,right=doors.querySelector('[data-door=right]')!,world=document.querySelector('main')!;
      const button=[...document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Office floors"] button')].find(b=>b.textContent?.includes(target))!;
      const frames:{time:number;title:string;phase:string;covered:boolean;open:boolean;visible:boolean;disabled:boolean;chrome:number[];dockInert:boolean;dockY:number;dockBackground:string;itemsBelow:boolean;itemYs:number[]}[]=[];
      let sawTravel=false,stalled=false;const start=performance.now();
      button.click();
      do{
        await new Promise(requestAnimationFrame);
        const area=world.getBoundingClientRect(),l=left.getBoundingClientRect(),r=right.getBoundingClientRect(),phase=doors.dataset.phase!;
        frames.push({time:performance.now()-start,title:document.querySelector('h1')!.textContent!,phase,covered:l.right>=area.left+area.width/2-.5&&r.left<=area.left+area.width/2+.5,open:l.right<=area.left+.5&&r.left>=area.right-.5,visible:getComputedStyle(doors).visibility==='visible',disabled:button.disabled,chrome:['[data-surface=intro]','[data-surface=updates]','[data-surface=dock]'].map(selector=>Number(getComputedStyle(document.querySelector(selector)!).opacity)),dockInert:document.querySelector('footer')!.inert,dockY:document.querySelector('footer')!.getBoundingClientRect().y,dockBackground:getComputedStyle(document.querySelector('footer')!).backgroundColor,itemsBelow:[...document.querySelectorAll('footer button')].every(el=>el.getBoundingClientRect().top>=innerHeight),itemYs:[...document.querySelectorAll('footer button')].map(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform==='none'?undefined:getComputedStyle(el).transform).m42)});
        if(phase!=='idle')sawTravel=true;
        // A long frame used to let the room/finish timers overtake the doors.
        if(busy&&!stalled&&performance.now()-start>80&&phase==='closing'){stalled=true;const end=performance.now()+650;while(performance.now()<end){/* simulate a busy renderer */}}
      }while((!sawTravel||doors.dataset.phase!=='idle')&&performance.now()-start<8000);
      return frames;
    },{target,busy});
    expect(frames.some(f=>f.phase==='preparing'&&f.open&&f.visible)).toBe(true);
    expect(frames.some(f=>f.phase==='closing'&&!f.open&&!f.covered)).toBe(true);
    const changed=frames.findIndex(f=>f.title===target);expect(changed).toBeGreaterThan(0);
    expect(frames[changed].covered).toBe(true);expect(frames[changed].chrome.slice(0,2).every(opacity=>opacity===0)&&frames[changed].itemsBelow).toBe(true);expect(frames.slice(0,changed).some(f=>f.covered&&f.visible)).toBe(true);
    for(const index of [0,1]){
      expect(frames.some(f=>f.phase==='closing'&&f.chrome[index]>0&&f.chrome[index]<1)).toBe(true);
      expect(frames.some(f=>f.phase==='opening'&&f.chrome[index]>0&&f.chrome[index]<1)).toBe(true);
      expect(frames.at(-1)!.chrome[index]).toBe(1);
    }
    expect(frames.every(f=>f.dockY===frames[0].dockY&&f.chrome[2]===1&&f.dockBackground===frames[0].dockBackground)).toBe(true);
    expect(frames.some(f=>f.phase==='closing'&&f.itemYs[0]>f.itemYs.at(-1)!)).toBe(true);
    expect(frames.at(-1)!.itemYs.every(y=>y===0)).toBe(true);
    expect(frames.filter(f=>f.phase!=='idle').every(f=>f.dockInert)).toBe(true);
    expect(frames.at(-1)!.dockInert).toBe(false);
    const closed=frames.filter(f=>f.phase==='closed');expect(closed.length).toBeGreaterThan(1);expect(closed.every(f=>f.covered&&f.visible&&f.disabled)).toBe(true);
    const opening=frames.filter(f=>f.phase==='opening');expect(opening.some(f=>!f.open&&!f.covered)).toBe(true);expect(opening.every(f=>f.visible&&f.disabled)).toBe(true);
    expect(frames.at(-1)).toMatchObject({title:target,phase:'idle',open:true,visible:false,disabled:false});
    expect(frames.every(f=>f.visible||f.open)).toBe(true);
  }
});

test('reduced motion changes floors directly without waiting for door callbacks',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('office.floor','delivery');localStorage.setItem('office.motion','reduced');});
  await page.goto('/');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();
  await expect(page.getByRole('heading',{level:1,name:'CTO Office',exact:true})).toBeVisible();
  await expect(page.locator('[data-elevator-doors]')).toHaveAttribute('data-phase','idle');
  for(const selector of ['[data-surface=intro]','[data-surface=updates]','[data-surface=dock]'])await expect(page.locator(selector)).toHaveCSS('opacity','1');
  await expect(page.getByRole('button',{name:/^Go to Floor 1, Delivery Team/})).toBeEnabled();
});
