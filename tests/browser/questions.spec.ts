import {test,expect,type APIRequestContext} from './fixture-test';
import {setPreferences} from './support';
import AxeBuilder from '@axe-core/playwright';
async function seed(request:APIRequestContext,project='brain',title='Cross-project search',harness=false,questions=2){
 const response=await request.post('/api/features?project='+project,{data:{action:'create',title,intent:'Synthetic question flow'}});const feature=await response.json();
 feature.rounds[0].questions=Array.from({length:questions},(_,i)=>({id:'q'+i,question:'Question '+(i+1)+' for '+title+'?',recommendation:'Editors',choices:['Editors','Everyone']}));
 if(harness){feature.rounds[0].author='harness';feature.rounds[0].options=[{id:'retry',label:'Retry once',tradeoff:'Keep previous attempt history.',action:'retry',target:'stage:discovery',preconditionsDigest:'fixture'},{id:'pause',label:'Pause',tradeoff:'Keep evidence.',action:'pause',target:'stage:discovery',preconditionsDigest:'fixture'}];}
 await request.post('/__fixture/snapshot?project='+project,{data:{features:[feature],featurePlanning:{assessment:true,progression:'automatic',policyDigest:'fixture'}}});return feature;
}
test.beforeEach(async({page,request})=>{await setPreferences(request,{reducedMotion:true});await page.addInitScript(()=>localStorage.setItem('office.floor','delivery'));});
test('a question present at page load restores focus to the stable Questions control',async({page,request})=>{
 await seed(request,'brain','Initial question',false,1);await page.goto('/');
 const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Questions for you (1)',exact:true})).toBeFocused();
});
test('cross-project modal contains focus, preserves the open drawer on Escape and submits to its owner',async({page,request})=>{
 await page.goto('/');await page.getByRole('button',{name:'Features',exact:true}).click();const drawer=page.getByRole('complementary',{name:'Features',exact:true});await expect(drawer).toBeVisible();
 const feature=await seed(request);const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('heading',{name:'Question 1 for Cross-project search?'})).toBeFocused();
 expect(await dialog.evaluate(el=>el.matches(':modal'))).toBe(true);
 await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(drawer).toBeVisible();
 await expect(page.getByRole('button',{name:'Close details',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Questions for you (1)',exact:true}).click();await page.getByRole('navigation',{name:'Questions for you'}).getByRole('button',{name:/Cross-project search/}).click();
 await dialog.getByLabel('Your answer',{exact:true}).fill('Custom audience');await dialog.getByRole('button',{name:'Next',exact:true}).click();await dialog.getByLabel('Your answer',{exact:true}).fill('Everyone with keyboard access');await dialog.getByRole('button',{name:'Back',exact:true}).click();await expect(dialog.getByLabel('Your answer',{exact:true})).toHaveValue('Custom audience');await dialog.getByRole('button',{name:'Next',exact:true}).click();await dialog.getByRole('button',{name:'Send answers',exact:true}).click();await expect(dialog).toBeHidden();
 const writes=await(await request.get('/__fixture/writes')).json();const answer=writes.find((w:any)=>w.body.action==='answer');expect(answer.path).toContain('project=brain');expect(answer.body).toMatchObject({expectedRevision:1,roundId:feature.rounds[0].id,answers:{q0:'Custom audience',q1:'Everyone with keyboard access'}});
});
test('Later and drafts survive reload and project switches; a newly arriving round waits its turn',async({page,request})=>{
 await page.goto('/');await seed(request,'brain','First',false,1);const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();await dialog.getByLabel('Your answer',{exact:true}).fill('Retained draft');
 await seed(request,'cms-field-vocabulary','Second',false,1);await expect(dialog.getByRole('heading',{name:'Question 1 for First?'})).toBeVisible();
 await dialog.getByRole('button',{name:'Later',exact:true}).click();await expect(dialog.getByRole('heading',{name:'Question 1 for Second?'})).toBeVisible();await dialog.getByRole('button',{name:'Later',exact:true}).click();await page.reload();await expect(dialog).toBeHidden();await page.getByLabel('Office project').selectOption('cms-field-vocabulary');await expect(page.getByLabel('Office project')).toHaveValue('cms-field-vocabulary');
 await page.getByRole('button',{name:'Questions for you (2)',exact:true}).click();await page.getByRole('navigation',{name:'Questions for you'}).getByRole('button',{name:/First/}).click();await expect(dialog.getByLabel('Your answer',{exact:true})).toHaveValue('Retained draft');
});
test('harness notes stay open, actions are explicit, and the narrow modal passes axe',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});await seed(request,'brain','Recovery',true,1);await page.goto('/');const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Apply action',exact:true})).toBeDisabled();
 await dialog.getByLabel('Recovery note',{exact:true}).fill('Provider is ready again');await dialog.getByRole('button',{name:'Save note',exact:true}).click();await expect(dialog.getByText('Note saved. Apply an available action when ready.')).toBeVisible();await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);const axe=await new AxeBuilder({page}).include('dialog[data-office-question-dialog]').analyze();expect(axe.violations).toEqual([]);
 await dialog.getByRole('radio',{name:/Retry once/}).check();await dialog.getByRole('button',{name:'Apply action',exact:true}).click();await expect(dialog).toBeHidden();
 const writes=await(await request.get('/__fixture/writes')).json();expect(writes.filter((w:any)=>w.body.action==='answer')).toEqual([]);expect(writes.filter((w:any)=>w.body.action==='harness-action').map((w:any)=>w.body.operation)).toEqual(['note','apply']);
});
test('another tab completion and revoked question visibility close stale rounds without deleting unrelated drafts',async({page,context,request})=>{
 const feature=await seed(request,'brain','Shared',false,1);await page.goto('/');const other=await context.newPage();await other.goto('/');const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();await dialog.getByLabel('Your answer',{exact:true}).fill('Retain this draft');await page.evaluate(()=>localStorage.setItem('unrelated-question-draft','Keep me'));
 const second=other.locator('dialog[data-office-question-dialog]');await second.getByLabel('Your answer',{exact:true}).fill('Answered elsewhere');await second.getByRole('button',{name:'Send answers',exact:true}).click();await expect(dialog).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem('unrelated-question-draft'))).toBe('Keep me');
 await seed(request,'brain','Revoked',false,1);await expect(dialog).toBeVisible();await request.post('/__fixture/snapshot?project=brain',{data:{features:[]}});await expect(dialog).toBeHidden();await other.close();
});
test('tour suspends opening until live mode resumes',async({page,request})=>{
 await page.goto('/');await page.getByRole('button',{name:'Tour the office',exact:true}).click();await seed(request,'brain','During tour',false,1);const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeHidden();await page.getByRole('button',{name:'Return to live office',exact:true}).click();await expect(dialog).toBeVisible();
});

