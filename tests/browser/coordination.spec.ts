import {test,expect} from '@playwright/test';
import { evidence, fixtureMode } from './support';
// The settings test writes through the API; restore the in-memory fixture afterwards.
test.afterEach(async({request})=>{if(fixtureMode)await request.post('/__fixture/reset');});
test('project pickup, Slack and time settings save through the real API and survive reload',async({page,request})=>{
 // Run against the isolated OFFICE_NO_POLL fixture server only. These settings
 // never authorize an external send or worker in this disabled coordination state.
 const initial=await(await request.get('/api/office?project=brain')).json();
 test.skip(initial.coordination?.enabled!==false,'Requires dispatch-disabled isolated server');
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
 await page.getByRole('combobox',{name:'Pickup status',exact:true}).fill('Approved');await page.getByRole('button',{name:'Save pickup rule',exact:true}).click();
 await expect.poll(async()=> (await(await request.get('/api/office?project=brain')).json()).coordination.pickup.status).toBe('Approved');
 await page.getByLabel('Slack workspace',{exact:true}).fill('Fixture workspace');await page.getByLabel('Notify people when a watched PR merges',{exact:true}).check();await page.getByRole('button',{name:'Save Slack notifications',exact:true}).click();
 await expect.poll(async()=> (await(await request.get('/api/office?project=brain')).json()).coordination.notices.policy.workspace).toBe('Fixture workspace');
 await page.getByLabel('Log measured Office work as my time',{exact:true}).uncheck();await page.getByRole('button',{name:'Save time settings',exact:true}).click();
 await expect.poll(async()=> (await(await request.get('/api/office?project=brain')).json()).coordination.time.enabled).toBe(false);
 await page.reload();await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('combobox',{name:'Pickup status',exact:true})).toHaveValue('Approved');await expect(page.getByLabel('Slack workspace',{exact:true})).toHaveValue('Fixture workspace');await expect(page.getByLabel('Log measured Office work as my time',{exact:true})).not.toBeChecked();
 const cec=await(await request.get('/api/office?project=cec')).json();expect(cec.coordination?.pickup?.status).not.toBe('Approved');
 await page.screenshot({path:evidence('office-coordination-settings.png')});
});
test('activity bubbles change with snapshots and disappear when the worker is idle (UI fixture)',async({page,request})=>{
 const snapshot=await(await request.get('/api/office?project=cec')).json();const agent=snapshot.agents.find((a:any)=>a.id==='pm');agent.activity='working';agent.ticket='CEC-999';agent.task='CEC-999 · Reading ticket details';let current=snapshot;
 await page.route('**/api/office*',r=>r.fulfill({json:current}));
 await page.addInitScript(()=>{
  class FixtureEvents extends EventTarget{static instances:FixtureEvents[]=[];constructor(_url:string){super();FixtureEvents.instances.push(this);}close(){}onopen:any;onerror:any;}
  (window as any).EventSource=FixtureEvents;(window as any).emitSnapshot=(s:any)=>FixtureEvents.instances.forEach(e=>e.dispatchEvent(new MessageEvent('snapshot',{data:JSON.stringify(s)})));
 });
 await page.goto('/');await page.getByLabel('Office project').selectOption('cec');snapshot.snapshotSequence++;await page.evaluate(s=>(window as any).emitSnapshot(s),snapshot);await expect(page.getByRole('status',{name:'Morgan activity',exact:true})).toContainText('Reading ticket details');
 agent.task='CEC-999 · Checking build results';snapshot.snapshotSequence++;await page.evaluate(s=>(window as any).emitSnapshot(s),snapshot);await expect(page.getByRole('status',{name:'Morgan activity',exact:true})).toContainText('Checking build results');
 await page.screenshot({path:evidence('office-live-activity-bubble.png')});
 agent.activity='idle';agent.task='Ready for the next handoff';snapshot.snapshotSequence++;await page.evaluate(s=>(window as any).emitSnapshot(s),snapshot);await expect(page.getByRole('status',{name:'Morgan activity',exact:true})).toHaveCount(0);
});
test('manual Start from an assigned Backlog issue queues a project-scoped request (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.serverTime=new Date().toISOString();const ticket={...state.tickets[0],key:'GH-999',summary:'Synthetic assigned backlog issue',status:'open',stage:'mailbox',pilot:false,blocker:'',assignee:'JFusco',url:'https://github.com/JFusco/brain/issues/999'};state.tickets=[ticket];state.deliveryQueue=[];state.coordination.jobs=[];state.coordination.listener.assigned=[{...ticket,pickupStatus:'Backlog'}];state.coordination.listener.reviews=[];state.pmQueue=[];state.teamQueue=[];state.github.board={...state.github.board,lanes:['Backlog'],items:[{id:'fixture',repository:'JFusco/brain',number:999,title:ticket.summary,status:'Backlog',state:'OPEN'}]};
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));let submitted:any;
 await page.route('**/api/commands?project=brain',async r=>{submitted=r.request().postDataJSON();await r.fulfill({status:202,json:{accepted:true}});});
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await page.getByText('Backlog · 1',{exact:true}).click();await page.getByRole('button').filter({hasText:'Synthetic assigned backlog issue'}).first().click();await expect(page.getByRole('button',{name:'Start ticket',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Start ticket',exact:true}).click();expect(submitted).toEqual({action:'start-assigned',key:'GH-999'});
});
