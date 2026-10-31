import { expect, test } from '@playwright/test';
import { evidence } from './support';
test('living office renders, opens contextual rooms and supports keyboard navigation',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible({timeout:30000});
  const labels=await page.locator('[data-scene-label=agent]:visible,[data-scene-label=room]:visible,[data-scene-label=mail]:visible').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));
  expect(labels.every(width=>width>10&&width<250)).toBe(true);
  await page.waitForTimeout(2000);await page.screenshot({path:evidence('office-overview.png')});
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  await expect(page.getByRole('complementary',{name:'PM mailbox'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Check mail now'})).toBeVisible();
  await page.screenshot({path:evidence('office-mailbox.png')});
  await page.keyboard.press('Escape');await expect(page.getByRole('complementary')).toHaveCount(0);
  await page.keyboard.press('m');await expect(page.getByRole('complementary',{name:'PM mailbox'})).toBeVisible();
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Visit Riley, QA'}).click();
  await expect(page.getByRole('heading',{name:'Riley',exact:true})).toBeVisible();
  const qa=(await(await page.request.get('/api/office')).json()).agents.find((a:any)=>a.id==='qa');
  await expect(page.locator('[data-panel-foot]')).toContainText(qa.sessionId||'No session running');
  expect(errors).toEqual([]);
});
test('explicit tour is local, animated, and cannot execute real ticket actions',async({page})=>{
  // Hold automatic tour progression while exercising its manual controls.
  await page.addInitScript(()=>{const interval=window.setInterval;window.setInterval=((handler:TimerHandler,delay?:number,...args:any[])=>interval(delay===6500?()=>{}:handler,delay,...args)) as typeof window.setInterval;});
  const writes:string[]=[];page.on('request',r=>{if(r.method()==='POST')writes.push(r.url());});
  await page.goto('/');await page.getByRole('button',{name:'Tour the office'}).click();
  await expect(page.getByText('Illustrative animation. No real work is running.')).toBeVisible();
  await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  await expect(page.getByRole('button',{name:'Check mail now'})).toBeDisabled();
  await page.getByRole('complementary',{name:'PM mailbox',exact:true}).getByRole('button',{name:/^DEMO-01/}).click();
  await expect(page.getByRole('heading',{name:'Make the save confirmation accessible'})).toBeVisible();
  await expect(page.getByText('This is an illustrative ticket. No Jira, code, browser or Azure action is running.')).toBeVisible();
  expect(writes).toEqual([]);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('button',{name:'Next step'}).click();await expect(page.locator('[data-work-packet]').first()).toBeVisible();await page.screenshot({path:evidence('office-tour.png')});
  await page.getByRole('button',{name:'Back to live'}).click();await expect(page.getByText('ILLUSTRATIVE TOUR',{exact:true})).toHaveCount(0);
});
test('settings persist and keyboard focus is visible',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Office settings'}).click();
  await page.getByLabel('Reduced motion').check();await page.getByLabel('Graphics').selectOption('low');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
  await page.getByRole('button',{name:'Office settings'}).click();await expect(page.getByLabel('Graphics')).toHaveValue('low');await expect(page.getByLabel('Reduced motion')).toBeChecked();
  await page.keyboard.press('Escape');await page.keyboard.press('m');await expect(page.getByRole('button',{name:'Close details'})).toBeFocused();
});
test('compact viewport keeps the office and contextual controls usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('complementary',{name:'PM mailbox'})).toBeVisible();
  await page.screenshot({path:evidence('office-mobile.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('shows connection loss and reconnects without inventing worker activity',async({page,context})=>{
  await page.goto('/');await expect(page.getByText('OFFICE LIVE',{exact:true})).toBeVisible();
  await context.setOffline(true);await expect(page.getByText('RECONNECTING',{exact:true})).toBeVisible({timeout:20000});
  await context.setOffline(false);await expect(page.getByText('OFFICE LIVE',{exact:true})).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'Azure operations',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Azure pipelines'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Running environments'})).toBeVisible();
});
test('human outbox and PM conversation are accessible and preserve ticket context',async({page,request})=>{
  const state=await(await request.get('/api/office')).json();
  state.serverTime=new Date().toISOString();state.messages=[];
  state.outbox=[{id:'ticket:CEC-999:qa',title:'CEC-999 needs your help',detail:'Synthetic browser fixture: lower-environment access is blocked.',role:'qa',ticket:'CEC-999',url:'https://example.org/CEC-999',status:'open',createdAt:state.serverTime,updatedAt:state.serverTime}];
  state.tickets=[{key:'CEC-999',summary:'Browser interaction fixture',type:'Bug',status:'QA',stage:'qa',activity:'blocked',blocker:'Synthetic access blocker',results:{},findings:[],evidence:[],pilot:true}];
  const writes:any[]=[];
  await page.route('**/api/office',route=>{state.snapshotSequence++;return route.fulfill({json:state});});
  await page.route('**/api/events',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
  await page.route('**/api/messages',async route=>{const data=route.request().postDataJSON();writes.push(data);state.messages.push({...data,requestId:data.id,from:'human',to:'pm',status:'queued',createdAt:state.serverTime,sessionId:'',recipients:[],receipts:[],error:''});await route.fulfill({status:202,json:{accepted:true,id:data.id}});});
  await page.goto('/');await page.getByRole('button',{name:/^Open your outbox,/}).click();
  await expect(page.getByRole('complementary',{name:'Your outbox'})).toBeVisible();await page.getByRole('button',{name:/CEC-999 needs your help/}).click();
  await page.getByRole('textbox',{name:'Message Morgan'}).fill('Synthetic test reply: please recheck access.');await page.getByRole('button',{name:'Send & recheck',exact:true}).click();
  await expect(page.getByText('Queued · waiting for a free desk')).toBeVisible();expect(writes).toHaveLength(1);expect(writes[0]).toMatchObject({role:'pm',ticket:'CEC-999',actionId:'ticket:CEC-999:qa',recheck:true});
  await expect(page.getByText('Needs follow-up',{exact:true})).toBeVisible();await page.screenshot({path:evidence('office-outbox-fixture.png')});
  await page.keyboard.press('Escape');await page.keyboard.press('c');await expect(page.getByRole('heading',{name:'Chat with Morgan',exact:true})).toBeVisible();
  await page.getByLabel('Conversation topic',{exact:true}).selectOption('CEC-999');await expect(page.getByText('Synthetic test reply: please recheck access.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Message Morgan'}).fill('Please tell QA about this requirement.');await page.getByRole('button',{name:'Send message',exact:true}).click();expect(writes).toHaveLength(2);expect(writes[1]).toMatchObject({ticket:'CEC-999',actionId:'',recheck:false});
});
test('chat stays usable on a narrow screen and in the illustrative tour',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();await expect(page.getByRole('textbox',{name:'Message Morgan'})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tour the office'}).click();await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();await expect(page.getByRole('textbox',{name:'Message Morgan'})).toBeDisabled();await expect(page.getByRole('button',{name:'Send message',exact:true})).toBeDisabled();
});
test('PM chat displays the persisted conversation and project notes from the service',async({page,request})=>{
  const state=await(await request.get('/api/office')).json(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();await expect(page.getByRole('heading',{name:'Chat with Morgan',exact:true})).toBeVisible();
  const officeMessages=state.messages.filter((m:any)=>!m.ticket);if(officeMessages.length){await expect(page.locator('[data-chat-message]')).toHaveCount(officeMessages.length);await expect(page.getByRole('log',{name:'Team conversation'})).toContainText(officeMessages.at(-1).body);}
  if(state.projectNotes?.some((n:any)=>!n.ticket)){await page.getByText('Project notes',{exact:true}).click();await expect(page.locator('[data-project-notes]')).toContainText(state.projectNotes.filter((n:any)=>!n.ticket).at(-1).summary);}
  await expect(page.getByRole('textbox',{name:'Message Morgan'})).toBeInViewport();await page.screenshot({path:evidence('office-chat.png')});expect(errors).toEqual([]);
});
