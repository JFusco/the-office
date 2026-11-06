import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixture-test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { evidence } from './support';
// Automated WCAG 2.2 AA audit of representative states. Canvas pixels are outside axe's
// reach; canvas text contrast and translucent overlays are checked manually (see IMPLEMENTATION.md).
const TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
// These pairs share selection handlers in OfficeScene and App. A category alone is
// never an exemption: the actual equivalent must be visible and >=24px (including controls reached by dock scrolling).
async function equivalentTarget(page:Page,target:string,failedTargets:string[]){
  return page.evaluate(({selector,failedTargets})=>{
    const source=document.querySelector<HTMLElement>(selector);
    if(!source)return null;
    const kind=source.dataset.sceneLabel,name=source.getAttribute('aria-label')||source.textContent?.trim()||'';
    const buttons=[...document.querySelectorAll<HTMLButtonElement>('footer button[aria-label]')];
    let equivalent:HTMLButtonElement|undefined;
    if(kind==='agent')equivalent=buttons.find(button=>button.getAttribute('aria-label')?.startsWith(`Visit ${name.split(',')[0]}, `));
    if(kind==='mail'){
      const prefix=name.startsWith('PM mailbox,')?'Open PM mailbox,':name.startsWith('Your outbox,')?'Open your outbox,':name.startsWith('PROJECT GOALS')?'Open project goals & ideas,':undefined;
      if(prefix)equivalent=buttons.find(button=>button.getAttribute('aria-label')?.startsWith(prefix));
    }
    if(kind==='room'){
      const rooms:[string,string][]=[['DEVELOPMENT','Developer'],['DEV LEAD','Dev lead'],['QA','QA'],['PROJECT MANAGEMENT','PM'],['CTO OFFICE','Goals & priorities (CTO)']];
      const role=rooms.find(([label])=>name.startsWith(label+' '))?.[1]||(name.includes(' · IT SUPPORT ')?'IT specialist':undefined);
      if(role)equivalent=buttons.find(button=>button.getAttribute('aria-label')?.endsWith(', '+role));
      if(name.includes(' · KNOWLEDGE '))equivalent=buttons.find(button=>/^Visit .+, knowledge engineer, /.test(button.getAttribute('aria-label')||''));
      if(name.startsWith('IDEAS & POSSIBILITIES ')||name.startsWith('DELIVERY REPORTS '))equivalent=buttons.find(button=>button.getAttribute('aria-label')?.startsWith('Open project goals & ideas,'));
    }
    if(!equivalent||equivalent.disabled||!equivalent.checkVisibility({visibilityProperty:true}))return null;
    const box=equivalent.getBoundingClientRect();
    if(box.width<24||box.height<24||failedTargets.some(target=>equivalent!.matches(target)))return null;
    return {target:selector,source:name,equivalent:equivalent.getAttribute('aria-label'),width:box.width,height:box.height,reason:'Same selection handler; visible equivalent target is at least 24 by 24 CSS pixels and has no axe target-size violation'};
  },{selector:target,failedTargets});
}
async function audit(page:Page,name:string){
  const result=await new AxeBuilder({page}).withTags(TAGS).analyze();
  const originalTargetSize=structuredClone(result.violations.filter(v=>v.id==='target-size'));
  const failedTargets=originalTargetSize.flatMap(v=>v.nodes.flatMap(n=>n.target.length===1&&typeof n.target[0]==='string'?[n.target[0]]:[]));
  const exemptions:NonNullable<Awaited<ReturnType<typeof equivalentTarget>>>[]=[];
  for(const violation of result.violations)if(violation.id==='target-size'){
    const remaining:typeof violation.nodes=[];
    for(const node of violation.nodes){
      const match=node.target.length===1&&typeof node.target[0]==='string'?await equivalentTarget(page,node.target[0],failedTargets):null;
      if(match)exemptions.push(match);else remaining.push(node);
    }
    violation.nodes=remaining;
  }
  result.violations=result.violations.filter(v=>v.nodes.length);
  const path=evidence(`axe/${name}.json`);mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify({violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),exceptedTargetSize:exemptions.map(e=>e.target),targetSizeExemptions:exemptions,originalTargetSize},null,1));
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
  await page.getByRole('button',{name:/^PM queue \d+:/}).click();await expect(page.getByRole('complementary')).toBeVisible();await audit(page,'drawer-pm-queue');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await page.getByRole('button',{name:/CEC-102/}).first().click();
  await expect(page.getByRole('heading',{name:'Delivery path'})).toBeVisible();await audit(page,'drawer-ticket');
});
test('GitHub project, CTO floor and popovers pass the WCAG 2.2 AA audit',async({page})=>{
  await ready(page);await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();await expect(page.getByRole('heading',{name:'GitHub & Actions'})).toBeVisible();await audit(page,'drawer-github');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await expect(page.getByRole('heading',{level:1,name:'CTO Office'})).toBeVisible();await audit(page,'cto-floor');
  await page.getByRole('button',{name:/^Open project goals/}).click();await expect(page.getByRole('complementary')).toBeVisible();await audit(page,'drawer-goals');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Office settings',exact:true}).click();await expect(page.getByRole('complementary',{name:'Settings'})).toBeVisible();await expect(page.locator('[data-office-config]')).toBeVisible();await audit(page,'settings');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Office help',exact:true}).click();await expect(page.getByRole('dialog',{name:'Office controls'})).toBeVisible();await audit(page,'help');await page.keyboard.press('Escape');
});
test('loading and error states pass the WCAG 2.2 AA audit',async({page})=>{
  let release!:()=>void;const held=new Promise<void>(r=>{release=r;});
  await page.route('**/api/events*',route=>route.abort());
  await page.route('**/api/office*',async route=>{await held;await route.fulfill({status:503,json:{error:'Fixture: office unavailable'}});});
  await page.goto('/');await expect(page.getByText('Connecting to your local office…')).toBeVisible();await audit(page,'state-loading');
  release();await expect(page.getByText(/Office returned 503/)).toBeVisible();await audit(page,'state-error');
});
