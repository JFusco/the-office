import { type Locator } from '@playwright/test';
import { expect, test, type Page } from './fixture-test';
import type { OfficeSnapshot } from '../../src/shared';
import { evidence as screenshotPath, setPreferences } from './support';
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
  await page.setViewportSize({width:390,height:640});
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Office help'}).click();await expect(page.getByRole('dialog',{name:'Office controls'})).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('dialog',{name:'Office controls'})).toBeVisible();
  const project = page.getByRole('complementary',{name:'PM mailbox'}).getByRole('button',{name:'Project settings'});
  const active = page.locator('[data-inspector-scroll]');
  await project.scrollIntoViewIfNeeded();
  const offset = await active.evaluate(element => element.scrollTop);
  await project.click();
  await expect(page.getByRole('heading',{name:'Project settings',exact:true})).toBeFocused();
  await expect(page.getByRole('dialog',{name:'Office controls'})).toHaveCount(0);
  for (const topic of ['Pickup', 'Notifications', 'Time']) {
    await expect(active.getByRole('button',{name:topic,exact:true})).toBeVisible();
  }
  await page.getByRole('button',{name:'Back to PM mailbox'}).click();
  await expect(project).toBeFocused();
  expect(await active.evaluate(element => element.scrollTop)).toBe(offset);
  await page.getByRole('button',{name:'Office settings'}).click();
  await expect(active.getByRole('button',{name:'Office preferences',exact:true})).toBeVisible();
  await expect(active.getByRole('button',{name:/^Project settings/})).toBeVisible();
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

async function sampleSlide(trigger: Locator) {
  const capture = await trigger.evaluateHandle(button => ({
    samples: new Promise<{ incoming: number[]; outgoing: number[]; paired: boolean; stationary: boolean; inert: boolean }>(resolve => {
      button.addEventListener('click', () => {
        const shell = button.closest('[data-inspector]')!;
        const leaving = shell.querySelector<HTMLElement>('[data-inspector-scroll]')!;
        const canvas = document.querySelector('canvas')!;
        const bounds = (element: Element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return `${x} ${y} ${width} ${height}`;
        };
        const frame = bounds(shell), scene = bounds(canvas);
        const { x, width } = leaving.parentElement!.getBoundingClientRect();
        const start = performance.now();
        const incoming: number[] = [], outgoing: number[] = [];
        let stationary = true, inert = true, paired = false;
        const slide = (element: Element) => element.getAnimations().find(animation =>
          (animation.effect as KeyframeEffect).getKeyframes().some(keyframe => 'transform' in keyframe));
        function sample() {
          const entering = shell.querySelector<HTMLElement>('[data-inspector-scroll]');
          const from = slide(leaving), to = entering && slide(entering);
          if (entering && entering !== leaving && from && to) {
            // Motion uses native transforms. Seek the two real animations together
            // before the outgoing page unmounts, even on a busy test machine.
            from.pause(); to.pause();
            for (const elapsed of [0, 70, 140, 210, 280]) {
              from.currentTime = to.currentTime = elapsed;
              const oldPage = (leaving.getBoundingClientRect().x - x) / width;
              const newPage = (entering.getBoundingClientRect().x - x) / width;
              outgoing.push(oldPage);
              incoming.push(newPage);
              paired ||= Math.abs(oldPage) > .01 && Math.abs(newPage) > .01;
              stationary &&= bounds(shell) === frame && bounds(canvas) === scene;
              inert &&= leaving.inert && !entering.inert;
            }
            from.play(); to.play();
          } else if (performance.now() - start < 420) {
            requestAnimationFrame(sample);
            return;
          }
          resolve({incoming, outgoing, paired, stationary, inert});
        }
        requestAnimationFrame(sample);
      }, {once:true});
    }),
  }));
  try {
    await trigger.click();
    return await capture.evaluate(result => result.samples);
  } finally {
    await capture.dispose();
  }
}

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
    const first=active.getByRole('button',{name:/^CEC-\d+ · /}).first();
    if (width === 390) await drawer.screenshot({path:screenshotPath('mailbox-navigation-phone.png')});
    // Tapping a button in Safari can leave focus on the previous control.
    const forward = await sampleSlide(first);
    expect(forward).toMatchObject({stationary:true,inert:true,paired:true});
    expect(Math.min(...forward.outgoing)).toBeCloseTo(-.2, 1);
    expect(forward.incoming[0]).toBeGreaterThan(.2);
    expect(forward.incoming.at(-1)).toBeCloseTo(0, 1);
    const evidence=active.getByRole('button',{name:/^Evidence/});
    await evidence.scrollIntoViewIfNeeded();
    const offset=await active.evaluate(el=>el.scrollTop);
    await evidence.press('Enter');
    await expect(drawer.getByRole('heading',{name:'Evidence',exact:true}).first()).toBeFocused();
    await expect(active.locator('[data-qa-results]')).toBeVisible();
    await drawer.getByRole('button',{name:/^Back to /}).click();
    await expect(evidence).toBeFocused();
    expect(await active.evaluate(el=>el.scrollTop)).toBe(offset);
    await expect.poll(() => active.evaluate(el => el.getBoundingClientRect().x - el.parentElement!.getBoundingClientRect().x)).toBeCloseTo(0, 0);
    const reverse = await sampleSlide(drawer.getByRole('button',{name:'Back to PM mailbox'}));
    expect(reverse).toMatchObject({stationary:true,inert:true,paired:true});
    expect(Math.min(...reverse.incoming)).toBeCloseTo(-.2, 1);
    expect(reverse.incoming.at(-1)).toBeCloseTo(0, 1);
    expect(Math.max(...reverse.outgoing)).toBeGreaterThan(.2);
    await expect(first).toBeFocused();

    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    const backToMailbox = drawer.getByRole('button',{name:'Back to PM mailbox'});
    await expect(backToMailbox).toBeVisible();
    await backToMailbox.click();
    await expect(first).toBeFocused();
    await expect(backToMailbox).toHaveCount(0);
    await first.press('Enter');
    await evidence.press('Enter');
    await expect(drawer.getByRole('heading',{name:'Evidence',exact:true}).first()).toBeFocused();
    await drawer.getByRole('button',{name:/^Back to CEC-/}).evaluate(async button => {
      const back = button as HTMLButtonElement;
      back.click();
      await new Promise(requestAnimationFrame);
      back.click();
    });
    await expect(first).toBeFocused();
    await expect(backToMailbox).toHaveCount(0);
    await expect(drawer.locator('[data-drawer-page]:not([inert])')).toHaveCount(1);
    expect(await original!.evaluate(el=>el===document.querySelector('[data-inspector]'))).toBe(true);
    expect(await geometry(page)).toEqual(office);
    await page.keyboard.press('Escape');await expect(mailbox).toBeFocused();
  });
}
async function openTicketDiscussion(page: Page) {
  await page.goto('/');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  await page.getByRole('button',{name:/Already with the team/}).click();
  await page.locator('[data-inspector-scroll]').getByRole('button').first().click();
  const discuss=page.getByRole('button',{name:/^Discuss .* with /});
  await discuss.click();
  return { discuss, compose:page.getByRole('textbox',{name:'Message Morgan'}),
    back:page.getByRole('button',{name:/^Back to CEC-/}) };
}

