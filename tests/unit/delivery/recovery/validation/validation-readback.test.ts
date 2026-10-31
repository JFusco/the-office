import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync,symlinkSync,renameSync,cpSync,readdirSync} from 'node:fs';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {GitOperations} from '../../../../../server/github/git-operations';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {validationReadbackCandidate,reconcileValidation} from '../../../../../server/delivery/recovery/validation/validation-readback';
import {readValidationProviderContext,validationProviderVersion} from '../../../../../server/delivery/recovery/validation/validation-provider-context';
import {ITSpecialist} from '../../../../../server/it/it-specialist';
import {enqueueRequest,executeRequest} from '../../../../../server/scheduling/requests';
import type {StageResult,TicketJob} from '../../../../../src/shared';
const roots:string[]=[],stores:Store[]=[],processes:number[]=[];
function liveProcess(){const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});child.unref();processes.push(child.pid!);return child.pid!;}
afterEach(()=>{for(const pid of processes.splice(0))try{process.kill(-pid,'SIGKILL');}catch{}vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true}));});
function replaceDirectory(path:string,symlink=true){const foreign=path+'-foreign';renameSync(path,foreign);if(symlink)symlinkSync(foreign,path);else cpSync(foreign,path,{recursive:true});}
function fixture(realWorktree=false){
 const root=mkdtempSync(resolve(tmpdir(),'office-qa-readback-'));roots.push(root);
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo:resolve(root,'primary')},root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const engine=new Engine(store),worktree=resolve(root,'candidate'),branch='codex/113-fixture';mkdirSync(worktree);
 let head='a'.repeat(40);
 if(realWorktree){execFileSync('git',['clone','--shared','--quiet',resolve(import.meta.dirname,'../../../../..'),worktree]);execFileSync('git',['checkout','--quiet','-b',branch],{cwd:worktree});head=execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim();}
 const job:TicketJob={id:'job',key:'GH-113',requestedAt:'',stage:'validate',status:'blocked',head,worktree,branch,pr:0,prUrl:'',detail:'Error: Worker exited with surviving subprocesses; effects require reconciliation',steps:[]};store.state.coordination.jobs=[job];
 const check=resolve(root,'ticket-work/job/checks.log');mkdirSync(resolve(root,'ticket-work/job'),{recursive:true});writeFileSync(check,'required check complete: exit 0');
 const result:StageResult={outcome:'passed',summary:'Synthetic completed checks',commit:head,worktree,branch,prId:0,findings:[{id:'original-finding',summary:'Fixture',expected:'Fixture',actual:'Verified fixture',attempts:1,status:'verified'}],receipts:[],evidence:[{id:'checks',kind:'checks',path:check,commit:head,summary:'Fixture checks',environment:'unit fixture',url:'',observedAt:''}],paidRuns:0,qaRunDir:'',previewUrl:'',blocker:'',prerequisites:null,approach:null};
 job.steps=[{stage:'review',result:structuredClone(result)}];job.candidateRecovery={head,findingIds:['original-finding'],summary:'Fixture'};job.implementationRecovery={kind:'candidate',workId:'implementation',at:''};
 const lead:any={id:'lead',sessionId:'lead-native',requestId:job.id,ticket:job.key,role:'lead',provider:'codex',stage:'github-review',status:'completed',startedAt:'2026-10-30T00:00:00Z',endedAt:'2026-10-30T00:01:00Z'};
 const original:any={id:'original',sessionId:'original-native',requestId:job.id,ticket:job.key,role:'qa',provider:'codex',stage:'github-validate',status:'failed',processId:2147483647,startedAt:'2026-10-30T00:02:00Z',endedAt:'2026-10-30T00:03:00Z'};
 store.state.workLog=[lead,original];
 const put=(id:string,name:string,value:any)=>{const dir=resolve(root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 const provider=(role:string,readOnly:boolean)=>({project:store.project.id,repository:store.project.repository,role,provider:'codex',readOnly});
 put('lead','provider.json',provider('lead',true));put('lead','result.json',{session:lead.sessionId,result:job.steps[0].result});
 put('original','provider.json',provider('qa',false));put('original','completed-output.json',result);
 put('original','error.json',{session:original.sessionId,provider:'codex',error:job.detail});
 put('original','capabilities.json',{name:'github-native',readOnly:false});
 put('original','assignment.json',{id:original.id,work:{projectId:store.project.id,kind:'delivery',id:job.id},lane:'delivery',stage:'github-validate',role:'qa',scope:{repository:store.project.repository,worktree,artifacts:resolve(root,'sessions/original')},profile:'github-native'});
 const identity=(id:string,session:string)=>({attemptId:id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,role:'qa',threadId:session});
 put('original','assignment-identity.json',identity(original.id,original.sessionId));
 const sha=createHash('sha256').update(readFileSync(resolve(root,'sessions/original/completed-output.json'))).digest('hex');
 const assessment={outcome:'passed',originalWorkId:'original',nativeSessionId:original.sessionId,checkpointSha256:sha,commit:head,completeNativeExecution:true,checksVerified:true,effectsVerified:true,noHumanHold:true,nativeRecordCount:42,nativeSessionPath:'/private/native-original.jsonl',verifiedFindingIds:['original-finding'],summary:'Independently verified complete native execution and unchanged checks',evidence:[{path:'/private/native-original.jsonl:42',summary:'All native command exits and check logs verified'}]};
 const readback=()=>{const id='reader-'+store.state.workLog!.length,session='native-'+id;store.state.workLog!.push({id,sessionId:session,requestId:job.id,ticket:job.key,role:'qa',provider:'codex',stage:'validation-readback',status:'completed',processId:2147483646,endedAt:'2026-10-30T00:05:00Z',effortKind:'administrative'} as any);put(id,'provider.json',provider('qa',true));put(id,'result.json',{session,result:assessment});put(id,'assignment-identity.json',identity(id,session));put(id,'capabilities.json',{name:'reader',readOnly:true});return structuredClone(assessment);};
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback() as any);
 const issue={number:113,html_url:'https://github.com/JFusco/cms-field-vocabulary/issues/113',state:'open',title:'Fixture',body:'Fixture scope',labels:[],assignees:[{login:'JFusco'}],updated_at:'2026-10-30T00:00:00Z'};
 const execute=vi.fn(async(program:string,args:string[])=>{
  if(args.some(arg=>arg.includes('/comments?')))return '[]';
  if(program==='git'){
   if(args[0]==='ls-remote')return '';
   if(realWorktree)return execFileSync('git',args,{cwd:worktree,encoding:'utf8'});
   if(args[0]==='rev-parse')return head;
   if(args[0]==='branch')return branch;
   if(args[0]==='status')return '';
  }
  return program==='gh'&&args[0]==='pr'?'[]':JSON.stringify(issue);
 });
 const delivery=new GitHubDelivery(store,engine,execute as any);
 const verify=vi.spyOn(engine.maintenance,'verifyCandidate').mockResolvedValue(undefined);
 vi.spyOn(GitOperations.prototype,'candidate').mockResolvedValue({base:'b'.repeat(40),files:['fixture.json'],diff:'Fixture'});
 const board:any={items:[{id:'item-113',repository:store.project.repository,number:113,status:'In review'}]};vi.spyOn(engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 return {root,store,engine,job,original,lead,result,check,put,run,readback,assessment,delivery,execute,verify,issue,ownership,board};
}
test('a fresh read-only Riley verifies the exact original and queues normal publication once without rewriting its failure',async()=>{
 const a=fixture(),original=JSON.stringify(a.original),prior=JSON.stringify(a.job.steps),checkpoint=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 expect(validationReadbackCandidate(a.store,a.job)?.work.id).toBe('original');
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);
 expect(a.job).toMatchObject({status:'queued',stage:'draft',head:a.result.commit,branch:a.result.branch,worktree:a.result.worktree});
 expect(JSON.stringify(a.original)).toBe(original);expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(prior);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(checkpoint);
 expect(a.run).toHaveBeenCalledTimes(1);expect(a.run.mock.calls[0]).toMatchObject(['qa',expect.stringContaining('COMPLETE original native session'),expect.anything(),expect.objectContaining({readOnly:true,effortKind:'administrative',stage:'validation-readback',requestId:a.job.id})]);
 const step=a.job.steps.at(-1)!;expect(step).toMatchObject({stage:'validate',workerId:'reader-2',result:{outcome:'passed',commit:a.job.head,approach:null,receipts:[{action:'validation-readback',target:'original',verified:true,uncertain:false}]}});
 const proof=JSON.parse(readFileSync(step.result.evidence.at(-1)!.path,'utf8'));expect(proof.readerId).toBe('reader-2');expect(proof.originalWorkId).toBe('original');expect(proof.evidenceDigests).toHaveLength(13);
 expect(a.verify).toHaveBeenCalledTimes(2);expect(a.ownership).toHaveBeenCalledTimes(2);
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Exact stopped');expect(a.run).toHaveBeenCalledTimes(1);
});
test.each(['wrong-worker','wrong-session','active-process','untrusted-checkpoint','changed-head','uncertain-receipt','unverified-finding','missing-review','source-amendment','published','unknown-error','symlink-check','foreign-check'] as const)('does not dispatch or advance an unsafe original: %s',async scenario=>{
 const a=fixture();
 if(scenario==='wrong-worker')a.original.role='developer';
 if(scenario==='wrong-session')a.put('original','assignment-identity.json',{threadId:'other'});
 if(scenario==='active-process')a.original.processId=liveProcess();
 if(scenario==='untrusted-checkpoint')a.put('original','completed-output.json',{summary:'Passed without native proof'});
 if(scenario==='changed-head')a.job.head='b'.repeat(40);
 if(scenario==='uncertain-receipt'){a.result.receipts.push({id:'write',action:'push',target:'branch',verified:false,uncertain:true,detail:'Unknown'});a.put('original','completed-output.json',a.result);}
 if(scenario==='unverified-finding'){a.result.findings[0].status='open';a.put('original','completed-output.json',a.result);}
 if(scenario==='missing-review')a.lead.status='failed';
 if(scenario==='source-amendment')a.job.sourceAmendment={} as any;
 if(scenario==='published')a.job.pr=123;
 if(scenario==='unknown-error')a.job.detail='Error: unknown writable worker failure';
 if(scenario==='symlink-check'){rmSync(a.check);symlinkSync(resolve(a.root,'sessions/original/provider.json'),a.check);}
 if(scenario==='foreign-check'){a.result.evidence[0].path=resolve(a.root,'sessions/original/provider.json');a.put('original','completed-output.json',a.result);}
 const prior=JSON.stringify(a.job);expect(validationReadbackCandidate(a.store,a.job)).toBeUndefined();await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);
});
test.each(['checkpoint','check-log','session','project','head','issue','ownership','pause','drain','new-active','process-identity','board-hold','board-change'] as const)('rechecks %s immediately before committing QA recovery',async scenario=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{const r=a.readback();
  if(scenario==='checkpoint')a.put('original','completed-output.json',{...a.result,summary:'Changed'});
  if(scenario==='check-log')writeFileSync(a.check,'Replaced check output');
  if(scenario==='session')a.original.sessionId='changed';
  if(scenario==='process-identity')a.original.processId=2147483645;
  if(scenario==='project')a.store.project.repository='JFusco/other';
  if(scenario==='head')a.job.head='b'.repeat(40);
  if(scenario==='issue')a.issue.body='Changed scope';
  if(scenario==='board-hold')a.board.items[0].status='Backlog';
  if(scenario==='board-change')a.board.items[0].status='Ready';
  if(scenario==='ownership')a.ownership.mockResolvedValue({complete:true,fresh:true,ownership:{status:'owned'}});
  if(scenario==='pause')a.store.state.paused=true;
  if(scenario==='drain')a.store.state.draining=true;
  if(scenario==='new-active')a.store.state.workLog!.push({...a.original,id:'another',status:'stopping'});
  return r as any;
 });
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();expect(a.job.steps).toHaveLength(1);expect(a.job.status).toBe('blocked');if(scenario!=='head')expect(JSON.stringify(a.job)).toBe(prior);
});
test.each(['sessions','sessions/original','sessions/lead','ticket-work','ticket-work/job'])('rejects an artifact parent aliased to an identical sibling before dispatch: %s',async path=>{
 const a=fixture(),prior=JSON.stringify(a.job),original=JSON.stringify(a.original);
 replaceDirectory(resolve(a.root,path));
 expect(validationReadbackCandidate(a.store,a.job)).toBeUndefined();
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Exact stopped');
 expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);expect(JSON.stringify(a.original)).toBe(original);
});
test('rejects reader artifacts under a symlinked session directory',async()=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{const result=a.readback();replaceDirectory(resolve(a.root,'sessions/reader-2'));return result as any;});
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('symbolic links');
 expect(JSON.stringify(a.job)).toBe(prior);expect(a.original.status).toBe('failed');expect(readdirSync(resolve(a.root,'ticket-work/job'))).toEqual(['checks.log']);
});
test.each(['sessions','sessions/original','sessions/lead','sessions/reader-2','ticket-work','ticket-work/job'].flatMap(path=>[true,false].map(symlink=>({path,symlink}))))('rejects identical-content directory replacement at final ownership: $path (symlink=$symlink)',async({path,symlink})=>{
 const a=fixture(),prior=JSON.stringify(a.job),original=JSON.stringify(a.original),checkpoint=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 a.ownership.mockImplementation(async()=>{if(a.ownership.mock.calls.length===2)replaceDirectory(resolve(a.root,path),symlink);return {complete:true,fresh:true,ownership:{status:'clear'}};});
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();
 expect(a.run).toHaveBeenCalledTimes(1);expect(a.ownership).toHaveBeenCalledTimes(2);expect(JSON.stringify(a.job)).toBe(prior);expect(JSON.stringify(a.original)).toBe(original);
 expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(checkpoint);expect(readdirSync(resolve(a.root,'ticket-work/job'))).toEqual(['checks.log']);
});
test.each([false,true])('checks the actual local worktree after final ownership (source edit=%s)',async changed=>{
 const a=fixture(true),prior=JSON.stringify(a.job),original=JSON.stringify(a.original),checkpoint=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 a.ownership.mockImplementation(async()=>{if(changed&&a.ownership.mock.calls.length===2)writeFileSync(resolve(a.job.worktree,'package.json'),'Changed during final ownership');return {complete:true,fresh:true,ownership:{status:'clear'}};});
 const recovery=reconcileValidation(a.delivery,a.job.key,'original',a.ownership);
 if(changed){await expect(recovery).rejects.toThrow('clean worktree changed');expect(JSON.stringify(a.job)).toBe(prior);expect(readdirSync(resolve(a.root,'ticket-work/job'))).toEqual(['checks.log']);}
 else{await recovery;expect(a.job).toMatchObject({stage:'draft',status:'queued'});expect(a.job.steps.filter(step=>step.stage==='validate')).toHaveLength(1);}
 expect(a.ownership).toHaveBeenCalledTimes(2);expect(JSON.stringify(a.original)).toBe(original);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(checkpoint);
});
test.each(['missing-execution','missing-checks','unknown-effects','human-hold','omitted-finding','wrong-checkpoint','wrong-session','wrong-role','wrong-provider','reader-active','reader-result','duplicate-reader'] as const)('requires positive actual independent Riley evidence: %s',async scenario=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 if(scenario==='missing-execution')a.assessment.completeNativeExecution=false;
 if(scenario==='missing-checks')a.assessment.checksVerified=false;
 if(scenario==='unknown-effects')a.assessment.effectsVerified=false;
 if(scenario==='human-hold')a.assessment.noHumanHold=false;
 if(scenario==='omitted-finding')a.assessment.verifiedFindingIds=[];
 if(scenario==='wrong-checkpoint')a.assessment.checkpointSha256='b'.repeat(64);
 a.run.mockImplementation(async()=>{const r=a.readback(),reader=a.store.state.workLog!.at(-1)!;
  if(scenario==='wrong-session')reader.sessionId='other';
  if(scenario==='wrong-role')reader.role='cto';
  if(scenario==='wrong-provider')a.put(reader.id,'provider.json',{readOnly:false});
  if(scenario==='reader-active')reader.processId=liveProcess();
  if(scenario==='reader-result')a.put(reader.id,'result.json',{session:reader.sessionId,result:{...r,summary:'Different'}});
  if(scenario==='duplicate-reader')a.readback();
  return r as any;
 });
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();expect(JSON.stringify(a.job)).toBe(prior);
});
test('legacy missing empty evidence URL is additive only; malformed required check fields remain rejected',()=>{
 const a=fixture();delete (a.result.evidence[0] as any).url;a.put('original','completed-output.json',a.result);expect(validationReadbackCandidate(a.store,a.job)?.result.evidence[0].url).toBe('');delete (a.result.evidence[0] as any).commit;a.put('original','completed-output.json',a.result);expect(validationReadbackCandidate(a.store,a.job)).toBeUndefined();
});
test('IT queues durable QA read-back in the delivery lane and preserves retry budgets and pauses',async()=>{
 const a=fixture(),it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])} as any,{report:async()=>({services:[]})} as any);
 await it.tick(new Date('2026-10-30T01:00Z'),true);await it.tick(new Date('2026-10-30T01:01Z'),true);
 expect(a.store.state.coordination!.requests).toEqual([expect.objectContaining({action:'reconcile-validation',head:'original',key:a.job.key,lane:'delivery',status:'queued'})]);expect(a.run).not.toHaveBeenCalled();
 const recovery=structuredClone(a.store.state.it!.recoveries);a.store.state.paused=true;await it.tick(new Date('2026-10-30T01:02Z'),true);expect(a.store.state.it!.recoveries).toEqual(recovery);
 a.store.state.paused=false;a.store.state.draining=true;await it.tick(new Date('2026-10-30T01:03Z'),true);expect(a.store.state.it!.recoveries).toEqual(recovery);
});
test.each(['review','completed'] as const)('IT clears its retained validation follow-up when the job leaves stopped QA: %s',async next=>{
 const a=fixture(),it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])} as any,{report:async()=>({services:[]})} as any);
 await it.tick(new Date('2026-10-30T01:00Z'),true);
 const id='validation:job:original';expect(a.store.state.it!.recoveries[id].status).toBe('retrying');
 a.job.stage=next==='review'?'review':'draft';a.job.status=next==='review'?'queued':'completed';a.store.state.paused=false;a.store.state.draining=false;
 await it.tick(new Date('2026-10-30T01:01Z'),true);
 expect(a.store.state.it!.recoveries[id].status).toBe('resolved');expect(a.store.state.it!.reports.at(-1)!.followUps.some(f=>f.id===id)).toBe(false);expect(a.store.state.it!.status).toBe('monitoring');
 expect(a.job.steps.some(step=>step.stage==='validate')).toBe(false);expect(a.run).not.toHaveBeenCalled();
});
test('request handler owns one reconciliation and retains its durable original identity',async()=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');expect(enqueueRequest(a.store,'reconcile-validation',a.job.key,'original')).toBe(request);
 const ownership={refresh:async()=>{},forProject:a.ownership};
 // executeRequest constructs its own adapter; supply the same read-only transport through the prototype.
 vi.spyOn(GitHubDelivery.prototype,'api').mockImplementation(async(path)=>path.includes('/comments?')?[]:structuredClone(a.issue));
 // Exercise handler selection without allowing a real Git/gh call: candidate verification is stopped here.
 a.verify.mockRejectedValueOnce(new Error('Synthetic candidate fence'));
 await executeRequest(a.store,a.engine,{sessionBridge:ownership} as any,request);
 expect(request).toMatchObject({action:'reconcile-validation',head:'original',status:'blocked',detail:expect.stringContaining('Synthetic candidate fence')});expect(a.run).not.toHaveBeenCalled();expect(a.job.status).toBe('blocked');
});
test('commits the exact working intent and accepted QA together before any wrapper notification',async()=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';a.store.save();
 const save=a.store.save.bind(a.store),commits:any[]=[];
 vi.spyOn(a.store,'save').mockImplementation(()=>{commits.push({stage:a.store.state.coordination!.jobs![0].stage,status:a.store.state.coordination!.requests![0].status});save();});
 const old=JSON.stringify(a.original);
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id);
 expect(commits).toEqual([{stage:'draft',status:'completed'}]);
 const persisted=JSON.parse((a.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body);
 expect(persisted.coordination.requests[0]).toMatchObject({id:request.id,action:'reconcile-validation',head:'original',status:'completed'});
 expect(persisted.coordination.jobs[0]).toMatchObject({stage:'draft',status:'queued'});expect(persisted.coordination.jobs[0].steps.at(-1).result.receipts).toContainEqual(expect.objectContaining({action:'validation-readback',target:'original',verified:true}));
 expect(JSON.stringify(a.original)).toBe(old);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.intentId).toBe(request.id);
 expect(enqueueRequest(a.store,'reconcile-validation',a.job.key,'original')).toBe(request);expect(a.store.state.coordination!.requests).toHaveLength(1);expect(a.run).toHaveBeenCalledTimes(1);
 // This is the state visible after a process dies before executeRequest can notify or save again.
 expect(persisted.coordination.requests.filter((r:any)=>r.action==='reconcile-validation'&&r.status!=='completed')).toEqual([]);
});
test('a precommit failure rolls back the intent and job together, keeping private proof non-authoritative',async()=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';a.store.save();
 const savedBefore=(a.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body;
 vi.spyOn(a.store,'save').mockImplementation(()=>{expect(a.store.state.coordination!.jobs![0].stage).toBe('draft');expect(a.store.state.coordination!.requests![0].status).toBe('completed');throw new Error('Injected atomic persistence failure');});
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id)).rejects.toThrow('Injected atomic');
 expect(a.store.state.coordination!.requests![0]).toMatchObject({id:request.id,status:'working'});expect(a.store.state.coordination!.jobs![0]).toMatchObject({stage:'validate',status:'blocked'});expect(a.store.state.coordination!.jobs![0].steps).toHaveLength(1);
 expect((a.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body).toBe(savedBefore);expect(a.store.state.workLog!.find(w=>w.id==='original')!.status).toBe('failed');
});
test.each(['status','head','replacement'] as const)('a changed durable intent blocks QA adoption: %s',async change=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';
 a.run.mockImplementation(async()=>{const result=a.readback();if(change==='status')request.status='interrupted';if(change==='head')request.head='other-original';if(change==='replacement')a.store.state.coordination!.requests=[{...request}];return result as any;});
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id)).rejects.toThrow('intent changed');expect(a.job).toMatchObject({stage:'validate',status:'blocked'});expect(a.job.steps).toHaveLength(1);
});
test.each(['missing','wrong-action','not-working'] as const)('requires the scheduler supplied exact working intent: %s',async change=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';if(change==='wrong-action')request.action='refresh';if(change==='not-working')request.status='queued';
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership,change==='missing'?'missing':request.id)).rejects.toThrow('Exact working validation intent');expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('validate');
});

