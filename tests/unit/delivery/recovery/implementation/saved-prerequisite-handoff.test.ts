import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {coordination} from '../../../../../server/scheduling/coordination';
import {projectById} from '../../../../../server/office/projects';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {ProjectProgress} from '../../../../../server/delivery/board/project-progress';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {withAmendmentOwnership} from '../../../../../server/delivery/recovery/source-amendment/source-amendment';
import {workerProfile} from '../../../../../server/workers/worker-profiles';
import * as processTools from '../../../../../server/workers/process';
import * as handoffs from '../../../../../server/delivery/recovery/implementation/saved-prerequisite-handoff';
import * as harnessScope from '../../../../../server/delivery/harness/scope';
import * as implementationRecovery from '../../../../../server/delivery/recovery/implementation/implementation-recovery';
import {digest} from '../../../../../server/store/readback-evidence';
import {scheduledWork} from '../../../../../server/scheduling/scheduled-work';
import {observePrerequisites} from '../../../../../server/delivery/pipeline/dependencies';
import {enqueueRequest,executeRequest} from '../../../../../server/scheduling/requests';
import type {StageResult} from '../../../../../src/shared';
const fixtures:{root:string;store:Store}[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const f of fixtures.splice(0)){f.store.close();rmSync(f.root,{recursive:true,force:true});}});
const oldHead='2'.repeat(40),head='9'.repeat(40);
function fixture(stage:'implement'|'scope-repair'='scope-repair',projectId='cms-field-vocabulary'){
 const root=mkdtempSync(resolve(tmpdir(),'office-saved-prereq-')),repo=resolve(root,'repo'),candidate=resolve(root,'candidate'),data=resolve(root,'office'),nativeRoot=resolve(root,'native');
 for(const p of [repo,candidate,nativeRoot])mkdirSync(p,{recursive:true});writeFileSync(resolve(candidate,'.git'),'gitdir: '+resolve(repo,'.git/worktrees/candidate')+'\n');
 const store=new Store(':memory:',{...projectById(projectId),repo},data);fixtures.push({root,store});store.state.coordination=coordination();store.state.coordination.enabled=true;
 const engine=new Engine(store);const owned=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 const issue={number:100,html_url:`https://github.com/${store.project.repository}/issues/100`,state:'open',updated_at:'2026-10-31T01:00:00Z',title:'Review proposed source changes',body:'Eight source baselines require human acceptance. Child PR closure remains required.',labels:[],assignees:[{id:1,login:'JFusco'}]};
 const child:any={number:117,html_url:`https://github.com/${store.project.repository}/pull/117`,state:'open',merged:false,merge_commit_sha:null,updated_at:'2026-10-31T01:00:00Z',head:{sha:'7'.repeat(40)},base:{ref:'main',repo:{full_name:store.project.repository}}};
 const reads:string[]=[];const execute=vi.fn(async(_bin:string,args:string[])=>{
  reads.push(args.join(' '));if(args[0]==='api'){
   const p=args[1].replace('repos/'+store.project.repository+'/','');if(p==='issues/100')return JSON.stringify(issue);if(p.startsWith('issues/100/comments'))return '[]';if(p==='pulls/117')return JSON.stringify(child);if(p.startsWith('pulls?'))return '[]';throw new Error('Unexpected API '+p);
  }
  if(args[0]==='rev-parse')return args[1]==='--show-toplevel'?candidate:head;
  if(args[0]==='status'||args[0]==='ls-remote')return '';
  if(args[0]==='merge-base')return args[1]==='--is-ancestor'?'':oldHead;
  if(args[0]==='diff')return args[1]==='--name-only'?'wiki/journal/fixture.md':'wiki/journal/fixture.md | 1 +';
  if(args[0]==='branch')return 'codex/fixture-100';if(args[0]==='remote')return 'https://github.com/'+store.project.repository;
  throw new Error('Unexpected command '+args.join(' '));
 });
 vi.spyOn(processTools,'processGroupAlive').mockReturnValue(false);vi.spyOn(ProjectProgress.prototype,'reconcile').mockResolvedValue(undefined);
 vi.spyOn(engine.github,'board').mockResolvedValue({url:store.project.githubProject!.url,error:'',items:[{id:'card-100',number:100,repository:store.project.repository,status:'In progress'}]}as any);
 const delivery=new GitHubDelivery(store,engine,execute as any);delivery.enqueue('GH-100');const job=delivery.jobs[0];
 Object.assign(job,{stage,status:'working',head:stage==='implement'?'':oldHead,worktree:stage==='implement'?'':candidate,branch:stage==='implement'?'':'codex/fixture-100',candidateRecovery:stage==='implement'?undefined:{head:oldHead,findingIds:['child-source'],summary:'Original child finding remains OPEN'},approach:{plan:'brief',review:'none',validation:'developer-checks',checks:['focused checks'],reason:'Prior route'}});
 const proofRoot=resolve(data,'ticket-work',job.id);mkdirSync(proofRoot,{recursive:true});const check=resolve(proofRoot,'checks.log');writeFileSync(check,'Synthetic current-head checks passed');
 const result:StageResult={outcome:'passed',summary:'Journal-only repair; child source remains unmerged',commit:head,approach:null,resolution:null,prerequisites:[{target:{projectId:store.project.id,kind:'pr',id:'117'},condition:'pr-merged',evidence:'Explicit structured dependency, never finding authority',observedAt:'2026-10-31T01:00:00Z'}],findings:[{id:'child-source',summary:'Original child source finding',expected:'Independent acceptance',actual:'Child PR still open',status:'open',attempts:1}],evidence:[{id:'checks',kind:'checks',path:check,commit:head,summary:'Current-head checks',environment:'local',url:'',observedAt:''}],receipts:[],worktree:candidate,branch:'codex/fixture-100',prId:0,paidRuns:0,qaRunDir:'',previewUrl:'',blocker:''};
 const claim=store.claimWork({projectId:store.project.id,kind:'delivery',id:job.id},'fixture',stage)!;
 const original={id:'original-writer',sessionId:'original-writer',requestId:job.id,ticket:job.key,role:'developer',provider:'claude',stage:`github-${stage}`,status:'completed',executionStatus:'completed',lane:'delivery',claimId:claim.id,startedAt:'2026-10-31T01:00:00Z',endedAt:'2026-10-31T01:01:00Z',processId:2147483400}as any;
 const dir=resolve(data,'sessions',original.id);mkdirSync(dir,{recursive:true});const put=(name:string,value:unknown)=>writeFileSync(resolve(dir,name),JSON.stringify(value));
 const saveWriter=()=>{
  if(!store.state.workLog?.some(w=>w.id===original.id))(store.state.workLog??=[]).push(original);
  const profile=workerProfile(original.stage,false);put('provider.json',{project:store.project.id,repository:store.project.repository,role:'developer',provider:'claude',session:original.sessionId,readOnly:false});
  put('assignment.json',{id:original.id,claimId:claim.id,lane:'delivery',stage:original.stage,role:'developer',work:claim.work,scope:{repository:store.project.repository,worktree:stage==='implement'?repo:candidate,artifacts:dir},profile:profile.name});
  put('assignment-identity.json',{attemptId:original.id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,threadId:original.sessionId,role:'developer'});put('capabilities.json',profile);put('result.json',{provider:'claude',session:original.sessionId,result});
  put('execution-completion.json',{workerId:original.id,session:original.sessionId,provider:'claude',resultSha256:digest({provider:'claude',session:original.sessionId,result})});
  put('provider-completion.json',{expectedSession:original.sessionId,result:{type:'result',subtype:'success',terminal_reason:'completed',is_error:false,session_id:original.sessionId,structured_output:result}});
  const cwd=stage==='implement'?repo:candidate,nativeDir=resolve(nativeRoot,cwd.replace(/[^a-zA-Z0-9-]/g,'-'));mkdirSync(nativeDir,{recursive:true});writeFileSync(resolve(nativeDir,original.id+'.jsonl'),JSON.stringify({sessionId:original.sessionId,cwd,message:{content:[{type:'tool_use',id:'inspect',name:'Read',input:{file_path:check}},{type:'tool_result',tool_use_id:'inspect',content:'Synthetic inspected checks'},{type:'tool_use',id:'structured',name:'StructuredOutput',input:result},{type:'tool_result',tool_use_id:'structured',content:'Synthetic output accepted'}]}})+'\n');
 };
 const nativePath=resolve(nativeRoot,(stage==='implement'?repo:candidate).replace(/[^a-zA-Z0-9-]/g,'-'),original.id+'.jsonl');
 const realHandoff=handoffs.handoffSavedPrerequisites;vi.spyOn(handoffs,'handoffSavedPrerequisites').mockImplementation((d,j,w,o,i)=>realHandoff(d,j,w,o,i,nativeRoot));
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>{saveWriter();return structuredClone(result) as any;});
 const normal=()=>withAmendmentOwnership(owned,()=>withAssignment(claim,'delivery',()=>delivery.step(job)));
 const prepareRecovery=()=>{saveWriter();job.steps.push({stage:'scope-repair',result:structuredClone(result)});job.status='blocked';store.finishClaim(claim.id,'completed');const request=enqueueRequest(store,'reconcile-implementation',job.key,original.id);const reader=store.claimWork({projectId:store.project.id,kind:'reconciliation',id:request.id},'fixture-reader','reconcile-implementation')!;request.status='working';return{request,reader,perform:()=>withAssignment(reader,'delivery',()=>handoffs.handoffSavedPrerequisites(delivery,job,original.id,owned,request.id))};};
 return {root,store,engine,delivery,job,claim,original,result,put,saveWriter,owned,execute,child,issue,run,normal,prepareRecovery,nativeRoot,nativePath,reads};
}
test('actual delivery step atomically retains original saved candidate and prerequisite before open finding blocks; unknown/open waits',async()=>{
 const f=fixture();await f.normal();expect(f.run).toHaveBeenCalledTimes(1);
 expect(f.job).toMatchObject({head,stage:'review',status:'queued',prerequisites:f.result.prerequisites,savedPrerequisiteHandoff:{originalWorkId:f.original.id,fromHead:oldHead,head},approach:{review:'focused',validation:'independent-checks'}});
 expect(f.job.steps[0].result).toEqual(f.result);expect(f.job.steps[0].result.findings[0].status).toBe('open');expect(f.job.candidateRecovery?.head).toBe(oldHead);expect(f.original.status).toBe('completed');f.store.finishClaim(f.claim.id,'completed');
 const coordinator:any={state:f.store.state.coordination,sessionBridge:{refresh:vi.fn()},pump:vi.fn()},entry:any={store:f.store,engine:f.engine,coordinator,conversations:{}};
 const select=()=>scheduledWork(entry,new Map([[f.store.project.id,f.store]])).find(i=>i.work.id===f.job.id)!;
 expect(select().eligibility.state).toBe('waiting');f.store.state.coordination!.dependencyObservations=[];expect(select().eligibility.state).toBe('waiting');
 // Even a direct stale claim cannot dispatch review without a fresh provider merge.
 await f.delivery.step(f.job);expect(f.run).toHaveBeenCalledTimes(1);expect(f.job).toMatchObject({status:'queued',stage:'review'});expect(f.job.detail).toContain('waits for fresh verified prerequisite merge');
 expect(f.store.state.coordination!.dependencyObservations).toMatchObject([{target:f.result.prerequisites![0].target,condition:'pr-merged',exists:true,complete:false,error:''}]);expect(select().eligibility.state).toBe('waiting');
 f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
 const later=new Date(Date.now()+61000);await observePrerequisites(f.job.prerequisites!,new Map([[f.store.project.id,f.store]]),f.execute as any,later);
 expect(scheduledWork(entry,new Map([[f.store.project.id,f.store]]),later).find(i=>i.work.id===f.job.id)!).toMatchObject({stage:'review',eligibility:{state:'runnable'}});
 expect(f.job.steps).toHaveLength(1);expect(f.run).toHaveBeenCalledTimes(1);expect(f.store.state.coordination!.requests||[]).toHaveLength(0);
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),prerequisites:null,findings:[{...f.result.findings[0],status:'fixed'}]})as any);
 await f.delivery.step(f.job);expect(f.job).toMatchObject({stage:'validate',status:'queued'});expect(f.run).toHaveBeenCalledTimes(2);expect(f.run.mock.calls[1][0]).toBe('lead');
 expect(f.job.steps[0].result).toEqual(f.result);
});
test('fresh dependency merge releases review only; raw original/open source finding never acquires acceptance',async()=>{
 const f=fixture();await f.normal();f.store.finishClaim(f.claim.id,'completed');f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
 const later=new Date(Date.now()+61000);await observePrerequisites(f.job.prerequisites!,new Map([[f.store.project.id,f.store]]),f.execute as any,later);
 const entry:any={store:f.store,engine:f.engine,coordinator:{state:f.store.state.coordination},conversations:{}};
 expect(scheduledWork(entry,new Map([[f.store.project.id,f.store]]),later).find(i=>i.work.id===f.job.id)!.eligibility.state).toBe('runnable');
 await handoffs.requireSavedPrerequisites(f.delivery,f.job);expect(f.job.stage).toBe('review');expect(f.job.steps).toHaveLength(1);expect(f.run).toHaveBeenCalledTimes(1);
 expect(handoffs.savedPrerequisiteFindingsResolved(f.job,'review',{...f.result,findings:[]})).toBe(false);
 expect(handoffs.savedPrerequisiteFindingsResolved(f.job,'review',f.result)).toBe(false);
 expect(handoffs.savedPrerequisiteFindingsResolved(f.job,'validate',{...f.result,findings:[{...f.result.findings[0],status:'fixed'}]})).toBe(false);
 expect(f.issue.body).toContain('human acceptance');expect(f.job.steps[0].result.findings[0].status).toBe('open');
});
test('existing original-qualified recovery adopts the same completed writer without a new model or rewriting old steps',async()=>{
 const f=fixture(),r=f.prepareRecovery(),prior=JSON.stringify(f.job.steps),raw=readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'result.json'));await r.perform();
 expect(r.request.status).toBe('completed');expect(f.job.head).toBe(head);expect(f.job.stage).toBe('review');expect(JSON.stringify(f.job.steps)).toBe(prior);expect(f.run).not.toHaveBeenCalled();expect(readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'result.json'))).toEqual(raw);
 await expect(r.perform()).rejects.toThrow();expect(f.job.steps).toHaveLength(1);
});
test('existing reconcile-implementation request selects saved prerequisite recovery before generic original-candidate path',async()=>{
 const f=fixture(),r=f.prepareRecovery();r.request.status='queued';vi.spyOn(processTools,'command').mockImplementation(f.execute as any);
 const coordinator:any={sessionBridge:{refresh:vi.fn(),forProject:vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}))}};
 // Session bridge is synchronous by contract.
 coordinator.sessionBridge.forProject.mockImplementation(()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 await withAssignment(r.reader,'delivery',()=>executeRequest(f.store,f.engine,coordinator,r.request));
 expect(r.request.status).toBe('completed');expect(f.job.head).toBe(head);expect(f.job.stage).toBe('review');expect(f.run).not.toHaveBeenCalled();expect(enqueueRequest(f.store,'reconcile-implementation',f.job.key,f.original.id).id).toBe(r.request.id);
});
test.each(['brain','codex'])('passed prerequisite result in excluded %s flow retains ordinary delivery routing',async flow=>{
 const f=fixture('scope-repair',flow==='brain'?'brain':'cms-field-vocabulary');f.result.findings[0].status='verified';
 if(flow==='codex'){f.original.provider='codex';f.run.mockImplementationOnce(async()=>{(f.store.state.workLog??=[]).push(f.original);return structuredClone(f.result)as any;});}
 const sourceRepair=vi.spyOn(f.delivery,'queueSourceRepair');await f.normal();
 expect(f.run).toHaveBeenCalledTimes(1);expect(sourceRepair).toHaveBeenCalled();expect(handoffs.handoffSavedPrerequisites).not.toHaveBeenCalled();
 expect(f.job).toMatchObject({stage:'draft',status:'queued',head});expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.job.detail).not.toContain('Unpublished ordinary saved writer required');
});
test('continuation reconcile-implementation request reaches existing implementation recovery',async()=>{
 const f=fixture(),r=f.prepareRecovery();f.job.implementationContinuation={originalWorkId:f.original.id,originalHead:oldHead,noteIds:[],scopeSha256:'a'.repeat(64),proofPath:f.result.evidence[0].path,phase:'repair',pendingFindingIds:['child-source'],repairFindingIds:['child-source'],round:0,maxRounds:3};
 const recover=vi.spyOn(implementationRecovery,'recoverImplementation');r.request.status='queued';
 await withAssignment(r.reader,'delivery',()=>executeRequest(f.store,f.engine,{}as any,r.request));
 expect(recover).toHaveBeenCalledWith(expect.any(GitHubDelivery),f.job.key,f.original.id,expect.any(Function));expect(handoffs.handoffSavedPrerequisites).not.toHaveBeenCalled();
 expect(r.request).toMatchObject({status:'blocked',detail:'Error: Certain stopped implementation identity is required'});expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.run).not.toHaveBeenCalled();
});
test.each([
 {uncertain:true,verified:true,ledger:false},{uncertain:true,verified:true,ledger:true},
 {uncertain:false,verified:false,ledger:false},{uncertain:false,verified:false,ledger:true},
])('earlier mutation receipt blocks saved recovery even with certain latest writer and ledger $ledger: $uncertain/$verified',async({uncertain,verified,ledger})=>{
 const f=fixture(),r=f.prepareRecovery();f.job.steps.unshift({stage:'review',result:{...structuredClone(f.result),commit:oldHead,prerequisites:null,receipts:[{id:'earlier-mutation',action:'PATCH issue',target:f.issue.html_url,verified,uncertain,detail:'Retained original mutation receipt'}]}});
 if(ledger)f.store.putEffect({id:'verified-effect',work:{projectId:f.store.project.id,kind:'delivery',id:f.job.id},status:'verified'}as any);
 const prior=JSON.stringify(f.job),raw=readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'result.json'));
 await expect(r.perform()).rejects.toThrow('Uncertain original effects require reconciliation');
 expect(JSON.stringify(f.job)).toBe(prior);expect(r.request.status).toBe('working');expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.run).not.toHaveBeenCalled();
 expect(readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'result.json'))).toEqual(raw);
});
test.each(['review','implement'])('historical read receipt retains existing stage-aware uncertainty rules for %s',async stage=>{
 const f=fixture(),r=f.prepareRecovery();f.job.steps.unshift({stage,result:{...structuredClone(f.result),commit:oldHead,prerequisites:null,receipts:[{id:'earlier-read',action:'GET issue',target:f.issue.html_url,verified:false,uncertain:false,detail:'Read diagnostic'}]}});
 const prior=JSON.stringify(f.job.steps);
 if(stage==='review'){await r.perform();expect(f.job).toMatchObject({head,stage:'review',status:'queued'});expect(r.request.status).toBe('completed');}
 else{await expect(r.perform()).rejects.toThrow('Uncertain original effects require reconciliation');expect(f.job.head).toBe(oldHead);expect(r.request.status).toBe('working');}
 expect(JSON.stringify(f.job.steps)).toBe(prior);expect(f.run).not.toHaveBeenCalled();
});
test.each(['foreign-project','unknown-project','missing-pr','duplicate','wrong-condition'])('rejects unsupported structured dependency %s without adopting or clearing a finding',async change=>{
 const f=fixture();if(change==='foreign-project')f.result.prerequisites![0].target.projectId='brain';if(change==='unknown-project')f.result.prerequisites![0].target.projectId='foreign';if(change==='missing-pr')f.child.number=999;if(change==='duplicate')f.result.prerequisites!.push(structuredClone(f.result.prerequisites![0]));if(change==='wrong-condition')f.result.prerequisites![0].condition='issue-closed';
 const r=f.prepareRecovery();await expect(r.perform()).rejects.toThrow();expect(f.job.head).toBe(oldHead);expect(f.job.status).toBe('blocked');expect(f.job.steps[0].result.findings[0].status).toBe('open');expect(f.run).not.toHaveBeenCalled();
});
test.each(['paused','ownership','claim','head','native','artifact','effects','input','provider','active-original','capabilities','assignment','terminal','no-completion'])('retains raw history and blocks %s proof drift',async change=>{
 const f=fixture(),r=f.prepareRecovery(),prior=JSON.stringify(f.job.steps);
 if(change==='paused')f.store.state.paused=true;if(change==='ownership')f.owned.mockResolvedValue({complete:false,fresh:false,ownership:{status:'unknown'}});
 if(change==='active-original')f.original.status='stopping';if(change==='capabilities')f.put('capabilities.json',workerProfile('github-review',true));
 if(change==='assignment'){const p=JSON.parse(readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'assignment.json'),'utf8'));p.claimId='foreign';f.put('assignment.json',p);}
 if(change==='terminal'){const p=JSON.parse(readFileSync(resolve(f.store.dataRoot,'sessions',f.original.id,'provider-completion.json'),'utf8'));p.result.terminal_reason='interrupted';f.put('provider-completion.json',p);}
 if(change==='no-completion')unlinkSync(resolve(f.store.dataRoot,'sessions',f.original.id,'execution-completion.json'));
 if(['claim','head','native','artifact','effects','input','provider'].includes(change))f.owned.mockImplementationOnce(async()=>({complete:true,fresh:true,ownership:{status:'clear'}})).mockImplementationOnce(async()=>{
  if(change==='claim')f.store.finishClaim(r.reader.id,'interrupted');if(change==='head')f.job.head='a'.repeat(40);if(change==='native')writeFileSync(f.nativePath,readFileSync(f.nativePath,'utf8')+'\n');if(change==='artifact')f.put('provider.json',{});
  if(change==='effects')f.store.putEffect({id:'uncertain',work:{projectId:f.store.project.id,kind:'delivery',id:f.job.id},status:'uncertain'} as any);
  if(change==='input'){f.store.state.messages.push({id:'human',from:'human',to:'pm',ticket:f.job.key,status:'answered',body:'New scope',error:''}as any,{id:'answer',requestId:'human',from:'pm',ticket:f.job.key,status:'answered',error:'',receipts:[]}as any);f.store.state.projectNotes.push({id:'note',requestId:'human',ticket:f.job.key,summary:'Scope change'}as any);}
  if(change==='provider')f.issue.body='Changed scope during candidate checks';return{complete:true,fresh:true,ownership:{status:'clear'}};
 });
 await expect(r.perform()).rejects.toThrow();expect(JSON.stringify(f.job.steps)).toBe(prior);expect(f.job.stage).toBe('scope-repair');expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.run).not.toHaveBeenCalled();
});
test('malformed native calls, replaced Git indirection and uncertain saved effects never qualify',async()=>{
 const f=fixture(),r=f.prepareRecovery();writeFileSync(f.nativePath,JSON.stringify({sessionId:f.original.id,cwd:f.job.worktree,message:{content:[{type:'tool_use',id:'unpaired',name:'Bash',input:{command:'synthetic'}}]}})+'\n');await expect(r.perform()).rejects.toThrow('Incomplete original native');
});

