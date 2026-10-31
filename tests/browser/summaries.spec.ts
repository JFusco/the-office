import {test,expect} from '@playwright/test';
import { evidence } from './support';
test('outbox shows an explicit action and keeps evidence collapsed; mailbox counts queued reviews (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();
 state.outbox=[{id:'ticket-job:fixture',title:'GH-264 delivery needs follow-up',detail:'PR #270 is waiting for its parent PR.\nExact technical evidence: '+ 'a'.repeat(40),role:'pm',ticket:'GH-264',url:'https://github.com/JFusco/brain/pull/270',status:'open',createdAt:'',updatedAt:''}];
 state.coordination.listener.reviews=[{id:'review-fixture',key:'GH-264',status:'owned'}];state.coordination.jobs=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open your outbox,/}).click();
 const card=page.locator('[data-outbox-item]').first();await expect(card).toContainText('No merge approval is being requested.');await expect(card).not.toContainText('Exact technical evidence');await card.click();
 const detail=page.locator('[data-outbox-detail]');await expect(detail.getByText(/Exact technical evidence/)).toBeHidden();await detail.getByText('Evidence & session details',{exact:true}).click();await expect(detail.getByText(/Exact technical evidence/)).toBeVisible();
 await page.screenshot({path:evidence('office-summary-outbox.png')});
 await page.getByRole('button',{name:'Close details',exact:true}).click();await expect(page.getByRole('button',{name:/^Open PM mailbox,/})).toContainText('0');
});

test('time report task options include issue titles (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.tickets=[{key:'GH-254',summary:'Refresh official reference catalogs',stage:'mailbox',status:'open'}];state.coordination.listener.reviews=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:'Visit Morgan, PM',exact:true}).click();
 const select=page.getByRole('combobox',{name:'Time report task'});await expect(select.locator('option[value="GH-254"]')).toHaveText('GH-254 · Refresh official reference catalogs');await select.selectOption('GH-254');await expect(select).toHaveValue('GH-254');await page.screenshot({path:evidence('office-time-task-titles.png')});
});
test('blocked ticket outcome remains visible while Morgan starts the next investigation (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.coordination.jobs=[];state.coordination.listener.reviews=[{id:'old',key:'GH-255',summary:'Fix sitemap language paths',status:'blocked',detail:'Ownership visibility is unavailable. No source work started.',endedAt:'2026-10-28T15:49:00Z',startedAt:'2026-10-28T15:45:00Z',queuedAt:'2026-10-28T15:44:00Z'},{id:'new',key:'GH-254',summary:'Refresh official references',status:'working',detail:'Waiting for prerequisite GH-255.',endedAt:'',startedAt:'2026-10-28T15:50:00Z',queuedAt:'2026-10-28T15:40:00Z'}];
 state.agents=state.agents.map((a:any)=>({...a,activity:'idle'}));await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');const updates=page.getByRole('region',{name:'Team updates Current work and the next step'});await expect(updates).toContainText('GH-255 · Fix sitemap language paths');await expect(updates).toContainText('Stopped; read back the original session before continuing.');await expect(updates).toContainText('Morgan is checking ownership and the next delivery step.');await page.screenshot({path:evidence('office-ticket-outcomes.png')});
});
test('mailbox shows GitHub lane, linked PR and Office work separately (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.github.board={...state.github.board,lanes:['Ready'],items:[{repository:'JFusco/brain',number:260,title:'PostgreSQL references',status:'Ready',state:'OPEN'}]};state.github.prs=[{number:266,state:'open',linkedIssues:[260]}];state.coordination.jobs=[{id:'fixture-job',key:'GH-260',pr:266,prUrl:'https://github.com/JFusco/brain/pull/266',stage:'lead-pr',status:'working',detail:'Sam is reviewing the current PR.',requestedAt:new Date().toISOString(),steps:[]}];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const source=page.getByRole('region',{name:'Project source statuses'});await expect(source).toContainText('Ready · 1');await expect(source).toContainText('PR #266 · Working on Sam’s PR review');await expect(source).toContainText('1 open PRs');await page.screenshot({path:evidence('office-source-statuses.png')});
});
test('agent last report separates its status pill from the summary (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();
 state.agents=state.agents.map((a:any)=>({...a,activity:'idle',...(a.id==='lead'?{lastOutcome:{ticket:'GH-262',status:'blocked',summary:'Parent PR needs reconciliation before this ticket continues.',at:new Date().toISOString()}}:{})}));
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/Visit Sam/}).click();
 const report=page.locator('[data-last-report]');await expect(report).toBeVisible();
 const pill=await report.getByText('blocked',{exact:true}).boundingBox(),summary=await report.locator('[data-work-summary]').boundingBox();
 expect(summary!.y-(pill!.y+pill!.height)).toBeGreaterThanOrEqual(12);
 await page.screenshot({path:evidence('office-agent-report-spacing.png')});
});
test('pickup checkbox is a compact inline control (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
 const checkbox=page.getByLabel('Automatically queue work assigned to me');await expect(checkbox).toBeVisible();
 const layout=await checkbox.evaluate(el=>({width:el.getBoundingClientRect().width,direction:getComputedStyle(el.parentElement!).flexDirection,display:getComputedStyle(el.parentElement!).display}));
 expect(layout).toEqual({width:16,direction:'row',display:'flex'});
});

