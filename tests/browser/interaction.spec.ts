import { expect, test, type Locator, type Page } from '@playwright/test';
import { evidence } from './support';
const full=async(page:Page)=>{await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>{localStorage.setItem('office.motion','full');localStorage.setItem('office.quality','low');localStorage.setItem('office.floor','delivery');});};
const ready=async(page:Page)=>{await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible({timeout:30000});};
const look=(l:Locator)=>l.evaluate(el=>{const s=getComputedStyle(el);return {property:s.transitionProperty,duration:s.transitionDuration,paint:[s.backgroundColor,s.color,s.borderColor,s.outlineColor,s.textDecorationColor,s.filter].join('|')};});
// Every enabled control in view: links, buttons, form fields, summaries and scene labels.
const CONTROLS='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary';

test('every visible enabled control has a scoped 150ms hover/focus transition',async({page})=>{
  await full(page);await ready(page);
  const check=async(label:string)=>{
    const bad=await page.evaluate(selector=>[...document.querySelectorAll<HTMLElement>(selector)].filter(el=>el.checkVisibility({visibilityProperty:true})).map(el=>{const s=getComputedStyle(el);return {name:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,40)||el.tagName,property:s.transitionProperty,duration:s.transitionDuration};}).filter(t=>t.property==='all'||t.property==='none'||!t.duration.split(',').some(d=>d.trim()==='0.15s')),CONTROLS);
    expect(bad,label).toEqual([]);
  };
  await check('overview');
  for(const button of ['Open PM mailbox','Open your outbox','Chat with Morgan','Azure operations']){await page.getByRole('button',{name:new RegExp(`^${button}`)}).click();await expect(page.getByRole('complementary')).toBeVisible();await check(button);await page.keyboard.press('Escape');}
  await page.getByRole('button',{name:'Office settings'}).click();await check('settings');
});
test('representative controls visibly change on hover and show a keyboard focus ring',async({page})=>{
  await full(page);await ready(page);
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  const drawer=page.getByRole('complementary',{name:'PM mailbox'});
  const targets:[string,Locator][]=[['icon button',page.getByRole('button',{name:'Office help'})],['dock button',page.getByRole('button',{name:/^Open your outbox,/})],['scene label',page.getByRole('button',{name:'DEVELOPMENT Implementation'})],
    ['project select',page.getByLabel('Office project')],['link',page.getByRole('link',{name:'Open board: CEC Jira board'})],['secondary button',drawer.getByRole('button',{name:'Save pickup rule'})],['summary',drawer.getByText('To Do · 1',{exact:true})],['text field',drawer.getByRole('combobox',{name:'Pickup status'})]];
  for(const [name,target] of targets){
    await target.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(200);const before=await look(target);
    expect(before.duration,name).toContain('0.15s');
    await target.hover();await page.waitForTimeout(250);expect((await look(target)).paint,`${name} hover`).not.toBe(before.paint);
  }
  await page.keyboard.press('Escape');await page.mouse.move(0,0);
  await page.getByRole('button',{name:'Office help'}).focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
  const ring=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement!);return {style:s.outlineStyle,width:s.outlineWidth,visible:document.activeElement!.matches(':focus-visible')};});
  expect(ring).toEqual({style:'solid',width:'3px',visible:true});
});
test('system and Office reduced motion both remove transitions',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>localStorage.setItem('office.motion','full'));await ready(page);
  expect((await look(page.getByRole('button',{name:'Office help'}))).property).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>localStorage.setItem('office.motion','reduced'));await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
  expect((await look(page.getByRole('button',{name:'Office help'}))).property).toBe('none');
  await page.getByRole('button',{name:'Office settings'}).click();await page.getByLabel('Reduced motion').uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-motion','full');expect((await look(page.getByRole('button',{name:'Office help'}))).property).not.toBe('none');
});
test('settings and help are named non-modal panels that take and return focus',async({page})=>{
  await ready(page);
  for(const [trigger,title,close] of [['Office settings','Display settings','Close settings'],['Office help','Office controls','Close help']] as const){
    await page.getByRole('button',{name:trigger}).click();const panel=page.getByRole('dialog',{name:title});
    await expect(panel).toBeVisible();await expect(panel).not.toHaveAttribute('aria-modal');await expect(page.getByRole('button',{name:trigger})).toHaveAttribute('aria-expanded','true');
    await expect(page.getByRole('button',{name:close})).toBeFocused();
    await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(page.getByRole('button',{name:trigger})).toBeFocused();
    await page.getByRole('button',{name:trigger}).click();await page.getByRole('button',{name:close}).click();await expect(page.getByRole('button',{name:trigger})).toBeFocused();
  }
  await expect(page.locator('[aria-modal]')).toHaveCount(0);
});
test('semantic landmarks, headings, buttons and decorative icons',async({page})=>{
  await ready(page);
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  for(const role of ['banner','main','contentinfo'] as const)await expect(page.getByRole(role)).toHaveCount(1);
  await expect(page.getByRole('navigation',{name:'Office floors'})).toBeVisible();await expect(page.getByRole('region',{name:'Interactive isometric office'})).toBeVisible();
  await expect(page.getByRole('button',{name:'The office, CTO / Delivery: return to office overview'})).toBeVisible();await expect(page.locator('a[href="#"]')).toHaveCount(0);
  expect(await page.locator('svg:not([aria-hidden="true"])').count()).toBe(0);
  expect(await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').count()).toBe(0);
  // Canvas actions have keyboard-reachable HTML equivalents.
  for(const name of [/^PM mailbox,/,/^Your outbox,/,'Review table and team handoffs','DEVELOPMENT Implementation','QA Browser testing','Azure operations',/^Morgan, idle, Project manager/])await expect(page.getByRole('button',{name}).first()).toBeVisible();
  await page.getByRole('button',{name:'Visit Morgan, PM',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary',{name:'Project manager'})).toBeVisible();await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Visit Morgan, PM',exact:true})).toBeFocused();
});
test('hidden floor and travelling scene controls are not focusable',async({page})=>{
  await full(page);await ready(page);
  const reachable=()=>page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('[data-scene-label]')].filter(el=>{el.focus();return document.activeElement===el;}).map(el=>el.textContent));
  const delivery=await reachable();expect(delivery.some(t=>t?.includes('CTO OFFICE'))).toBe(false);expect(delivery.some(t=>t?.includes('DEVELOPMENT'))).toBe(true);
  // Sample focusability in the same frame the doors report the brief `closed` phase.
  const closed=await page.evaluate(async()=>{
    const doors=document.querySelector<HTMLElement>('[data-elevator-doors]')!;[...document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Office floors"] button')][0].click();
    const until=performance.now()+8000;while(doors.dataset.phase!=='closed'&&performance.now()<until)await new Promise(requestAnimationFrame);
    return {phase:doors.dataset.phase,reachable:[...document.querySelectorAll<HTMLElement>('[data-scene-label]')].filter(el=>{el.focus();return document.activeElement===el;}).length};
  });
  expect(closed).toEqual({phase:'closed',reachable:0});
  await expect(page.locator('[data-elevator-doors]')).toHaveAttribute('data-phase','idle',{timeout:10000});
  const cto=await reachable();expect(cto.some(t=>t?.includes('CTO OFFICE'))).toBe(true);expect(cto.some(t=>t?.includes('DEVELOPMENT'))).toBe(false);
});
test('reflows at 320px and 200% zoom without horizontal scrolling',async({page})=>{
  for(const viewport of [{width:320,height:640},{width:720,height:500}]){
    await page.setViewportSize(viewport);await ready(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    // Every header control stays fully on screen; the dock scrolls rather than clipping its controls.
    expect(await page.locator('header').locator('a,button,select').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth);}).map(el=>el.getAttribute('aria-label')))).toEqual([]);
    expect(await page.locator('footer').evaluate(el=>el.scrollWidth<=el.clientWidth||getComputedStyle(el).overflowX==='auto')).toBe(true);
    expect(await page.locator('header').evaluate(header=>{const boxes=[...header.querySelectorAll('a,button,select')].map(el=>el.getBoundingClientRect()).filter(r=>r.width>0).sort((a,b)=>a.left-b.left);return boxes.some((r,i)=>i>0&&r.left<boxes[i-1].right-0.5);})).toBe(false);
    await page.getByRole('button',{name:/^Pause office|^Resume office/}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:/^Pause office|^Resume office/})).toBeInViewport();
    await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('button',{name:'Close details'})).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:evidence(`reflow-${viewport.width}.png`)});
  }
});
test('forced colors restore system select chrome and keep focus visible',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});await ready(page);
  const select=page.getByLabel('Office project');await expect(select).toHaveCSS('appearance','auto');
  await expect(select.locator('xpath=following-sibling::*[local-name()="svg"]')).toBeHidden();
  await page.getByRole('button',{name:'Office help'}).focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>getComputedStyle(document.activeElement!).outlineStyle)).toBe('solid');
  await page.screenshot({path:evidence('forced-colors.png')});
});
