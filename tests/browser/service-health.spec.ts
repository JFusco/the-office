import {expect,test} from './fixture-test';
import { evidence } from './support';

test('heart opens the shared drawer and keeps configured login separate from a worker failure',async({page})=>{
 let calls=0;
 await page.route('**/api/service-health*',route=>{calls++;return route.fulfill({json:{checkedAt:'2026-10-28T20:40:00Z',context:'Checks run in the Office service environment.',services:[{id:'anthropic',name:'Anthropic · Claude',status:'warning',detail:'Claude reports a configured login. No model call was made.',identity:'Fixture account',checkedAt:'2026-10-28T20:40:00Z',lastFailure:{at:'2026-10-28T20:27:13Z',detail:'GH-255 · Updating the candidate base failed. Read the original session before retrying its work.'},nextStep:'Compare the Office service environment with your terminal.'},{id:'github',name:'GitHub',status:'connected',detail:'GitHub verified the active account.',checkedAt:'2026-10-28T20:40:00Z'}]}});});
 await page.goto('/');await page.getByRole('button',{name:'Service health',exact:true}).click();
  const panel=page.getByRole('complementary',{name:'Service health',exact:true});await expect(panel).toBeVisible();await expect(panel.getByRole('heading',{name:'Service health',exact:true})).toBeVisible();await expect(panel.getByText('Claude reports a configured login. No model call was made.')).toBeVisible();await expect(panel.getByText('Check needs follow-up',{exact:true})).toBeVisible();await expect(panel.getByText('Connected',{exact:true})).toBeVisible();await panel.getByText(/Earlier delivery failure/).click();await expect(panel.getByText(/GH-255/)).toBeVisible();
 const beforeRefresh=calls;await panel.getByRole('button',{name:'Refresh health',exact:true}).click();await expect.poll(()=>calls).toBe(beforeRefresh+1);await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(page.getByRole('button',{name:'Service health',exact:true})).toBeFocused();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Service health',exact:true}).click();await expect(panel).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:evidence('office-service-health-mobile.png')});
});

test('health distinguishes delivery evidence, overdue assignments, provider incidents and passive recovery', async ({ page }) => {
 const now = new Date().toISOString();
 await page.route('**/api/service-health*', route => route.fulfill({ json: {
  checkedAt: now, context: 'Background health monitoring is active.',
  services: [
   { id: 'slack', name: 'Slack · connected app', kind: 'activity', status: 'connected', statusLabel: 'Delivery verified', detail: 'A message was confirmed by reading it back.', checkedAt: now, checkedLabel: 'Last confirmed delivery' },
   { id: 'listener:cec', name: 'CEC · assignment listener', kind: 'listener', status: 'unknown', statusLabel: 'Check queued', detail: 'The next assignment check is queued with the scheduler.', checkedAt: '', checkedLabel: 'Last successful assignment check' },
   { id: 'provider:openai', name: 'OpenAI · public service status', kind: 'provider', status: 'warning', statusLabel: 'Service disruption', detail: 'Codex errors. Public provider status does not verify your account.', checkedAt: now, checkedLabel: 'Status page checked', sourceUrl: 'https://status.openai.com/' },
   { id: 'provider:anthropic', name: 'Claude · public service status', kind: 'provider', status: 'connected', statusLabel: 'Operational', detail: 'All Systems Operational.', checkedAt: now, sourceUrl: 'https://status.claude.com/' },
  ],
 } }));
 await page.goto('/'); await page.getByRole('button', { name: 'Service health', exact: true }).click();
 const panel = page.getByRole('complementary', { name: 'Service health', exact: true });
 await expect(panel.getByText('Delivery verified', { exact: true })).toBeVisible();
 await expect(panel.getByText(/^Last confirmed delivery:/)).toBeVisible();
 await expect(panel.getByText('Last successful assignment check: Not recorded')).toBeVisible();
 await expect(panel.getByText('Service disruption', { exact: true })).toBeVisible();
 await expect(panel.getByText('Operational', { exact: true })).toBeVisible();
 await expect(panel.getByRole('link', { name: 'View provider status ↗' })).toHaveCount(2);
 await expect(panel.getByText(/Current login has not been checked/)).toHaveCount(0);
});

test('a stalled refresh expires saved green and releases the refresh button', async ({ page }) => {
 await page.clock.install({ time: new Date('2026-11-04T20:00:00Z') });
 let calls = 0;
 await page.route('**/api/service-health*', route => {
  if (++calls > 1) return; // Deliberately leave the next read pending.
  return route.fulfill({ json: { checkedAt: '2026-11-04T20:00:00Z', services: [{ id: 'provider:openai', name: 'OpenAI · public service status', kind: 'provider', status: 'connected', statusLabel: 'Operational', detail: 'All Systems Operational.', checkedAt: '2026-11-04T20:00:00Z', expiresAt: '2026-11-04T20:02:30Z' }] } });
 });
 await page.goto('/'); await page.getByRole('button', { name: 'Service health', exact: true }).click();
 const panel = page.getByRole('complementary', { name: 'Service health', exact: true });
 await expect(panel.getByText('Operational', { exact: true })).toBeVisible();
 await page.clock.runFor(60001); await expect.poll(() => calls).toBe(2);
 await page.clock.runFor(90001);
 await expect(panel.getByRole('group', { name: 'Service connections' }).getByText('Update overdue', { exact: true })).toBeVisible();
 await expect(panel.getByRole('alert')).toContainText('Health refresh timed out');
 await expect(panel.getByRole('button', { name: 'Refresh health', exact: true })).toBeEnabled();
});

