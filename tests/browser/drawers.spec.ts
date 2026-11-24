import { expect, test, type Page } from './fixture-test';
import { setPreferences } from './support';
async function geometry(page:Page){return page.evaluate(()=>{
  const box=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
  return {world:box('main'),canvas:box('canvas'),header:box('header'),dock:box('[data-surface=dock]'),scroll:[scrollX,scrollY],width:document.documentElement.scrollWidth};
});}
async function frames(page:Page){return page.evaluate(async()=>{
  const samples:{left:number|null;world:number[];canvas:number[];scroll:number[];width:number}[]=[],until=performance.now()+1600;
  do {await new Promise(requestAnimationFrame);const panel=document.querySelector('[data-inspector]'),world=document.querySelector('main')!.getBoundingClientRect(),canvas=document.querySelector('canvas')!.getBoundingClientRect();samples.push({left:panel?.getBoundingClientRect().left??null,world:[world.x,world.y,world.width,world.height],canvas:[canvas.x,canvas.y,canvas.width,canvas.height],scroll:[scrollX,scrollY],width:document.documentElement.scrollWidth});}while(performance.now()<until);
  return samples;
});}
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test(`drawer slides both ways without moving the office at ${viewport.width}px`,async({page,request})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});
    await setPreferences(request,{reducedMotion:false,quality:'low'});
    await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible();
    const before=await geometry(page);
    const openingFrames=frames(page);await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const opening=await openingFrames;
    const panel=page.getByRole('complementary',{name:'PM mailbox'});await expect(panel).toBeVisible();
    const settled=(await panel.boundingBox())!;expect(settled.x+settled.width).toBeCloseTo(viewport.width,0);
    expect(opening.some(f=>f.left!==null&&f.left>settled.x+5)).toBe(true);
    expect(opening.at(-1)!.left).toBeCloseTo(settled.x,0);
    await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
    const closingFrames=frames(page);await page.getByRole('button',{name:'Close details'}).click();const closing=await closingFrames;
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
  // The next drawer slides in after the previous one closes; it settles with no transform.
  await expect.poll(()=>page.locator('[data-inspector]').evaluate(el=>getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await page.keyboard.press('Escape');await expect(page.locator('[data-inspector]')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth)).toBe(true);
});
test('opening another panel closes the current drawer first, then slides the next one in',async({page,request})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await setPreferences(request,{reducedMotion:false,quality:'low'});
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const mailbox=page.getByRole('complementary',{name:'PM mailbox'});await expect(mailbox).toBeVisible();
  await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
  await expect.poll(()=>mailbox.evaluate(el=>getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  const settled=(await mailbox.boundingBox())!;
  const sampling=page.evaluate(async()=>{const out:{label:string|null;left:number}[][]=[],until=performance.now()+1600;
    do{await new Promise(requestAnimationFrame);out.push([...document.querySelectorAll('[data-inspector]')].map(el=>({label:el.getAttribute('aria-label'),left:el.getBoundingClientRect().left})));}while(performance.now()<until);return out;});
  await page.getByRole('button',{name:/^Open your outbox,/}).click();
  const frames=await sampling;
  expect(frames.every(f=>f.length<=1)).toBe(true);
  const labels=frames.map(f=>f[0]?.label??null),lastMailbox=labels.lastIndexOf('PM mailbox'),firstOutbox=labels.indexOf('Your outbox');
  expect(lastMailbox).toBeGreaterThanOrEqual(0);expect(firstOutbox).toBeGreaterThan(lastMailbox);
  const mailboxLefts=frames.filter(f=>f[0]?.label==='PM mailbox').map(f=>f[0].left),outboxLefts=frames.filter(f=>f[0]?.label==='Your outbox').map(f=>f[0].left);
  // The mailbox leaves fully before the outbox enters from the edge and settles in place.
  expect(Math.max(...mailboxLefts)).toBeGreaterThan(settled.x+settled.width*.5);
  expect(outboxLefts[0]).toBeGreaterThan(settled.x+5);expect(outboxLefts.at(-1)!).toBeCloseTo(settled.x,0);
  await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('[data-inspector]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Open your outbox,/})).toBeFocused();
});
test('a drawer opened from inside another drawer returns focus to the original trigger',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const mailbox=page.getByRole('complementary',{name:'PM mailbox'});await expect(mailbox).toBeVisible();
  await mailbox.getByRole('button',{name:/Already with the team/}).click();
  await page.locator('[data-inspector-scroll]').getByRole('button').first().click();
  await expect(page.getByRole('button',{name:'Back to Already with the team'})).toBeVisible();await expect(page.locator('[data-inspector] h2').first()).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('[data-inspector]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Open PM mailbox,/})).toBeFocused();
});
test('Settings opened from the mailbox closes help, and waits for preferences like the gear',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Office help'}).click();await expect(page.getByRole('dialog',{name:'Office controls'})).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('dialog',{name:'Office controls'})).toBeVisible();
  await page.getByRole('complementary',{name:'PM mailbox'}).getByRole('button',{name:'Project settings'}).click();
  await expect(page.getByRole('complementary',{name:'Settings'})).toBeVisible();await expect(page.getByRole('dialog',{name:'Office controls'})).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:/^Open PM mailbox,/})).toBeFocused();
});
test('before preferences load, neither the gear nor the mailbox can open Settings',async({page})=>{
  await page.route('**/api/events*',route=>route.abort());
  await page.route('**/api/office',route=>route.fulfill({status:503,json:{error:'Fixture: office unavailable'}}));
  await page.goto('/');await page.getByRole('button',{name:'Tour the office'}).click();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const mailbox=page.getByRole('complementary',{name:'PM mailbox'});await expect(mailbox).toBeVisible();
  await expect(mailbox.getByRole('button',{name:'Project settings'})).toBeDisabled();await expect(page.getByRole('button',{name:'Office settings'})).toBeDisabled();
});
test('cancelling a drawer swap with Escape returns focus to the original trigger',async({page,request})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await setPreferences(request,{reducedMotion:false,quality:'low'});
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const mailbox=page.getByRole('complementary',{name:'PM mailbox'});await expect(mailbox).toBeVisible();
  // Escape lands while the mailbox is still sliding out for the ticket drawer.
  await mailbox.getByRole('button',{name:/Already with the team/}).click();
  await page.locator('[data-inspector-scroll]').getByRole('button').first().click();await page.keyboard.press('Escape');
  await expect(page.locator('[data-inspector]')).toHaveCount(0);await expect(page.getByRole('complementary',{name:'Ticket'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Open PM mailbox,/})).toBeFocused();
});