test('a claimed worker may finish during drain, but its new review remains undispatched',async()=>{
 const f=fixture(),r=f.prepareRecovery();f.store.state.draining=true;await r.perform();f.store.finishClaim(r.reader.id,'completed');
 expect(f.job.stage).toBe('review');const entry:any={store:f.store,engine:f.engine,coordinator:{state:f.store.state.coordination},conversations:{}};
 expect(scheduledWork(entry,new Map([[f.store.project.id,f.store]])).find(i=>i.work.id===f.job.id)!.eligibility.state).toBe('blocked');expect(f.run).not.toHaveBeenCalled();
});
test.each(['uncertain-receipt','failed-outcome','missing-completion','result-drift','foreign-claim','gitdir-symlink','outside-evidence','duplicate-finding'])('saved result is never authority without complete original proof: %s',async change=>{
 const f=fixture();if(change==='uncertain-receipt')f.result.receipts.push({id:'unverified',action:'write',target:'provider',verified:false,uncertain:true,detail:'Unknown'});
 if(change==='failed-outcome')f.result.outcome='failed';if(change==='duplicate-finding')f.result.findings.push({...f.result.findings[0]});
 if(change==='outside-evidence')f.result.evidence[0].path=resolve(f.job.worktree,'outside.log');
 const r=f.prepareRecovery();if(change==='outside-evidence')writeFileSync(f.result.evidence[0].path,'Unowned evidence');
 if(change==='missing-completion')unlinkSync(resolve(f.store.dataRoot,'sessions',f.original.id,'execution-completion.json'));
 if(change==='result-drift')f.put('result.json',{provider:'claude',session:f.original.id,result:{...f.result,commit:'d'.repeat(40)}});
 if(change==='foreign-claim')f.store.finishClaim(f.claim.id,'interrupted');
 if(change==='gitdir-symlink'){unlinkSync(resolve(f.job.worktree,'.git'));symlinkSync(resolve(f.root,'repo'),resolve(f.job.worktree,'.git'));}
 await expect(r.perform()).rejects.toThrow();expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.job.stage).toBe('scope-repair');expect(f.run).not.toHaveBeenCalled();
});
test('review cannot drop the unresolved original finding after prerequisite merge; QA remains mandatory',async()=>{
 const f=fixture();await f.normal();f.store.finishClaim(f.claim.id,'completed');f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),findings:[],prerequisites:null,evidence:[{...f.result.evidence[0],kind:'review'}]})as any);
 await f.delivery.step(f.job);expect(f.run).toHaveBeenCalledTimes(2);expect(f.job.status).toBe('blocked');expect(f.job.stage).toBe('review');expect(f.job.detail).toContain('independent disposition');expect(f.job.steps[0].result.findings[0].status).toBe('open');
});
test.each((['passed','reroute']as const).flatMap(outcome=>['review-none','developer-checks','full','browser'].map(downgrade=>({outcome,downgrade}))))('saved handoff rejects $downgrade downgrade from $outcome review with already verified original findings',async({outcome,downgrade})=>{
  const f=fixture();f.result.findings[0].status='verified';
  if(downgrade==='full')f.job.approach!.review='full';if(downgrade==='browser')f.job.approach!.validation='browser';
  await f.normal();f.store.finishClaim(f.claim.id,'completed');f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
  const prior=structuredClone(f.job.approach!);vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
  const approach={...prior,reason:'Proposed new route'};
  if(downgrade==='review-none')approach.review='none';if(downgrade==='developer-checks')approach.validation='developer-checks';
  if(downgrade==='full')approach.review='focused';if(downgrade==='browser')approach.validation='independent-checks';
  f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),outcome,prerequisites:null,approach})as any);
  await f.delivery.step(f.job);expect(f.run).toHaveBeenCalledTimes(2);expect(f.job).toMatchObject({stage:'review',status:'blocked',approach:prior});expect(f.job.detail).toContain('requires retained independent review and QA');
});
test('already verified writer findings still require passed current-head review and independently verified QA',async()=>{
 const f=fixture();f.result.findings[0].status='verified';await f.normal();f.store.finishClaim(f.claim.id,'completed');f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),prerequisites:null,findings:[{...f.result.findings[0],status:'fixed'}]})as any);
 await f.delivery.step(f.job);expect(f.job).toMatchObject({stage:'validate',status:'queued'});expect(f.run.mock.calls[1][0]).toBe('lead');
 f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),prerequisites:null,findings:[{...f.result.findings[0],status:'fixed'}]})as any);
 await f.delivery.step(f.job);expect(f.job).toMatchObject({stage:'validate',status:'blocked'});expect(f.job.detail).toContain('independent disposition');
 f.run.mockImplementationOnce(async()=>({...structuredClone(f.result),prerequisites:null})as any);
 await f.delivery.step(f.job);expect(f.job).toMatchObject({stage:'draft',status:'queued'});expect(f.run.mock.calls[2][0]).toBe('qa');expect(f.run.mock.calls[3][0]).toBe('qa');expect(f.job.steps[0].result).toEqual(f.result);
});
test.each(['native','artifact','prerequisite','worktree','proof','provider'])('post-handoff acceptance gate rejects changed %s',async change=>{
 const f=fixture();await f.normal();f.store.finishClaim(f.claim.id,'completed');f.child.merged=true;f.child.state='closed';f.child.merge_commit_sha='6'.repeat(40);
 if(change==='native')writeFileSync(f.nativePath,readFileSync(f.nativePath,'utf8')+'\n');if(change==='artifact')f.put('provider.json',{});if(change==='prerequisite')f.job.prerequisites![0].target.id='118';
 if(change==='worktree'){unlinkSync(resolve(f.job.worktree,'.git'));writeFileSync(resolve(f.job.worktree,'.git'),'gitdir: replaced\n');}
 if(change==='proof')writeFileSync(f.job.savedPrerequisiteHandoff!.proofPath,'{}');if(change==='provider')f.child.base.repo.full_name='foreign/repository';
 await expect(handoffs.requireSavedPrerequisites(f.delivery,f.job)).rejects.toThrow();expect(f.job.steps[0].result.findings[0].status).toBe('open');expect(f.run).toHaveBeenCalledTimes(1);
 await f.delivery.step(f.job);expect(f.job).toMatchObject({stage:'review',status:'blocked'});expect(f.run).toHaveBeenCalledTimes(1);
});

// Legacy route: a model-created candidate. Hands-off CMS jobs without recovery records get a harness-created worktree instead.
test('ordinary unpublished implementation can retain its newly created candidate while native assignment stays bound to original repository cwd',async()=>{
 vi.spyOn(harnessScope,'harnessDelivers').mockReturnValue(false);const f=fixture('implement');await f.normal();expect(f.job).toMatchObject({head,stage:'review',status:'queued',worktree:resolve(f.root,'candidate'),branch:'codex/fixture-100',savedPrerequisiteHandoff:{stage:'implement',fromHead:''}});
 expect(f.run).toHaveBeenCalledTimes(1);expect(f.job.steps[0].result.findings[0].status).toBe('open');
});
