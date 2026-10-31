import { expect, test, type Page } from '@playwright/test';
async function geometry(page:Page){return page.evaluate(()=>{
  const box=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
  return {world:box('main'),canvas:box('canvas'),header:box('header'),dock:box('[data-surface=dock]'),scroll:[scrollX,scrollY],width:document.documentElement.scrollWidth};
});}
async function frames(page:Page){return page.evaluate(async()=>{
  const samples:{left:number|null;world:number[];canvas:number[];scroll:number[];width:number}[]=[],until=performance.now()+500;
  do {await new Promise(requestAnimationFrame);const panel=document.querySelector('[data-inspector]'),world=document.querySelector('main')!.getBoundingClientRect(),canvas=document.querySelector('canvas')!.getBoundingClientRect();samples.push({left:panel?.getBoundingClientRect().left??null,world:[world.x,world.y,world.width,world.height],canvas:[canvas.x,canvas.y,canvas.width,canvas.height],scroll:[scrollX,scrollY],width:document.documentElement.scrollWidth});}while(performance.now()<until);
  return samples;
});}
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test(`drawer slides both ways without moving the office at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});
    await page.addInitScript(()=>{localStorage.setItem('office.motion','full');localStorage.setItem('office.quality','low');});
    await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible();
    const before=await geometry(page);
    await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const opening=await frames(page);
    const panel=page.getByRole('complementary',{name:'PM mailbox'});await expect(panel).toBeVisible();
    const settled=(await panel.boundingBox())!;expect(settled.x+settled.width).toBeCloseTo(viewport.width,0);
    expect(opening.some(f=>f.left!==null&&f.left>settled.x+5)).toBe(true);
    expect(opening.at(-1)!.left).toBeCloseTo(settled.x,0);
    await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
    await page.getByRole('button',{name:'Close details'}).click();const closing=await frames(page);
    expect(closing.some(f=>f.left!==null&&f.left>settled.x+5)).toBe(true);expect(closing.at(-1)!.left).toBeNull();
    await expect(page.locator('[data-inspector]')).toHaveCount(0);
    for(const f of [...opening,...closing]){expect(f.world).toEqual(before.world);expect(f.canvas).toEqual(before.canvas);expect(f.scroll).toEqual(before.scroll);expect(f.width).toBe(before.width);}
    expect(await geometry(page)).toEqual(before);await expect(page.getByRole('button',{name:/^Open PM mailbox,/})).toBeFocused();
  });
}
test('switching and rapidly reopening drawers keeps one overlay and respects reduced motion',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
  await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();await expect(page.locator('[data-inspector]')).toHaveCount(1);await expect(page.getByRole('textbox',{name:'Message Morgan'})).toBeInViewport();
  await page.keyboard.press('Escape');await page.keyboard.press('o');await expect(page.getByRole('complementary',{name:'Your outbox'})).toBeVisible();await expect(page.locator('[data-inspector]')).toHaveCount(1);
  const transform=await page.locator('[data-inspector]').evaluate(el=>getComputedStyle(el).transform);expect(['none','matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  await page.keyboard.press('Escape');await expect(page.locator('[data-inspector]')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth)).toBe(true);
});
