import { expect, test, type Page } from '@playwright/test';
import { evidence, fixtureMode } from './support';
// These two cases measure one accepted snapshot, not connection recovery (covered below).
// Pause before importing the app so startup/load time cannot advance its one-second clock.
async function fixedSnapshotClock(page: Page, state: any) {
  const at=new Date();state.serverTime=at.toISOString();state.serviceInstanceId='fixed-clock-fixture';state.snapshotSequence=1;
  for(const work of state.workLog||[])if(work.status==='running')work.lastHeartbeatAt=state.serverTime;
  await page.clock.install({time:at});await page.clock.pauseAt(new Date(at.getTime()+1000));
  await page.addInitScript(()=>{
    (window as any).__fixedClock={start:performance.now(),streams:[]};
    (window as any).EventSource=class {
      listeners:any={};onerror:any;constructor(){(window as any).__fixedClock.streams.push(this);}
      addEventListener(name:string,callback:any){this.listeners[name]=callback;}close(){}
    };
  });
  // Retries can only receive the identical sequence; opening a connection cannot reanchor it.
  await page.route('**/api/office**',route=>route.fulfill({json:state}));
  return async()=>{
    // Align the receipt with a shared-clock sample after the measured view has mounted.
    const phase=await page.evaluate(()=>performance.now()-(window as any).__fixedClock.start);
    await page.clock.runFor((1000-phase%1000)%1000);
    state.snapshotSequence++;
    await page.evaluate(data=>{const stream=(window as any).__fixedClock.streams.at(-1);stream.listeners.snapshot({data:JSON.stringify(data)});},state);
  };
}
test('Morgan and the Azure wall show worker, build, queue and job times separately (UI fixture)',async({page,request})=>{
  const state=await(await request.get('/api/office')).json(),now=new Date().toISOString();state.workLog=[{id:'synthetic-time',role:'developer',task:'Synthetic telemetry UI fixture',ticket:'CEC-999',stage:'implement',requestId:'fixture',sessionId:'fixture-session',provider:'claude',model:'claude-opus-5-5',effort:'medium',status:'completed',startedAt:now,lastHeartbeatAt:now,endedAt:now,elapsedMs:90000,queuedMs:10000,inputTokens:100,outputTokens:10,durationUncertain:false,reportedAt:now}];
  const build={id:999999,name:'Synthetic fixture build',status:'completed',result:'succeeded',commit:'a'.repeat(40),branch:'refs/pull/3/merge',url:'https://example.org/build/999999',durationMs:300000,queueMs:60000,observedAt:now,linkedTickets:['CEC-999'],relatedPrIds:[3],stages:[{id:'job-fixture',type:'Job',attempt:1,name:'Synthetic parallel job',state:'completed',result:'succeeded',issues:[],durationMs:240000}]};state.ciHistory=[build];state.azure.builds=[build];
  await page.route('**/api/office',r=>r.fulfill({json:state}));await page.route('**/api/events',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByRole('button',{name:'Visit Morgan, PM',exact:true}).click();const book=page.getByRole('region',{name:'Time reported to Morgan',exact:true});await expect(book).toContainText('1m 30s · 1 sessions');await expect(book).toContainText('5m 0s · 1 runs');await book.getByRole('combobox',{name:'Time report task'}).selectOption('CEC-999');await book.getByText('Worker sessions (1)',{exact:true}).click();await expect(book).toContainText('Reported to Morgan');await expect(book).toContainText('Synthetic telemetry UI fixture');await page.screenshot({path:evidence('pm-time-book-fixture.png')});
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Azure operations',exact:true}).click();await expect(page.locator('[data-pipeline-timing]').first()).toContainText('Build: 5m 0s');await page.getByText('Stages, jobs & tasks',{exact:true}).first().click();await expect(page.locator('[data-pipeline-timing]').first()).toContainText('Synthetic parallel job');await expect(page.locator('[data-pipeline-timing]').first()).toContainText('4m 0s');
});
test('the live time endpoint agrees with the persisted worker and build ledger',async({request})=>{
  test.skip(fixtureMode,'Backend contract: run against an isolated real server (OFFICE_TEST_BASE_URL)');
  const state=await(await request.get('/api/office')).json(),report=await(await request.get('/api/time')).json();expect(report.summary.workerRuns).toBe(state.workLog?.length||0);expect(report.summary.buildRuns).toBe(state.ciHistory?.length||0);expect(report.summary.workerMs).toBe((state.workLog||[]).reduce((n:number,w:any)=>n+w.elapsedMs,0));expect((await request.get('/api/time?ticket=not-a-ticket')).status()).toBe(400);
});
test('running clocks tick each second without new SSE and freeze on stale evidence (isolated fixture)',async({page,request})=>{
  test.skip(!fixtureMode,'Synthetic timing fixture only');
  await request.post('/__fixture/reset');
  const now=new Date().toISOString();
  const state=await(await request.get('/api/office')).json();
  const published=JSON.stringify(state.coordination?.time?.entries||[]);
  await request.post('/__fixture/snapshot?project=cec&push=0',{data:{workLog:[{id:'live-clock',role:'developer',task:'Live clock fixture',ticket:'CEC-999',stage:'implement',requestId:'fixture',sessionId:'fixture',provider:'fixture',model:'fixture',effort:'fixture',status:'running',startedAt:now,lastHeartbeatAt:now,endedAt:'',elapsedMs:58000,queuedMs:0,inputTokens:null,outputTokens:null,durationUncertain:false,reportedAt:''}]}});
  const fixed=await(await request.get('/api/office')).json();const anchor=await fixedSnapshotClock(page,fixed);
  await page.goto('/');await page.getByRole('button',{name:'Visit Morgan, PM',exact:true}).click();
  const book=page.getByRole('region',{name:'Time reported to Morgan',exact:true});await anchor();await expect(book).toContainText('58s · 1 sessions');
  await page.clock.runFor(2000);await expect(book).toContainText('1m 0s · 1 sessions');
  await page.clock.runFor(1000);await expect(book).toContainText('1m 1s · 1 sessions');
  await page.clock.runFor(33000);await expect(book).toContainText('Last confirmed measurements');await expect(book).toContainText('58s · 1 sessions');
  const actual=await(await request.get('/api/office')).json();expect(actual.workLog[0].elapsedMs).toBe(58000);expect(JSON.stringify(actual.coordination?.time?.entries||[])).toBe(published);
});

test('activity bubbles and agent details share the second clock and freeze without changing recorded time',async({page,request})=>{
  test.skip(!fixtureMode,'Synthetic timing fixture only');await request.post('/__fixture/reset');
  const state=await(await request.get('/api/office')).json(),now=new Date().toISOString();
  const developer=state.agents.find((agent:any)=>agent.id==='developer');developer.activity='working';developer.ticket='CEC-999';developer.task='CEC-999 · Building the fixture';
  const published=JSON.stringify(state.coordination.time.entries);
  await request.post('/__fixture/snapshot?project=cec&push=0',{data:{agents:state.agents,workLog:[{...state.workLog[0],id:'bubble-clock',role:'developer',task:'Live bubble clock',ticket:'CEC-999',stage:'implement',status:'running',startedAt:now,lastHeartbeatAt:now,endedAt:'',elapsedMs:58000}]}});
  await page.clock.install({time:new Date()});await page.goto('/');
  const bubble=page.locator('[data-task-bubble] [data-live-agent-task="developer"]');
  await expect(bubble).toBeVisible();
  // The 3D label can appear after the first clock tick. Pause once it is mounted,
  // then measure exact one-second increments from the same accepted snapshot.
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  await page.getByRole('button',{name:'Visit Alex, Developer',exact:true}).click();
  const detail=page.getByRole('complementary',{name:'Developer',exact:true}).locator('[data-live-agent-task="developer"]');
  const seconds=async(locator:typeof bubble)=>{const match=(await locator.innerText()).match(/(?:(\d+)h )?(?:(\d+)m )?(\d+)s elapsed/);if(!match)throw new Error('Missing elapsed clock');return Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]);};
  const initial=await seconds(bubble);expect(await seconds(detail)).toBe(initial);
  await page.clock.runFor(1000);expect(await seconds(bubble)).toBe(initial+1);expect(await seconds(detail)).toBe(initial+1);
  await page.clock.runFor(1000);expect(await seconds(bubble)).toBe(initial+2);expect(await seconds(detail)).toBe(initial+2);
  await page.clock.runFor(1000);expect(await seconds(bubble)).toBe(initial+3);expect(await seconds(detail)).toBe(initial+3);
  await page.clock.runFor(33000);await expect(detail).toContainText('58s elapsed · last confirmed');
  await page.clock.runFor(2000);await expect(detail).toContainText('58s elapsed · last confirmed');
  const actual=await(await request.get('/api/office')).json();expect(actual.workLog[0].elapsedMs).toBe(58000);expect(JSON.stringify(actual.coordination.time.entries)).toBe(published);
  expect(await(await request.get('/__fixture/writes')).json()).toEqual([]);
});

