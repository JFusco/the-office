import {expect,test,vi} from 'vitest';
import {CurrentChecksWait,selectCurrentChecks,checksPassed,checksPending,checksFailed,currentMergeChecks} from '../../server/github-check-selection';
const head='592066a0ef1383220c9a7169924b2ced958405e1',repo='JFusco/cms-field-vocabulary',branch='codex/114-cms13-element-content-options';
function fixture(){
 const pr={number:117,head:{sha:head,ref:branch},base:{ref:'main',sha:'f'.repeat(40),repo:{full_name:repo}}},job:any={head,pr:117};
 const raw:any={total_count:2,check_runs:[{id:124392657056,name:'commitlint',app:{id:15368,slug:'github-actions'},head_sha:head,status:'completed',conclusion:'success',started_at:'2026-10-31T00:55:01Z',completed_at:'2026-10-31T00:55:21Z',details_url:`https://github.com/${repo}/actions/runs/41152703573/job/124392657056`,check_suite:{id:111556576021}},
 {id:124392572677,name:'commitlint',app:{id:15368,slug:'github-actions'},head_sha:head,status:'completed',conclusion:'cancelled',started_at:'2026-10-31T00:54:41Z',completed_at:'2026-10-31T00:54:59Z',details_url:`https://github.com/${repo}/actions/runs/41152687097/job/124392572677`,check_suite:{id:111556534273}}]};
 const make=(i:number)=>{const c=raw.check_runs[i],id=i===0?41152703573:41152687097;return{id,workflow_id:348353911,check_suite_id:c.check_suite.id,path:'.github/workflows/commitlint.yml',event:'pull_request',head_branch:branch,head_sha:head,run_number:i===0?144:143,run_attempt:1,created_at:i===0?'2026-10-31T00:54:51Z':'2026-10-31T00:54:39Z',status:c.status,conclusion:c.conclusion,repository:{id:1354198741,full_name:repo},head_repository:{id:1354198741,full_name:repo},pull_requests:[{number:117,id:5082108022,head:{sha:head,ref:branch,repo:{id:1354198741}},base:{sha:'f'.repeat(40),ref:'main',repo:{id:1354198741}}}]};};
 const runs=[make(0),make(1)],jobs=raw.check_runs.map((c:any,i:number)=>({id:c.id,run_id:runs[i].id,run_attempt:1,head_sha:head,name:c.name,html_url:c.details_url,check_run_url:`https://api.github.com/repos/${repo}/check-runs/${c.id}`,status:c.status,conclusion:c.conclusion,started_at:c.started_at,completed_at:c.completed_at}));
 const inventory:any={total_count:2,workflow_runs:structuredClone(runs)},statuses:any={sha:head,total_count:0,statuses:[],state:'pending'};
 const api=vi.fn(async(path:string)=>{if(path===`commits/${head}/check-runs?per_page=100`)return structuredClone(raw);if(path===`commits/${head}/status`)return structuredClone(statuses);if(path.startsWith('actions/jobs/')){const j=jobs.find((j:any)=>j.id===Number(path.split('/').at(-1)));if(!j)throw Error('Unknown job');return structuredClone(j);}if(path.startsWith('actions/runs/')){const r=runs.find(r=>r.id===Number(path.split('/')[2]));if(!r)throw Error('Unknown run');return structuredClone(r);}if(path.startsWith('actions/workflows/'))return structuredClone(inventory);throw Error('Unexpected '+path);});
 const delivery:any={store:{project:{repository:repo,target:'main'}},api};return{raw,job,pr,runs,jobs,inventory,statuses,api,delivery,select:()=>selectCurrentChecks(delivery,job,raw,pr,statuses)};
}
test('provider-bound matching actual context selects newer run/attempt and retains every raw cancelled ID unchanged',async()=>{
 const f=fixture(),before=JSON.stringify(f.raw),s=await f.select();expect(s.effective.map(c=>c.id)).toEqual([124392657056]);expect(s.superseded).toMatchObject([{oldCheckId:124392572677,currentCheckId:124392657056,oldRunId:41152687097,currentRunId:41152703573}]);expect(checksPassed(s,f.statuses,head)).toBe(true);expect(JSON.stringify(f.raw)).toBe(before);expect(f.api).toHaveBeenCalledTimes(5);
});
test.each(['failure','timed_out','action_required','cancelled','pending'])('newest %s always blocks merge and preserves its actual current state',async outcome=>{
 const f=fixture();for(const x of [f.raw.check_runs[0],f.jobs[0],f.runs[0],f.inventory.workflow_runs[0]]){x.status=outcome==='pending'?'in_progress':'completed';x.conclusion=outcome==='pending'?null:outcome;if('completed_at'in x&&outcome==='pending')x.completed_at=null;}
 const s=await f.select();expect(checksPassed(s,f.statuses,head)).toBe(false);expect(checksPending(s,f.statuses,head)).toBe(outcome==='pending');expect(checksFailed(s,f.statuses,head)).toBe(['failure','timed_out','action_required'].includes(outcome));
});
test.each(['queued','failure'])('newer %s workflow without its check/job row cannot reuse an older green result',async state=>{
 const f=fixture(),newer=structuredClone(f.runs[0]);Object.assign(newer,{id:41152704500,run_number:145,check_suite_id:111556599999,status:state==='queued'?'queued':'completed',conclusion:state==='queued'?null:'failure',created_at:'2026-10-31T00:56:00Z'});f.inventory.workflow_runs.unshift(newer);f.inventory.total_count++;
 if(state==='queued')await expect(f.select()).rejects.toBeInstanceOf(CurrentChecksWait);else await expect(f.select()).rejects.toThrow('missing or ambiguous matching check/job');
});
test.each(['workflow','event','path','app'])('different %s contexts are never silently coalesced by check name',async field=>{
 const f=fixture();if(field==='app')f.raw.check_runs[1].app.id=999;
 else for(const x of [f.runs[1],f.inventory.workflow_runs[1]]){if(field==='workflow')x.workflow_id=222;if(field==='event')x.event='push';if(field==='path')x.path='.github/workflows/other.yml';}
 const s=await f.select();expect(s.superseded).toHaveLength(0);expect(s.effective).toHaveLength(2);expect(checksPassed(s,f.statuses,head)).toBe(false);
});
test.each(['wrong-repository-url','wrong-job-url','wrong-job-id','wrong-suite','wrong-attempt','wrong-head','wrong-branch','wrong-pr','wrong-head-repo','unknown-job','raw-duplicate','raw-missing-page','inventory-limit','inventory-missing-page','inventory-missing-original','inventory-ambiguous-order','inventory-drift','historical-inventory-drift','time-regression'])('supersession fails closed for %s',async kind=>{
 const f=fixture();
 if(kind==='wrong-repository-url')f.raw.check_runs[0].details_url=f.raw.check_runs[0].details_url.replace(repo,'foreign/repo');if(kind==='wrong-job-url')f.jobs[0].check_run_url='https://api.github.com/repos/foreign/repo/check-runs/'+f.jobs[0].id;
 if(kind==='wrong-job-id')f.jobs[0].run_id=99;if(kind==='wrong-suite')f.runs[0].check_suite_id=999;if(kind==='wrong-attempt')f.runs[0].run_attempt=2;if(kind==='wrong-head')f.runs[0].head_sha='a'.repeat(40);
 if(kind==='wrong-branch')f.runs[0].head_branch='foreign';if(kind==='wrong-pr')f.runs[0].pull_requests[0].number=118;if(kind==='wrong-head-repo')f.runs[0].head_repository.id=999;
 if(kind==='unknown-job')f.jobs.splice(0,1);if(kind==='raw-duplicate')f.raw.check_runs[1]=structuredClone(f.raw.check_runs[0]);if(kind==='raw-missing-page')f.raw.total_count++;
 if(kind==='inventory-limit')f.inventory.total_count=101;if(kind==='inventory-missing-page')f.inventory.total_count=3;if(kind==='inventory-missing-original'){f.inventory.workflow_runs.pop();f.inventory.total_count--;}
 if(kind==='inventory-ambiguous-order')f.inventory.workflow_runs[1].run_number=144;if(kind==='inventory-drift')f.inventory.workflow_runs[0].conclusion='failure';if(kind==='historical-inventory-drift')f.inventory.workflow_runs[1].conclusion='success';if(kind==='time-regression'){f.runs[0].created_at='2026-10-31T00:54:00Z';f.inventory.workflow_runs[0].created_at=f.runs[0].created_at;}
 await expect(f.select()).rejects.toThrow();
});
test('a later completed_at cancellation cannot override positively newer workflow numbering',async()=>{
 const f=fixture();f.raw.check_runs[1].completed_at='2026-10-31T00:56:00Z';f.jobs[1].completed_at=f.raw.check_runs[1].completed_at;f.raw.check_runs.reverse();expect(checksPassed(await f.select(),f.statuses,head)).toBe(true);
});
test('unique non-Actions checks stay independent; absent metadata cannot justify dropping their failures',async()=>{
 const f=fixture();f.raw.check_runs[1].app={id:999,slug:'other-provider'};const s=await f.select();expect(s.effective).toHaveLength(2);expect(f.api).not.toHaveBeenCalled();expect(checksPassed(s,f.statuses,head)).toBe(false);
});
test('commit statuses and missing required coverage are not hidden by Actions supersession',async()=>{
 const f=fixture(),s=await f.select();f.statuses.statuses=[{state:'failure',context:'required-external'}];f.statuses.total_count=1;f.statuses.state='failure';expect(checksPassed(s,f.statuses,head)).toBe(false);expect(checksFailed(s,f.statuses,head)).toBe(true);
 f.statuses.total_count=2;expect(()=>checksPassed(s,f.statuses,head)).toThrow('Complete current-head');
});