test('supplies actual owned-group kernel evidence when the old native artifacts omit their PGID',async()=>{
 const a=fixture();expect(JSON.parse(readFileSync(resolve(a.root,'sessions/original/error.json'),'utf8')).processId).toBeUndefined();
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);
 const prompt=a.run.mock.calls[0][1];expect(prompt).toContain('"processGroupId":2147483647');expect(prompt).toContain('"result":"ESRCH"');expect(prompt).toContain('WorkTime.processId');expect(prompt).toContain('does not prove check success or reconcile effects');
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.terminationObservations).toHaveLength(2);
 for(const observed of proof.terminationObservations)expect(observed).toMatchObject({workerId:'original',nativeSessionId:'original-native',processGroupId:2147483647,probe:'process.kill(-processGroupId, 0)',result:'ESRCH',observedAt:expect.any(String)});
 expect(a.original.status).toBe('failed');
});
test.each([undefined,0,-2147483647,1.5,NaN,'94096'])('does not invent termination evidence from missing or invalid PID %s',async pid=>{
 const a=fixture();a.original.processId=pid;expect(validationReadbackCandidate(a.store,a.job)).toBeUndefined();await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Exact stopped');expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('validate');
});

test.each(['already-draining','drain-during-readback'] as const)('the exact live scheduler claim may finish a drain: %s',async when=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:request.id},'test-scheduler','reconcile-validation','delivery')!;
 if(when==='already-draining')a.store.state.draining=true;else a.run.mockImplementation(async()=>{const result=a.readback();a.store.state.draining=true;return result as any;});
 await withAssignment(claim,'delivery',()=>reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id));
 expect(a.job).toMatchObject({stage:'draft',status:'queued'});expect(request.status).toBe('completed');expect(a.store.state.draining).toBe(true);expect(a.store.activeClaims()).toContainEqual(claim);
});
test.each(['unowned','stopping','other-intent'] as const)('a drain never admits an invalid claim: %s',async change=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:change==='other-intent'?'other':request.id},'test-scheduler','reconcile-validation','delivery')!;
 if(change==='unowned')a.store.finishClaim(claim.id,'completed');if(change==='stopping')a.store.finishClaim(claim.id,'stopping');a.store.state.draining=true;
 await expect(withAssignment(claim,'delivery',()=>reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id))).rejects.toThrow('Validation identity');expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('validate');
});
test('a valid admitted claim never overrides a human pause during a drain',async()=>{
 const a=fixture(),request=enqueueRequest(a.store,'reconcile-validation',a.job.key,'original');request.status='working';
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:request.id},'test-scheduler','reconcile-validation','delivery')!;
 a.run.mockImplementation(async()=>{const result=a.readback();a.store.state.draining=true;a.store.state.paused=true;return result as any;});
 await expect(withAssignment(claim,'delivery',()=>reconcileValidation(a.delivery,a.job.key,'original',a.ownership,request.id))).rejects.toThrow('Validation identity');expect(a.job.stage).toBe('validate');expect(request.status).toBe('working');
});