test('a ticket conversation keeps typed and suggested drafts across live updates and Back',async({page,request})=>{
  const {discuss, compose, back} = await openTicketDiscussion(page);
  const suggestion = await compose.inputValue();
  expect(suggestion).not.toBe('');
  await compose.fill('Can you check the latest update?');
  await expect(page.getByRole('button',{name:'Pause office',exact:true})).toBeVisible();
  expect((await request.post('/__fixture/snapshot',{data:{paused:true}})).ok()).toBe(true);
  await expect(page.getByRole('button',{name:'Resume office',exact:true})).toBeVisible();
  await expect(compose).toHaveValue('Can you check the latest update?');
  await back.click();await expect(discuss).toBeFocused();
  await expect(page.locator('[data-drawer-page] textarea')).toHaveCount(0);
  await discuss.click();await expect(compose).toHaveValue('Can you check the latest update?');
  await page.getByRole('button',{name:'Use current suggestion'}).click();
  await expect(compose).toHaveValue(suggestion);
  await back.click();
  await expect(page.locator('[data-drawer-page] textarea')).toHaveCount(0);
  await discuss.click();await expect(compose).toHaveValue(suggestion);
});

test('a reopened chat keeps its pending send and retries a lost response with the same ID',async({page})=>{
  const submissions: { id:string; body:string }[] = [];
  let loseResponse!: () => void;
  const held = new Promise<void>(resolve => { loseResponse = resolve; });
  await page.route(/\/api\/messages(?:\?|$)/, async route => {
    submissions.push(route.request().postDataJSON());
    if (submissions.length === 1) {
      await route.fetch();
      await held;
      await route.abort();
      return;
    }
    await route.continue();
  });
  const {discuss, compose, back} = await openTicketDiscussion(page);
  const send = page.getByRole('button',{name:'Send message',exact:true});
  try {
    await compose.fill('Check the handoff');
    await send.click();
    await expect.poll(() => submissions.length).toBe(1);
    await back.click();
    await expect(page.locator('[data-drawer-page] textarea')).toHaveCount(0);
    await discuss.click();
    await expect(compose).toBeDisabled();
    await expect(page.getByRole('button',{name:'Sending…'})).toBeDisabled();
  } finally {
    loseResponse();
  }
  await expect(send).toBeEnabled();
  await back.click();
  await expect(page.locator('[data-drawer-page] textarea')).toHaveCount(0);
  await discuss.click();
  await expect(compose).toHaveValue('Check the handoff');
  await send.click();
  await expect(compose).toHaveValue('');
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toEqual(submissions[0]);
  await compose.fill('Check only the QA notes');
  await send.click();
  await expect(compose).toHaveValue('');
  expect(submissions).toHaveLength(3);
  expect(submissions[2].id).not.toBe(submissions[0].id);
  expect(submissions[2].body).toBe('Check only the QA notes');
});