test('questions arrive on the CTO floor and typed stale responses preserve earlier drafts',async({page,request})=>{
 await page.goto('/');await page.getByRole('button',{name:/^Go to Floor 2, CTO Office/}).click();await expect(page.getByRole('heading',{level:1,name:'CTO Office'})).toBeVisible();
 const feature=await seed(request,'brain','Stale',false,1),dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();await dialog.getByLabel('Your answer',{exact:true}).fill('Original draft');
 await page.route('**/api/features/*',async route=>{if(route.request().method()!=='POST')return route.continue();await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Feature changed; reload before submitting',code:'revision-change'})});});
 await dialog.getByRole('button',{name:'Send answers',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Feature changed'})).toBeVisible();
 expect(await page.evaluate(({id,round})=>localStorage.getItem(['office.feature.answer','brain',id,round,'q0'].map(encodeURIComponent).join(':')),{id:feature.id,round:feature.rounds[0].id})).toBe('Original draft');
});
test('disabled activation renders no Questions control in the default office',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:/^PM mailbox,/})).toBeVisible({timeout:30000});
 await expect(page.getByRole('button',{name:/^Questions for you/})).toHaveCount(0);
});
for(const viewport of [{width:1440,height:1000},{width:390,height:844}])test(`the Questions control never overlaps open drawer controls at ${viewport.width}px`,async({page,request})=>{
 await page.setViewportSize(viewport);await seed(request,'brain','Layout',false,1);await page.goto('/');
 const dialog=page.locator('dialog[data-office-question-dialog]');await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 await page.getByRole('button',{name:/^Open PM mailbox,/}).click();await expect(page.getByRole('complementary',{name:'PM mailbox'})).toBeVisible();
 const control=page.getByRole('button',{name:'Questions for you (1)',exact:true});await expect(control).toBeVisible();
 expect(await control.evaluate(el=>{const r=el.getBoundingClientRect();return [...document.querySelectorAll('[data-inspector] :is(a[href],button,input,select,textarea,summary)')].map(c=>c.getBoundingClientRect()).filter(o=>o.width>0&&o.height>0&&Math.min(r.right,o.right)-Math.max(r.left,o.left)>0.5&&Math.min(r.bottom,o.bottom)-Math.max(r.top,o.top)>0.5).length;})).toBe(0);
});
test('an inline round arriving in the Features drawer keeps typing focus; Next moves focus to the next question',async({page,request})=>{
 const feature=await(await request.post('/api/features?project=cec',{data:{action:'create',title:'Focus continuity',intent:'Synthetic inline round'}})).json();
 feature.rounds[0].answers={audience:'Editors'};await request.post('/__fixture/snapshot?project=cec',{data:{features:[feature]}});
 await page.goto('/');await page.getByRole('button',{name:'Features',exact:true}).click();
 const drawer=page.getByRole('complementary',{name:'Features',exact:true});await drawer.getByRole('button',{name:/Focus continuity/}).click();
 const revision=drawer.getByLabel('Correct or add a decision');await revision.fill('Still typing');await expect(revision).toBeFocused();
 feature.rounds.push({id:'second',revision:feature.revision,createdAt:new Date().toISOString(),answers:{},questions:[1,2].map(i=>({id:'q'+i,question:'Inline question '+i+'?',recommendation:'Editors',choices:['Editors','Everyone']}))});
 await request.post('/__fixture/snapshot?project=cec',{data:{features:[feature]}});
 await expect(drawer.getByRole('heading',{name:'Inline question 1?'})).toBeVisible();await expect(revision).toBeFocused();await expect(revision).toHaveValue('Still typing');
 await drawer.getByLabel('Your answer',{exact:true}).fill('Editors');await drawer.getByRole('button',{name:'Next',exact:true}).click();
 await expect(drawer.getByRole('heading',{name:'Inline question 2?'})).toBeFocused();
 await expect(page.getByRole('button',{name:/^Questions for you/})).toHaveCount(0);
});
