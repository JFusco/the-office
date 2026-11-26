import {afterEach,expect,test,vi} from 'vitest';
import {writeFileSync,readFileSync,symlinkSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {ProjectProgress} from '../../../../../server/delivery/board/project-progress';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {workerProfile} from '../../../../../server/workers/worker-profiles';
import * as processTools from '../../../../../server/workers/process';
import * as handoffs from '../../../../../server/delivery/recovery/implementation/saved-prerequisite-handoff';
import * as harnessScope from '../../../../../server/delivery/harness/scope';
import * as implementationRecovery from '../../../../../server/delivery/recovery/implementation/implementation-recovery';
import {scheduledWork} from '../../../../../server/scheduling/scheduled-work';
import {observePrerequisites} from '../../../../../server/delivery/pipeline/dependencies';
import {enqueueRequest,executeRequest} from '../../../../../server/scheduling/requests';
import {cleanupFixtures,fixture,head,oldHead} from './saved-prerequisite-fixture';
afterEach(cleanupFixtures);
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

// The GitHub writer prompts never define paidRuns, so a writer may leave it null: not reported is not a paid run (#598).
const effectRows=(f:ReturnType<typeof fixture>)=>(f.store.db.prepare('SELECT count(*) AS n FROM effects').get()as{n:number}).n;
const reconcile=async(f:ReturnType<typeof fixture>)=>{
 const r=f.prepareRecovery();r.request.status='queued';vi.spyOn(processTools,'command').mockImplementation(f.execute as any);
 const coordinator:any={sessionBridge:{refresh:vi.fn(),forProject:vi.fn(()=>({complete:true,fresh:true,ownership:{status:'clear'}}))}};
 await withAssignment(r.reader,'delivery',()=>executeRequest(f.store,f.engine,coordinator,r.request));return r.request;
};
test.each(['scope-repair','implement']as const)('ordinary acceptance hands off a passed %s writer that leaves paidRuns unreported',async stage=>{
 if(stage==='implement')vi.spyOn(harnessScope,'harnessDelivers').mockReturnValue(false);
 const f=fixture(stage);f.result.paidRuns=null;await f.normal();
 expect(f.job).toMatchObject({head,stage:'review',status:'queued',prerequisites:f.result.prerequisites,savedPrerequisiteHandoff:{originalWorkId:f.original.id,stage,head}});
 expect(f.job.steps[0].result.paidRuns).toBeNull();expect(f.run).toHaveBeenCalledTimes(1);expect(f.store.state.coordination!.requests||[]).toHaveLength(0);expect(effectRows(f)).toBe(0);
});
test('ordinary acceptance still refuses the handoff to a writer that reports a paid run',async()=>{
 const f=fixture();f.result.paidRuns=1;await f.normal();
 expect(f.job).toMatchObject({stage:'scope-repair',status:'blocked',head:oldHead});expect(f.job.detail).toContain('Saved result candidate or effects are unverified');
 expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.run).toHaveBeenCalledTimes(1);expect(effectRows(f)).toBe(0);
});
test.each([{stage:'scope-repair',harnessWorktree:false},{stage:'implement',harnessWorktree:true}]as const)('a reconcile-implementation request hands off a stopped $stage writer that left paidRuns unreported (harness worktree: $harnessWorktree)',async({stage,harnessWorktree})=>{
 const f=fixture(stage,'cms-field-vocabulary',{harnessWorktree});f.result.paidRuns=null;const request=await reconcile(f);
 expect(request.status).toBe('completed');
 expect(f.job).toMatchObject({head,stage:'review',status:'queued',prerequisites:f.result.prerequisites,savedPrerequisiteHandoff:{originalWorkId:f.original.id,stage,head,fromHead:stage==='implement'?'':oldHead}});
 expect(f.job.steps[0].result.paidRuns).toBeNull();expect(f.run).not.toHaveBeenCalled();expect(effectRows(f)).toBe(0);
});
test('a reconcile-implementation request still refuses the handoff to a stopped writer that reported a paid run',async()=>{
 const f=fixture('implement','cms-field-vocabulary',{harnessWorktree:true});f.result.paidRuns=1;const request=await reconcile(f);
 expect(request.status).toBe('blocked');expect(request.detail).toContain('Saved result candidate or effects are unverified');
 expect(f.job).toMatchObject({stage:'implement',status:'blocked',head:''});expect(f.job.savedPrerequisiteHandoff).toBeUndefined();expect(f.run).not.toHaveBeenCalled();expect(effectRows(f)).toBe(0);
});