test('an unsaved notification setting survives Back and a live update',async({page,request})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Office settings'}).click();
  await page.getByRole('button',{name:/Project settings/}).click();
  const notifications=page.getByRole('button',{name:'Notifications',exact:true});
  await notifications.click();
  const channel=page.getByRole('textbox',{name:'Channel name',exact:true});
  await channel.fill('delivery-updates-draft');
  await expect(page.getByRole('button',{name:'Pause office',exact:true})).toBeVisible();
  expect((await request.post('/__fixture/snapshot',{data:{paused:true}})).ok()).toBe(true);
  await expect(page.getByRole('button',{name:'Resume office',exact:true})).toBeVisible();
  await expect(channel).toHaveValue('delivery-updates-draft');
  await page.getByRole('button',{name:/^Back to /}).click();await expect(notifications).toBeFocused();
  await notifications.press('Enter');await expect(channel).toHaveValue('delivery-updates-draft');
});

test('a changed mailbox priority keeps the original Back target', async ({page,request}) => {
  const snapshot: OfficeSnapshot = await (await request.get('/api/office')).json();
  const [replacement, originalTicket] = snapshot.tickets;
  originalTicket.activity = 'blocked';
  const update = async () => {
    const response = await request.post('/__fixture/snapshot',{data:{tickets:snapshot.tickets}});
    expect(response.ok()).toBe(true);
  };
  await update();
  await page.goto('/');
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  const root = page.locator('[data-drawer-page="root"]');
  const originalRow = root.getByRole('button',{name:new RegExp('^' + originalTicket.key + ' ·')});
  const original = await originalRow.elementHandle();
  await originalRow.click();
  const evidence = page.getByRole('button',{name:/^Evidence/});
  await evidence.click();
  originalTicket.activity = 'working';
  replacement.activity = 'blocked';
  await update();
  await expect(root.locator('[data-drawer-row]').filter({hasText:replacement.summary})).toHaveCount(1);
  await page.getByRole('button',{name:'Back to ' + originalTicket.key}).click();
  await expect(evidence).toBeFocused();
  await page.getByRole('button',{name:'Back to PM mailbox'}).click();
  await expect(originalRow).toBeFocused();
  expect(await original!.evaluate(el => el === document.activeElement)).toBe(true);
  const priority = root.getByRole('heading',{name:'Needs attention'}).locator('..');
  await expect(priority.getByRole('button',{name:new RegExp('^' + replacement.key + ' ·')})).toBeVisible();

});

for (const [topic, empty] of [
  ['Ready for pickup', 'No assignments ready for pickup.'],
  ['Waiting for pickup', 'No assignments waiting for pickup.'],
  ['Already with the team', 'No tickets with the team.'],
] as const) {
  test(`${topic} stays open when its last ticket leaves`, async ({page,request}) => {
    const snapshot: OfficeSnapshot = await (await request.get('/api/office')).json();
    const {listener} = snapshot.coordination!;
    if (topic === 'Waiting for pickup') {
      listener.assigned[0].status = 'Backlog';
      expect((await request.post('/__fixture/snapshot',{data:{coordination:snapshot.coordination}})).ok()).toBe(true);
    }
    await page.goto('/');
    await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
    const row = page.getByRole('button',{name:topic + ' 1',exact:true});
    await row.click();
    const heading = page.locator('[data-inspector] > div > h2').filter({hasText:topic});
    await expect(heading).toBeFocused();
    if (topic === 'Already with the team') {
      for (const ticket of snapshot.tickets) ticket.stage = 'mailbox';
    } else {
      listener.assigned = [];
    }
    const response = await request.post('/__fixture/snapshot',{data:{tickets:snapshot.tickets, coordination:snapshot.coordination}});
    expect(response.ok()).toBe(true);
    await expect(page.getByText(empty,{exact:true})).toBeVisible();
    await expect(heading).toBeFocused();
    await page.getByRole('button',{name:'Back to PM mailbox'}).click();
    await expect(page.getByRole('button',{name:topic + ' 0',exact:true})).toBeFocused();
  });
}

test('phone settings topics form one aligned list', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Office settings'}).click();
  await page.getByRole('button',{name:/Project settings/}).click();
  const rows = page.locator('[data-inspector-scroll] [data-drawer-row]');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toBeInViewport();
  const boxes = await rows.evaluateAll(elements => elements.map(element => {
    const row = element.getBoundingClientRect();
    return {left:row.left,right:row.right,top:row.top,bottom:row.bottom,height:row.height,chevron:element.querySelector('svg')!.getBoundingClientRect().right};
  }));
  for (const [i,row] of boxes.entries()) {
    expect(row.height).toBeGreaterThanOrEqual(44);
    expect(row.left).toBeCloseTo(boxes[0].left);
    expect(row.right).toBeCloseTo(boxes[0].right);
    expect(row.chevron).toBeCloseTo(boxes[0].chevron);
    if (i) expect(row.top).toBeCloseTo(boxes[i-1].bottom);
  }
  await page.locator('[data-inspector]').screenshot({path:screenshotPath('settings-navigation-phone.png')});
});