test('GitHub drawer spaces notices, timestamps and checkbox text consistently (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.projects=state.projects.map((p:any)=>({...p,working:p.id==='cec'?1:0}));
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:'GitHub operations',exact:true}).click();
 const notice=page.locator('[data-github-panel]').getByText(/Another project has a worker assignment/);await expect(notice).toBeVisible();const n=await notice.boundingBox(),stamp=await page.locator('[data-github-panel] > p').last().boundingBox();expect(stamp!.y-(n!.y+n!.height)).toBeGreaterThanOrEqual(14);
 const row=page.getByLabel('Automatically queue work assigned to me');await row.scrollIntoViewIfNeeded();const input=await row.boundingBox(),label=await row.locator('..').locator('span').boundingBox();expect(label!.x-(input!.x+input!.width)).toBeGreaterThanOrEqual(10);expect(Math.abs(input!.y-label!.y)).toBeLessThanOrEqual(3);
 await page.screenshot({path:evidence('office-github-panel-spacing.png')});
});
test('inbox opens with the exact queued tickets above settings, with no long-link overflow (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.coordination.listener.reviews=[{id:'first',key:'GH-70',summary:'Add Shopify documentation coverage',status:'queued',queuedAt:'2026-10-28T12:00Z',workRequested:'manual'},{id:'second',key:'GH-71',summary:'Add Umbraco documentation coverage',status:'queued',queuedAt:'2026-10-28T13:00Z'}];
 state.coordination.notices={...state.coordination.notices,entries:[{id:'long',key:'GH-261',status:'sent',detail:'https://verndale.slack.com/archives/D1Z7SSZQ9/p'+ '1793212166310519'.repeat(20)}]};
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
 const queue=page.getByRole('region',{name:'Queued for Morgan'});await expect(queue).toBeVisible();await expect(queue).toContainText('Add Shopify documentation coverage');await expect(queue).toContainText('Add Umbraco documentation coverage');
 const top=await queue.boundingBox(),settings=await page.getByRole('heading',{name:'Daily checkpoints & assignments'}).boundingBox();expect(top!.y+top!.height).toBeLessThan(settings!.y);
 const scroll=page.locator('[data-inspector-scroll]');expect(await scroll.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.getByText(state.coordination.notices.entries[0].detail,{exact:true}).scrollIntoViewIfNeeded();expect(await scroll.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.screenshot({path:evidence('office-inbox-width.png')});
});

test('settings show styled save success and failure beside the submitted form (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 let fail=false;await page.route('**/api/commands*',r=>r.fulfill({status:fail?500:200,json:fail?{error:'Settings store is unavailable'}:{accepted:true}}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
 await page.getByRole('button',{name:'Save pickup rule',exact:true}).click();const feedback=page.locator('[data-save-feedback]');await expect(feedback).toHaveAttribute('data-save-feedback','success');await expect(feedback).toContainText('Pickup rule saved.');
 fail=true;await page.getByRole('button',{name:'Save pickup rule',exact:true}).click();await expect(feedback).toHaveAttribute('data-save-feedback','error');await expect(feedback).toHaveAttribute('role','alert');await expect(feedback).toContainText('Settings store is unavailable');
 await page.screenshot({path:evidence('office-save-feedback.png')});
});

test('outbox detail separates its status, title, action and summary (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.outbox=[{id:'assignment:fixture',ticket:'GH-70',role:'pm',title:'GH-70 intake needs follow-up',detail:'A temporary read failed. Morgan will report the remaining blocker.',status:'open',url:'https://github.com/JFusco/brain/issues/70'}];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open your outbox,/}).click();await page.locator('[data-outbox-item]').click();
 const detail=page.locator('[data-outbox-detail]');const tag=await detail.getByText('Needs follow-up',{exact:true}).boundingBox(),title=await detail.locator('h3').boundingBox(),action=await detail.locator(':scope > p').boundingBox();expect(title!.y-tag!.y-tag!.height).toBeGreaterThanOrEqual(13);expect(action!.y-title!.y-title!.height).toBeGreaterThanOrEqual(13);expect(await page.locator('[data-inspector-scroll]').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.screenshot({path:evidence('office-outbox-spacing.png')});
});

