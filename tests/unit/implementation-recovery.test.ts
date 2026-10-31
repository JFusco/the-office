import {savedNegativeContinuationReview} from '../../server/continuation-review-readback';
import {negativeTechnicalReview,implementationContinuationDecision} from '../../server/implementation-continuation';
import {bindBrainAuditEffects} from '../../server/brain-audit-effects';
import {readPriorBrainAudit,brainAuditRetryFingerprint} from '../../server/brain-audit-reuse';
import * as auditReuse from '../../server/brain-audit-reuse';
import {readValidationProviderContext} from '../../server/validation-provider-context';
import {continuationScope,continuationWorkerProof} from '../../server/continuation-evidence';
import * as continuationEvidence from '../../server/continuation-evidence';
import {sanitizeObject} from '../../server/security';
import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync,realpathSync,symlinkSync,renameSync,cpSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {withAssignment,currentAssignment} from '../../server/assignment-context';
import {Scheduler} from '../../server/scheduler';
import {enqueueRequest,executeRequest} from '../../server/requests';
import {SessionBridge} from '../../server/session-bridge';
import {digest} from '../../server/readback-evidence';
import * as readbackEvidence from '../../server/readback-evidence';
import * as processTools from '../../server/process';
import {continuationArtifacts,continuationWorktree} from '../../server/continuation-evidence';
import {tmpdir} from 'node:os';
import {resolve,relative} from 'node:path';
import {Store} from '../../server/store';
import {Engine} from '../../server/engine';
import {GitHubDelivery} from '../../server/github-delivery';
import {GitOperations} from '../../server/git-operations';
import {GitHubMaintenance} from '../../server/maintenance';
import {ProjectProgress} from '../../server/project-progress';
import {projectById,officeCapacity} from '../../server/projects';
import {coordination} from '../../server/coordination';
import {implementationRecoveryCandidate,recoverImplementation,recoveredFindingsResolved} from '../../server/implementation-recovery';
import {ITSpecialist} from '../../server/it-specialist';
import type {StageResult,TicketJob} from '../../src/shared';
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true}));});
function fixture(kind:'candidate'|'preflight'='candidate'){
 const root=mkdtempSync(resolve(tmpdir(),'office-impl-readback-'));roots.push(root);
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo:resolve(root,'primary')},root);stores.push(store);store.state.coordination=coordination();
 const engine=new Engine(store),head='a'.repeat(40),worktree=resolve(root,'candidate');mkdirSync(worktree);
 const result:StageResult={outcome:kind==='candidate'?'passed':'blocked',summary:'Synthetic fixture',commit:kind==='candidate'?head:'',worktree:kind==='candidate'?worktree:'',branch:kind==='candidate'?'codex/113-fixture':'',prId:0,findings:[{id:kind==='candidate'?'locator-registry-addition':'missing-assignment-identity',summary:'Fixture',expected:'Fixture',actual:'Fixture',attempts:1,status:'open'}],receipts:[],evidence:[],paidRuns:0,qaRunDir:'',previewUrl:'',blocker:''};
 const job:TicketJob={id:'job',key:'GH-113',requestedAt:'',stage:'implement',status:'blocked',head:'',worktree:'',branch:'',pr:0,prUrl:'',detail:'Fixture',steps:[{stage:'implement',result}]};store.state.coordination.jobs=[job];
 store.state.workLog=[{id:'original',sessionId:'native-session',requestId:job.id,ticket:job.key,role:'developer',provider:'claude',stage:'github-implement',status:kind==='candidate'?'completed':'blocked',endedAt:'2026-10-29T22:00:00Z'} as any];
 const dir=resolve(root,'sessions/original');mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'provider.json'),JSON.stringify({project:store.project.id,repository:store.project.repository,role:'developer',provider:'claude'}));
 writeFileSync(resolve(dir,'result.json'),JSON.stringify({session:'native-session',result}));
 const issue={state:'open',assignees:[{login:'JFusco'}],updated_at:'2026-10-29T21:00:00Z'};
 const execute=vi.fn(async(program:string,args:string[])=>{
  if(program==='gh'&&args[0]==='pr'&&args[1]==='list')return '[]';
  if(program==='git'&&args[0]==='ls-remote')return '';
  return JSON.stringify(issue);
 }),delivery=new GitHubDelivery(store,engine,execute as any);
 const verify=vi.spyOn(engine.maintenance,'verifyCandidate').mockResolvedValue(undefined);
 vi.spyOn(GitOperations.prototype,'candidate').mockResolvedValue({base:'b'.repeat(40),files:['sources/profiles/fixture.json'],diff:'Fixture'});
 const assessment={outcome:'passed',originalWorkId:'original',verifiedNoEffects:true,summary:'Original evidence verified',evidence:[{path:'https://github.com/JFusco/cms-field-vocabulary/issues/113#issuecomment-1',summary:'Semantic issue reference'},{path:worktree,summary:'Semantic candidate directory'}]};
 const readback=()=>{
  const id='readback-'+(store.state.workLog!.length),sessionId='native-'+id;
  store.state.workLog!.push({id,sessionId,requestId:job.id,ticket:job.key,role:'lead',provider:'codex',stage:'implementation-readback',status:'completed',endedAt:'2026-10-29T23:00:00Z'} as any);
  const path=resolve(root,'sessions',id);mkdirSync(path,{recursive:true});
  writeFileSync(resolve(path,'provider.json'),JSON.stringify({project:store.project.id,repository:store.project.repository,role:'lead',provider:'codex',readOnly:true}));
  writeFileSync(resolve(path,'result.json'),JSON.stringify({session:sessionId,result:assessment}));
  return structuredClone(assessment);
 };
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback() as any);
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 return {root,store,engine,job,result,delivery,execute,run,verify,issue,ownership,assessment,readback};
}
test('adopts the exact saved candidate into independent review and QA, preserving the original open finding and history',async()=>{
 const a=fixture(),prior=JSON.stringify(a.job.steps[0]);
 await recoverImplementation(a.delivery,a.job.key,'original',a.ownership);
 expect(a.job).toMatchObject({head:a.result.commit,worktree:a.result.worktree,stage:'review',status:'queued',candidateRecovery:{findingIds:['locator-registry-addition']},implementationRecovery:{workId:'original',kind:'candidate'},approach:{review:'focused',validation:'independent-checks'}});
 expect(JSON.stringify(a.job.steps[0])).toBe(prior);expect(a.verify).toHaveBeenCalledTimes(2);expect(a.ownership).toHaveBeenCalledTimes(2);expect(a.run).toHaveBeenCalledTimes(1);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence[0].path,'utf8'));expect(proof.evidenceDigests).toHaveLength(4);
 for(const item of proof.evidenceDigests)expect(item.sha256).toMatch(/^[a-f0-9]{64}$/);
 expect(proof.assessment.evidence).toEqual(a.assessment.evidence);
 expect(proof.evidenceDigests.map((item:any)=>item.path)).toEqual([
 resolve(a.root,'sessions/original/provider.json'),resolve(a.root,'sessions/original/result.json'),
 resolve(a.root,'sessions/readback-1/provider.json'),resolve(a.root,'sessions/readback-1/result.json')]);
 expect(implementationRecoveryCandidate(a.store,a.job)).toBeUndefined();await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('identity');
});
test('known identity-only preflight needs positive no-effect proof before one fresh assignment; no candidate is invented',async()=>{
 const a=fixture('preflight'),prior=JSON.stringify(a.job.steps[0]);a.assessment.verifiedNoEffects=false;
 await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('verified');expect(a.job.status).toBe('blocked');
 a.assessment.verifiedNoEffects=true;await recoverImplementation(a.delivery,a.job.key,'original',a.ownership);
 expect(a.job).toMatchObject({stage:'implement',status:'queued',head:'',worktree:'',branch:'',implementationRecovery:{kind:'preflight'}});expect(a.verify).not.toHaveBeenCalled();expect(JSON.stringify(a.job.steps[0])).toBe(prior);
});
test.each([false,true])('a fresh implementation after preflight recovery retains independent gates and candidate identity with stronger requirements=%s',async strong=>{
 const a=fixture('preflight');
 if(strong)a.job.approach={plan:'none',review:'full',validation:'browser',checks:['Fixture checks'],reason:'Retained stronger requirements'};
 await recoverImplementation(a.delivery,a.job.key,'original',a.ownership);
 const history=JSON.stringify(a.job.steps),head='c'.repeat(40),worktree=resolve(a.root,'candidate'),branch='codex/fresh-fixture';
 const proof=resolve(a.root,'ticket-work',a.job.id,'fresh-checks.json');writeFileSync(proof,'{}');
 const response:StageResult={...structuredClone(a.result),outcome:'passed',commit:head,worktree,branch,findings:[],
  evidence:[{id:'checks',kind:'checks',path:proof,commit:head,summary:'Fresh candidate checks',environment:'unit fixture',url:'',observedAt:''}],
  approach:{plan:'none',review:'none',validation:'developer-checks',checks:['Fixture checks'],reason:'Small understood correction'}};
 a.run.mockResolvedValueOnce(response as any);
 a.execute.mockImplementation(async(program,args)=>program==='git'&&args[0]==='rev-parse'?head:JSON.stringify(a.issue));
 await a.delivery.step(a.job);
 expect(a.job).toMatchObject({head,worktree,branch,stage:'review',status:'queued',approach:{review:strong?'full':'focused',validation:strong?'browser':'independent-checks'}});
 expect(a.execute).toHaveBeenCalledWith('git',['rev-parse','HEAD'],expect.objectContaining({cwd:worktree}));
 expect(a.run.mock.calls.at(-1)).toMatchObject(['developer',expect.any(String),expect.anything(),expect.objectContaining({stage:'github-implement',requestId:a.job.id})]);
 expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);
 expect(a.job.steps.at(-1)).toMatchObject({stage:'implement',result:{outcome:'passed',commit:head,worktree,branch}});
 expect(a.job.skippedStages).toBeUndefined();expect(implementationRecoveryCandidate(a.store,a.job)).toBeUndefined();
});
test.each(['existing-pr','remote-branch','unknown-pr-inventory'] as const)('rejects candidate publication with %s without changing the job',async scenario=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 a.execute.mockImplementation(async(program,args)=>{
  if(program==='gh'&&args[0]==='pr'&&args[1]==='list')return scenario==='existing-pr'?'[{"number":123}]':scenario==='unknown-pr-inventory'?'{}':'[]';
  if(program==='git'&&args[0]==='ls-remote')return scenario==='remote-branch'?`${a.result.commit}\trefs/heads/${a.result.branch}\n`:'';
  return JSON.stringify(a.issue);
 });
 await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Candidate publication must be reconciled separately');
 expect(JSON.stringify(a.job)).toBe(prior);
 expect(a.execute).toHaveBeenCalledWith('gh',['pr','list','--repo',a.store.project.repository,'--head',a.result.branch,'--state','all','--json','number'],expect.objectContaining({readOnly:true}));
 expect(a.execute).toHaveBeenCalledWith('git',['ls-remote','--heads','origin',`refs/heads/${a.result.branch}`],expect.objectContaining({cwd:a.result.worktree,readOnly:true}));
});
test.each((['candidate','preflight'] as const).flatMap(kind=>(['readback','final-ownership'] as const).flatMap(timing=>
 ['session','replacement-worker','provider','project','provider-artifact','result-artifact'].map(change=>({kind,timing,change})))))('rejects $kind recovery when $change changes during $timing',async({kind,timing,change})=>{
 const a=fixture(kind),prior=JSON.stringify(a.job),providerPath=resolve(a.root,'sessions/original/provider.json'),resultPath=resolve(a.root,'sessions/original/result.json');
 let artifacts:{provider:string;result:string}|undefined;
 const mutate=()=>{
  if(change==='session')a.store.state.workLog![0].sessionId='changed-session';
  if(change==='replacement-worker')a.store.state.workLog!.push({...a.store.state.workLog![0],id:'replacement'});
  if(change==='provider')a.store.state.workLog![0].provider='codex';
  if(change==='project')a.store.project.repo=resolve(a.root,'changed-primary');
  if(change==='provider-artifact')writeFileSync(providerPath,JSON.stringify({...JSON.parse(readFileSync(providerPath,'utf8')),session:'changed-session'}));
  if(change==='result-artifact')writeFileSync(resultPath,JSON.stringify({session:'native-session',result:{...a.result,summary:'Changed saved result'}}));
  artifacts={provider:readFileSync(providerPath,'utf8'),result:readFileSync(resultPath,'utf8')};
 };
 if(timing==='readback')a.run.mockImplementation(async()=>{const response=a.readback();mutate();return response as any;});
 else a.ownership.mockImplementation(async()=>{if(a.ownership.mock.calls.length===2)mutate();return {complete:true,fresh:true,ownership:{status:'clear'}};});
 await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow('Implementation identity or live ownership changed');
 expect(JSON.stringify(a.job)).toBe(prior);expect(artifacts).toBeDefined();
 expect(readFileSync(providerPath,'utf8')).toBe(artifacts!.provider);expect(readFileSync(resultPath,'utf8')).toBe(artifacts!.result);
});
test.each(['uncertain','active','wrong-session','wrong-result','missing-readback','ownership','pause','issue-change','held-proposal'] as const)('preserves the original when %s evidence blocks recovery',async scenario=>{
 const a=fixture(),before=()=>JSON.stringify(a.job);
 if(scenario==='uncertain')a.result.receipts.push({id:'write',action:'push',target:'branch',verified:false,uncertain:true,detail:'Unknown'});
 if(scenario==='active')a.store.state.workLog![0].status='stopping';
 if(scenario==='wrong-session')writeFileSync(resolve(a.root,'sessions/original/result.json'),JSON.stringify({session:'other',result:a.result}));
 if(scenario==='wrong-result')writeFileSync(resolve(a.root,'sessions/original/result.json'),JSON.stringify({session:'native-session',result:{...a.result,commit:'b'.repeat(40)}}));
 if(scenario==='missing-readback')a.run.mockImplementation(async()=>structuredClone(a.assessment) as any);
 if(scenario==='ownership')a.ownership.mockResolvedValue({complete:false,fresh:false,ownership:{status:'clear'}});
 if(scenario==='pause')a.run.mockImplementation(async()=>{const response=a.readback();a.store.state.paused=true;return response as any;});
 if(scenario==='issue-change')a.run.mockImplementation(async()=>{const response=a.readback();a.issue.updated_at='2026-10-29T23:00:00Z';return response as any;});
 if(scenario==='held-proposal')a.job.key='GH-91';
 const prior=before();await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();expect(before()).toBe(prior);
});
test('review and QA must explicitly resolve each original finding; a green result cannot drop it',()=>{
 const a=fixture();a.job.implementationRecovery={workId:'original',kind:'candidate',at:''};a.job.candidateRecovery={head:a.result.commit,findingIds:['locator-registry-addition'],summary:''};
 expect(recoveredFindingsResolved(a.job,'review',{...a.result,findings:[]})).toBe(false);
 const fixed={...a.result,findings:a.result.findings.map(f=>({...f,status:'fixed' as const}))};
 expect(recoveredFindingsResolved(a.job,'review',fixed)).toBe(true);expect(recoveredFindingsResolved(a.job,'validate',fixed)).toBe(false);
 expect(recoveredFindingsResolved(a.job,'validate',{...fixed,findings:fixed.findings.map(f=>({...f,status:'verified' as const}))})).toBe(true);
});
test.each([
 {stage:'review',outcome:'reroute',strong:false,review:'none',validation:'developer-checks'},
 {stage:'review',outcome:'reroute',strong:false,review:'none',validation:'independent-checks'},
 {stage:'review',outcome:'reroute',strong:false,review:'focused',validation:'developer-checks'},
 {stage:'validate',outcome:'reroute',strong:false,review:'focused',validation:'developer-checks'},
 {stage:'review',outcome:'passed',strong:false,review:'none',validation:'developer-checks'},
 {stage:'review',outcome:'reroute',strong:true,review:'focused',validation:'browser'},
 {stage:'validate',outcome:'reroute',strong:true,review:'full',validation:'independent-checks'},
 ] as const)('retains recovered requirements for $stage $outcome with review=$review and validation=$validation',async({stage,outcome,strong,review,validation})=>{
 const a=fixture();a.result.findings[0].status='verified';
 writeFileSync(resolve(a.root,'sessions/original/result.json'),JSON.stringify({session:'native-session',result:a.result}));
 if(strong)a.job.approach={plan:'none',review:'full',validation:'browser',checks:['Fixture checks'],reason:'Retained stronger requirements'};
 await recoverImplementation(a.delivery,a.job.key,'original',a.ownership);
 a.job.stage=stage;const prior=JSON.stringify({approach:a.job.approach,decisions:a.job.decisions}),history=JSON.stringify(a.job.steps);
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 a.run.mockResolvedValue({...structuredClone(a.result),outcome,findings:[],approach:{...a.job.approach!,review,validation,reason:'Attempted reduction'}} as any);
 await a.delivery.step(a.job);
 expect(a.job).toMatchObject({stage,status:'blocked'});expect(a.job.detail).toContain('retained independent review and QA');
 expect(JSON.stringify({approach:a.job.approach,decisions:a.job.decisions})).toBe(prior);
 expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(a.job.steps.at(-1)!.result.outcome).toBe(outcome);
 expect(a.job.skippedStages).toBeUndefined();
});
test.each([false,true])('the retained recovered review and QA route completes with stronger requirements=%s',async strong=>{
 const a=fixture();a.result.findings[0].status='verified';
 writeFileSync(resolve(a.root,'sessions/original/result.json'),JSON.stringify({session:'native-session',result:a.result}));
 if(strong)a.job.approach={plan:'none',review:'full',validation:'browser',checks:['Fixture checks'],reason:'Retained stronger requirements'};
 await recoverImplementation(a.delivery,a.job.key,'original',a.ownership);
 const approach=structuredClone(a.job.approach),proof=resolve(a.root,'ticket-work',a.job.id,'checks.json');writeFileSync(proof,'{}');
 const response:StageResult={...structuredClone(a.result),evidence:[{id:'checks',kind:'checks',path:proof,commit:a.job.head,summary:'Fixture checks',environment:'unit fixture',url:'',observedAt:''}],approach:null};
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);a.run.mockClear();
 for(const stage of ['review','validate'] as const){
  a.run.mockResolvedValueOnce({...structuredClone(response),outcome:'reroute',approach} as any);
  await a.delivery.step(a.job);expect(a.job).toMatchObject({stage,status:'queued'});
  a.run.mockResolvedValueOnce(structuredClone(response) as any);
  await a.delivery.step(a.job);expect(a.job).toMatchObject({stage:stage==='review'?'validate':'draft',status:'queued'});
 }
 expect(a.job.approach).toEqual(approach);expect(a.run.mock.calls.map(call=>call[0])).toEqual(['lead','lead','qa','qa']);
 expect(a.job.steps.filter(step=>['review','validate'].includes(step.stage)&&step.result.outcome==='passed').map(step=>step.result.commit)).toEqual([a.job.head,a.job.head]);
});
test('IT enqueues recovery once, preserves attempts through pause and never directly dispatches a model',async()=>{
 const a=fixture(),offices={entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])};
 const it=new ITSpecialist(offices as any,{report:async()=>({services:[]})} as any);
 await it.tick(new Date('2026-10-29T23:00:00Z'),true);await it.tick(new Date('2026-10-29T23:01:00Z'),true);
 expect(a.store.state.coordination!.requests).toEqual([expect.objectContaining({action:'reconcile-implementation',key:a.job.key,head:'original',status:'queued'})]);expect(a.run).not.toHaveBeenCalled();
 const prior=structuredClone(a.store.state.it!.recoveries);a.store.state.paused=true;await it.tick(new Date('2026-10-29T23:02:00Z'),true);expect(a.store.state.it!.recoveries).toEqual(prior);
});