test('newer queued run cannot hide an independent failed commit status as benign provider wait',async()=>{
 const f=fixture(),newer={...structuredClone(f.runs[0]),id:41152704500,run_number:145,check_suite_id:111556599999,status:'queued',conclusion:null,created_at:'2026-10-31T00:56:00Z'};f.inventory.workflow_runs.unshift(newer);f.inventory.total_count++;
 f.statuses.state='failure';f.statuses.statuses=[{state:'failure',context:'required-external'}];f.statuses.total_count=1;
 try{await f.select();throw new Error('Unexpected selection');}catch(error){expect(error).not.toBeInstanceOf(CurrentChecksWait);expect(String(error)).toContain('missing or ambiguous matching check/job');}
});

test('complete empty pending statuses allow passing current Actions without changing raw provider inputs',async()=>{
 const f=fixture(),inputs=()=>[f.raw,f.statuses,f.runs,f.jobs,f.inventory,f.pr,f.job],before=structuredClone(inputs());
 expect(f.statuses).toEqual({sha:head,state:'pending',total_count:0,statuses:[]});
 const s=await f.select();expect(s.effective.map(c=>c.id)).toEqual([f.raw.check_runs[0].id]);expect(s.superseded).toHaveLength(1);
 expect(checksPassed(s,f.statuses,head)).toBe(true);expect(checksPending(s,f.statuses,head)).toBe(false);expect(checksFailed(s,f.statuses,head)).toBe(false);
 await expect(currentMergeChecks(f.delivery,f.job,f.pr)).resolves.toEqual(s);expect(inputs()).toEqual(before);
});