function commentFor(a:ReturnType<typeof fixture>,id:number,body=`Comment ${id}`){return {id,issue_url:`https://api.github.com/repos/${a.store.project.repository}/issues/113`,html_url:`${a.issue.html_url}#issuecomment-${id}`,body,user:{login:'JFusco'},author_association:'OWNER',created_at:'2026-10-30T00:00:00Z',updated_at:'2026-10-30T00:00:00Z'};}
test('passes complete fresh provider facts across comment pages and retains before/after observations',async()=>{
 const a=fixture(),comments=Array.from({length:101},(_,i)=>commentFor(a,i+1));
 const api=vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?structuredClone(comments.slice(path.endsWith('page=1')?0:100,path.endsWith('page=1')?100:101)):structuredClone(a.issue));
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);
 const prompt=a.run.mock.calls[0][1];expect(prompt).toContain('CURRENT PROVIDER FACTS');expect(prompt).toContain('Comment 101');expect(prompt).toContain('"status":"In review"');expect(prompt).toContain('do not call the Office bridge');
 expect(api.mock.calls.filter(call=>call[0].includes('/comments?')).map(call=>call[0])).toEqual(['issues/113/comments?per_page=100&page=1','issues/113/comments?per_page=100&page=2','issues/113/comments?per_page=100&page=1','issues/113/comments?per_page=100&page=2']);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.providerObservations.before.comments).toHaveLength(101);expect(proof.providerObservations.after.comments).toHaveLength(101);expect(proof.providerObservations.before.board.item.id).toBe('item-113');expect(proof.providerObservations.after.issue.number).toBe(113);
});
test('binds immutable identities in the native schema, rejecting the actual extra-checksum-character failure',async()=>{
 const a=fixture();await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);const schema=a.run.mock.calls[0][2] as any;expect(schema.parse(a.assessment)).toEqual(a.assessment);
 for(const [field,value]of Object.entries({originalWorkId:'other-original',nativeSessionId:'other-native',checkpointSha256:a.assessment.checkpointSha256+'c',commit:'b'.repeat(40)}))expect(()=>schema.parse({...a.assessment,[field]:value})).toThrow();
});
test('a comment-only edit during readback blocks adoption even when issue updated_at stays unchanged',async()=>{
 const a=fixture(),comment=commentFor(a,1);vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?[structuredClone(comment)]:structuredClone(a.issue));
 a.run.mockImplementation(async()=>{const r=a.readback();comment.body='New human hold';return r as any;});await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Issue or Riley');expect(a.job.stage).toBe('validate');
});
test.each(['foreign-comment','duplicate-page','unavailable','permission','oversize','foreign-issue'] as const)('missing or untrusted provider context is never substituted: %s',async change=>{
 const a=fixture(),comment=commentFor(a,1);if(change==='foreign-comment')comment.issue_url='https://api.github.com/repos/JFusco/other/issues/113';if(change==='oversize')comment.body='x'.repeat(1024*1024+1);if(change==='foreign-issue')a.issue.html_url='https://github.com/JFusco/other/issues/113';
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>{if(!path.includes('/comments?'))return structuredClone(a.issue);if(change==='permission')throw new Error('Provider permission denied');if(change==='unavailable')return {};if(change==='duplicate-page')return Array(100).fill(comment);return [structuredClone(comment)];});
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('validate');expect(a.original.status).toBe('failed');
});