test.each(['duplicate','role','project','request','session','assessment','stopping','endedAt','missing-result','replaced-provider','replaced-result','replaced-worker'] as const)('rejects invalid owned readback %s without changing the job',async scenario=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{
  const response=a.readback(),worker=a.store.state.workLog!.at(-1)!;
  if(scenario==='duplicate')a.readback();
  if(scenario==='role')worker.role='qa';
  if(scenario==='request')worker.requestId='other-job';
  if(scenario==='stopping')worker.status='stopping';
  if(scenario==='endedAt')worker.endedAt='';
  const path=resolve(a.root,'sessions',worker.id);
  if(scenario==='project')writeFileSync(resolve(path,'provider.json'),JSON.stringify({project:'other',repository:a.store.project.repository,role:'lead',provider:'codex',readOnly:true}));
  if(scenario==='session')worker.sessionId='wrong-native';
  if(scenario==='assessment')response.summary='Not the saved response';
  if(scenario==='missing-result')rmSync(resolve(path,'result.json'));
  return response as any;
 });
 if(scenario.startsWith('replaced-'))a.ownership.mockImplementation(async()=>{
  if(a.ownership.mock.calls.length===2){
   const worker=a.store.state.workLog!.at(-1)!;
   if(scenario==='replaced-worker')worker.sessionId='changed-native';
   else writeFileSync(resolve(a.root,'sessions',worker.id,scenario==='replaced-provider'?'provider.json':'result.json'),'{}');
  }
  return {complete:true,fresh:true,ownership:{status:'clear'}};
 });
 await expect(recoverImplementation(a.delivery,a.job.key,'original',a.ownership)).rejects.toThrow();
 expect(JSON.stringify(a.job)).toBe(prior);
});