test('shared PM queue cards separate ticket labels, pills and actions (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();state.teamQueue=[{project:'brain',projectName:'Brain',job:{id:'layout',key:'GH-264',stage:'lead-pr',status:'queued',detail:'Independent current-head review queued.',pr:270,prUrl:'https://github.com/JFusco/brain/pull/270'}}];state.pmQueue=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^PM queue \d+:/}).click();
 const card=page.locator('[data-card]').first();const label=await card.locator('strong').boundingBox(),tag=await card.locator(':scope > span').first().boundingBox(),link=await card.getByRole('link').boundingBox(),button=await card.getByRole('button').boundingBox();expect(tag!.y-label!.y-label!.height).toBeGreaterThanOrEqual(11);expect(button!.y-link!.y-link!.height).toBeGreaterThanOrEqual(11);expect(await page.locator('[data-inspector-scroll]').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.screenshot({path:evidence('office-pm-queue-spacing.png')});
});

test('PM queue and badge share current work and exclude old intake decisions (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();
 const review=(key:string,status:string,extra={})=>({project:'brain',projectName:'Brain',review:{id:key,key,status,summary:`Title ${key}`,queuedAt:'2026-10-28T12:00Z',detail:'Previous intake report',...extra}});
 const job=(key:string,status:string,extra={})=>({project:'brain',projectName:'Brain',job:{id:key,key,status,stage:'lead-pr',requestedAt:'2026-10-28T12:00Z',detail:'Current delivery',...extra}});
 state.pmQueue=[review('GH-70','held'),review('GH-71','owned'),review('GH-10','ready'),review('GH-264','blocked',{workRequested:'automatic'}),review('GH-255','queued',{workRequested:'automatic'}),review('GH-99','blocked',{workRequested:'manual'})];
 state.teamQueue=[job('GH-264','working',{pr:270,prUrl:'https://github.com/JFusco/brain/pull/270'}),job('GH-263','completed')];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');
 const button=page.getByRole('button',{name:/^PM queue \d+: 2 active or queued, 0 waiting on prerequisites, 1 stopped$/});await expect(button).toContainText('3');await button.click();
 const panel=page.getByRole('complementary',{name:'PM queue',exact:true});await expect(panel.locator('[data-card]')).toHaveCount(3);await expect(panel.getByRole('region',{name:'With the team now'})).toContainText('GH-264');await expect(panel.getByRole('region',{name:'Queued next'})).toContainText('GH-255');await expect(panel.getByRole('region',{name:'Stopped · needs follow-up'})).toContainText('GH-99');
 for(const key of ['GH-70','GH-71','GH-10','GH-263'])await expect(panel).not.toContainText(key);
 await page.screenshot({path:evidence('office-pm-queue-current-only.png')});
});

test('Ready work held on a prerequisite appears in both Inbox and PM queue (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();const review={id:'dependent',prerequisites:[{target:{projectId:'brain',kind:'issue',id:'255'},condition:'issue-closed',evidence:'Synthetic dependency record',observedAt:new Date().toISOString()}],key:'GH-254',summary:'Refresh approved references',url:'https://github.com/JFusco/brain/issues/254',status:'held',workRequested:'automatic',detail:'Keep this held until GH-255 passes review and delivery.',queuedAt:'2026-10-28T12:00Z'};
 state.coordination.jobs=[];state.coordination.listener.reviews=[review];state.coordination.listener.assigned=[{key:'GH-254',summary:review.summary,pickupStatus:'Ready',status:'open'}];state.pmQueue=[{project:'brain',projectName:'Brain',review}];state.teamQueue=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
 const ready=page.getByRole('region',{name:'Ready assignments waiting'});await expect(ready).toContainText('GH-254');await expect(ready).toContainText('Waiting for GH-255');
 await page.getByRole('button',{name:'Close details',exact:true}).click();await page.getByRole('button',{name:/^PM queue \d+: 0 active or queued, 1 waiting on prerequisites, 0 stopped$/}).click();const waiting=page.getByRole('region',{name:'Waiting on prerequisites'});await expect(waiting).toContainText('GH-254');await expect(waiting).toContainText('Blocked by GH-255');await page.screenshot({path:evidence('office-ready-prerequisite.png')});
});