test('bounds the whole provider context when comments alone fit below 1 MiB',async()=>{
 const a=fixture(),comments=Array.from({length:16},(_,i)=>commentFor(a,i+1,'x'.repeat(65000))),prior=JSON.stringify(a.job),original=JSON.stringify(a.original);
 const commentBytes=Buffer.byteLength(JSON.stringify(comments.map(({issue_url,...comment})=>comment)),'utf8');
 expect(commentBytes).toBeLessThan(1024*1024);expect(commentBytes).toBeGreaterThan(1024*1024-10000);a.issue.body='y'.repeat(60000);
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?structuredClone(comments):structuredClone(a.issue));
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Current issue comment context exceeds the bounded packet; none was truncated');
 expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('validate');expect(JSON.stringify(a.job)).toBe(prior);expect(JSON.stringify(a.original)).toBe(original);
});

const incompleteProviderFields=[
 {resource:'issue',field:'title',invalid:null},{resource:'issue',field:'body',invalid:0},
 {resource:'issue',field:'labels',invalid:{}},{resource:'issue',field:'updated_at',invalid:''},
 {resource:'comment',field:'user',invalid:{}},{resource:'comment',field:'author_association',invalid:null},
 {resource:'comment',field:'created_at',invalid:''},{resource:'comment',field:'updated_at',invalid:null},
];
test.each(incompleteProviderFields.flatMap(field=>[true,false].flatMap(missing=>[false,true].map(after=>({...field,missing,after})))))('rejects incomplete $resource field $field (missing=$missing, after=$after)',async({resource,field,invalid,missing,after})=>{
 const a=fixture(),comment=commentFor(a,1),prior=JSON.stringify(a.job),original=JSON.stringify(a.original),checkpoint=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 const invalidate=()=>{const record=resource==='issue'?a.issue:comment;if(missing)delete (record as any)[field];else (record as any)[field]=invalid;};
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?[structuredClone(comment)]:structuredClone(a.issue));
 if(after)a.run.mockImplementation(async()=>{const result=a.readback();invalidate();return result as any;});else invalidate();
 await expect(reconcileValidation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow(resource==='issue'?'Current issue scope is unavailable':'Current issue comment identity or pagination is unverified');
 expect(a.run).toHaveBeenCalledTimes(after?1:0);expect(a.job.stage).toBe('validate');expect(JSON.stringify(a.job)).toBe(prior);expect(JSON.stringify(a.original)).toBe(original);
 expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(checkpoint);expect(readdirSync(resolve(a.root,'ticket-work/job'))).toEqual(['checks.log']);
});
test.each([null,''])('retains explicitly empty or null scope and a null comment author (body=%s)',async body=>{
 const a=fixture(),comment={...commentFor(a,1,''),user:null};(a.issue as any).body=body;
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?[structuredClone(comment)]:structuredClone(a.issue));
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));
 for(const observation of [proof.providerObservations.before,proof.providerObservations.after]){expect(observation.issue.body).toBe(body);expect(observation.issue.labels).toEqual([]);expect(observation.comments[0]).toMatchObject({body:'',user:null,created_at:comment.created_at,updated_at:comment.updated_at});}
});