// Synthetic disk artifacts and mocked transports exercise orchestration, not native delivery.
function brainFixture(){
 const a=fixture();Object.assign(a.store.project,{...projectById('brain'),repo:resolve(a.root,'primary')});a.store.state.paused=false;
 a.ownership.mockImplementation(async()=>({complete:true,fresh:true,expiresAt:new Date(Date.now()+45000).toISOString(),ownership:{status:'clear'}}));
 writeFileSync(resolve(a.result.worktree,'.git'),'gitdir: /synthetic/owned-gitdir');
 a.job.key='GH-67';a.result.findings[0].id='index-429';a.result.branch='codex/67-fixture';a.result.approach=null;
 a.result.receipts=[{id:'comment',action:'Create issue comment',target:'https://github.com/JFusco/brain/issues/67#issuecomment-1',verified:true,uncertain:false,detail:'Synthetic source work began'}];
 const put=(id:string,name:string,value:unknown)=>{const dir=resolve(a.root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 const original=a.store.state.workLog![0];Object.assign(original,{ticket:a.job.key,processId:2147483647,claimId:'original-claim',lane:'delivery',startedAt:'2026-10-29T22:00:00Z'});
 function workerFiles(work:any,result:unknown,readOnly:boolean,cwd:string,kind='delivery',workId=a.job.id){
  put(work.id,'provider.json',{project:'brain',repository:a.store.project.repository,role:work.role,provider:work.provider,readOnly,session:work.provider==='claude'?work.sessionId:null});
  put(work.id,'result.json',{session:work.sessionId,result});
  const profile={name:readOnly?'reader':'github-native',readOnly,cutover:readOnly?'verified':'native'};
  put(work.id,'capabilities.json',profile);
  put(work.id,'assignment-identity.json',{attemptId:work.id,requestId:a.job.id,projectId:'brain',repository:a.store.project.repository,role:work.role,threadId:work.sessionId});
  put(work.id,'assignment.json',{id:work.id,claimId:work.claimId,work:{projectId:'brain',kind,id:workId},lane:'delivery',stage:work.stage,role:work.role,scope:{repository:a.store.project.repository,worktree:cwd,artifacts:resolve(a.root,'sessions',work.id)},profile:profile.name});
 }
 workerFiles(original,a.result,false,a.store.project.repo);
 const note={id:'scope-note',ticket:a.job.key,requestId:'human',createdAt:'2026-10-29T21:00:00Z',summary:'Human-approved bounds',detail:'Official navigation only; preserve default limits and native privacy/official/wiki gates'};
 const message:any={id:'human',requestId:'human',from:'human',to:'pm',ticket:a.job.key,status:'answered',body:'Approve bounded source work',createdAt:note.createdAt,error:'',receipts:[],recipients:[],actionId:'',sessionId:'',recheck:false};
 a.store.state.projectNotes=[note,{...note,id:'storage-note',requestId:'human-storage',detail:'Use shared storage/retrieval only'}];
 a.store.state.messages=[message,{...message,id:'human-storage',requestId:'human-storage',body:'Preserve shared storage boundary'}];
 const works:any[]=[],steps:TicketJob['steps']=[],recoveries:NonNullable<TicketJob['discoveryRecovery']>[]=[];
 const proofRoot=resolve(a.root,'ticket-work',a.job.id);mkdirSync(proofRoot,{recursive:true});
 for(let i=0;i<3;i++){
  const work={...original,id:`discovery-${i}`,sessionId:`discovery-session-${i}`,status:'blocked'},baseline='b'.repeat(40),requestId=`resume-${i}`;
  const result={...structuredClone(a.result),outcome:'blocked' as const,commit:baseline,branch:'',worktree:'',receipts:[]};works.push(work);workerFiles(work,result,false,a.store.project.repo);
  const path=resolve(proofRoot,`${requestId}.json`),artifacts=['provider.json','result.json'].map(name=>{const path=resolve(a.root,'sessions',work.id,name);return {path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')};});
  const prior={...structuredClone(a.job),steps:[...structuredClone(steps),{stage:'implement',result}]};
  const binding={noteId:note.id,scopeDigest:digest({note,original:message}),jobDigest:digest(prior),workDigest:digest(work)};
  writeFileSync(path,JSON.stringify({prior,binding,originalWork:work,assessment:{outcome:'passed',verifiedNoDeliveryEffects:true,originalAttemptId:work.id,originalSessionId:work.sessionId,baselineCommit:baseline,nativeClaimsClear:true},artifacts}));
  steps.push({stage:'implement',result},{stage:'discovery-readback',result:{...structuredClone(result),outcome:'passed',findings:[],evidence:[{id:requestId,kind:'review',path,commit:'',summary:'Synthetic discovery proof',environment:'fixture',url:'',observedAt:''}],receipts:[{id:requestId,action:'discovery-readback',target:work.id,verified:true,uncertain:false,detail:'No effects audited'}]}});
  recoveries.push({requestId,originalWorkId:work.id,originalSessionId:work.sessionId,baseline,noteId:note.id,findingIds:['index-429'],at:''});
  (a.store.state.coordination!.requests??=[]).push({id:requestId,action:'resume-discovery',key:a.job.key,head:work.id,status:'completed',lane:'delivery',requestedAt:'',detail:'',discoveryResume:binding});
 }
 a.job.steps=[...steps,{stage:'implement',result:a.result}];a.job.discoveryRecoveryHistory=recoveries.slice(0,-1);a.job.discoveryRecovery=recoveries.at(-1);a.store.state.workLog=[...works,original];
 Object.assign(a.issue,{number:67,html_url:'https://github.com/JFusco/brain/issues/67',title:'Fixture',body:'Approved scope',labels:[]});
 const native:any={slotDate:'2026-10-30',attempts:0,retryAfter:null,active:null,completed:null};let currentHead=a.result.commit,codeDiff='';
 a.execute.mockImplementation(async(program,args)=>{
  if(program==='node')return JSON.stringify(native);
  if(program==='gh'&&args[0]==='pr')return '[]';
  if(program==='gh'&&args.some(arg=>arg.includes('/comments?')))return '[]';
  if(program==='git'){
   if(args[0]==='rev-parse')return currentHead;
   if(args[0]==='branch')return a.result.branch;
   if(args[0]==='diff')return codeDiff;
   return '';
  }
  return JSON.stringify(a.issue);
 });
 const board:any={items:[{id:'card',repository:a.store.project.repository,number:67,status:'In progress'}]};vi.spyOn(a.engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const request=enqueueRequest(a.store,'reconcile-implementation',a.job.key,original.id);
 const assessment:any={outcome:'passed',originalWorkId:original.id,nativeSessionId:original.sessionId,commit:a.result.commit,verifiedNoEffects:false,completeNativeExecution:true,effectsVerified:true,noPaidOperations:true,noHumanHold:true,nativeClaimsClear:true,nativeSessionPath:'/synthetic/native-session.jsonl',nativeRecordCount:42,summary:'Synthetic complete effects audit',evidence:[{path:'/synthetic/native-session.jsonl:42',summary:'All original command completions'}],effects:[{id:'comment',kind:'issue-comment',target:a.result.receipts[0].target,verified:true,uncertain:false,evidence:'Native command and readback'},{id:'candidate',kind:'source-commit',target:a.result.commit,verified:true,uncertain:false,evidence:'Native source commit and worktree'},{id:'private-config',kind:'private-config-copy',target:a.result.worktree,verified:true,uncertain:false,evidence:'Native ignored config copy without secret contents'}]};
 assessment.effects.push({id:'worktree',kind:'worktree',target:a.result.worktree,verified:true,uncertain:false,evidence:'Native isolated checkout creation'});
 const readback=()=>{
  const work:any={...original,claimId:currentAssignment()?.claim.id,id:'brain-reader-'+a.store.state.workLog!.length,sessionId:'brain-reader-session-'+a.store.state.workLog!.length,role:'lead',provider:'codex',stage:'implementation-readback',status:'completed',processId:2147483646};
  a.store.state.workLog!.push(work);workerFiles(work,assessment,true,a.result.worktree,'reconciliation',request.id);return structuredClone(assessment);
 };
 a.run.mockImplementation(async()=>readback() as any);
 const visibility:any={complete:true,fresh:true,ownership:{status:'clear'}};
 vi.spyOn(SessionBridge.prototype,'refresh').mockImplementation(async()=>({} as any));vi.spyOn(SessionBridge.prototype,'forProject').mockImplementation(()=>visibility);
 vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 const admitted=async(kind:'reconciliation'|'delivery',id:string,stage:string,run:()=>Promise<unknown>)=>{
  const claim=a.store.claimWork({projectId:'brain',kind,id},'fixture-scheduler',stage,'delivery')!;
  try{return await withAssignment(claim,'delivery',run);}finally{a.store.finishClaim(claim.id,'completed');}
 };
 const adopt=async()=>{request.status='working';return admitted('reconciliation',request.id,request.action,()=>recoverImplementation(a.delivery,a.job.key,original.id,a.ownership));};
 const stage=async(result:StageResult,mutate?:()=>void)=>{
  a.run.mockImplementationOnce(async()=>{
   const work:any={...original,claimId:currentAssignment()?.claim.id,id:'stage-'+a.store.state.workLog!.length,sessionId:'stage-session-'+a.store.state.workLog!.length,role:a.job.stage==='review'?'lead':a.job.stage==='validate'?'qa':'developer',provider:a.job.stage==='scope-repair'?'claude':'codex',stage:`github-${a.job.stage}`,status:result.outcome==='failed'?'failed':result.outcome==='blocked'?'blocked':'completed'};
   a.store.state.workLog!.push(work);workerFiles(work,result,a.job.stage==='review',a.job.worktree);currentHead=result.commit;mutate?.();return structuredClone(result) as any;
  });
  return admitted('delivery',a.job.id,a.job.stage,()=>a.delivery.step(a.job));
 };
 const response=(head=a.job.head,technicalIds:string[]=[],sourceStatus:'open'|'fixed'|'verified'='open'):StageResult=>{
  const path=resolve(proofRoot,`checks-${a.store.state.workLog!.length}.json`);writeFileSync(path,'{"checked":true}');
  return {...structuredClone(a.result),commit:head,worktree:a.result.worktree,branch:a.result.branch,receipts:[],findings:[{...a.result.findings[0],status:sourceStatus},...technicalIds.map(id=>({...a.result.findings[0],id,status:'verified' as const}))],evidence:[{id:'proof',kind:a.job.stage==='review'?'review':'checks',path,commit:head,summary:'Synthetic exact-head evidence',environment:'fixture',url:'',observedAt:''}]};
 };
 return {...a,put,original,request,assessment,readback,admitted,adopt,stage,response,visibility,native,board,workerFiles,setCodeDiff:(value:string)=>codeDiff=value};
}

test('Brain scheduler request adopts the latest saved implementation after three bound discovery continuations atomically',async()=>{
 const a=brainFixture(),history=JSON.stringify(a.job.steps),original=JSON.stringify(a.original);
 expect(implementationRecoveryCandidate(a.store,a.job)?.work.id).toBe('original');
 expect(enqueueRequest(a.store,'reconcile-implementation',a.job.key,'original')).toBe(a.request);
 vi.spyOn(processTools,'command').mockImplementation(a.execute as any);
 const scheduler=new Scheduler(officeCapacity()),item={store:a.store,work:{projectId:'brain',kind:'reconciliation' as const,id:a.request.id},stage:a.request.action,rank:1,enqueuedAt:a.request.requestedAt,eligibility:{state:'runnable' as const,reason:'fixture',owner:'Morgan',nextCheckAt:null},identity:()=>digest(a.request),execute:()=>executeRequest(a.store,a.engine,{sessionBridge:{refresh:async()=>{},forProject:a.ownership}} as any,a.request)};
 await Promise.all([scheduler.pump([{store:a.store,items:[item]}]),scheduler.pump([{store:a.store,items:[item]}])]);
 expect(a.request.status).toBe('completed');expect(a.job).toMatchObject({stage:'review',status:'queued',head:a.result.commit,implementationContinuation:{phase:'technical-review',round:0,maxRounds:3,pendingFindingIds:['index-429'],noteIds:['scope-note','storage-note']}});
 expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(JSON.stringify(a.original)).toBe(original);expect(a.job.head).not.toBe(a.job.discoveryRecovery!.baseline);
 const saved=JSON.parse((a.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body);expect(saved.coordination.requests.at(-1).status).toBe('completed');expect(saved.coordination.jobs[0].implementationContinuation.phase).toBe('technical-review');
 const calls=a.run.mock.calls.length;await expect(a.adopt()).rejects.toThrow();expect(a.run.mock.calls).toHaveLength(calls);
});
test('Brain without bound history and human approval stays excluded',()=>{const a=brainFixture();delete a.job.discoveryRecovery;delete a.job.discoveryRecoveryHistory;expect(implementationRecoveryCandidate(a.store,a.job)).toBeUndefined();});

test('actual delivery steps route negative review -> same-candidate repair -> re-review -> activation -> ordinary review and QA',async()=>{
 const a=brainFixture();await a.adopt();const prior=JSON.stringify(a.job.steps),ids=['deadline','redirect','pacing'];
 const negative=a.response();negative.outcome='blocked';negative.findings.push(...ids.map(id=>({...negative.findings[0],id})));
 await a.stage(negative);expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'repair',round:1,repairFindingIds:ids}});
 expect(a.run.mock.calls.at(-1)![1]).toContain('READ ONLY full independent implementation review');expect(a.run.mock.calls.at(-1)![1]).not.toContain('Review must return status=fixed');
 await a.stage(a.response('c'.repeat(40),ids));expect(a.job).toMatchObject({stage:'review',status:'queued',head:'c'.repeat(40),implementationContinuation:{phase:'technical-review'}});
 await a.stage(a.response(a.job.head,ids));expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'activation'}});
 expect(a.job.steps.at(-1)!.result.findings[0].status).toBe('open');
 await a.stage(a.response('d'.repeat(40),ids,'fixed'));expect(a.job).toMatchObject({stage:'review',status:'queued',implementationContinuation:{phase:'acceptance'}});
 await a.stage(a.response(a.job.head,ids,'fixed'));expect(a.job).toMatchObject({stage:'validate',status:'queued'});
 const invalid=a.response(a.job.head,ids,'fixed');await a.stage(invalid);expect(a.job).toMatchObject({stage:'validate',status:'blocked'});
 a.job.status='queued';await a.stage(a.response(a.job.head,ids,'verified'));expect(a.job).toMatchObject({stage:'draft',status:'queued'});
 expect(JSON.stringify(a.job.steps.slice(0,7))).toBe(JSON.stringify(JSON.parse(prior).slice(0,7)));
 expect(a.job.candidateRecovery!.findingIds).toEqual(expect.arrayContaining(['index-429',...ids]));
});

test('published continuation candidates return through ordinary review and QA after a CI repair',async()=>{
 const a=brainFixture(),ids=['assignment-identity'];
 a.result.findings.push({...a.result.findings[0],id:ids[0],status:'fixed'});a.workerFiles(a.original,a.result,false,a.store.project.repo);
 await a.adopt();await a.stage(a.response(a.job.head,ids));
 await a.stage(a.response('c'.repeat(40),ids,'fixed'));
 await a.stage(a.response(a.job.head,ids,'fixed'));await a.stage(a.response(a.job.head,ids,'verified'));
 expect(a.job).toMatchObject({stage:'draft',status:'queued',implementationContinuation:{phase:'acceptance'}});
 Object.assign(a.job,{pr:123,prUrl:'https://github.com/JFusco/brain/pull/123',head:'d'.repeat(40),stage:'review'});
 const transport=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args)=>program==='gh'&&args[0]==='pr'?'[{"number":123}]':program==='git'&&args[0]==='ls-remote'?`${a.job.head}\trefs/heads/${a.job.branch}`:transport(program,args));
 const guard=vi.spyOn(a.delivery,'continuationGuard');
 const published=(status:'fixed'|'verified')=>({...a.response(a.job.head,ids,status),prId:a.job.pr});
 for(const stage of ['review','validate'] as const){
  for(const id of ['index-429',...ids]){
   const missing=published('verified');missing.findings=missing.findings.filter(f=>f.id!==id);
   await a.stage(missing);expect(a.job).toMatchObject({stage,status:'blocked'});a.job.status='queued';
  }
  if(stage==='validate'){
   await a.stage(published('fixed'));expect(a.job).toMatchObject({stage,status:'blocked'});a.job.status='queued';
  }
  await a.stage(published(stage==='review'?'fixed':'verified'));
  expect(a.job).toMatchObject({stage:stage==='review'?'validate':'draft',status:'queued'});
 }
 expect(guard).not.toHaveBeenCalled();expect(a.job.candidateRecovery!.findingIds).toEqual(['index-429',...ids]);
 expect(a.run.mock.calls.slice(-2).map(call=>call[0])).toEqual(['qa','qa']);
});

test.each(['open','fixed'] as const)('activation-code returns to technical review with source finding %s and the existing budget',async sourceStatus=>{
 const a=brainFixture(),ids=['deadline'];await a.adopt();
 const negative=a.response();negative.outcome='blocked';negative.findings.push({...negative.findings[0],id:ids[0]});
 await a.stage(negative);await a.stage(a.response('c'.repeat(40),ids));await a.stage(a.response(a.job.head,ids));
 expect(a.job.implementationContinuation).toMatchObject({phase:'activation',round:1,repairFindingIds:ids});
 const before=structuredClone(a.job.implementationContinuation),history=JSON.stringify(a.job.steps),result=a.response('d'.repeat(40),ids,sourceStatus);
 a.setCodeDiff('Changed reviewed network implementation');await a.stage(result);
 expect(a.job).toMatchObject({stage:'review',status:'queued',head:result.commit,implementationContinuation:{...before,phase:'technical-review'}});
 expect(a.job.candidateRecovery!.findingIds).toEqual(['index-429',...ids]);
 expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(a.job.steps.at(-1)!.result).toEqual(result);
 const worker=a.store.state.workLog!.at(-1)!;
 expect(JSON.parse(readFileSync(resolve(a.root,'sessions',worker.id,'result.json'),'utf8')).result).toEqual(result);
 a.setCodeDiff('');await a.stage(a.response(a.job.head,ids));
 expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'activation',round:1}});
 expect(a.job.steps.at(-1)!.result.findings[0].status).toBe('open');
});

test.each(['uncertain','ownership','persistence','omit-technical'] as const)('activation-code cannot bypass the %s fence',async scenario=>{
 const a=brainFixture(),ids=['assignment-identity'];
 a.result.findings.push({...a.result.findings[0],id:ids[0],status:'fixed'});a.workerFiles(a.original,a.result,false,a.store.project.repo);
 await a.adopt();await a.stage(a.response(a.job.head,ids));
 const state=JSON.stringify(a.job.implementationContinuation),head=a.job.head,result=a.response('c'.repeat(40),ids,'fixed');
 if(scenario==='uncertain')result.receipts=[{id:'unknown-write',action:'source activation',target:'source',verified:false,uncertain:true,detail:'Requires readback'}];
 if(scenario==='omit-technical')result.findings=result.findings.filter(f=>f.id!==ids[0]);
 if(scenario==='persistence'){
  const save=a.store.save.bind(a.store);
  vi.spyOn(a.store,'save').mockImplementation(()=>{if(a.store.state.coordination!.jobs![0].implementationContinuation?.phase==='technical-review')throw new Error('Synthetic activation transition failure');save();});
 }
 const transport=a.execute.getMockImplementation()!;let started=false;
 a.execute.mockImplementation(async(program,args)=>{const value=await transport(program,args);if(started&&scenario==='ownership'&&program==='git'&&args[0]==='status')a.visibility.ownership.status='owned';return value;});
 a.setCodeDiff('Changed reviewed implementation');await a.stage(result,()=>{started=true;});
 const current=a.store.state.coordination!.jobs![0];
 expect(current.status).toBe('blocked');expect(current.head).toBe(head);expect(JSON.stringify(current.implementationContinuation)).toBe(state);
});

test('activation can change a previously reviewed wiki file without requiring another technical review',async()=>{
 const a=brainFixture();
 vi.mocked(GitOperations.prototype.candidate).mockResolvedValue({base:'b'.repeat(40),files:['wiki/source.md'],diff:'Reviewed code and wiki'});
 const transport=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args)=>program==='git'&&args[0]==='diff'?args.includes('*.ts')?'':'Changed wiki/source.md':transport(program,args));
 await a.adopt();await a.stage(a.response());await a.stage(a.response('c'.repeat(40),[],'fixed'));
 expect(a.job).toMatchObject({stage:'review',status:'queued',implementationContinuation:{phase:'acceptance'}});
 expect(a.execute).toHaveBeenCalledWith('git',expect.arrayContaining(['diff','*.ts']),expect.objectContaining({readOnly:true}));
});