test('wake invalidates delayed HTTP and old stream callbacks before timers can restart',async({page,request})=>{
  test.skip(!fixtureMode,'Synthetic connection race only');
  await page.addInitScript(()=>{
    (window as any).__streams=[];
    (window as any).EventSource=class {
      listeners:any={};onerror:any;constructor(){(window as any).__streams.push(this);}
      addEventListener(name:string,callback:any){this.listeners[name]=callback;}
      close(){}
    };
  });
  const initial=await(await request.get('/api/office')).json();initial.serviceInstanceId='wake-instance';initial.snapshotSequence=1;initial.workLog=[];
  let hold=false;const pending:any[]=[];
  await page.route('**/api/office',async route=>{if(hold)pending.push(route);else await route.fulfill({json:initial});});
  await page.goto('/');await page.getByRole('button',{name:'Visit Morgan, PM',exact:true}).click();
  hold=true;await page.evaluate(()=>window.dispatchEvent(new Event('office-clock-gap')));await expect.poll(()=>pending.length).toBe(1);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>pending.length).toBe(2);
  const terminal={...initial,snapshotSequence:3,workLog:[{id:'wake-clock',role:'developer',task:'Terminal work',ticket:'CEC-999',stage:'implement',status:'completed',elapsedMs:61000,queuedMs:0,startedAt:initial.serverTime,lastHeartbeatAt:initial.serverTime,endedAt:initial.serverTime}]};
  await pending[1].fulfill({json:terminal});
  const book=page.getByRole('region',{name:'Time reported to Morgan',exact:true});await expect(book).toContainText('1m 1s · 1 sessions');
  const delayed={...terminal,snapshotSequence:100,workLog:[{...terminal.workLog[0],status:'running',elapsedMs:99000}]};
  await pending[0].fulfill({json:delayed});
  await page.evaluate(data=>{const old=(window as any).__streams.at(-2);old.listeners.snapshot({data:JSON.stringify(data)});old.onerror?.();},delayed);
  await expect(book).toContainText('1m 1s · 1 sessions');await expect(book).not.toContainText('1m 39s');
  await expect(page.getByText('Office disconnected',{exact:false})).toHaveCount(0);
});