test.each(['success','pending'])('empty %s statuses without any check rows still deny merge',async state=>{
 const f=fixture();f.raw.check_runs=[];f.raw.total_count=0;f.statuses.state=state;
 const s=await f.select();expect(checksPassed(s,f.statuses,head)).toBe(false);expect(checksPending(s,f.statuses,head)).toBe(false);expect(checksFailed(s,f.statuses,head)).toBe(false);
 await expect(currentMergeChecks(f.delivery,f.job,f.pr)).rejects.toThrow('Current-head checks have not all passed');
});

test.each([
 {row:'success',aggregate:'pending',wait:false,failed:false},
 {row:'pending',aggregate:'pending',wait:true,failed:false},
 {row:'pending',aggregate:'success',wait:true,failed:false},
 {row:'failure',aggregate:'success',wait:false,failed:true},
 {row:'error',aggregate:'success',wait:false,failed:true},
 {row:'unknown',aggregate:'success',wait:false,failed:false},
])('nonempty $row status with $aggregate aggregate retains readiness and wait semantics',async({row,aggregate,wait,failed})=>{
 const f=fixture();Object.assign(f.statuses,{state:aggregate,total_count:1,statuses:[{context:'external-check',state:row}]});
 const s=await f.select();expect(checksPassed(s,f.statuses,head)).toBe(false);expect(checksPending(s,f.statuses,head)).toBe(wait);expect(checksFailed(s,f.statuses,head)).toBe(failed);
 const merge=currentMergeChecks(f.delivery,f.job,f.pr);
 if(wait)await expect(merge).rejects.toBeInstanceOf(CurrentChecksWait);else await expect(merge).rejects.toThrow('Current-head checks have not all passed');
});

test.each(['failure','error','unknown',undefined])('empty %s status aggregate cannot use the empty pending exception',async state=>{
 const f=fixture();f.statuses.state=state;const s=await f.select();
 expect(checksPassed(s,f.statuses,head)).toBe(false);expect(checksPending(s,f.statuses,head)).toBe(false);expect(checksFailed(s,f.statuses,head)).toBe(false);
 await expect(currentMergeChecks(f.delivery,f.job,f.pr)).rejects.toThrow('Current-head checks have not all passed');
});

test.each(['wrong-head','incomplete','missing-count','unexpected-row'])('empty pending exception preserves %s status coverage denial',async kind=>{
 const f=fixture(),s=await f.select();
 if(kind==='wrong-head')f.statuses.sha='0'.repeat(40);if(kind==='incomplete')f.statuses.total_count=1;if(kind==='missing-count')delete f.statuses.total_count;if(kind==='unexpected-row')f.statuses.statuses=[{state:'success'}];
 for(const predicate of [checksPassed,checksPending,checksFailed])expect(()=>predicate(s,f.statuses,head)).toThrow('Complete current-head commit statuses required');
 await expect(currentMergeChecks(f.delivery,f.job,f.pr)).rejects.toThrow('Complete current-head commit statuses required');
});