test.each(['no-scope','scope-edit','native-active','unknown-effects','denied-native','wrong-session','wrong-capability','missing-process','live-process','symlink','parent-replacement','existing-pr','remote-branch','pause-final','ownership-final','intent-change','duplicate-intent','baseline','atomic-failure'] as const)('Brain adoption blocks %s without changing original job',async scenario=>{
 const a=brainFixture();
 if(scenario==='no-scope')a.store.state.messages[0].status='queued';
 if(scenario==='scope-edit')a.store.state.projectNotes[0].detail='Changed after binding';
 if(scenario==='native-active')a.native.active={id:'11111111-1111-4111-8111-111111111111',authorId:'22222222-2222-4222-8222-222222222222',slotDate:'2026-10-30',phase:'running'};
 if(scenario==='unknown-effects')a.assessment.effects[0].uncertain=true;
 if(scenario==='denied-native')a.assessment.completeNativeExecution=false;
 if(scenario==='wrong-session')a.put('original','assignment-identity.json',{threadId:'wrong'});
 if(scenario==='wrong-capability')a.put('original','capabilities.json',{name:'reader',readOnly:true,cutover:'verified'});
 if(scenario==='missing-process')delete a.original.processId;
 if(scenario==='live-process')vi.spyOn(processTools,'processGroupAlive').mockReturnValue(true);
 if(scenario==='symlink'){const path=resolve(a.root,'sessions/original/result.json');renameSync(path,path+'.old');symlinkSync(path+'.old',path);}
 if(scenario==='baseline'){a.result.commit=a.job.discoveryRecovery!.baseline;a.workerFiles(a.original,a.result,false,a.store.project.repo);}
 if(scenario==='existing-pr'||scenario==='remote-branch'){const impl=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(p,args)=>p==='gh'&&args[0]==='pr'&&scenario==='existing-pr'?'[{"number":1}]':p==='git'&&args[0]==='ls-remote'&&scenario==='remote-branch'?'published':impl(p,args));}
 if(scenario==='duplicate-intent'){a.request.status='working';a.store.state.coordination!.requests!.push({...a.request,id:'duplicate'});}
 if(['pause-final','ownership-final','intent-change','parent-replacement'].includes(scenario))a.ownership.mockImplementation(async()=>{
  if(a.run.mock.calls.length){
   if(scenario==='pause-final')a.store.state.paused=true;
   if(scenario==='ownership-final')return {complete:false,fresh:false,ownership:{status:'owned'}};
   if(scenario==='intent-change')a.request.head='different';
   if(scenario==='parent-replacement'){const path=resolve(a.root,'sessions/original');renameSync(path,path+'-old');cpSync(path+'-old',path,{recursive:true});}
  }
  return {complete:true,fresh:true,expiresAt:new Date(Date.now()+45000).toISOString(),ownership:{status:'clear'}};
 });
 const before=JSON.stringify(a.job);
 if(scenario==='atomic-failure'){const save=a.store.save.bind(a.store);vi.spyOn(a.store,'save').mockImplementation(()=>{if(a.store.state.coordination!.jobs![0].implementationContinuation)throw new Error('Synthetic persistence failure');save();});}
 await expect(a.adopt()).rejects.toThrow();expect(JSON.stringify(a.store.state.coordination!.jobs![0])).toBe(before);
});

test.each(['scope','pause','ownership','claim','head','branch','published','native','unknown','omit-source','accept-source','omit-technical','budget','changed-artifact'] as const)('phase transition fails closed for %s',async scenario=>{
 const a=brainFixture();await a.adopt();
 if(scenario==='omit-technical'){a.job.implementationContinuation!.repairFindingIds=['deadline'];a.job.implementationContinuation!.round=1;}
 if(scenario==='budget')a.job.implementationContinuation!.round=3;
 if(scenario==='unknown'){a.job.implementationContinuation!.phase='activation';a.job.stage='scope-repair';}
 const before=JSON.stringify(a.job.implementationContinuation),head=a.job.head,result=a.response();
 if(scenario==='omit-source')result.findings=[];
 if(scenario==='accept-source')result.findings[0].status='verified';
 if(scenario==='unknown'){result.findings[0].status='fixed';result.findings.push({...result.findings[0],id:'unexpected'});}
 if(scenario==='budget')result.findings.push({...result.findings[0],id:'deadline'});
 if(scenario==='head')result.commit='f'.repeat(40);
 if(scenario==='branch')result.branch='other';
 const mutate=()=>{
  if(scenario==='scope')a.store.state.projectNotes[1].detail='Concurrent human scope edit';
  if(scenario==='pause')a.store.state.paused=true;
  if(scenario==='ownership')a.visibility.ownership.status='owned';
  if(scenario==='claim')for(const claim of a.store.activeClaims())a.store.finishClaim(claim.id,'interrupted');
  if(scenario==='native')a.native.active={id:'11111111-1111-4111-8111-111111111111',authorId:'22222222-2222-4222-8222-222222222222',slotDate:'2026-10-30',phase:'active'};
  if(scenario==='changed-artifact')a.put('original','provider.json',{});
  if(scenario==='published'){const impl=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(p,args)=>p==='git'&&args[0]==='ls-remote'?'published':impl(p,args));}
 };
 await a.stage(result,mutate);expect(a.job.status).toMatch(/blocked|interrupted/);expect(a.job.head).toBe(head);expect(JSON.stringify(a.job.implementationContinuation)).toBe(before);
});

test('parsing refuses bytes replaced after artifact hashing',()=>{
 const a=fixture(),original=readbackEvidence.artifact;
 vi.spyOn(readbackEvidence,'artifact').mockImplementation((store,path)=>{const file=original(store,path);writeFileSync(path,'{"replacement":true}');return file;});
 expect(()=>continuationArtifacts(a.store,'original',['result.json'])).toThrow('changed');
});

test.each(['session','capability','assignment','provider','duplicate','live-group','missing-result','wrong-audit-target'] as const)('Brain audit rejects a mismatched independent reader: %s',scenario=>{
 const a=brainFixture(),prior=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{
  if(scenario==='wrong-audit-target')a.assessment.effects[0].target='different issue comment';
  const response=a.readback(),worker=a.store.state.workLog!.at(-1)!;
  if(scenario==='session')worker.sessionId='unrelated-native-session';
  if(scenario==='capability')a.put(worker.id,'capabilities.json',{name:'github-native',readOnly:false,cutover:'native'});
  if(scenario==='assignment')a.put(worker.id,'assignment.json',{id:worker.id,work:{id:'other-request'}});
  if(scenario==='provider')a.put(worker.id,'provider.json',{project:'other',readOnly:true});
  if(scenario==='duplicate')a.readback();
  if(scenario==='live-group')vi.spyOn(processTools,'processGroupAlive').mockImplementation(pid=>pid===worker.processId);
  if(scenario==='missing-result')rmSync(resolve(a.root,'sessions',worker.id,'result.json'));
  return response as any;
 });
 return expect(a.adopt()).rejects.toThrow().then(()=>expect(JSON.stringify(a.job)).toBe(prior));
});

test('an already admitted exact scheduler claim can finish an intentional drain; drain alone grants no recovery',async()=>{
 const a=brainFixture();a.ownership.mockImplementation(async()=>{if(a.run.mock.calls.length)a.store.state.draining=true;return {complete:true,fresh:true,expiresAt:new Date(Date.now()+45000).toISOString(),ownership:{status:'clear'}};});
 await a.adopt();expect(a.store.state.draining).toBe(true);expect(a.job.implementationContinuation?.phase).toBe('technical-review');
 const b=brainFixture();b.request.status='working';b.store.state.draining=true;await expect(recoverImplementation(b.delivery,b.job.key,'original',b.ownership)).rejects.toThrow('scheduler-owned');expect(b.run).not.toHaveBeenCalled();
});

test('previously fixed original IDs stay mandatory at technical review and activation',async()=>{
 const a=brainFixture();a.result.findings.push({...a.result.findings[0],id:'assignment-identity',status:'fixed'});a.workerFiles(a.original,a.result,false,a.store.project.repo);
 const prior=JSON.stringify(a.result);await a.adopt();expect(a.job.implementationContinuation!.repairFindingIds).toEqual(['assignment-identity']);
 await a.stage(a.response());expect(a.job.status).toBe('blocked');expect(a.job.implementationContinuation!.phase).toBe('technical-review');
 a.job.status='queued';await a.stage(a.response(a.job.head,['assignment-identity']));expect(a.job.implementationContinuation!.phase).toBe('activation');expect(JSON.stringify(a.result)).toBe(prior);
});
test('read-only reviewer source references coexist with the harness-owned current-head review artifact',async()=>{
 const a=brainFixture();await a.adopt();const result=a.response();result.evidence[0].path=resolve(a.job.worktree,'reviewed-source.ts');writeFileSync(result.evidence[0].path,'// Synthetic reviewed source');
 await a.stage(result);expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'activation'}});
 expect(a.job.steps.at(-1)!.result.evidence.some(e=>e.path===result.evidence[0].path)).toBe(true);
});

test.each(['intent-replaced','duplicate-reader'] as const)('final Brain adoption rejects %s',async scenario=>{
 const a=brainFixture(),prior=JSON.stringify(a.job);
 a.ownership.mockImplementation(async()=>{
  if(a.run.mock.calls.length){
   if(scenario==='intent-replaced'){const requests=a.store.state.coordination!.requests!;requests[requests.indexOf(a.request)]={...a.request,status:'blocked'};}
   else a.store.state.workLog!.push({...a.store.state.workLog!.at(-1)!,id:'late-reader',sessionId:'late-native'});
  }
  return {complete:true,fresh:true,expiresAt:new Date(Date.now()+45000).toISOString(),ownership:{status:'clear'}};
 });
 await expect(a.adopt()).rejects.toThrow();expect(JSON.stringify(a.job)).toBe(prior);
});

test.each(['pause','ownership','worktree','comments','persistence'] as const)('final awaited fence prevents a partial phase transition: %s',async scenario=>{
 const a=brainFixture();await a.adopt();const state=JSON.stringify(a.job.implementationContinuation),head=a.job.head;
 const result=a.response();let started=false,changed=false;
 const transport=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args)=>{
  const value=await transport(program,args);
  if(started&&!changed&&((scenario==='comments'&&args.some(arg=>arg.includes('/comments?')))||(scenario!=='comments'&&program==='git'&&args[0]==='status'))){
   changed=true;
   if(scenario==='pause')a.store.state.paused=true;
   if(scenario==='ownership')a.visibility.ownership.status='owned';
   if(scenario==='worktree'){const path=a.job.worktree;renameSync(path,path+'-original');cpSync(path+'-original',path,{recursive:true});}
   if(scenario==='comments')return JSON.stringify([{id:1,issue_url:'https://api.github.com/repos/JFusco/brain/issues/67',html_url:'https://github.com/JFusco/brain/issues/67#issuecomment-1',body:'New human hold',user:{login:'JFusco'},author_association:'OWNER',created_at:'2026-10-30T00:00:00Z',updated_at:'2026-10-30T00:00:00Z'}]);
  }
  return value;
 });
 if(scenario==='persistence'){const save=a.store.save.bind(a.store);vi.spyOn(a.store,'save').mockImplementation(()=>{if(a.store.state.coordination!.jobs![0].implementationContinuation?.phase==='activation')throw new Error('Synthetic atomic transition failure');save();});}
 await a.stage(result,()=>{started=true;});
 const current=a.store.state.coordination!.jobs![0];expect(current.status).toMatch(/blocked|interrupted/);expect(current.head).toBe(head);expect(JSON.stringify(current.implementationContinuation)).toBe(state);
});


test('continuation worktree permits a stable ancestor alias but rejects a linked worktree itself',()=>{
 const a=brainFixture(),before=continuationWorktree(a.result.worktree),alias=resolve(a.root,'ancestor-alias');
 symlinkSync(a.root,alias);
 const throughAlias=continuationWorktree(resolve(alias,relative(a.root,a.result.worktree)));
 expect(throughAlias).toEqual(before);
 const linked=resolve(a.root,'linked-worktree');symlinkSync(a.result.worktree,linked);
 expect(()=>continuationWorktree(linked)).toThrow('Owned continuation worktree');
 const git=resolve(a.result.worktree,'.git');renameSync(git,git+'.original');symlinkSync(git+'.original',git);
 expect(()=>continuationWorktree(a.result.worktree)).toThrow('symbolic links');
});

test('a stable ancestor alias survives actual verifier canonicalization from adoption through technical review',async()=>{
 const a=brainFixture(),canonical=realpathSync(a.result.worktree),alias=resolve(a.root,'ancestor-alias');
 symlinkSync(a.root,alias);mkdirSync(a.store.project.repo);
 a.result.worktree=resolve(alias,relative(a.root,a.result.worktree));a.workerFiles(a.original,a.result,false,a.store.project.repo);
 const original=readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8'),history=JSON.stringify(a.job.steps);
 for(const effect of a.assessment.effects)if(effect.kind==='worktree'||effect.kind==='private-config-copy')effect.target=canonical;
 const verifier=new GitHubMaintenance(a.store,a.engine.agents,(async(program:string,args:string[],options:any)=>{
  if(program==='git'&&args[0]==='rev-parse'&&args[1]==='--show-toplevel')return options.cwd;
  if(program==='git'&&args[0]==='remote')return `https://github.com/${a.store.project.repository}`;
  if(program==='gh'&&args[0]==='issue')return JSON.stringify({number:67,state:'OPEN',url:`https://github.com/${a.store.project.repository}/issues/67`});
  return a.execute(program,args);
 }) as any);
 a.verify.mockImplementation(candidate=>verifier.verifyCandidate(candidate));
 a.run.mockImplementation(async()=>{
  const response=a.readback(),worker=a.store.state.workLog!.at(-1)!,path=resolve(a.root,'sessions',worker.id,'assignment.json');
  const assignment=JSON.parse(readFileSync(path,'utf8'));assignment.scope.worktree=canonical;a.put(worker.id,'assignment.json',assignment);return response as any;
 });
 await a.adopt();expect(a.job.worktree).toBe(canonical);
 const result=a.response();result.worktree=canonical;await a.stage(result);
 expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'activation'}});
 expect(readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8')).toBe(original);
 expect(JSON.stringify(a.job.steps.slice(0,7))).toBe(history);
 const proof=JSON.parse(readFileSync(a.job.implementationContinuation!.proofPath,'utf8'));
 expect(proof.prior.steps.at(-1).result.worktree).toBe(a.result.worktree);expect(proof.worktreeIdentity.path).toBe(canonical);
});