for (const width of [390,1440]) {
  test(`ticket evidence returns to the same mailbox row at ${width}px`,async({page,request})=>{
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await setPreferences(request,{reducedMotion:false,quality:'low'});
    await page.goto('/');
    const mailbox=page.getByRole('button',{name:/^Open PM mailbox,/});
    await mailbox.click();
    const drawer=page.locator('[data-inspector]'),active=drawer.locator('[data-inspector-scroll]');
    await expect.poll(()=>drawer.evaluate(el=>el.getBoundingClientRect().right)).toBeCloseTo(width,0);
    const office=await geometry(page),original=await drawer.elementHandle();
    const group=drawer.getByRole('button',{name:/Already with the team/});
    await group.click();
    const first=active.getByRole('button').first();
    await first.click();
    const evidence=active.getByRole('button',{name:/^Evidence/});
    await evidence.scrollIntoViewIfNeeded();
    const offset=await active.evaluate(el=>el.scrollTop);
    await evidence.press('Enter');
    await expect(drawer.getByRole('heading',{name:'Evidence',exact:true}).first()).toBeFocused();
    await expect(active.locator('[data-qa-results]')).toBeVisible();
    await drawer.getByRole('button',{name:/^Back to /}).click();
    await expect(evidence).toBeFocused();
    expect(await active.evaluate(el=>el.scrollTop)).toBe(offset);
    await drawer.getByRole('button',{name:'Back to Already with the team'}).click();
    await expect(first).toBeFocused();
    await drawer.getByRole('button',{name:'Back to PM mailbox'}).click();
    await expect(group).toBeFocused();
    expect(await original!.evaluate(el=>el===document.querySelector('[data-inspector]'))).toBe(true);
    expect(await geometry(page)).toEqual(office);
    await page.keyboard.press('Escape');await expect(mailbox).toBeFocused();
  });
}
test('returning to a conversation restores its draft',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  await page.getByRole('button',{name:/Already with the team/}).click();
  await page.locator('[data-inspector-scroll]').getByRole('button').first().click();
  const discuss=page.getByRole('button',{name:/^Discuss .* with /});
  await discuss.click();const compose=page.getByRole('textbox',{name:'Message Morgan'});
  await compose.fill('Can you check the latest update?');
  await page.getByRole('button',{name:/^Back to /}).click();await expect(discuss).toBeFocused();
  await discuss.click();await expect(compose).toHaveValue('Can you check the latest update?');
});

test('an unsaved notification setting survives Back and a live update',async({page,request})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Office settings'}).click();
  await page.getByRole('button',{name:/Project settings/}).click();
  const notifications=page.getByRole('button',{name:'Notifications',exact:true});
  await notifications.click();
  const channel=page.getByRole('textbox',{name:'Channel name',exact:true});
  await channel.fill('delivery-updates-draft');
  const snapshot=await (await request.get('/api/office')).json();
  await request.post('/__fixture/snapshot',{data:{events:snapshot.events}});
  await page.getByRole('button',{name:/^Back to /}).click();await expect(notifications).toBeFocused();
  await notifications.press('Enter');await expect(channel).toHaveValue('delivery-updates-draft');
});
