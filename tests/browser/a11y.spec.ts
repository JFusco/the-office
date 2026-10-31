import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { evidence } from './support';
// Automated WCAG 2.2 AA audit of representative states. Canvas pixels are outside axe's
// reach; canvas text contrast and translucent overlays are checked manually (see IMPLEMENTATION.md).
const TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
// WCAG 2.5.8 "Equivalent" exception: scene labels can overlap at narrow widths, and these have
// keyboard-reachable equivalents (dock mailbox/outbox, roster). The review table label has none and stays enforced.
const EQUIVALENT_TARGET=/data-scene-label="(mail|agent|room)"/;
async function audit(page:Page,name:string){
  await page.waitForTimeout(400);
  const result=await new AxeBuilder({page}).withTags(TAGS).analyze();
  const excepted=result.violations.filter(v=>v.id==='target-size').flatMap(v=>v.nodes.filter(n=>EQUIVALENT_TARGET.test(n.html)).map(n=>n.target.join(' ')));
  for(const v of result.violations)if(v.id==='target-size')v.nodes=v.nodes.filter(n=>!EQUIVALENT_TARGET.test(n.html));
  result.violations=result.violations.filter(v=>v.nodes.length);
  const path=evidence(`axe/${name}.json`);mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify({violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),exceptedTargetSize:excepted},null,1));
  expect.soft(result.violations.map(v=>`${v.id}: ${v.nodes.map(n=>n.target.join(' ')).join(' | ')}`)).toEqual([]);
}
async function ready(page:Page){await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible({timeout:30000});}
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test(`office overview passes the WCAG 2.2 AA audit at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);await ready(page);await audit(page,`overview-${viewport.width}`);
  });
}
test('delivery drawers pass the WCAG 2.2 AA audit',async({page})=>{
  await ready(page);
  for(const [button,name] of [['Open PM mailbox','mailbox'],['Open your outbox','outbox'],['Chat with Morgan','chat'],['Azure operations','azure'],['Service health','health'],['Visit Riley, QA','agent']] as const){
    await page.getByRole('button',{name:new RegExp(`^${button}`)}).click();await expect(page.getByRole('complementary')).toBeVisible();
    if(name==='outbox')await page.getByRole('button',{name:/CEC-102 needs a test account/}).click();
    await audit(page,`drawer-${name}`);await page.keyboard.press('Escape');await expect(page.getByRole('complementary')).toHaveCount(0);
  }
  await page.getByRole('button',{name:/^PM queue \d+:/}).click();await audit(page,'drawer-pm-queue');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await page.getByRole('button',{name:/CEC-102/}).first().click();
  await expect(page.getByRole('heading',{name:'Delivery path'})).toBeVisible();await audit(page,'drawer-ticket');
});
test('GitHub project, CTO floor and popovers pass the WCAG 2.2 AA audit',async({page})=>{
  await ready(page);await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();await expect(page.getByRole('heading',{name:'GitHub & Actions'})).toBeVisible();await audit(page,'drawer-github');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await expect(page.getByRole('heading',{level:1,name:'CTO Office'})).toBeVisible();await audit(page,'cto-floor');
  await page.getByRole('button',{name:/^Open project goals/}).click();await audit(page,'drawer-goals');await page.keyboard.press('Escape');
  for(const [button,name] of [['Office settings','settings'],['Office help','help']] as const){await page.getByRole('button',{name:button,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await audit(page,name);await page.keyboard.press('Escape');}
});
test('loading and error states pass the WCAG 2.2 AA audit',async({page})=>{
  let release!:()=>void;const held=new Promise<void>(r=>{release=r;});
  await page.route('**/api/events*',route=>route.abort());
  await page.route('**/api/office*',async route=>{await held;await route.fulfill({status:503,json:{error:'Fixture: office unavailable'}});});
  await page.goto('/');await expect(page.getByText('Connecting to your local office…')).toBeVisible();await audit(page,'state-loading');
  release();await expect(page.getByText(/Office returned 503/)).toBeVisible();await audit(page,'state-error');
});