test.each(['refresh','expired','unavailable','owned'] as const)('Brain adoption refreshes ownership after awaited checks: %s',async scenario=>{
 const a=brainFixture(),prior=JSON.stringify(a.job);let now=Date.now(),advanced=false;
 const start=now,observed:number[]=[];vi.spyOn(Date,'now').mockImplementation(()=>now);
 a.ownership.mockImplementation(async()=>{
  observed.push(now);
  return {complete:!advanced||scenario!=='unavailable',fresh:true,expiresAt:new Date(scenario==='expired'?start+45000:now+45000).toISOString(),ownership:{status:advanced&&scenario==='owned'?'owned':'clear'}};
 });
 const transport=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args)=>{
  const value=await transport(program,args);
  if(a.run.mock.calls.length&&!advanced&&program==='git'&&args[0]==='status'){advanced=true;now+=46000;}
  return value;
 });
 if(scenario==='refresh'){
  await a.adopt();expect(observed.at(-1)).toBe(start+46000);expect(a.job.implementationContinuation?.phase).toBe('technical-review');
 }else{
  await expect(a.adopt()).rejects.toThrow('live ownership changed');expect(JSON.stringify(a.job)).toBe(prior);
  expect(a.job.implementationContinuation).toBeUndefined();expect(a.request.status).toBe('working');
 }
 expect(advanced).toBe(true);
});

test('Brain adoption rechecks ownership expiry inside the final synchronous persistence fence',async()=>{
 const a=brainFixture(),prior=JSON.stringify(a.job);let now=Date.now();vi.spyOn(Date,'now').mockImplementation(()=>now);
 const capture=readbackEvidence.artifact;
 vi.spyOn(readbackEvidence,'artifact').mockImplementation((store,path)=>{
  const file=capture(store,path);if(path.endsWith(`${a.request.id}-implementation-readback.json`))now+=46000;return file;
 });
 await expect(a.adopt()).rejects.toThrow('live ownership changed');expect(JSON.stringify(a.job)).toBe(prior);
 expect(a.job.implementationContinuation).toBeUndefined();expect(a.request.status).toBe('working');
});

test('unknown historical paid count is preserved and requires a positive complete native no-paid audit',async()=>{
 const a=brainFixture();a.result.paidRuns=null;a.workerFiles(a.original,a.result,false,a.store.project.repo);
 expect(implementationRecoveryCandidate(a.store,a.job)?.work.id).toBe(a.original.id);
 await a.adopt();expect(a.job.stage).toBe('review');
 expect(a.job.steps.filter(step=>step.stage==='implement').at(-1)!.result.paidRuns).toBeNull();
 expect(JSON.parse(readFileSync(resolve(a.root,'sessions',a.original.id,'result.json'),'utf8')).result.paidRuns).toBeNull();
});
test('unknown paid count never becomes a no-paid assertion without the independent audit',async()=>{
 const a=brainFixture();a.result.paidRuns=null;a.workerFiles(a.original,a.result,false,a.store.project.repo);a.assessment.noPaidOperations=false;
 await expect(a.adopt()).rejects.toThrow('Positive complete Brain native effects audit required');
 expect(a.job.implementationContinuation).toBeUndefined();expect(a.result.paidRuns).toBeNull();
});

test('Brain exact branch/head source commit and composite ignored config effects bind without rewriting receipts',async()=>{
 const a=brainFixture(),receipt={id:'worktree-local-config',action:'copy ignored brain.config.local.json (0600) and chmod .state 0700 in worktree',target:a.result.worktree,verified:true,uncertain:false,detail:'Raw original aggregate'};
 a.result.receipts.push(receipt);a.result.receipts.push({id:'candidate',action:'git commit (pre-commit privacy guard enabled)',target:`${a.result.branch}@${a.result.commit}`,verified:true,uncertain:false,detail:'Raw original branch target'});
 const commit=a.assessment.effects.find((e:any)=>e.kind==='source-commit');commit.target=`${a.result.branch}@${a.result.commit}`;
 a.assessment.effects.push({id:receipt.id,kind:'private-config-copy',target:resolve(a.result.worktree,'brain.config.local.json'),verified:true,uncertain:false,evidence:'Exact native copy operation and private mode readback'},
  {id:'worktree-private-permissions',kind:'private-diagnostic',target:resolve(a.result.worktree,'.state'),verified:true,uncertain:false,evidence:'Exact native chmod and mode readback'});
 a.workerFiles(a.original,a.result,false,a.store.project.repo);const raw=JSON.stringify(a.result);await a.adopt();
 expect(JSON.stringify(a.result)).toBe(raw);const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence[0].path,'utf8'));expect(proof.effectBindings).toContainEqual({receipt,effectIds:['worktree-local-config','worktree-private-permissions'],kind:'ignored-config-and-private-permissions'});
});
test.each(['missing-permissions','aggregate-only','foreign-config','foreign-state','unknown-action','unverified','uncertain','empty-native-evidence','foreign-commit','duplicate-id','unknown-receipt'])('Brain effect projection rejects unsupported identity: %s',scenario=>{
 const candidate={worktree:'/candidate',branch:'codex/fixture',commit:'a'.repeat(40)},receipt={id:'worktree-local-config',action:'copy ignored brain.config.local.json (0600) and chmod .state 0700 in worktree',target:'/candidate'};
 const effects=[{id:'commit',kind:'source-commit',target:`${candidate.branch}@${candidate.commit}`,verified:true,uncertain:false,evidence:'Native commit'},
 {id:'worktree',kind:'worktree',target:candidate.worktree,verified:true,uncertain:false,evidence:'Native worktree'},
 {id:receipt.id,kind:'private-config-copy',target:'/candidate/brain.config.local.json',verified:true,uncertain:false,evidence:'Native copy'},
 {id:'worktree-private-permissions',kind:'private-diagnostic',target:'/candidate/.state',verified:true,uncertain:false,evidence:'Native chmod'}];
 const known=[receipt];
 if(scenario==='aggregate-only'){effects.pop();effects[2].target=candidate.worktree;}
 if(scenario==='missing-permissions')effects.pop();if(scenario==='foreign-config')effects[2].target='/foreign/brain.config.local.json';if(scenario==='foreign-state')effects[3].target='/foreign/.state';if(scenario==='unknown-action')receipt.action='copy arbitrary config';if(scenario==='unverified')effects[2].verified=false;if(scenario==='uncertain')effects[2].uncertain=true;if(scenario==='empty-native-evidence')effects[2].evidence=' ';if(scenario==='foreign-commit')effects[0].target='other@'+candidate.commit;if(scenario==='duplicate-id')effects.push({...effects[0]});if(scenario==='unknown-receipt')known.push({...receipt,id:'unknown'});
 expect(()=>bindBrainAuditEffects(candidate,known,effects)).toThrow('Positive complete');
});

test('Brain recovery rejects an aggregate config match without file and permissions subeffects',async()=>{
 const a=brainFixture(),receipt={id:'worktree-local-config',action:'copy ignored brain.config.local.json (0600) and chmod .state 0700 in worktree',target:a.result.worktree,verified:true,uncertain:false,detail:'Raw aggregate'};
 a.result.receipts.push(receipt);a.assessment.effects.push({id:receipt.id,kind:'private-config-copy',target:a.result.worktree,verified:true,uncertain:false,evidence:'Aggregate operation only'});
 a.workerFiles(a.original,a.result,false,a.store.project.repo);const prior=JSON.stringify(a.job),raw=JSON.stringify(a.result);
 await expect(a.adopt()).rejects.toThrow('Positive complete');expect(JSON.stringify(a.job)).toBe(prior);expect(JSON.stringify(a.result)).toBe(raw);
});

async function priorBrainAuditFixture(representation?:'loose-witness'|'permission-alias'){
 const a=brainFixture(),nativeRoots={codex:resolve(a.root,'codex-sessions'),claude:resolve(a.root,'claude-projects')};mkdirSync(nativeRoots.claude,{recursive:true});
 const sourcePath=resolve(nativeRoots.claude,a.original.sessionId!+'.jsonl'),source='{"type":"synthetic-source"}\n';writeFileSync(sourcePath,source);
 a.assessment.nativeSessionPath=sourcePath;a.assessment.nativeRecordCount=1;a.assessment.evidence=[{path:sourcePath,summary:`1 records; SHA-256 ${createHash('sha256').update(source).digest('hex')}. Complete original audit.`}];
 if(representation==='loose-witness')a.assessment.evidence[0].summary='Complete original audit; SHA-256 '+createHash('sha256').update(source).digest('hex')+'.';
 if(representation==='permission-alias'){
  a.result.receipts.push({id:'worktree-local-config',action:'copy ignored brain.config.local.json (0600) and chmod .state 0700 in worktree',target:a.result.worktree,verified:true,uncertain:false,detail:'Raw aggregate'});
  a.assessment.effects.push({id:'worktree-local-config',kind:'private-config-copy',target:resolve(a.result.worktree,'brain.config.local.json'),verified:true,uncertain:false,evidence:'Native config copy'},
   {id:'permissions-alias',kind:'private-diagnostic',target:resolve(a.result.worktree,'.state'),verified:true,uncertain:false,evidence:'Native permissions'});
  a.workerFiles(a.original,a.result,false,a.store.project.repo);
 }
 const context={prior:structuredClone(a.job),scope:continuationScope(a.store,a.job),original:continuationWorkerProof(a.store,a.job,a.original,false,a.store.project.repo),local:{issue:67,head:a.result.commit,worktree:a.result.worktree,branch:a.result.branch,summary:a.result.summary},knownEffects:a.result.receipts,provider:await readValidationProviderContext(a.delivery,a.job.key)};
 a.request.status='working';
 await a.admitted('reconciliation',a.request.id,a.request.action,async()=>{
  a.readback();const worker=a.store.state.workLog!.at(-1)!;worker.startedAt=new Date().toISOString();worker.endedAt=worker.startedAt;
 });
 const reader=a.store.state.workLog!.at(-1)!;a.request.status='blocked';a.request.detail='Error: Positive complete Brain native effects audit required';
 const task=`READ ONLY complete original native execution audit for Brain candidate recovery. Original worker ${a.original.id}, session ${a.original.sessionId}, exact candidate ${JSON.stringify(context.local)}. Bound human scope ${JSON.stringify(context.scope.notes)}. Current provider facts ${JSON.stringify(context.provider)}. Owned original evidence ${JSON.stringify(context.original.files)}; terminated group {}.\nRead complete original source. Prior state ${JSON.stringify(context.prior)}`;
 const saveNativeReader=(work:typeof reader,result:unknown)=>{
  const date=work.startedAt.slice(0,10).replaceAll('-','/'),dir=resolve(nativeRoots.codex,date);mkdirSync(dir,{recursive:true});
  const nativePath=resolve(dir,`rollout-${work.sessionId}.jsonl`),records=[{type:'session_meta',payload:{id:work.sessionId,cwd:a.result.worktree}},{type:'response_item',payload:{type:'message',role:'user',content:[{text:task.split('\n')[0]+'\nRuntime context\n'+task}]}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(result)}}];
  writeFileSync(nativePath,records.map(r=>JSON.stringify(r)).join('\n')+'\n');return {nativePath,records};
 };
 const {nativePath,records}=saveNativeReader(reader,a.assessment);
 const next=enqueueRequest(a.store,'reconcile-implementation',a.job.key,a.original.id);next.status='working';
 return {...a,nativeRoots,nativePath,records,context,next,reader,saveNativeReader};
}
test('reuses one completed native audit through a new scheduler intent without repeating a model call',async()=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit,prior=structuredClone(a.request),reader=structuredClone(a.reader),raw=readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8');
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));a.run.mockClear();
 await a.admitted('reconciliation',a.next.id,a.next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership));
 expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('review');expect(a.next.status).toBe('completed');expect(a.request).toEqual(prior);expect(a.reader).toEqual(reader);expect(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8')).toBe(raw);
 const proof=JSON.parse(readFileSync(a.job.implementationContinuation!.proofPath,'utf8'));expect(proof.auditReuse.originalIntent).toEqual(prior);expect(proof.auditReuse.nativeInput.path).toBe(a.nativePath);expect(proof.reader.worker.id).toBe(reader.id);
});
test.each(['human-scope','candidate','prior-job','provider','native-result','native-session','source-native','old-intent','claim','unknown-readback'])('reuse rejects stale or ambiguous original audit inputs: %s',async scenario=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit;
 if(scenario==='human-scope')a.context.scope.notes[0].note.detail='Changed';
 if(scenario==='candidate')a.context.local.head='c'.repeat(40);
 if(scenario==='prior-job')a.context.prior.detail='Changed';
 if(scenario==='provider')a.context.provider.issue.body='New human scope';
 if(scenario==='native-result')a.records.at(-1)!.payload.last_agent_message='{}';
 if(scenario==='native-session')a.records[0].payload.id='foreign';
 if(scenario==='source-native')writeFileSync(a.assessment.nativeSessionPath,'changed\n');
 if(scenario==='old-intent')a.request.detail='Unrelated failed operation';
 if(scenario==='claim')a.store.db.prepare("UPDATE work_claims SET body=json_set(body,'$.status','running') WHERE id=?").run(a.reader.claimId!);
 if(scenario==='unknown-readback')a.put(a.reader.id,'assignment.json',{id:'foreign'});
 if(['native-result','native-session'].includes(scenario))writeFileSync(a.nativePath,a.records.map(r=>JSON.stringify(r)).join('\n')+'\n');
 expect(()=>actual(a.store,a.job,a.next,a.context,a.nativeRoots)).toThrow();
 expect(a.next.status).toBe('working');expect(a.job.stage).toBe('implement');
});
test.each(['source-native','native-result','old-intent','missing-intent','foreign-original','empty-original'])('Brain recovery rejects tampered reuse without another model call: %s',async scenario=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit;
 if(scenario==='source-native')writeFileSync(a.assessment.nativeSessionPath,'changed\n');
 if(scenario==='native-result'){a.records.at(-1)!.payload.last_agent_message='{}';writeFileSync(a.nativePath,a.records.map(r=>JSON.stringify(r)).join('\n')+'\n');}
 if(scenario==='old-intent')a.request.detail='Unrelated failed operation';
 if(scenario==='missing-intent')a.store.state.coordination!.requests=a.store.state.coordination!.requests!.filter(r=>r.id!==a.request.id);
 if(['foreign-original','empty-original'].includes(scenario)){
  const saved=JSON.parse(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8'));saved.result.originalWorkId=scenario==='foreign-original'?'foreign-original':'';a.put(a.reader.id,'result.json',saved);
 }
 expect(()=>actual(a.store,a.job,a.next,a.context,a.nativeRoots)).toThrow();
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));a.run.mockClear();const prior=JSON.stringify(a.job);
 await expect(a.admitted('reconciliation',a.next.id,a.next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership))).rejects.toThrow();
 expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);expect(a.next.status).toBe('working');
});
test('a genuinely new Brain original retains the fresh reader path despite a prior original audit',async()=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit,priorAudit=readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8');
 // A new stopped original has its own identity and worktree; the prior audit stays untouched.
 a.original.id='new-original';a.original.sessionId='new-native';a.next.head=a.original.id;
 a.result.worktree=resolve(a.root,'new-candidate');mkdirSync(a.result.worktree);writeFileSync(resolve(a.result.worktree,'.git'),'gitdir: /synthetic/new-gitdir');
 a.workerFiles(a.original,a.result,false,a.store.project.repo);a.assessment.originalWorkId=a.original.id;a.assessment.nativeSessionId=a.original.sessionId;
 for(const effect of a.assessment.effects)if(['worktree','private-config-copy'].includes(effect.kind))effect.target=a.result.worktree;
 const sourcePath=resolve(a.nativeRoots.claude,a.original.sessionId+'.jsonl'),source='{"type":"new-synthetic-source"}\n';writeFileSync(sourcePath,source);
 a.assessment.nativeSessionPath=sourcePath;a.assessment.evidence=[{path:sourcePath,summary:`1 records; SHA-256 ${createHash('sha256').update(source).digest('hex')}. Complete new original audit.`}];
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));
 a.run.mockImplementation(async()=>{const result=a.readback(),worker=a.store.state.workLog!.at(-1)!;a.workerFiles(worker,result,true,a.result.worktree,'reconciliation',a.next.id);return result as any;});a.run.mockClear();
 await a.admitted('reconciliation',a.next.id,a.next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership));
 expect(a.run).toHaveBeenCalledTimes(1);expect(a.job.stage).toBe('review');expect(a.next.status).toBe('completed');
 expect(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8')).toBe(priorAudit);
});
test('IT preserves exhausted original counts and deduplicates one protocol/input-specific reuse request',async()=>{
 const a=await priorBrainAuditFixture();a.next.status='blocked';a.next.detail='Not yet executed';
 const oldId=`implementation:${a.job.id}`;a.store.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],recoveries:{[oldId]:{attempts:3,nextAt:'',status:'needs-human',detail:'Original exhausted native audit attempts',requestId:a.request.id}},services:[]};
 const fingerprint=brainAuditRetryFingerprint(a.store,a.job,a.original.id);expect(fingerprint).toBeTruthy();
 const offices={entries:new Map([['brain',{store:a.store,engine:a.engine}]])},health={report:async()=>({services:[]})},it=new ITSpecialist(offices as any,health as any),now=Date.now();
 const original=structuredClone(a.store.state.it!.recoveries[oldId]),history=JSON.stringify(a.job.steps),before=a.store.state.coordination!.requests!.length,bindingId=`implementation-audit-binding:${a.job.id}:${fingerprint}`;
 await it.tick(new Date(now),true);const requests=a.store.state.coordination!.requests!.filter(r=>r.action==='reconcile-implementation'&&r.status==='queued');expect(requests).toHaveLength(1);
 a.store.state.paused=true;await it.tick(new Date(now+60000),true);
 expect(a.store.state.it!.recoveries[bindingId]).toMatchObject({attempts:1,status:'retrying'});
 a.store.state.paused=false;await it.tick(new Date(now+120000),true);
 expect(a.store.state.coordination!.requests).toHaveLength(before+1);expect(a.store.state.it!.recoveries[bindingId].attempts).toBe(1);
 requests[0].status='blocked';requests[0].detail='Saved native binding failed';await it.tick(new Date(now+180000),true);
 expect(a.store.state.coordination!.requests).toHaveLength(before+1);expect(a.store.state.it!.recoveries[bindingId]).toMatchObject({attempts:1,status:'needs-human',requestId:requests[0].id});
 expect(a.store.state.it!.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:bindingId,owner:'Morgan',detail:expect.stringContaining('Saved native binding failed')}));
 a.store.state=JSON.parse((a.store.db.prepare('SELECT body FROM state WHERE id=1').get()as any).body);
 const restarted=new ITSpecialist(offices as any,health as any);await restarted.tick(new Date(now+600000),true);
 expect(a.store.state.coordination!.requests).toHaveLength(before+1);expect(a.store.state.it!.recoveries[bindingId]).toMatchObject({attempts:1,status:'needs-human',requestId:requests[0].id});
 const job=a.store.state.coordination!.jobs![0];job.detail='Changed candidate input';
 const changedFingerprint=brainAuditRetryFingerprint(a.store,job,a.original.id);expect(changedFingerprint).toBeTruthy();expect(changedFingerprint).not.toBe(fingerprint);
 await restarted.tick(new Date(now+660000),true);
 expect(a.store.state.coordination!.requests).toHaveLength(before+2);expect(a.store.state.it!.recoveries[`implementation-audit-binding:${job.id}:${changedFingerprint}`].attempts).toBe(1);
 expect(a.store.state.it!.recoveries[bindingId]).toMatchObject({attempts:1,status:'needs-human'});expect(a.store.state.it!.recoveries[oldId]).toEqual(original);expect(JSON.stringify(job.steps)).toBe(history);
 expect(a.store.state.it!.reports.flatMap(r=>r.actions).some(action=>action.includes('confirms the reported failure cleared'))).toBe(false);expect(a.run).not.toHaveBeenCalled();
});