test('ignores assignee avatars and other API metadata in provider versions and read-back adoption',async()=>{
 const a=fixture();Object.assign(a.issue.assignees[0],{id:1,avatar_url:'old-avatar'});(a.issue.labels as any[])=[{id:10,name:'review',color:'ffffff'}];
 const before=await readValidationProviderContext(a.delivery,a.job.key),after=structuredClone(before);
 after.observedAt='2026-10-30T00:10:00Z';Object.assign(after.issue,{url:'unrelated-api-url'});Object.assign(after.issue.assignees[0],{avatar_url:'new-avatar'});Object.assign(after.issue.labels[0],{color:'000000'});
 expect(validationProviderVersion(after)).toBe(validationProviderVersion(before));
 a.run.mockImplementation(async()=>{const result=a.readback();Object.assign(a.issue.assignees[0],{avatar_url:'new-avatar'});Object.assign(a.issue.labels[0],{color:'000000'});return result as any;});
 await reconcileValidation(a.delivery,a.job.key,'original',a.ownership);expect(a.job.stage).toBe('draft');expect(a.original.status).toBe('failed');
});
test.each([
 {field:'assignee id',mutate:(c:any)=>c.issue.assignees[0].id++},
 {field:'assignee login',mutate:(c:any)=>c.issue.assignees[0].login='other'},
 {field:'label id',mutate:(c:any)=>c.issue.labels[0].id++},
 {field:'label name',mutate:(c:any)=>c.issue.labels[0].name='hold'},
 {field:'issue body',mutate:(c:any)=>c.issue.body='Changed scope'},
 {field:'issue title',mutate:(c:any)=>c.issue.title='Changed title'},
 {field:'comment body',mutate:(c:any)=>c.comments[0].body='Human hold'},
 {field:'board lane',mutate:(c:any)=>c.board.item.status='Ready'},
])('provider version retains changes to $field',async({mutate})=>{
 const a=fixture(),comment=commentFor(a,1);Object.assign(a.issue.assignees[0],{id:1});(a.issue.labels as any[])=[{id:10,name:'review'}];
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>path.includes('/comments?')?[structuredClone(comment)]:structuredClone(a.issue));
 const before=await readValidationProviderContext(a.delivery,a.job.key),after=structuredClone(before);mutate(after);
 expect(validationProviderVersion(after)).not.toBe(validationProviderVersion(before));
});