test('Team Updates ticks the actual reconciliation worker without new snapshots while delivery stays blocked',async({page,request})=>{
 test.skip(!fixtureMode,'Synthetic timing fixture only');await request.post('/__fixture/reset');
 const state=await(await request.get('/api/office')).json(),now=new Date().toISOString();
 const sam=state.agents.find((agent:any)=>agent.id==='lead');Object.assign(sam,{activity:'working',ticket:'GH-67',task:'GH-67 · Working on your request · Inspecting project files'});
 const published=JSON.stringify(state.coordination.time.entries);
 await request.post('/__fixture/snapshot?project=cec&push=0',{data:{agents:state.agents,coordination:{...state.coordination,jobs:[{id:'blocked-delivery',key:'GH-67',stage:'implement',status:'blocked',requestedAt:now,updatedAt:now,detail:'Candidate awaits saved-execution reconciliation',head:'a'.repeat(40),worktree:'/fixture/owned-worktree',branch:'fixture-67',pr:0,prUrl:'',steps:[]}]},workLog:[{id:'team-updates-clock',role:'lead',task:'Saved implementation audit',ticket:'GH-67',stage:'implementation-readback',requestId:'audit-request',sessionId:'fixture',provider:'fixture',model:'fixture',effort:'fixture',status:'running',startedAt:now,lastHeartbeatAt:now,endedAt:'',elapsedMs:58000,queuedMs:0,inputTokens:null,outputTokens:null,durationUncertain:false,reportedAt:''}]}});
 const fixed=await(await request.get('/api/office')).json();const anchor=await fixedSnapshotClock(page,fixed);await page.goto('/');
 const updates=page.getByRole('region',{name:/Team updates/});
 await expect(updates).toContainText('Delivery blocked · Sam reconciles saved work');await expect(updates).toContainText('Sam: Reconciling saved implementation');await anchor();
 await expect(updates).toContainText('58s elapsed');
 await page.clock.runFor(2000);await expect(updates).toContainText('1m 0s elapsed');
 await page.clock.runFor(1000);await expect(updates).toContainText('1m 1s elapsed');
 await expect(updates).toContainText('Delivery awaits Sam’s reconciliation result');
 await page.clock.runFor(33000);await expect(updates).toContainText('58s elapsed · last confirmed');await page.clock.runFor(2000);await expect(updates).toContainText('58s elapsed · last confirmed');
 const saved=await(await request.get('/api/office')).json();expect(saved.workLog[0].elapsedMs).toBe(58000);expect(JSON.stringify(saved.coordination.time.entries)).toBe(published);expect(await(await request.get('/__fixture/writes')).json()).toEqual([]);
});