test.each(['consistent','conflicting','issue-comment','board-status','native-claim','git-fetch','loose-witness','permission-alias']as const)('multiple completed audit representations remain preserved and %s evidence is handled deterministically',async scenario=>{
 const later=scenario==='loose-witness'||scenario==='permission-alias',conflicting=['conflicting','issue-comment','board-status','native-claim','git-fetch'].includes(scenario);
 const a=await priorBrainAuditFixture(later?scenario:undefined),second=a.next,actual=readPriorBrainAudit,raw=readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8');
 await a.admitted('reconciliation',second.id,second.action,async()=>{
  const alternate={...a.reader,id:'z-alternate-reader',sessionId:'alternate-native-session',claimId:currentAssignment()!.claim.id,startedAt:new Date().toISOString(),endedAt:new Date().toISOString()};
  a.store.state.workLog!.push(alternate);
  const result=structuredClone(a.assessment);result.summary='A differently worded independent audit of the same source';
  if(scenario==='conflicting')result.noHumanHold=false;
  if(['issue-comment','board-status','native-claim','git-fetch'].includes(scenario))result.effects.push({id:'extra-provider-effect',kind:scenario,target:'https://github.com/JFusco/brain/issues/67#issuecomment-999',verified:true,uncertain:false,evidence:'Conflicting native effect inventory'});
  if(scenario==='loose-witness')result.evidence[0].summary=`1 records; SHA-256 ${createHash('sha256').update(readFileSync(a.assessment.nativeSessionPath)).digest('hex')}. Complete original audit.`;
  if(scenario==='permission-alias')result.effects.find((e:any)=>e.id==='permissions-alias').id='worktree-private-permissions';
  a.workerFiles(alternate,result,true,a.result.worktree,'reconciliation',second.id);
  a.saveNativeReader(alternate,result);
 });
 second.status='blocked';second.detail='Error: Positive complete Brain native effects audit required';
 const next=enqueueRequest(a.store,'reconcile-implementation',a.job.key,a.original.id);next.status='working';
 if(conflicting)expect(()=>actual(a.store,a.job,next,a.context,a.nativeRoots)).toThrow('Conflicting');
 else {
  const proof=actual(a.store,a.job,next,a.context,a.nativeRoots)!;expect(proof.proof.worker.id).toBe(later?'z-alternate-reader':a.reader.id);expect(proof.alternates.map(p=>p.proof.worker.id)).toEqual([later?a.reader.id:'z-alternate-reader']);
  vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));a.run.mockClear();
  await a.admitted('reconciliation',next.id,next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership));
  expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('review');expect(next.status).toBe('completed');
  const saved=JSON.parse(readFileSync(a.job.implementationContinuation!.proofPath,'utf8'));expect(saved.auditReuse.otherCompletedAudits.map((p:any)=>p.reader.worker.id)).toEqual([later?a.reader.id:'z-alternate-reader']);
 }
 expect(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8')).toBe(raw);
 expect(a.reader.status).toBe('completed');expect(a.request.status).toBe('blocked');expect(a.next.status).toBe('blocked');
});

test.each(['equivalent-labels','extra-equivalent-fetch','extra-comment','different-comment','extra-board','different-board','extra-native-claim','different-original-worker','different-repository-origin','wrong-session-label']as const)('provider identity spelling compatibility preserves full audited recovery gates: %s',async scenario=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit,second=a.next,repository=a.store.project.repo,originalWorkId=a.original.id;
 a.assessment.effects.push({id:'origin-fetch',kind:'git-fetch',target:`${repository}: origin`,verified:true,uncertain:false,evidence:'Complete native origin fetch readback'},
  {id:'native-claims',kind:'native-claim',target:`Brain native maintenance/publication claims for ${originalWorkId}`,verified:true,uncertain:false,evidence:'Complete native claim operation accounting'},
  {id:'configured-card',kind:'board-status',target:`${a.store.project.githubProject!.url} item card`,verified:true,uncertain:false,evidence:'Configured card identity and exact status readback'});
 a.workerFiles(a.reader,a.assessment,true,a.result.worktree,'reconciliation',a.request.id);a.saveNativeReader(a.reader,a.assessment);
 let alternateId='';
 await a.admitted('reconciliation',second.id,second.action,async()=>{
  const alternate={...a.reader,id:'z-provider-alias-reader',sessionId:'provider-alias-native-session',claimId:currentAssignment()!.claim.id,startedAt:new Date().toISOString(),endedAt:new Date().toISOString()};alternateId=alternate.id;a.store.state.workLog!.push(alternate);
  const result=structuredClone(a.assessment);result.summary='Same audited operations with the other observed exact labels';
  result.effects.find((e:any)=>e.kind==='git-fetch').target=`${repository} origin`;
  result.effects.find((e:any)=>e.kind==='native-claim').target=`Brain original attempt ${originalWorkId}`;
  if(scenario==='extra-equivalent-fetch')result.effects.push({id:'extra-origin-fetch',kind:'git-fetch',target:`${repository}: origin`,verified:true,uncertain:false,evidence:'An additional fetch with the equivalent provider identity'});
  if(scenario==='extra-comment')result.effects.push({id:'extra-comment',kind:'issue-comment',target:'https://github.com/JFusco/brain/issues/67#issuecomment-999',verified:true,uncertain:false,evidence:'An additional provider effect'});
  if(scenario==='different-comment')result.effects.find((e:any)=>e.kind==='issue-comment').target='https://github.com/JFusco/brain/issues/68#issuecomment-1';
  if(scenario==='extra-board')result.effects.push({id:'extra-card',kind:'board-status',target:`${a.store.project.githubProject!.url} item other-card`,verified:true,uncertain:false,evidence:'An additional card effect'});
  if(scenario==='different-board')result.effects.find((e:any)=>e.kind==='board-status').target='https://github.com/users/JFusco/projects/9 item card';
  if(scenario==='extra-native-claim')result.effects.push({id:'extra-claim',kind:'native-claim',target:'Brain original attempt other-session',verified:true,uncertain:false,evidence:'An additional native claim effect'});
  if(scenario==='wrong-session-label')result.effects.find((e:any)=>e.kind==='native-claim').target=`Brain original attempt ${a.original.sessionId}`;
  if(scenario==='different-original-worker')result.effects.find((e:any)=>e.kind==='native-claim').target='Brain original attempt other-session';
  if(scenario==='different-repository-origin')result.effects.find((e:any)=>e.kind==='git-fetch').target='/foreign/brain origin';
  a.workerFiles(alternate,result,true,a.result.worktree,'reconciliation',second.id);a.saveNativeReader(alternate,result);
 });
 second.status='blocked';second.detail='Error: Positive complete Brain native effects audit required';
 const next=enqueueRequest(a.store,'reconcile-implementation',a.job.key,a.original.id);next.status='working';
 const firstRaw=readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8'),alternateRaw=readFileSync(resolve(a.root,'sessions',alternateId,'result.json'),'utf8'),oldRequests=JSON.stringify([a.request,second]);
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));a.run.mockClear();
 if(scenario==='equivalent-labels'){
  const selected=actual(a.store,a.job,next,a.context,a.nativeRoots)!;expect(selected.proof.worker.id).toBe(a.reader.id);expect(selected.alternates.map(p=>p.proof.worker.id)).toEqual([alternateId]);
  await a.admitted('reconciliation',next.id,next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership));
  expect(a.job).toMatchObject({stage:'review',status:'queued',implementationContinuation:{phase:'technical-review'}});expect(next.status).toBe('completed');
  const saved=JSON.parse(readFileSync(a.job.implementationContinuation!.proofPath,'utf8'));expect(saved.reader.result.effects).toEqual(a.assessment.effects);expect(saved.auditReuse.otherCompletedAudits[0].reader.worker.id).toBe(alternateId);
 }else{
  expect(()=>actual(a.store,a.job,next,a.context,a.nativeRoots)).toThrow('Conflicting completed Brain audit evidence');
  await expect(a.admitted('reconciliation',next.id,next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership))).rejects.toThrow('Conflicting completed Brain audit evidence');
  expect(a.job.stage).toBe('implement');expect(next.status).toBe('working');
 }
 expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify([a.request,second])).toBe(oldRequests);
 expect(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8')).toBe(firstRaw);expect(readFileSync(resolve(a.root,'sessions',alternateId,'result.json'),'utf8')).toBe(alternateRaw);
});

