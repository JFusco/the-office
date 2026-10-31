import { expect, test } from '@playwright/test';
import { evidence, fixtureMode } from './support';

test('switching projects loads the real isolated API, scopes chat and restores CEC',async({page,request})=>{
  const cec=await(await request.get('/api/office')).json();
  const cmsResponse=await request.get('/api/office?project=cms-field-vocabulary');expect(cmsResponse.ok()).toBe(true);
  const cms=await cmsResponse.json();expect(cms.project.repository).toBe('JFusco/cms-field-vocabulary');expect(cms.tickets.every((t:any)=>t.key.startsWith('GH-'))).toBe(true);
  // Read-only browser verification: capture chat writes instead of dispatching
  // a model or creating a real GitHub issue.
  const writes:{url:string;body:any}[]=[];
  await page.route('**/api/messages?project=cms-field-vocabulary',async route=>{writes.push({url:route.request().url(),body:route.request().postDataJSON()});await route.fulfill({status:202,json:{accepted:true}});});
  await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.locator('canvas').evaluate(el=>el.dataset.projectCanvas='preserved');await page.getByLabel('Office project').selectOption('cms-field-vocabulary');
  await expect(page.getByRole('button',{name:'GitHub operations',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();await expect(page.getByRole('heading',{name:'GitHub & Actions',exact:true})).toBeVisible();
  expect(await page.locator('canvas').getAttribute('data-project-canvas')).toBe('preserved');await expect(page.getByRole('heading',{name:'Azure pipelines',exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();
  await page.getByRole('textbox',{name:'Message Morgan',exact:true}).fill('Draft a GitHub issue. Synthetic browser request only; no live write.');
  await page.getByRole('button',{name:'Send message',exact:true}).click();expect(writes).toHaveLength(1);expect(writes[0].url).toContain('project=cms-field-vocabulary');expect(writes[0].body.ticket).toBe('');
  await page.keyboard.press('Escape');
  await page.screenshot({path:evidence('office-cms-project.png')});
  await page.reload();await expect(page.getByLabel('Office project')).toHaveValue('cms-field-vocabulary');
  await page.getByLabel('Office project').selectOption('cec');await expect(page.getByRole('button',{name:'Azure operations',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();
  for(const note of cms.projectNotes||[])if(!(cec.projectNotes||[]).some((n:any)=>n.id===note.id))await expect(page.getByText(note.summary,{exact:true})).toHaveCount(0);
});

test('scoped API rejects unknown projects and cross-project issue keys without dispatching work',async({request})=>{
  test.skip(fixtureMode,'Backend contract: run against an isolated real server (OFFICE_TEST_BASE_URL)');
  expect((await request.get('/api/office?project=missing-project')).status()).toBe(409);
  expect((await request.get('/api/time?project=cms-field-vocabulary&ticket=CEC-123')).status()).toBe(400);
  const cross=await request.post('/api/commands?project=cms-field-vocabulary',{data:{action:'start-pilot',key:'CEC-123'}});expect(cross.status()).toBe(400);
  expect((await request.get('/api/office?project=cec')).ok()).toBe(true);
});

test('pending project fetch and SSE snapshots cannot open stale drawers or dispatch actions (UI fixture)',async({page,request})=>{
  const cec=await(await request.get('/api/office')).json(),cms=await(await request.get('/api/office?project=cms-field-vocabulary')).json();
  const held=new Set<string>(),writes:{url:string;body:any}[]=[];let release!:()=>void;
  const ready=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()==='POST'){writes.push({url:req.url(),body:req.postDataJSON()});return route.fulfill({status:202,json:{accepted:true}});}
    if(['/api/office','/api/events'].includes(url.pathname)){
      const target=url.searchParams.get('project')==='cms-field-vocabulary';
      if(target){held.add(url.pathname);await ready;}
      const state=target?cms:cec;
      return url.pathname==='/api/events'?route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}):route.fulfill({json:state});
    }
    return route.continue();
  });
  try{
    await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.locator('canvas').evaluate(el=>el.dataset.projectCanvas='preserved');
    await page.getByLabel('Office project').selectOption('cms-field-vocabulary');
    await expect.poll(()=>held.size).toBe(2);await expect(page.locator('[data-project-loading]')).toBeVisible();
    await page.getByLabel('Office project').blur();
    for(const key of ['m','c','o']){await page.keyboard.press(key);await expect(page.locator('[data-inspector]')).toHaveCount(0);}
    // Even a queued click on a now-inert control cannot start a command.
    await page.getByRole('button',{name:/^(Pause|Resume) office$/}).dispatchEvent('click');expect(writes).toHaveLength(0);
    release();await expect(page.locator('[data-project-loading]')).toHaveCount(0);
    await page.keyboard.press('m');await expect(page.getByRole('heading',{name:'PM mailbox',exact:true})).toBeVisible();
    await expect(page.getByText('GitHub issues for this project.',{exact:false})).toBeVisible();
    await page.getByRole('button',{name:'Check mail now',exact:true}).click();
    expect(writes).toHaveLength(1);expect(writes[0].url).toContain('project=cms-field-vocabulary');expect(writes[0].body.action).toBe('check-mail');
    expect(await page.locator('canvas').getAttribute('data-project-canvas')).toBe('preserved');
  }finally{release();}
});

 test('project selector stays usable on a narrow screen',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByLabel('Office project').selectOption('cms-field-vocabulary');await expect(page.getByRole('button',{name:'GitHub operations',exact:true})).toBeVisible();await expect(page.getByLabel('Office project')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('ticket drawer shows the team decision and skipped steps distinctly from passing work (UI fixture)',async({page,request})=>{
  const state=await(await request.get('/api/office')).json();
  const reason='Synthetic UI fixture: the small known change is covered by focused checks.';
  const approach={plan:'none',review:'none',validation:'developer-checks',checks:['Focused build/typecheck'],reason};
  state.tickets=[{key:'CEC-999',summary:'Synthetic approach display fixture',type:'Task',status:'In Progress',stage:'ci',activity:'waiting',blocker:'',commit:'',branch:'',prId:0,previewUrl:'',attempt:0,findings:[],evidence:[],results:{},approach,decisions:[{role:'pm',stage:'understand',at:new Date().toISOString(),approach}],skippedStages:Object.fromEntries(['plan','plan-review','code-review','preview','qa'].map(s=>[s,reason]))}];
  await page.route('**/api/office',r=>r.fulfill({json:state}));await page.route('**/api/events',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
  await page.goto('/');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await page.getByRole('button',{name:/CEC-999 Synthetic approach display fixture/}).click();
  await expect(page.getByRole('heading',{name:'Team approach',exact:true})).toBeVisible();await expect(page.getByText('No separate plan',{exact:true})).toBeVisible();await expect(page.getByText('Developer checks',{exact:true})).toBeVisible();await expect(page.getByText('Not needed for this task',{exact:true})).toHaveCount(5);await expect(page.locator('[data-stage-state=passed]')).toHaveCount(0);
});

test('Brain is selectable with its own maintenance control and schedule',async({page,request})=>{
  const response=await request.get('/api/office?project=brain');expect(response.ok()).toBe(true);
  const brain=await response.json();expect(brain.project.repository).toBe('JFusco/brain');expect(brain.intake.schedule).toContain('5:00 PM');
  await page.goto('/');await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();
  await expect(page.getByRole('button',{name:'Run Brain maintenance',exact:true})).toBeVisible();
  await expect(page.getByText(/Daily maintenance and capture review at 5 PM Eastern/)).toBeVisible();
  await page.reload();await expect(page.getByLabel('Office project')).toHaveValue('brain');
});

test('Brain board lanes and ticket spacing reflect live project observations',async({page,request})=>{
  const brain=await(await request.get('/api/office?project=brain')).json();
  expect(brain.project.githubProject.url).toBe('https://github.com/users/JFusco/projects/8');
  expect(brain.github.board.error).toBe('');expect(brain.github.board.items.length).toBeGreaterThan(0);
  await page.goto('/');await page.getByLabel('Office project').selectOption('brain');
  const dropdown=page.getByLabel('Office project');
  // The inset chevron is a decorative icon beside the native select (hidden in forced colors).
  await expect(dropdown).toHaveCSS('appearance','none');await expect(dropdown).toHaveCSS('padding-right','38px');
  await expect(dropdown.locator('xpath=following-sibling::*[local-name()="svg"]')).toHaveAttribute('aria-hidden','true');
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();
  await expect(page.getByRole('heading',{name:'GitHub Project',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Brain board ↗',exact:true})).toHaveAttribute('href',brain.project.githubProject.url);
  for(const lane of brain.github.board.lanes)await expect(page.getByRole('heading',{name:`${lane} · ${brain.github.board.items.filter((i:any)=>i.status===lane&&i.repository==='JFusco/brain').length}`,exact:true})).toBeVisible();
  await page.screenshot({path:evidence('brain-project-board.png')});
  await page.keyboard.press('Escape');await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
  const card=brain.github.board.items.find((i:any)=>i.repository==='JFusco/brain'&&brain.tickets.some((t:any)=>t.key===`GH-${i.number}`&&t.status==='open'));
  expect(card).toBeTruthy();
  await page.getByRole('button',{name:new RegExp(`GH-${card.number}\\b`)}).click();
  await expect(page.getByText(`Project lane: ${card.status}`,{exact:true})).toBeVisible();
  expect(await page.locator('[data-inspector-scroll]').evaluate(el=>el.scrollTop)).toBe(0);
  const button=await page.getByRole('button',{name:`Discuss GH-${card.number} with Morgan`,exact:true}).boundingBox();
  const heading=await page.locator('[data-github-ticket] [data-ticket-heading]').boundingBox();
  expect(heading!.y-(button!.y+button!.height)).toBeGreaterThanOrEqual(23);
  const badge=await page.locator('[data-github-ticket]').getByText('open',{exact:true}).boundingBox();
  const description=await page.locator('[data-github-ticket]').getByText(/^Project lane:/).boundingBox();
  expect(description!.y-(badge!.y+badge!.height)).toBeGreaterThanOrEqual(13);
  await page.locator('[data-inspector]').screenshot({path:evidence('brain-ticket-spacing.png')});
});

test('Open board follows the selected project for Jira and GitHub and remains visible on mobile',async({page,request})=>{
  await page.goto('/');
  for(const [id,pattern] of [['cec',/verndale\.atlassian\.net\/secure\/RapidBoard\.jspa\?rapidView=9121/],['brain',/github\.com\/users\/JFusco\/projects\/8$/],['cms-field-vocabulary',/github\.com\/users\/JFusco\/projects\/6$/]] as const){
    await page.getByLabel('Office project').selectOption(id);
    const board=page.getByRole('link',{name:/^Open .* board$/});await expect(board).toBeVisible();await expect(board).toHaveAttribute('href',pattern);await expect(board).toHaveAttribute('target','_blank');
  }
  const cms=await(await request.get('/api/office?project=cms-field-vocabulary')).json();expect(cms.github.board.error).toBe('');
  await page.getByRole('button',{name:'GitHub operations',exact:true}).click();
  await expect(page.getByRole('link',{name:'CMS Field Vocabulary board ↗',exact:true})).toHaveAttribute('href','https://github.com/users/JFusco/projects/6');
  for(const lane of cms.github.board.lanes)await expect(page.getByRole('heading',{name:`${lane} · ${cms.github.board.items.filter((i:any)=>i.status===lane&&i.repository===cms.project.repository).length}`,exact:true})).toBeVisible();
  await page.screenshot({path:evidence('cms-project-board.png')});
  await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('link',{name:'Open board: CMS field vocabulary GitHub board',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:evidence('cms-board-link-mobile.png')});
});

test('PM queue shows another project without switching views, then opens its project-qualified ticket (UI fixture)',async({page,request})=>{
  const cec=await(await request.get('/api/office?project=cec')).json(),brain=await(await request.get('/api/office?project=brain')).json();
  const queue=[{project:'brain',projectName:'Brain',review:{id:'fixture-brain',key:'GH-255',summary:'Synthetic cross-project arrival',url:'https://github.com/JFusco/brain/issues/255',queuedAt:new Date().toISOString(),startedAt:'',endedAt:'',status:'queued',workRequested:'manual',detail:'Waiting for Morgan to check existing sessions.',owner:''}}];
  cec.pmQueue=brain.pmQueue=queue;
  await page.route('**/api/office*',async r=>r.fulfill({json:new URL(r.request().url()).searchParams.get('project')==='brain'?brain:cec}));
  await page.route('**/api/events*',async r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(new URL(r.request().url()).searchParams.get('project')==='brain'?brain:cec)}\n\n`}));
  await page.goto('/');await page.getByLabel('Office project').selectOption('cec');
  await page.getByRole('button',{name:'PM queue 1: 1 active or queued, 0 waiting on prerequisites, 0 stopped',exact:true}).click();
  await expect(page.getByLabel('Office project')).toHaveValue('cec');await expect(page.getByText('Brain · GH-255',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open Brain ticket',exact:true}).click();
  await expect(page.getByLabel('Office project')).toHaveValue('brain');await expect(page.getByRole('button',{name:'Discuss GH-255 with Morgan',exact:true})).toBeVisible();
  await page.screenshot({path:evidence('office-cross-project-pm-queue.png')});
});
