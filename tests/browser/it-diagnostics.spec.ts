import {expect,test} from './fixture-test';

test('current IT diagnostics do not repeat historical findings and expire when refresh fails',async({page,request})=>{
 const now=Date.now(),s=await(await request.get('/api/office?project=cec')).json();
 s.it={projectId:'cec',checkedAt:new Date(now).toISOString(),nextCheckAt:'',status:'monitoring',followUps:[],services:[],recoveries:{},reports:[{id:'old',at:new Date(now-86400000).toISOString(),status:'retrying',summary:'Historical GH-310 follow-up',actions:[],followUps:[{id:'native-delivery:old',owner:'IT',detail:'GH-310 historical waiting record'}],notified:[],fingerprint:''}]};
 await page.clock.install({time:now});
 await page.route('**/api/office*',route=>route.fulfill({json:s}));await page.route('**/api/events*',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(s)}\n\n`}));
 let calls=0;await page.route('**/api/service-health*',route=>++calls===1?route.fulfill({json:{checkedAt:s.it.checkedAt,services:[],context:'Synthetic fixture',it:s.it}}):route.fulfill({status:503,json:{error:'Synthetic unavailable'}}));
 await page.goto('/');await page.getByRole('button',{name:'Service health',exact:true}).click();
 const current=page.getByRole('region',{name:'Ellis IT specialist',exact:true});await expect(current.getByText('No current IT follow-up.',{exact:true})).toBeVisible();await expect(current.getByText(/GH-310/)).toHaveCount(0);
 await page.getByText('IT report history',{exact:true}).click();await expect(page.getByText(/GH-310 historical waiting record/)).toBeVisible();
 await page.clock.fastForward(165000);await expect(current.getByText('Update overdue',{exact:true})).toBeVisible();await expect(current.getByText(/current status is unverified/)).toBeVisible();await expect(current.getByText('No current IT follow-up.',{exact:true})).toHaveCount(0);await expect(page.getByText(/GH-310 historical waiting record/)).toBeVisible();
});

test('project switches discard a newer health response from the previous project while the new check waits',async({page,request})=>{
 const now=Date.now(),cec=await(await request.get('/api/office?project=cec')).json(),cms=await(await request.get('/api/office?project=cms-field-vocabulary')).json();
 const it=(projectId:string,followUps:any[]=[])=>({projectId,checkedAt:new Date(now-30000).toISOString(),nextCheckAt:'',status:followUps.length?'retrying':'monitoring',followUps,services:[],recoveries:{},reports:[]});
 cec.it=it('cec',[{id:'source',owner:'IT',detail:'CEC-only diagnostic'}]);cms.it=it('cms-field-vocabulary');
 const choose=(url:string)=>new URL(url).searchParams.get('project')==='cms-field-vocabulary'?cms:cec;
 await page.route('**/api/office*',route=>route.fulfill({json:choose(route.request().url())}));await page.route('**/api/events*',route=>route.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(choose(route.request().url()))}\n\n`}));
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/service-health*',async route=>{const s=choose(route.request().url());if(s===cms)await pending;try{await route.fulfill({json:{checkedAt:new Date(now).toISOString(),services:[],context:'Synthetic fixture',it:{...s.it,checkedAt:new Date(now).toISOString()}}});}catch{}});
 await page.goto('/');await page.getByRole('button',{name:'Service health',exact:true}).click();await expect(page.getByText(/CEC-only diagnostic/)).toBeVisible();
 await page.getByLabel('Office project').selectOption('cms-field-vocabulary');await expect(page.getByRole('button',{name:'GitHub operations',exact:true})).toBeVisible();
 if(!await page.getByRole('region',{name:'Ellis IT specialist',exact:true}).isVisible())await page.getByRole('button',{name:'Service health',exact:true}).click();
 const current=page.getByRole('region',{name:'Ellis IT specialist',exact:true});await expect(current.getByText('No current IT follow-up.',{exact:true})).toBeVisible();await expect(page.getByText(/CEC-only diagnostic/)).toHaveCount(0);release();
 await expect(current.getByText('Monitoring',{exact:true})).toBeVisible();
});