test.each(['interrupted','blocked']as const)('completed positive audit survives an ordinary %s fence through IT and actual recovery without a model retry',async status=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit;
 a.request.status=status;a.request.detail=status==='interrupted'?'Error: Brain implementation identity, scope, claim or live ownership changed':'Error: Issue/comments/holds/board changed during Brain audit';
 a.next.status='blocked';a.next.detail='Fixture intent never executed';
 const originalRecovery=`implementation:${a.job.id}`,raw=readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8'),old=JSON.stringify(a.request);
 a.store.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],recoveries:{[originalRecovery]:{attempts:3,nextAt:'',status:'needs-human',detail:'Original audit attempts exhausted',requestId:a.request.id}},services:[]};
 const fingerprint=brainAuditRetryFingerprint(a.store,a.job,a.original.id);expect(fingerprint).toBeTruthy();
 const it=new ITSpecialist({entries:new Map([['brain',{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 a.run.mockClear();await it.tick(new Date(),true);await it.tick(new Date(),true);
 const queued=a.store.state.coordination!.requests!.filter(r=>r.action==='reconcile-implementation'&&r.status==='queued');expect(queued).toHaveLength(1);
 expect(a.store.state.it!.recoveries[originalRecovery].attempts).toBe(3);expect(a.store.state.it!.recoveries[`implementation-audit-binding:${a.job.id}:${fingerprint}`].attempts).toBe(1);
 const next=queued[0];next.status='working';
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));
 await a.admitted('reconciliation',next.id,next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership));
 expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('review');expect(next.status).toBe('completed');expect(JSON.stringify(a.request)).toBe(old);expect(readFileSync(resolve(a.root,'sessions',a.reader.id,'result.json'),'utf8')).toBe(raw);
 const saved=JSON.parse(readFileSync(a.job.implementationContinuation!.proofPath,'utf8'));expect(saved.auditReuse.originalIntent).toMatchObject({status,detail:a.request.detail});
});
test.each(['missing','duplicate','queued','working','completed','non-error','changed-action','changed-key','changed-head','changed-lane'])('terminal audit reuse remains fail-closed for invalid prior intent: %s',async scenario=>{
 const a=await priorBrainAuditFixture(),actual=readPriorBrainAudit;
 if(scenario==='missing')a.store.state.coordination!.requests=a.store.state.coordination!.requests!.filter(r=>r.id!==a.request.id);
 if(scenario==='duplicate')a.store.state.coordination!.requests!.push(structuredClone(a.request));
 if(['queued','working','completed'].includes(scenario))a.request.status=scenario as any;
 if(scenario==='non-error')a.request.detail='Positive audit exists';
 if(scenario==='changed-action')a.request.action='reconcile-validation';
 if(scenario==='changed-key')a.request.key='GH-68';
 if(scenario==='changed-head')a.request.head='foreign-original';
 if(scenario==='changed-lane')a.request.lane='operations';
 expect(brainAuditRetryFingerprint(a.store,a.job,a.original.id)).toBeUndefined();expect(()=>actual(a.store,a.job,a.next,a.context,a.nativeRoots)).toThrow('prior intent binding');
 vi.spyOn(auditReuse,'readPriorBrainAudit').mockImplementation((store,job,intent,context)=>actual(store,job,intent,context,a.nativeRoots));a.run.mockClear();
 await expect(a.admitted('reconciliation',a.next.id,a.next.action,()=>recoverImplementation(a.delivery,a.job.key,a.original.id,a.ownership))).rejects.toThrow();
 expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('implement');expect(a.next.status).toBe('working');
});

function failedTechnicalResult(a:ReturnType<typeof brainFixture>){
 const result=a.response();result.outcome='failed';result.prerequisites=null;
 result.findings.push(...['deadline','redirect-scope','dedup-pacing'].map(id=>({...result.findings[0],id})));
 result.findings.push({...result.findings[0],id:'fixed-identity',status:'fixed'});
 result.resolution={kind:'source-repair',findingIds:result.findings.filter(f=>f.status==='open').map(f=>f.id),evidenceIds:[result.evidence[0].id]};
 return result;
}
function mixedHistoricalResult(a:ReturnType<typeof brainFixture>){
 const negative=failedTechnicalResult(a),old='b'.repeat(40),historicalPath=resolve(a.root,'ticket-work',a.job.id,'preserved-429.txt');writeFileSync(historicalPath,'Historical 429, unchanged');
 const historical={...negative.evidence[0],id:'preserved-source-hold',path:historicalPath,commit:old};
 a.job.steps.push({stage:'implement',result:{...structuredClone(negative),commit:old,resolution:null,evidence:[{...historical,id:'original-probe'}],findings:[structuredClone(negative.findings[0])]}});
 a.job.implementationContinuation!.round=1;a.job.implementationContinuation!.repairFindingIds=['deadline','redirect-scope','dedup-pacing','fixed-identity'];
 for(const finding of negative.findings)if(a.job.implementationContinuation!.repairFindingIds.includes(finding.id))finding.status='verified';
 negative.findings.push({...negative.findings[0],id:'redirect-response-lifecycle'});
 const source=resolve(a.job.worktree,'review-source.ts'),checks=resolve(a.job.worktree,'review-checks.ts');writeFileSync(source,'export const source = true;');writeFileSync(checks,'export const checked = true;');
 negative.evidence=[{...negative.evidence[0],id:'current-diagnostic',path:source},{...negative.evidence[0],id:'current-checks',kind:'checks',path:checks},historical];
 negative.resolution={kind:'source-repair',findingIds:negative.findings.filter(f=>f.status==='open').map(f=>f.id),evidenceIds:negative.evidence.map(e=>e.id)};
 return negative;
}
test('ordinary review retains mixed historical source evidence and derives owned exact-head review before bounded round two',async()=>{
 const a=brainFixture();await a.adopt();const negative=mixedHistoricalResult(a),raw=JSON.stringify(negative),history=JSON.stringify(a.job.steps);
 await a.stage(negative);const worker=a.store.state.workLog!.at(-1)!;
 expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'repair',round:2,pendingFindingIds:['index-429']}});
 expect(JSON.stringify(JSON.parse(readFileSync(resolve(a.root,'sessions',worker.id,'result.json'),'utf8')).result)).toBe(raw);
 expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(a.job.steps.at(-1)!.result.findings.find(f=>f.id==='index-429')!.status).toBe('open');
 const review=a.job.steps.at(-1)!.result.evidence.at(-1)!;expect(review).toMatchObject({kind:'review',commit:a.job.head});expect(review.path.startsWith(resolve(a.root,'ticket-work',a.job.id))).toBe(true);
 expect(JSON.parse(readFileSync(review.path,'utf8')).review).toEqual(negative);expect(JSON.parse(readFileSync(review.path,'utf8')).diagnostics).toHaveLength(3);expect(negative.evidence.at(-1)!.commit).toBe('b'.repeat(40));
});
test('ordinary mixed diagnostic files are rechecked after asynchronous continuation verification',async()=>{
 const a=brainFixture();await a.adopt();const negative=mixedHistoricalResult(a),before=structuredClone(a.job.implementationContinuation);let started=false,changed=false;
 const transport=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args)=>{
  const value=await transport(program,args);
  if(started&&!changed&&program==='git'&&args[0]==='status'){
   writeFileSync(negative.evidence[0].path,'Changed diagnostic');changed=true;
  }
  return value;
 });
 await a.stage(negative,()=>{started=true;});
 const current=a.store.state.coordination!.jobs![0];
 expect(changed).toBe(true);expect(current).toMatchObject({stage:'review',status:'blocked'});
 expect(current.implementationContinuation).toEqual(before);expect(current.detail).toContain('diagnostic evidence changed');
});
test.each([
 {stage:'review',outcome:'blocked'},
 {stage:'review',outcome:'failed'},
 {stage:'superseded-stage-result',outcome:'failed'},
] as const)('ordinary mixed review rejects unvalidated historical provenance: $stage/$outcome',async({stage,outcome})=>{
 const a=brainFixture();await a.adopt();const negative=mixedHistoricalResult(a),retained=a.job.steps.at(-1)!;
 retained.stage=stage;retained.result.outcome=outcome;
 const before=structuredClone(a.job);expect(negativeTechnicalReview(negative,a.job)).toBe(false);expect(implementationContinuationDecision(a.job,negative)?.action).toBe('blocked');
 await a.stage(negative);
 expect(a.job).toMatchObject({stage:'review',status:'blocked',head:before.head});expect(a.job.implementationContinuation).toEqual(before.implementationContinuation);expect(a.job.steps).toEqual(before.steps);
});
test('ordinary mixed review cannot use its current result as retained history',async()=>{
 const a=brainFixture();await a.adopt();const negative=mixedHistoricalResult(a);a.job.steps.pop();const before=structuredClone(a.job);
 await a.stage(negative,()=>{a.store.state.workLog!.at(-1)!.status='completed';});
 expect(a.job).toMatchObject({stage:'review',status:'blocked',head:before.head});expect(a.job.implementationContinuation).toEqual(before.implementationContinuation);
 expect(a.job.steps.slice(0,-1)).toEqual(before.steps);expect(a.job.steps.at(-1)!.stage).toBe('review');
 const current=a.job.steps.at(-1)!.result;expect(negativeTechnicalReview(current,a.job)).toBe(false);expect(implementationContinuationDecision(a.job,current)?.action).toBe('blocked');
});
test.each(['',' \t '])('ordinary mixed review rejects a blank evidence reference: %j',async id=>{
 const a=brainFixture();await a.adopt();const negative=mixedHistoricalResult(a);negative.evidence.at(-1)!.id=id;negative.resolution!.evidenceIds[2]=id;
 const before=structuredClone(a.job);expect(negativeTechnicalReview(negative,a.job)).toBe(false);expect(implementationContinuationDecision(a.job,negative)?.action).toBe('blocked');
 await a.stage(negative);
 expect(a.job).toMatchObject({stage:'review',status:'blocked',head:before.head});expect(a.job.implementationContinuation).toEqual(before.implementationContinuation);expect(a.job.steps).toEqual(before.steps);
 const worker=a.store.state.workLog!.at(-1)!;expect(JSON.parse(readFileSync(resolve(a.root,'sessions',worker.id,'result.json'),'utf8')).result).toEqual(negative);
});
test('actual failed technical assessment routes through ordinary delivery to Alex with open source gates retained',async()=>{
 const a=brainFixture();await a.adopt();const negative=failedTechnicalResult(a),history=JSON.stringify(a.job.steps);
 await a.stage(negative);const worker=a.store.state.workLog!.at(-1)!;
 expect(worker.status).toBe('failed');expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',head:a.result.commit,implementationContinuation:{phase:'repair',round:1,pendingFindingIds:['index-429']}});
 expect(a.job.implementationContinuation!.repairFindingIds).toEqual(expect.arrayContaining(['deadline','redirect-scope','dedup-pacing','fixed-identity']));expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);
 expect(a.job.steps.at(-1)).toMatchObject({stage:'review',workerId:worker.id,result:{outcome:'failed',resolution:{kind:'source-repair'}}});
 const saved=JSON.parse(readFileSync(resolve(a.root,'sessions',worker.id,'result.json'),'utf8'));expect(saved.result.outcome).toBe('failed');expect(saved.result.findings[0].status).toBe('open');
});
test.each(['provider-crash','output-recovery','status-failed-result-passed','incomplete-result','uncertain-effect','wrong-resolution','stale-head','wrong-assignment','failed-qa','repair-budget'])('failed review metadata never hides genuine provider/process/identity failure: %s',async scenario=>{
 const a=brainFixture();await a.adopt();
 if(scenario==='failed-qa'){a.job.stage='validate';a.job.implementationContinuation!.phase='acceptance';}
 if(scenario==='repair-budget')a.job.implementationContinuation!.round=3;
 const before=structuredClone(a.job.implementationContinuation),stage=a.job.stage,negative=failedTechnicalResult(a);
 if(scenario==='uncertain-effect')negative.receipts.push({id:'uncertain',action:'unknown write',target:'provider',verified:false,uncertain:true,detail:'Retained uncertainty'});
 if(scenario==='wrong-resolution')negative.resolution!.kind='permission';
 if(scenario==='stale-head')negative.commit='c'.repeat(40);
 await a.stage(negative,()=>{const worker=a.store.state.workLog!.at(-1)!;
  if(scenario==='provider-crash')a.put(worker.id,'error.json',{error:'Provider process crashed'});
  if(scenario==='output-recovery')a.put(worker.id,'output-error.json',{error:'Provider transport failure'});
  if(scenario==='status-failed-result-passed')a.put(worker.id,'result.json',{session:worker.sessionId,result:{...negative,outcome:'passed'}});
  if(scenario==='incomplete-result')a.put(worker.id,'result.json',{session:worker.sessionId,result:{outcome:'failed'}});
  if(scenario==='wrong-assignment')a.put(worker.id,'assignment.json',{id:'foreign'});
 });
 expect(a.job.status).toBe('blocked');expect(a.job.stage).toBe(stage);expect(a.job.implementationContinuation).toEqual(before);
 if(scenario==='failed-qa')expect(a.store.state.workLog!.at(-1)).toMatchObject({role:'qa',stage:'github-validate',status:'failed'});
 if(scenario==='repair-budget')expect(a.job.detail).toContain('budget exhausted');
});
async function savedNegativeFixture(mixed=false){
 const a=brainFixture();await a.adopt();const negative=mixed?mixedHistoricalResult(a):failedTechnicalResult(a);let work:any;
 await a.admitted('delivery',a.job.id,'review',async()=>{
  work={...a.original,id:'saved-negative-review',sessionId:'saved-negative-native',role:'lead',provider:'codex',stage:'github-review',status:'failed',claimId:currentAssignment()!.claim.id,processId:2147483645,startedAt:new Date().toISOString(),endedAt:new Date().toISOString()};
  a.store.state.workLog!.push(work);a.workerFiles(work,negative,true,a.job.worktree);
 });
 const nativeRoot=resolve(a.root,'codex-sessions'),day=work.startedAt.slice(0,10).replaceAll('-','/'),dir=resolve(nativeRoot,day);mkdirSync(dir,{recursive:true});
 const nativePath=resolve(dir,`rollout-${work.sessionId}.jsonl`),records:any[]=[{type:'session_meta',payload:{id:work.sessionId,cwd:a.job.worktree}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(negative)}}];
 const writeNative=()=>writeFileSync(nativePath,records.map(r=>JSON.stringify(r)).join('\n')+'\n');writeNative();
 const readNative=continuationEvidence.continuationNativeReview;
 vi.spyOn(continuationEvidence,'continuationNativeReview').mockImplementation((store,worker,result)=>readNative(store,worker,result,nativeRoot));
 a.job.status='blocked';a.job.detail='Error: One actual independent continuation stage worker required';
 const request=enqueueRequest(a.store,'reconcile-review',a.job.key,work.id);request.status='working';
 const reconcile=()=>a.admitted('reconciliation',request.id,request.action,()=>a.delivery.reconcileReview(a.job.key,work.id));
 return {...a,negative,work,reviewRequest:request,reconcile,nativeRoot,nativePath,records,writeNative};
}
test('existing reconcile-review command reuses exact saved failed review without model replay or acceptance',async()=>{
 const a=await savedNegativeFixture(),raw=readFileSync(resolve(a.root,'sessions',a.work.id,'result.json'),'utf8'),native=readFileSync(a.nativePath,'utf8'),worker=JSON.stringify(a.work),history=JSON.stringify(a.job.steps);a.run.mockClear();
 const selected=savedNegativeContinuationReview(a.store,a.job,a.work.id)!;expect(selected.proof.worker.id).toBe(a.work.id);expect(selected.native.file.path).toBe(a.nativePath);
 await a.reconcile();expect(a.run).not.toHaveBeenCalled();expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'repair',round:1,pendingFindingIds:['index-429']}});expect(a.reviewRequest.status).toBe('completed');
 expect(readFileSync(resolve(a.root,'sessions',a.work.id,'result.json'),'utf8')).toBe(raw);expect(JSON.stringify(a.work)).toBe(worker);expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);
 expect(readFileSync(a.nativePath,'utf8')).toBe(native);const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.native).toEqual(selected.native);
 expect(a.job.steps.at(-1)).toMatchObject({stage:'review',workerId:a.work.id,result:{outcome:'failed'}});await expect(a.reconcile()).rejects.toThrow('Exact saved');expect(a.job.implementationContinuation!.round).toBe(1);
});
test.each(['stale-issue','late-comment','ownership','new-human-note','pause','foreign-claim','missing-intent','uncertain-effect','crashed-original','tampered-result','live-original','old-claim','changed-provider','repair-budget'])('saved negative reconciliation rejects unsafe or stale evidence without a model retry: %s',async scenario=>{
 const a=await savedNegativeFixture(),before=structuredClone(a.job);a.run.mockClear();
 if(scenario==='repair-budget'){a.job.implementationContinuation!.round=3;before.implementationContinuation!.round=3;}
 if(scenario==='stale-issue')a.issue.updated_at=new Date(Date.now()+60000).toISOString();
 if(scenario==='ownership')a.visibility.ownership.status='owned';
 if(scenario==='late-comment'){
  const original=a.execute.getMockImplementation()!,at=new Date(Date.now()+60000).toISOString();
  a.execute.mockImplementation(async(program,args)=>program==='gh'&&args[1]?.includes('issues/67/comments?')?JSON.stringify([{id:99,issue_url:'https://api.github.com/repos/JFusco/brain/issues/67',html_url:'https://github.com/JFusco/brain/issues/67#issuecomment-99',body:'New human scope',user:{login:'JFusco'},author_association:'OWNER',created_at:at,updated_at:at}]):original(program,args));
 }
 if(scenario==='new-human-note')a.store.state.projectNotes[0].detail='Changed human scope';
 if(scenario==='pause')a.store.state.paused=true;
 if(scenario==='missing-intent')a.store.state.coordination!.requests=a.store.state.coordination!.requests!.filter(r=>r.id!==a.reviewRequest.id);
 if(scenario==='uncertain-effect')a.negative.receipts.push({id:'unknown',action:'unknown mutation',target:'provider',verified:false,uncertain:true,detail:'Uncertain'});
 if(scenario==='crashed-original')a.put(a.work.id,'error.json',{error:'Provider crashed'});
 if(scenario==='tampered-result')a.negative.commit='d'.repeat(40);
 if(['uncertain-effect','tampered-result'].includes(scenario))a.workerFiles(a.work,a.negative,true,a.job.worktree);
 if(scenario==='live-original')vi.spyOn(processTools,'processGroupAlive').mockImplementation(pid=>pid===a.work.processId);
 if(scenario==='old-claim')a.store.db.prepare("UPDATE work_claims SET body=json_set(body,'$.status','running') WHERE id=?").run(a.work.claimId);
 if(scenario==='changed-provider'){let calls=0;const api=a.delivery.api.bind(a.delivery);vi.spyOn(a.delivery,'api').mockImplementation(async path=>{const result=await api(path);if(path==='issues/67'&&++calls>1)a.issue.updated_at=new Date(Date.now()+60000).toISOString();return result;});}
 if(scenario==='foreign-claim')await expect(a.admitted('reconciliation','other-intent','reconcile-review',()=>a.delivery.reconcileReview(a.job.key,a.work.id))).rejects.toThrow();
 else await expect(a.reconcile()).rejects.toThrow();
 expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('review');expect(a.job.implementationContinuation).toEqual(before.implementationContinuation);expect(a.job.steps).toEqual(before.steps);expect(a.work.status).toBe('failed');
});