test('queue retains the blocked PR and Ready prerequisite instead of claiming no work remains',async({page,request})=>{
 const state=await(await request.get('/api/office')).json();state.project={id:'cec',name:'CEC',provider:'azure'};state.projects=[{id:'brain',name:'Brain',paused:false}];state.pmQueue=[{project:'brain',projectName:'Brain',review:{id:'held254',key:'GH-254',summary:'Refresh references',status:'held',workRequested:'automatic',detail:'Keep held until GH-255 completes.',prerequisites:[{target:{projectId:'brain',kind:'issue',id:'255'},condition:'issue-closed',evidence:'Synthetic fixture',observedAt:new Date().toISOString()}],queuedAt:'2026-10-28T12:00:00Z'}}];state.teamQueue=[{project:'brain',projectName:'Brain',job:{id:'pr271',key:'GH-265',stage:'prepare-pr',status:'blocked',pr:271,prUrl:'https://github.com/JFusco/brain/pull/271',requestedAt:'2026-10-28T12:00:00Z',detail:'Source acceptance still needs follow-up.'}}];
 await page.route('**/api/office*',route=>route.fulfill({json:state}));await page.route('**/api/events*',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByRole('button',{name:/^PM queue \d+:/}).click();const panel=page.getByRole('complementary',{name:'PM queue',exact:true});await expect(panel.getByText('Brain · GH-254',{exact:true})).toBeVisible();await expect(panel.getByRole('link',{name:'PR #271 ↗'})).toBeVisible();await expect(panel.getByText(/Nothing can run yet: 1 waiting on prerequisites · 1 stopped/)).toBeVisible();await expect(panel.getByText(/No active or queued work/)).toHaveCount(0);
});

test('GitHub PRs show their issue connection and prerequisite notices open the blocking ticket',async({page,request})=>{
 const s=await(await request.get('/api/office')).json();s.project={id:'cec',name:'Brain',provider:'github',repository:'JFusco/brain',target:'main'};
 const ticket=(key:string,title:string)=>({...s.tickets[0],key,summary:title,status:'open',url:`https://github.com/JFusco/brain/issues/${key.slice(3)}`,pilot:false});s.tickets=[ticket('GH-254','Refresh approved references'),ticket('GH-255','Fix sitemap language paths'),ticket('GH-265','Register Microsoft PostgreSQL skills')];
 s.github={status:'idle',observedAt:new Date().toISOString(),error:'',runs:[],issues:[{number:265,key:'GH-265',title:'Register Microsoft PostgreSQL skills',state:'open'}],prs:[{number:271,title:'Register Microsoft PostgreSQL skills',state:'open',draft:false,author:'fixture',head:'a'.repeat(40),base:'main',url:'https://github.com/JFusco/brain/pull/271',mergedAt:'',checks:[],reviews:[],linkedIssues:[265]}]};
 s.coordination={enabled:true,checkpoints:[],listener:{lastCheckedAt:new Date().toISOString(),error:'',assigned:[{key:'GH-254',status:'open',pickupStatus:'Ready'}],reviews:[{id:'held254',key:'GH-254',summary:'Refresh approved references',status:'held',workRequested:'automatic',detail:'Keep held until GH-255 completes.',prerequisites:[{target:{projectId:'brain',kind:'issue',id:'255'},condition:'issue-closed',evidence:'Synthetic fixture',observedAt:new Date().toISOString()}],queuedAt:'2026-10-28T12:00:00Z'}]},jobs:[{id:'255',key:'GH-255',stage:'update-base',status:'blocked',detail:'Worker login failed.',pr:0,steps:[]}]};
 await page.route('**/api/office*',route=>route.fulfill({json:s}));await page.route('**/api/events*',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(s)}\n\n`}));
 await page.goto('/');await page.getByRole('button',{name:'GitHub operations',exact:true}).click();const panel=page.getByRole('complementary',{name:'GitHub operations',exact:true});await expect(panel.getByRole('link',{name:'Linked issue #265 · Register Microsoft PostgreSQL skills',exact:true})).toHaveAttribute('href','https://github.com/JFusco/brain/issues/265');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();const ready=page.getByRole('region',{name:'Ready assignments waiting'});await ready.getByRole('button',{name:/GH-254/}).click();const issue=page.getByRole('complementary',{name:'Ticket',exact:true});await expect(issue.getByRole('note')).toContainText('Blocked by GH-255');await expect(issue.getByRole('button',{name:'Start ticket',exact:true})).toBeDisabled();await issue.getByRole('button',{name:'GH-255',exact:true}).click();await expect(issue.getByRole('heading',{name:'Fix sitemap language paths',exact:true})).toBeVisible();
});
