import {test,expect} from '@playwright/test';
import { evidence } from './support';
test('existing Goals & Ideas shows CEC goals from Brain and routes edits to CEC (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json();const goal={id:crypto.randomUUID(),project:'CEC',projectId:'cec',mapping:'mapped',title:'Designer content gap scan',detail:'Compare new frames with the existing experience.',priority:2,status:'planned',updatedAt:new Date().toISOString(),requestId:'fixture'};state.ctoGoals=[goal];state.goals=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));let saved:any;
 await page.route('**/api/goals',async r=>{saved=r.request().postDataJSON();await r.fulfill({status:200,json:goal});});
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await page.getByRole('button',{name:/^Open project goals/}).click();
 await expect(page.getByRole('heading',{name:'Goals & ideas',exact:true})).toBeVisible();await page.getByRole('button').filter({hasText:'Designer content gap scan'}).click();
 await expect(page.getByRole('combobox',{name:'Project',exact:true})).toHaveValue('cec');await expect(page.getByRole('combobox',{name:'Project',exact:true})).toBeDisabled();
 await page.getByRole('textbox',{name:'Why it matters',exact:true}).fill('Updated CEC requirement');await page.getByRole('button',{name:'Save changes',exact:true}).click();expect(saved).toMatchObject({project:'CEC',detail:'Updated CEC requirement'});await expect(page.getByLabel('Office project')).toHaveValue('brain');
});
test('new CTO goals choose configured projects by canonical ID while preserving the current Office view',async({page,request})=>{
 await request.post('/__fixture/reset');const writes:any[]=[];
 await page.route('**/api/goals*',async route=>{writes.push({url:route.request().url(),body:route.request().postDataJSON()});await route.fulfill({json:{ok:true}});});
 await page.goto('/');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await page.getByRole('button',{name:/^Open project goals/}).click();
 const project=page.getByRole('combobox',{name:'Project',exact:true});await expect(project).toHaveValue('cec');
 await expect(project.locator('option')).toHaveText(['Choose a configured project','CEC','Brain','CMS field vocabulary']);
 await expect(page.getByRole('textbox',{name:'Project',exact:true})).toHaveCount(0);await project.selectOption('brain');
 await page.getByLabel('Goal',{exact:true}).fill('Synthetic Brain goal');await page.getByRole('button',{name:'Save goal',exact:true}).click();await expect(page.getByText('Goal saved.',{exact:true})).toBeVisible();
 expect(writes).toHaveLength(1);expect(new URL(writes[0].url).searchParams.get('project')).toBe('brain');expect(writes[0].body).toMatchObject({project:'Brain',title:'Synthetic Brain goal'});
 await expect(page.getByLabel('Office project')).toHaveValue('cec');await expect(project).toHaveValue('cec');
});
test('ambiguous legacy goals keep their project label and require mapping instead of silently moving',async({page,request})=>{
 await request.post('/__fixture/reset');const state=await(await request.get('/api/office')).json();
 state.ctoGoals=[{id:crypto.randomUUID(),project:'Old project name',projectId:'cec',mapping:'unmapped',title:'Legacy goal',detail:'Preserve human scope',priority:2,status:'planned',updatedAt:new Date().toISOString(),requestId:'fixture'}];
 await page.route('**/api/office*',route=>route.fulfill({json:state}));await page.route('**/api/events*',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await page.getByRole('button',{name:/^Open project goals/}).click();await page.getByRole('button').filter({hasText:'Legacy goal'}).click();
 await expect(page.getByRole('combobox',{name:'Project',exact:true})).toHaveValue('unmapped');await expect(page.getByRole('combobox',{name:'Project',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeDisabled();
 await expect(page.getByText('Project mapping needs review before this goal can be saved.',{exact:true})).toBeVisible();expect(await(await request.get('/__fixture/writes')).json()).toEqual([]);
});
test('global Avery history is visible across projects and does not claim to wait for delivery desks (UI fixture)',async({page,request})=>{
 const state=await(await request.get('/api/office?project=brain')).json(),id=crypto.randomUUID();state.ctoMessages=[{id,requestId:id,from:'human',to:'cto',ticket:'',actionId:'',body:'Add these CEC goals',status:'queued',createdAt:new Date().toISOString(),sessionId:'',recheck:false,error:'',recipients:[],receipts:[],contextProject:'CEC'}];state.messages=[];
 await page.route('**/api/office*',r=>r.fulfill({json:state}));await page.route('**/api/events*',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
 await page.goto('/');await page.getByLabel('Office project').selectOption('brain');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await page.getByRole('button',{name:/^Visit Avery,/}).click();await expect(page.getByText('Add these CEC goals',{exact:true})).toBeVisible();await expect(page.getByText('Queued · Avery will read this after the current CTO reply',{exact:true})).toBeVisible();await expect(page.getByText('Queued · waiting for a free desk',{exact:true})).toHaveCount(0);await page.screenshot({path:evidence('office-global-cto.png')});
});