test.each(['sanitization','empty-review-path'])('saved negative reconciliation permits WorkerRuntime normalization only: %s',async scenario=>{
 const a=await savedNegativeFixture(),nativeResult=structuredClone(a.negative);
 if(scenario==='sanitization')nativeResult.summary='Inspected https://example.invalid/?token=synthetic';
 if(scenario==='empty-review-path')nativeResult.evidence[0].path='';
 a.records.at(-1)!.payload.last_agent_message=JSON.stringify(nativeResult);a.writeNative();
 const saved=sanitizeObject(nativeResult);
 if(scenario==='empty-review-path'){
  saved.evidence[0].path=resolve(a.root,'ticket-work',a.job.id,`${a.work.id}-analysis.md`);writeFileSync(saved.evidence[0].path,saved.summary);
 }
 a.put(a.work.id,'result.json',{session:a.work.sessionId,result:saved});a.run.mockClear();
 await a.reconcile();expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'repair',round:1}});expect(a.run).not.toHaveBeenCalled();
 expect(a.job.steps.at(-1)!.result.summary).toBe(saved.summary);expect(a.job.steps.at(-1)!.result.evidence[0]).toEqual(saved.evidence[0]);
});
test.each(['missing-native','invalid-json','invalid-result','wrong-session','wrong-cwd','duplicate-native','incomplete-native','same-head-findings','same-head-resolution','nonempty-review-path'])('saved negative reconciliation rejects missing, invalid or altered native evidence: %s',async scenario=>{
 const a=await savedNegativeFixture(),before=structuredClone(a.job);a.run.mockClear();
 if(scenario==='missing-native')rmSync(a.nativePath);
 if(scenario==='invalid-json')writeFileSync(a.nativePath,'not json\n');
 if(scenario==='invalid-result')a.records.at(-1)!.payload.last_agent_message=JSON.stringify({outcome:'failed'});
 if(scenario==='wrong-session')a.records[0].payload.id='foreign-session';
 if(scenario==='wrong-cwd')a.records[0].payload.cwd=a.store.project.repo;
 if(scenario==='duplicate-native')cpSync(a.nativePath,resolve(a.nativeRoot,a.work.startedAt.slice(0,10).replaceAll('-','/'),`duplicate-${a.work.sessionId}.jsonl`));
 if(scenario==='incomplete-native')a.records.pop();
 if(['invalid-result','wrong-session','wrong-cwd','incomplete-native'].includes(scenario))a.writeNative();
 if(scenario==='same-head-findings'){
  a.negative.findings[1].id='altered-deadline';a.negative.resolution!.findingIds=a.negative.findings.filter(f=>f.status==='open').map(f=>f.id);
 }
 if(scenario==='same-head-resolution')a.negative.resolution!.evidenceIds.push(a.negative.evidence[0].id);
 if(scenario==='nonempty-review-path')a.negative.evidence[0].path=resolve(a.root,'ticket-work',a.job.id,'different-review.md');
 if(['same-head-findings','same-head-resolution','nonempty-review-path'].includes(scenario))a.put(a.work.id,'result.json',{session:a.work.sessionId,result:a.negative});
 await expect(a.reconcile()).rejects.toThrow('Exact saved');expect(a.run).not.toHaveBeenCalled();expect(a.job).toEqual(before);expect(a.work.status).toBe('failed');
});
test.each(['awaited-read','final-admission'])('saved negative reconciliation rechecks original native artifact at %s',async timing=>{
 const a=await savedNegativeFixture(),before=structuredClone(a.job),capture=readbackEvidence.artifact;a.run.mockClear();let changed=false;
 const mutate=()=>{writeFileSync(a.nativePath,readFileSync(a.nativePath,'utf8')+'\n');changed=true;};
 if(timing==='awaited-read'){
  const api=a.delivery.api.bind(a.delivery);vi.spyOn(a.delivery,'api').mockImplementation(async path=>{const result=await api(path);if(!changed)mutate();return result;});
 }else vi.spyOn(readbackEvidence,'artifact').mockImplementation((store,path)=>{const file=capture(store,path);if(path.endsWith(`${a.reviewRequest.id}-negative-review-readback.json`)&&!changed)mutate();return file;});
 await expect(a.reconcile()).rejects.toThrow('changed');expect(changed).toBe(true);expect(a.run).not.toHaveBeenCalled();expect(a.store.state.coordination!.jobs![0]).toEqual(before);
});

test('original-bound saved mixed review consumes actual native result into round two without a new model or historical restamp',async()=>{
 const a=await savedNegativeFixture(true),raw=readFileSync(resolve(a.root,'sessions',a.work.id,'result.json'),'utf8'),native=readFileSync(a.nativePath,'utf8'),history=JSON.stringify(a.job.steps);a.run.mockClear();
 const selected=savedNegativeContinuationReview(a.store,a.job,a.work.id)!;expect(selected.diagnostics).toHaveLength(3);
 await a.reconcile();expect(a.run).not.toHaveBeenCalled();expect(a.reviewRequest.status).toBe('completed');
 expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{phase:'repair',round:2,pendingFindingIds:['index-429']}});
 expect(readFileSync(resolve(a.root,'sessions',a.work.id,'result.json'),'utf8')).toBe(raw);expect(readFileSync(a.nativePath,'utf8')).toBe(native);expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);
 const result=a.job.steps.at(-1)!.result;expect(result.evidence.find(e=>e.id==='preserved-source-hold')!.commit).toBe('b'.repeat(40));expect(result.findings.find(f=>f.id==='index-429')!.status).toBe('open');
 const proof=JSON.parse(readFileSync(result.evidence.at(-1)!.path,'utf8'));expect(proof.diagnostics).toEqual(selected.diagnostics);expect(proof.native).toEqual(selected.native);
});
test.each(['unknown-historical','blocked-history','failed-history','superseded-history','missing-current','unknown-reference','duplicate-reference','empty-reference','blank-reference','missing-file','outside-file','symlink-file','pending-resolved','native-tamper'])('mixed saved evidence fails closed: %s',async scenario=>{
 const a=await savedNegativeFixture(true);a.run.mockClear();
 if(scenario==='unknown-historical')a.negative.evidence.at(-1)!.commit='c'.repeat(40);
 if(['blocked-history','failed-history','superseded-history'].includes(scenario)){
  const retained=a.job.steps.at(-1)!;retained.stage=scenario==='superseded-history'?'superseded-stage-result':'review';retained.result.outcome=scenario==='blocked-history'?'blocked':'failed';
  expect(negativeTechnicalReview(a.negative,a.job)).toBe(false);expect(implementationContinuationDecision(a.job,a.negative)?.action).toBe('blocked');
 }
 if(scenario==='missing-current')a.negative.resolution!.evidenceIds=['preserved-source-hold'];
 if(scenario==='unknown-reference')a.negative.resolution!.evidenceIds.push('never-observed');
 if(scenario==='duplicate-reference')a.negative.resolution!.evidenceIds.push('current-diagnostic');
 if(scenario==='empty-reference'||scenario==='blank-reference'){
  const id=scenario==='empty-reference'?'':' \t ';a.negative.evidence.at(-1)!.id=id;a.negative.resolution!.evidenceIds[2]=id;
 }
 if(scenario==='missing-file')rmSync(a.negative.evidence[0].path);
 if(scenario==='outside-file'){
  const outside=mkdtempSync(resolve(tmpdir(),'office-impl-outside-'));roots.push(outside);a.negative.evidence[0].path=resolve(outside,'outside-current.ts');writeFileSync(a.negative.evidence[0].path,'Real outside diagnostic');
 }
 if(scenario==='symlink-file'){
  const path=resolve(a.job.worktree,'linked-current.ts');symlinkSync(a.negative.evidence[0].path,path);a.negative.evidence[0].path=path;
 }
 if(scenario==='pending-resolved')a.negative.findings.find(f=>f.id==='index-429')!.status='verified';
 if(scenario!=='native-tamper'){a.records.at(-1)!.payload.last_agent_message=JSON.stringify(a.negative);a.writeNative();}
 else a.negative.summary='Altered saved analysis';
 a.put(a.work.id,'result.json',{session:a.work.sessionId,result:a.negative});const before=structuredClone(a.job);
 await expect(a.reconcile()).rejects.toThrow('Exact saved');expect(a.run).not.toHaveBeenCalled();expect(a.job).toEqual(before);expect(a.work.status).toBe('failed');
});
test('mixed diagnostic files are rechecked after asynchronous native and provider reads',async()=>{
 const a=await savedNegativeFixture(true),before=structuredClone(a.job);a.run.mockClear();let changed=false;const api=a.delivery.api.bind(a.delivery);
 vi.spyOn(a.delivery,'api').mockImplementation(async path=>{const result=await api(path);if(!changed){writeFileSync(a.negative.evidence[0].path,'Changed diagnostic');changed=true;}return result;});
 await expect(a.reconcile()).rejects.toThrow('changed');expect(a.run).not.toHaveBeenCalled();expect(a.job).toEqual(before);
});

test.each(['normal','saved'] as const)('harness derives current review record from native structured diagnostics without a model-written Office review path: %s',async mode=>{
 if(mode==='normal'){
  const a=brainFixture();await a.adopt();const result=mixedHistoricalResult(a);result.evidence[0].kind='checks';await a.stage(result);
  expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{round:2}});expect(a.job.steps.at(-1)!.result.evidence.at(-1)!.kind).toBe('review');
 }else{
  const a=await savedNegativeFixture(true);a.negative.evidence[0].kind='checks';a.records.at(-1)!.payload.last_agent_message=JSON.stringify(a.negative);a.writeNative();a.put(a.work.id,'result.json',{session:a.work.sessionId,result:a.negative});a.run.mockClear();
  await a.reconcile();expect(a.run).not.toHaveBeenCalled();expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',implementationContinuation:{round:2}});expect(a.job.steps.at(-1)!.result.evidence.at(-1)!.kind).toBe('review');
 }
});
