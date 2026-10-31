import {HOLDS} from '../../server/config';
import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync,existsSync,symlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../server/store';
import {Engine} from '../../server/engine';
import {GitHubDelivery} from '../../server/github-delivery';
import {projectById} from '../../server/projects';
import {ITSpecialist} from '../../server/it-specialist';
import {coordination} from '../../server/coordination';
import {currentAssignment,withAssignment} from '../../server/assignment-context';
import {enqueueRequest,enqueueCloseoutReconciliation} from '../../server/requests';
import {workerProfile} from '../../server/worker-profiles';
import {closeoutRecoveryCandidate,closeoutRequestResolved,verifiedCloseoutCleanupRequest} from '../../server/closeout-recovery-evidence';
import {assertCoreCloseoutCoverage,reconcileOriginalCloseout} from '../../server/closeout-recovery';
import {cleanupMergedCandidate,resumeCloseoutCleanup} from '../../server/merged-candidate-cleanup';
import * as gates from '../../server/preparation-gates';
import * as localRemoval from '../../server/local-worktree-removal';
import * as processes from '../../server/process';
import {artifact,rootArtifact,sha,digest} from '../../server/readback-evidence';
import type {TicketJob,StageResult,HarnessRequest} from '../../src/shared';
const env=vi.hoisted(()=>({home:''}));vi.mock('node:os',async original=>({...await original<typeof import('node:os')>(),homedir:()=>env.home}));
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{delete HOLDS['GH-115'];vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true}));});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'office-closeout-proof-'));roots.push(root);env.home=root;
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo:resolve(root,'primary')},root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const engine=new Engine(store),head='a'.repeat(40),merge='b'.repeat(40),branch='codex/scoped-fixture',worktree=mkdtempSync(resolve(tmpdir(),'office-closeout-owned-worktree-'));roots.push(worktree);writeFileSync(resolve(worktree,'.git'),'gitdir: fixture');
 const job:TicketJob={id:'job',key:'GH-115',stage:'closeout',status:'blocked',requestedAt:'2026-10-30T00:00:00Z',head,mergeCommit:merge,branch,worktree,pr:116,prUrl:'https://github.com/JFusco/cms-field-vocabulary/pull/116',detail:'Error: Worker exited with surviving subprocesses; effects require reconciliation',steps:[]};store.state.coordination.jobs=[job];store.state.tickets.push({key:job.key,status:'active',stage:'review',activity:'working'}as any);
 const path=resolve(root,'ticket-work/job/evidence.json');mkdirSync(resolve(root,'ticket-work/job'),{recursive:true});writeFileSync(path,'{"evidence":true}');
 const source:StageResult={outcome:'passed',summary:'Actual accepted same-head source and QA',commit:head,worktree,branch,prId:116,findings:[],receipts:[],evidence:[{id:'source',kind:'review',path,commit:head,summary:'Source',environment:'fixture',url:'',observedAt:''}],paidRuns:0,qaRunDir:'',previewUrl:'',blocker:'',prerequisites:null,approach:null};
 job.steps=[{stage:'review',result:structuredClone(source)},{stage:'validate',result:structuredClone(source)},{stage:'lead-pr',result:structuredClone(source)}];
 const put=(id:string,name:string,value:any)=>{const dir=resolve(root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 function worker(id:string,role:string,stage:string,status:string,readOnly:boolean,kind='delivery',assignmentId=job.id){
  const work:any={id,sessionId:'native-'+id,requestId:job.id,ticket:job.key,role,stage,provider:'codex',status,lane:'delivery',claimId:'claim-'+id,processId:2147483600-id.length,startedAt:'2026-10-30T00:01:00Z',endedAt:'2026-10-30T00:02:00Z'};
  store.state.workLog!.push(work);put(id,'provider.json',{project:store.project.id,repository:store.project.repository,role,provider:'codex',readOnly});
  put(id,'assignment.json',{id,claimId:work.claimId,stage,role,lane:'delivery',work:{projectId:store.project.id,kind,id:assignmentId},scope:{repository:store.project.repository,worktree,artifacts:resolve(root,'sessions',id)},profile:workerProfile(stage,readOnly).name});
  put(id,'assignment-identity.json',{attemptId:id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,role,threadId:work.sessionId});put(id,'capabilities.json',workerProfile(stage,readOnly));return work;
 }
 store.state.workLog=[];const lead=worker('lead','lead','github-lead-pr','completed',true);put('lead','result.json',{session:lead.sessionId,result:source});
 const original=worker('original','pm','github-closeout','failed',false);original.startedAt='2026-10-30T00:03:00Z';original.endedAt='2026-10-30T00:04:00Z';const issueUrl='https://github.com/JFusco/cms-field-vocabulary/issues/115',commentUrl=issueUrl+'#issuecomment-999';
 const raw:any={...structuredClone(source),outcome:'blocked',summary:'Core closeout verified; original cleanup uncertain',commit:merge,findings:[{id:'cleanup',summary:'Cleanup uncertain',expected:'Verified removal',actual:'Timeout',status:'open',attempts:1}],receipts:[{id:'issue-close',action:'issue-close',target:issueUrl,verified:true,uncertain:false,detail:'Closed'},{id:'issue-comment',action:'issue-comment',target:commentUrl,verified:true,uncertain:false,detail:'One original comment'},{id:'board-status',action:'board-status',target:store.project.githubProject!.url,verified:true,uncertain:false,detail:'Done'},{id:'merged-branch-cleanup',action:`git push origin --delete ${branch}`,target:`https://github.com/${store.project.repository}/tree/${branch}`,verified:false,uncertain:true,detail:'Original timed out'}]};
 raw.resolution={kind:'uncertain-effect',findingIds:['cleanup'],evidenceIds:['source']};
 const saveOriginal=()=>{put('original','completed-output.json',raw);const nativeRoot=resolve(root,'.codex/sessions');mkdirSync(nativeRoot,{recursive:true});writeFileSync(resolve(nativeRoot,'rollout-native-original.jsonl'),[{type:'session_meta',payload:{id:original.sessionId}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(raw)}}].map(r=>JSON.stringify(r)).join('\n'));};saveOriginal();
 put('original','error.json',{provider:'codex',session:original.sessionId,error:job.detail});
 const mergeEffect:any={id:`merge:${job.id}:${head}`,work:{projectId:store.project.id,kind:'delivery',id:job.id},attemptId:'merge-attempt',operation:'github-merge',target:job.prUrl,authorization:'accepted',payload:{sha:head},expectedState:null,status:'verified',createdAt:'',dispatchedAt:'',verifiedAt:'',receipt:{merged:true,sha:merge},error:'',elapsedMs:1};store.putEffect(mergeEffect);
 const intent=enqueueRequest(store,'reconcile-closeout',job.key,original.id);intent.status='working';
 const assessment:any={outcome:'passed',originalWorkId:original.id,nativeSessionId:original.sessionId,checkpointSha256:artifact(store,resolve(root,'sessions/original/completed-output.json')).sha256,mergeCommit:merge,head,cleanupFindingId:'cleanup',completeNativeExecution:true,originalDeletionNotCurrentlyApplied:true,noOtherUncertainEffects:true,coreCloseoutVerified:true,sourceGatesPreserved:true,noHumanHold:true,nativeSessionPath:resolve(root,'.codex/sessions/rollout-native-original.jsonl'),nativeRecordCount:2,summary:'Complete original execution accounted for; delete not applied, only separate cleanup pending',evidence:[{path,summary:'Full native execution and exact provider ref'}]};
 const readback=()=>{const assignment=currentAssignment()?.claim,reader=worker('reader','lead','closeout-original-readback','completed',true,'reconciliation',assignment?.work.kind==='reconciliation'?assignment.work.id:intent.id);put(reader.id,'result.json',{session:reader.sessionId,result:assessment});return structuredClone(assessment);};
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback()as any);
 const issue:any={number:115,html_url:issueUrl,state:'closed',state_reason:'completed',title:'Exact scope',body:'Acceptance preserved',labels:[],assignees:[{login:'JFusco'}]};
 const pull:any={number:116,html_url:job.prUrl,state:'closed',merged_at:'2026-10-30T00:00:00Z',merge_commit_sha:merge,head:{sha:head,ref:branch,repo:{full_name:store.project.repository}},base:{ref:'main',repo:{full_name:store.project.repository}}};
 const comments:any[]=[{id:999,html_url:commentUrl,body:'Exact merged PR closeout',user:{login:'JFusco'},created_at:'now',updated_at:'now'}],board:any={items:[{id:'item',number:115,repository:store.project.repository,status:'Done'}]};
 const refs={remote:head as string|null,local:head as string|null,dirty:'',dependents:[]as any[],registered:true},writes:any[]=[],hooks={afterWrite:undefined as undefined|((kind:string)=>void),beforeRead:undefined as undefined|(()=>void)};
 const execute=vi.fn(async(program:string,args:string[],options:any)=>{
  if(program==='git'){
   if(args[0]==='remote')return 'https://github.com/'+store.project.repository+'.git';if(args[0]==='rev-parse')return head;if(args[0]==='branch')return branch;if(args[0]==='status')return refs.dirty;
   if(args[0]==='for-each-ref')return refs.local?`refs/heads/${branch}\t${refs.local}`:'';
   if(args[0]==='worktree'&&args[1]==='list')return refs.registered?`worktree ${worktree}\nHEAD ${head}\nbranch refs/heads/${branch}\n`:'';
   if(args[0]==='ls-files')return args.at(-1)!;if(args[0]==='show')return 'tracked exact bytes';
   if(args[0]==='worktree'&&args[1]==='remove'){writes.push({kind:'worktree',args});options.onSpawn(2147483500);rmSync(worktree,{recursive:true});refs.registered=false;hooks.afterWrite?.('worktree');return '';}
   if(args[0]==='update-ref'){writes.push({kind:'branch',args});options.onSpawn(2147483501);refs.local=null;hooks.afterWrite?.('branch');return '';}
  }
  if(program==='gh'&&args[1]==='graphql'){
   const input=JSON.parse(options.input);
   if(input.query.startsWith('mutation')){writes.push({kind:'remote',input});options.onSpawn(2147483502);refs.remote=null;hooks.afterWrite?.('remote');return JSON.stringify({data:{updateRefs:{clientMutationId:input.variables.input.clientMutationId}}});}
   hooks.beforeRead?.();return JSON.stringify({data:{repository:{id:'repository-node',nameWithOwner:store.project.repository,ref:refs.remote?{id:'ref',name:branch,target:{oid:refs.remote}}:null}}});
  }
  if(program==='gh'&&args[1].includes('/pulls?'))return JSON.stringify([refs.dependents]);
  throw new Error('Unexpected command '+program+' '+args.join(' '));
 });
 const delivery=new GitHubDelivery(store,engine,execute as any);vi.spyOn(delivery,'verifyPR').mockImplementation(async()=>structuredClone(pull));vi.spyOn(delivery,'api').mockImplementation(async p=>{
  if(p===`issues/115`)return structuredClone(issue);if(p.startsWith('issues/115/comments?'))return structuredClone(comments);if(p==='issues/comments/999')return structuredClone(comments[0]);if(p.startsWith('actions/runs?'))return{total_count:1,workflow_runs:[{id:1,head_sha:merge,event:'push',head_branch:'main',status:'completed',conclusion:'success'}]};throw new Error('Unexpected API '+p);
 });vi.spyOn(engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 async function claimed<T>(request:HarnessRequest,fn:()=>Promise<T>){request.status='working';const claim=store.claimWork({projectId:store.project.id,kind:'reconciliation',id:request.id},'test',request.action,'delivery')!;try{return await withAssignment(claim,'delivery',fn);}finally{store.finishClaim(claim.id,'completed');}}
 const reconcile=()=>claimed(intent,()=>reconcileOriginalCloseout(delivery,job.key,original.id,ownership,intent.id));
 const cleanupRequest=()=>store.state.coordination!.requests!.find(r=>r.action==='cleanup-merged-candidate')!;
 const cleanup=()=>claimed(cleanupRequest(),()=>cleanupMergedCandidate(delivery,cleanupRequest(),ownership));
 const resume=()=>{const r=enqueueRequest(store,'reconcile-closeout',job.key,original.id);return claimed(r,()=>resumeCloseoutCleanup(delivery,r,ownership));};
 return{root,store,engine,job,head,merge,branch,worktree,source,original,lead,raw,put,worker,saveOriginal,intent,assessment,readback,run,issue,pull,comments,board,refs,writes,hooks,execute,delivery,ownership,reconcile,cleanup,cleanupRequest,resume,claimed};
}

test('full original read-back queues distinct exact-tip cleanup; core writes and original failure are never replayed',async()=>{
 const a=fixture(),rawBytes=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8'),original=structuredClone(a.original);
 expect(closeoutRecoveryCandidate(a.store,a.job)?.work.id).toBe('original');await a.reconcile();expect(a.writes).toEqual([]);expect(a.job.status).toBe('blocked');expect(a.cleanupRequest().status).toBe('queued');
 await a.cleanup();expect(a.job.status).toBe('completed');expect(a.job.closeoutRecovery?.status).toBe('complete');expect(a.store.ticket(a.job.key).stage).toBe('complete');
 expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.writes[0].input.variables.input.refUpdates).toEqual([{name:`refs/heads/${a.branch}`,beforeOid:a.head,afterOid:'0'.repeat(40),force:false}]);
 expect(a.writes[1].args).toEqual(['worktree','remove','--',a.worktree]);expect(a.writes[2].args).toEqual(['update-ref','-d',`refs/heads/${a.branch}`,a.head]);
 expect(a.original).toEqual(original);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(rawBytes);expect(a.job.steps.at(-2)?.result.outcome).toBe('blocked');expect(a.job.steps.at(-1)?.result.receipts.every(r=>r.verified&&!r.uncertain)).toBe(true);
 expect(enqueueRequest(a.store,'reconcile-closeout',a.job.key,'original').id).toBe(a.intent.id);
});
test('full original read-back queues cleanup for an interrupted original through resume and completion',async()=>{
 const a=fixture();a.job.status='interrupted';
 expect(closeoutRecoveryCandidate(a.store,a.job)?.work.id).toBe('original');
 await a.reconcile();expect(a.writes).toEqual([]);expect(a.job.status).toBe('interrupted');expect(a.job.closeoutRecovery?.status).toBe('cleanup-pending');
 const id=a.cleanupRequest().id;expect(a.cleanupRequest().status).toBe('queued');
 a.cleanupRequest().status='interrupted';await a.resume();expect(a.cleanupRequest()).toMatchObject({id,status:'queued'});expect(a.job.status).toBe('interrupted');expect(a.writes).toEqual([]);
 await a.cleanup();expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.job.status).toBe('completed');expect(a.job.closeoutRecovery?.status).toBe('complete');expect(a.original.status).toBe('failed');
});
test.each(['source-amendment','stale-review','open-QA','extra-uncertainty','extra-open-finding','wrong-claim','wrong-capabilities','wrong-native','unknown-error','missing-identity','foreign-gate','missing-final-lead','duplicate-native','fixed-unverified','dependency','wrong-resolution','wrong-resolution-evidence'])('unsafe original cannot dispatch a reader or cleanup: %s',async scenario=>{
 const a=fixture();if(scenario==='source-amendment')a.job.sourceAmendment={}as any;if(scenario==='stale-review')a.job.steps[0].result.commit='c'.repeat(40);if(scenario==='open-QA')a.job.steps[1].result.findings=[{id:'x',status:'open'}as any];if(scenario==='extra-uncertainty')a.raw.receipts.push({...a.raw.receipts[3],id:'extra'});if(scenario==='extra-open-finding')a.raw.findings.push({...a.raw.findings[0],id:'extra'});if(scenario==='wrong-resolution')a.raw.resolution.kind='source-repair';if(scenario==='wrong-resolution-evidence')a.raw.resolution.evidenceIds=['missing'];if(scenario==='duplicate-native')a.store.state.workLog!.push({...a.original,id:'duplicate-native'});if(scenario==='fixed-unverified')a.raw.findings.push({...a.raw.findings[0],id:'fixed',status:'fixed'});if(scenario==='dependency')a.job.dependsOnPR=100;if(scenario==='wrong-claim')a.original.claimId='other';if(scenario==='wrong-capabilities')a.put('original','capabilities.json',{name:'editor',readOnly:false});if(scenario==='wrong-native')a.put('original','assignment-identity.json',{threadId:'other'});if(scenario==='unknown-error')a.put('original','error.json',{session:a.original.sessionId,provider:'codex',error:'different'});if(scenario==='missing-identity')delete a.raw.commit;if(scenario==='foreign-gate')a.job.steps[0].result.evidence[0].path='/foreign/acceptance.json';if(scenario==='missing-final-lead')a.store.state.workLog=a.store.state.workLog?.filter(w=>w.id!==a.lead.id);a.saveOriginal();
 await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(a.writes).toEqual([]);expect(a.job.closeoutRecovery).toBeUndefined();
});
test.each(['scope','pause','native-count','native-path','effects','source-gates','checkpoint','reader-caps'])('independent read-back cannot commit changed or incomplete proof: %s',async scenario=>{
 const a=fixture();a.run.mockImplementation(async()=>{if(scenario==='scope')a.issue.body='Changed human scope';if(scenario==='pause')a.store.state.paused=true;if(scenario==='native-count')a.assessment.nativeRecordCount=3;if(scenario==='native-path')a.assessment.nativeSessionPath='/foreign/original.jsonl';if(scenario==='effects')a.assessment.noOtherUncertainEffects=false;if(scenario==='source-gates')a.assessment.sourceGatesPreserved=false;if(scenario==='checkpoint'){a.raw.summary='Changed';a.saveOriginal();}const result=a.readback();if(scenario==='reader-caps')a.put('reader','capabilities.json',{name:'editor',readOnly:false});return result as any;});
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.closeoutRecovery).toBeUndefined();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');
});
test.each(['remote-tip','local-tip','dirty','dependent','scope','pause','evidence','other-uncertainty'])('every cleanup mutation is fenced against %s',async scenario=>{
 const a=fixture();await a.reconcile();if(scenario==='remote-tip')a.refs.remote='c'.repeat(40);if(scenario==='local-tip')a.refs.local='c'.repeat(40);if(scenario==='dirty')a.refs.dirty=' M human-file';if(scenario==='dependent')a.refs.dependents.push({number:999});if(scenario==='scope')a.issue.body='Changed scope';if(scenario==='pause')a.store.state.paused=true;if(scenario==='evidence')writeFileSync(a.source.evidence[0].path,'changed');if(scenario==='other-uncertainty')a.store.putEffect({...a.store.getEffect(`merge:job:${a.head}`)!,id:'other',status:'uncertain'});
 await expect(a.cleanup()).rejects.toThrow();expect(a.writes).toEqual([]);expect(a.job.status).toBe('blocked');expect(a.original.status).toBe('failed');
});
test('uncertain new delete is read back under the same cleanup identity, never resent',async()=>{
 const a=fixture();await a.reconcile();a.hooks.afterWrite=kind=>{if(kind==='remote')throw new Error('Transport lost AFTER exact conditional delete');};await expect(a.cleanup()).rejects.toThrow();expect(a.refs.remote).toBeNull();expect(a.writes).toHaveLength(1);a.cleanupRequest().status='blocked';
 const id=a.cleanupRequest().id;await a.resume();expect(a.cleanupRequest().id).toBe(id);expect(a.cleanupRequest().status).toBe('queued');a.hooks.afterWrite=undefined;await a.cleanup();expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.job.status).toBe('completed');
});
test('unresolved new deletion stays blocked without resend even after a supported resume',async()=>{
 const a=fixture();await a.reconcile();a.hooks.afterWrite=kind=>{if(kind==='remote'){a.refs.remote=a.head;throw new Error('Uncertain delete did not visibly apply');}};await expect(a.cleanup()).rejects.toThrow();a.cleanupRequest().status='blocked';await a.resume();a.hooks.afterWrite=undefined;await expect(a.cleanup()).rejects.toThrow('not resent');expect(a.writes).toHaveLength(1);expect(a.job.status).toBe('blocked');
});
test('crash after worktree removal reconciles observed absence without another remove',async()=>{
 const a=fixture();await a.reconcile();a.hooks.afterWrite=kind=>{if(kind==='worktree')throw new Error('Transport lost after removal');};await expect(a.cleanup()).rejects.toThrow();expect(existsSync(a.worktree)).toBe(false);a.cleanupRequest().status='interrupted';await a.resume();a.hooks.afterWrite=undefined;await a.cleanup();expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.job.status).toBe('completed');
});
test('scope change after remote delete preserves failed evidence and prevents local cleanup',async()=>{
 const a=fixture();await a.reconcile();a.hooks.afterWrite=kind=>{if(kind==='remote')a.issue.body='Human changed scope';};await expect(a.cleanup()).rejects.toThrow();expect(a.writes.map(w=>w.kind)).toEqual(['remote']);expect(existsSync(a.worktree)).toBe(true);expect(a.job.status).toBe('blocked');
});
test('reader cannot bypass an active claim or replace the pending cleanup intent',async()=>{
 const a=fixture();await a.reconcile();a.cleanupRequest().status='blocked';const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:a.cleanupRequest().id},'other','cleanup-merged-candidate','delivery')!;await expect(a.resume()).rejects.toThrow('still active');expect(a.writes).toEqual([]);a.store.finishClaim(claim.id,'completed');
});

test('tracked source gates are preserved as exact approved blobs before cleanup removes their worktree',async()=>{
 const a=fixture(),path=resolve(a.worktree,'gate.txt');writeFileSync(path,'tracked exact bytes');
 vi.spyOn(gates,'preparationGateEvidence').mockImplementation(()=>({files:[artifact(a.store,a.source.evidence[0].path),rootArtifact(a.worktree,path)],references:[],trackedSources:['gate.txt'],gateSummary:a.job.steps}));
 await a.reconcile();const proof=JSON.parse(readFileSync(a.job.closeoutRecovery!.proofPath,'utf8'));expect(proof.preservedSourceFiles).toHaveLength(1);expect(readFileSync(proof.preservedSourceFiles[0].copy.path,'utf8')).toBe('tracked exact bytes');
 await a.cleanup();expect(a.job.status).toBe('completed');expect(existsSync(path)).toBe(false);expect(readFileSync(proof.preservedSourceFiles[0].copy.path,'utf8')).toBe('tracked exact bytes');
});
test('a tracked file differing from its approved Git blob cannot authorize cleanup',async()=>{
 const a=fixture(),path=resolve(a.worktree,'gate.txt');writeFileSync(path,'uncommitted different bytes');
 vi.spyOn(gates,'preparationGateEvidence').mockImplementation(()=>({files:[artifact(a.store,a.source.evidence[0].path),rootArtifact(a.worktree,path)],references:[],trackedSources:['gate.txt'],gateSummary:a.job.steps}));
 await expect(a.reconcile()).rejects.toThrow('exact approved Git blob');expect(a.job.closeoutRecovery).toBeUndefined();expect(a.writes).toEqual([]);
});

test('complete cleanup resolves stale recovery projection only for the exact proven original',async()=>{
 const a=fixture(),old={...a.intent,id:'old-failed',status:'blocked'}as HarnessRequest;
 expect(closeoutRequestResolved(a.store,old)).toBe(false);await a.reconcile();expect(closeoutRequestResolved(a.store,old)).toBe(false);await a.cleanup();expect(closeoutRequestResolved(a.store,old)).toBe(true);
 expect(closeoutRequestResolved(a.store,{...old,head:'other-original'})).toBe(false);a.store.updateEffect(a.job.closeoutRecovery!.operations.remote.effectId,'verified',e=>{e.status='uncertain';});expect(closeoutRequestResolved(a.store,old)).toBe(false);
});

test('a mutable preflight blocker can clear without resetting or replaying an attempted effect',async()=>{
 const a=fixture();await a.reconcile();a.refs.dirty=' M temporary-worker-file';await expect(a.cleanup()).rejects.toThrow();expect(a.writes).toEqual([]);expect(a.store.getEffect(a.job.closeoutRecovery!.operations.remote.effectId)).toBeUndefined();
 a.cleanupRequest().status='blocked';a.refs.dirty='';await a.resume();await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);
});
test.each(['running','paused','draining'])('IT only enqueues the exact failed original while project is running: %s',async mode=>{
 const a=fixture();a.intent.status='blocked';a.store.state.paused=mode==='paused';a.store.state.draining=mode==='draining';
 const offices={entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine,coordinator:{}}]])},health={report:vi.fn(async()=>({checkedAt:'',context:'',services:[]}))};
 await new ITSpecialist(offices as any,health as any).tick(new Date(),true);
 const next=a.store.state.coordination!.requests!.filter(r=>r.id!==a.intent.id&&r.action==='reconcile-closeout');expect(next).toHaveLength(mode==='running'?1:0);if(mode==='running')expect(next[0]).toMatchObject({head:'original',key:a.job.key,status:'queued'});expect(a.run).not.toHaveBeenCalled();expect(a.writes).toEqual([]);
});

/** The integration uses the real durable claims/effects/closeout path; standalone tests exercise the filesystem qualifier. */
async function partiallyRemovedCleanup(){
 const a=fixture();await a.reconcile();const execute=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args,options)=>{
  if(program==='git'&&args[0]==='worktree'&&args[1]==='remove'&&!args.includes('--force')){a.writes.push({kind:'worktree-original',args});options.onSpawn(2147483500);throw new Error('git timed out; previous action outcome must be reconciled');}
  return execute(program,args,options);
 });
 await expect(a.cleanup()).rejects.toThrow('timed out');
 const op=a.job.closeoutRecovery!.operations.worktree,id=op.effectId,body=(a.store.db.prepare('SELECT body FROM effects WHERE id=?').get(id)as{body:string}).body;
 const originalProof=JSON.parse(readFileSync(a.job.closeoutRecovery!.proofPath,'utf8'));
 const qualification={version:1,repo:a.store.project.repo,worktree:a.worktree,head:a.head,branch:a.branch,owned:originalProof.worktree,missing:['originally-tracked-removed'],present:[],ignored:[]};
 const inspect=vi.spyOn(localRemoval,'inspectPartialWorktree').mockResolvedValue(qualification as any);
 a.cleanupRequest().status='blocked';await a.resume();
 return{...a,op,id,body,inspect,qualification,originalExecute:execute};
}
test('full original read-back queues one qualified partial local continuation under the SAME uncertain effect and request',async()=>{
 const a=await partiallyRemovedCleanup(),requestId=a.cleanupRequest().id,raw=JSON.stringify(a.raw),original=structuredClone(a.original);
 await a.cleanup();expect(a.job.status).toBe('completed');expect(a.cleanupRequest().id).toBe(requestId);expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original','worktree','branch']);expect(a.writes[2].args).toEqual(['worktree','remove','--force','--',a.worktree]);
 expect(a.op.effectId).toBe(a.id);expect(a.op.processId).toBe(2147483500);expect(a.op.localResumption).toMatchObject({attempt:1,processId:2147483500});
 const saved=JSON.parse(readFileSync(a.op.localResumption!.proofPath,'utf8'));expect(saved.originalEffectBody).toBe(a.body);expect(saved.originalEffectSha256).toBe(sha(a.body));expect(JSON.parse(saved.originalEffectBody)).toMatchObject({id:a.id,status:'uncertain',error:expect.stringContaining('timed out')});expect(saved.qualification).toEqual(a.qualification);
 expect(a.store.getEffect(a.id)).toMatchObject({id:a.id,status:'verified',attemptId:requestId,receipt:{localResumption:{attempt:1}}});expect(a.original).toEqual(original);expect(JSON.stringify(a.raw)).toBe(raw);expect(a.run).toHaveBeenCalledTimes(1);
 const force=a.execute.mock.calls.find(([,args])=>args.includes('--force'))!;expect(force[2].timeout).toBe(300000);expect(a.inspect).toHaveBeenCalledTimes(2);
});
test.each(['qualification','changed-inventory','pause','scope','tip','missing-original-pid','original-alive'])('partial continuation is denied without another mutation: %s',async scenario=>{
 const a=await partiallyRemovedCleanup();
 if(scenario==='qualification')a.inspect.mockRejectedValue(new Error('Changed original blob'));
 if(scenario==='changed-inventory')a.inspect.mockResolvedValueOnce(a.qualification as any).mockResolvedValueOnce({...a.qualification,missing:['different']}as any);
 if(scenario==='pause')a.store.state.paused=true;if(scenario==='scope')a.issue.body='new human scope';if(scenario==='tip')a.refs.local='c'.repeat(40);
 if(scenario==='missing-original-pid')delete a.op.processId;
 if(scenario==='original-alive')vi.spyOn(processes,'processGroupAlive').mockImplementation(pid=>pid===a.op.processId);
 await expect(a.cleanup()).rejects.toThrow();expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original']);expect(a.store.getEffect(a.id)?.status).toBe('uncertain');expect(a.op.localResumption).toBeUndefined();
});
test('a failed one-time continuation retains original uncertainty and cannot be attempted a second time',async()=>{
 const a=await partiallyRemovedCleanup(),execute=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args,options)=>{if(args.includes('--force')){a.writes.push({kind:'continuation-failed',args});options.onSpawn(2147483503);throw new Error('Continuation timed out');}return execute(program,args,options);});
 await expect(a.cleanup()).rejects.toThrow('Continuation timed out');expect(a.op.localResumption).toMatchObject({attempt:1,processId:2147483503,error:'Error: Continuation timed out'});expect(a.store.getEffect(a.id)?.status).toBe('uncertain');
 a.cleanupRequest().status='blocked';await a.resume();await expect(a.cleanup()).rejects.toThrow('already consumed');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original','continuation-failed']);expect(a.store.getEffect(a.id)?.error).toContain('previous action outcome');
});
test('crash after partial continuation removal reads back the SAME effect without another local or remote dispatch',async()=>{
 const a=await partiallyRemovedCleanup();a.hooks.afterWrite=kind=>{if(kind==='worktree')throw new Error('Transport lost after qualified local removal');};
 await expect(a.cleanup()).rejects.toThrow('Transport lost');expect(existsSync(a.worktree)).toBe(false);expect(a.store.getEffect(a.id)?.status).toBe('uncertain');a.cleanupRequest().status='interrupted';await a.resume();a.hooks.afterWrite=undefined;
 await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original','worktree','branch']);expect(a.inspect).toHaveBeenCalledTimes(2);expect(a.original.status).toBe('failed');
});
test.each(['no-process','alive-process','missing-proof','tampered-proof'])('reserved partial continuation stays unknown after a crash: %s',async scenario=>{
 const a=await partiallyRemovedCleanup(),execute=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args,options)=>{if(args.includes('--force')){if(scenario!=='no-process')options.onSpawn(2147483503);throw new Error('Crash at continuation');}return execute(program,args,options);});
 await expect(a.cleanup()).rejects.toThrow('Crash at continuation');const r=a.op.localResumption!;
 if(scenario==='alive-process')vi.spyOn(processes,'processGroupAlive').mockImplementation(pid=>pid===r.processId);
 if(scenario==='missing-proof')rmSync(r.proofPath);if(scenario==='tampered-proof')writeFileSync(r.proofPath,'{}');
 a.cleanupRequest().status='blocked';await a.resume();await expect(a.cleanup()).rejects.toThrow();expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original']);expect(a.store.getEffect(a.id)?.status).toBe('uncertain');
});
test('missing tracked source gate after partial removal still requires its exact preserved approved copy',async()=>{
 const a=fixture(),path=resolve(a.worktree,'gate.txt');writeFileSync(path,'tracked exact bytes');
 vi.spyOn(gates,'preparationGateEvidence').mockImplementation(()=>({files:[artifact(a.store,a.source.evidence[0].path),rootArtifact(a.worktree,path)],references:[],trackedSources:['gate.txt'],gateSummary:a.job.steps}));
 await a.reconcile();const execute=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args,options)=>{if(args[0]==='worktree'&&args[1]==='remove'&&!args.includes('--force')){a.writes.push({kind:'partial',args});options.onSpawn(2147483500);rmSync(path);throw new Error('git timed out');}return execute(program,args,options);});
 await expect(a.cleanup()).rejects.toThrow('timed out');const proof=JSON.parse(readFileSync(a.job.closeoutRecovery!.proofPath,'utf8'));
 vi.spyOn(localRemoval,'inspectPartialWorktree').mockResolvedValue({worktree:a.worktree,head:a.head,branch:a.branch,owned:proof.worktree,missing:['gate.txt']}as any);
 a.cleanupRequest().status='blocked';await a.resume();await a.cleanup();expect(a.job.status).toBe('completed');expect(readFileSync(proof.preservedSourceFiles[0].copy.path,'utf8')).toBe('tracked exact bytes');
});

test('a dangling replacement root after continuation is not mistaken for verified removal',async()=>{
 const a=await partiallyRemovedCleanup();a.hooks.afterWrite=kind=>{if(kind==='worktree')symlinkSync(resolve(a.root,'nonexistent'),a.worktree);};
 await expect(a.cleanup()).rejects.toThrow();expect(a.store.getEffect(a.id)?.status).toBe('uncertain');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original','worktree']);expect(a.job.status).toBe('blocked');
});

test.each(['paused','draining','running'])('IT preserves exhausted closeout history after a failed partial continuation and %s tick',async mode=>{
 const a=await partiallyRemovedCleanup();a.cleanupRequest().status='blocked';const requests=a.store.state.coordination!.requests!;for(const q of requests.filter(q=>q.action==='reconcile-closeout'))q.status='completed';
 const legacyId='closeout:'+a.job.id,legacy={attempts:3,nextAt:'',status:'needs-human' as const,detail:'Old failure retained',requestId:requests.filter(q=>q.action==='reconcile-closeout').at(-1)!.id};
 a.store.state.it={checkedAt:'',nextCheckAt:'',status:'needs-attention',reports:[],services:[],recoveries:{[legacyId]:structuredClone(legacy)}};
 const candidate=localRemoval.partialLocalCleanupCandidate(a.store,a.job)!;expect(candidate).toBeTruthy();
 const offices={entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine,coordinator:{}}]])},health={report:vi.fn(async()=>({checkedAt:'',context:'',services:[]}))},it=new ITSpecialist(offices as any,health as any),count=requests.length;
 await it.tick(new Date(),true);expect(requests).toHaveLength(count+1);const partial=a.store.state.it.recoveries[candidate.key];expect(partial).toMatchObject({attempts:1,requestId:requests.at(-1)!.id});expect(a.store.state.it.recoveries[legacyId]).toEqual(legacy);
 const reconcile=requests.find(q=>q.id===partial.requestId)!;await a.claimed(reconcile,()=>resumeCloseoutCleanup(a.delivery,reconcile,a.ownership));expect(reconcile.status).toBe('completed');
 expect(a.cleanupRequest().status).toBe('queued');
 for(const status of ['queued','working'] as const){
  a.cleanupRequest().status=status;await it.tick(new Date(),true);
  expect(partial).toMatchObject({attempts:1,status:'retrying',requestId:reconcile.id});expect(requests).toHaveLength(count+1);expect(a.store.state.it.recoveries[legacyId]).toEqual(legacy);
  const pendingReport=a.store.state.it.reports.at(-1)!;expect(pendingReport.followUps).toContainEqual(expect.objectContaining({id:legacyId,owner:'IT',detail:expect.stringContaining('scheduler owns execution')}));expect(pendingReport.followUps.some(f=>f.id===legacyId&&f.owner==='Morgan')).toBe(false);
  expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original']);
 }
 const execute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args,options)=>{if(args.includes('--force')){a.writes.push({kind:'continuation-failed',args});options.onSpawn(2147483503);throw new Error('Continuation timed out');}return execute(program,args,options);});
 await expect(a.cleanup()).rejects.toThrow('Continuation timed out');a.cleanupRequest().status='blocked';expect(a.op.localResumption).toMatchObject({attempt:1,error:'Error: Continuation timed out'});expect(localRemoval.partialLocalCleanupCandidate(a.store,a.job)).toBeUndefined();
 if(mode==='paused')a.store.state.paused=true;if(mode==='draining')a.store.state.draining=true;if(mode==='running')a.store.state.workLog!.push({...a.original,id:'still-running',status:'running'});
 await it.tick(new Date(),true);expect(a.store.state.it.recoveries[legacyId]).toEqual(legacy);expect(requests).toHaveLength(count+1);
 a.store.state.paused=false;a.store.state.draining=false;a.store.state.workLog=a.store.state.workLog!.filter(w=>w.id!=='still-running');
 await it.tick(new Date(),true);expect(requests).toHaveLength(count+1);expect(a.store.state.it.recoveries[legacyId]).toEqual(legacy);expect(a.store.state.it.recoveries[candidate.key]).toMatchObject({attempts:1,requestId:reconcile.id});expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original','continuation-failed']);expect(a.store.getEffect(a.id)?.status).toBe('uncertain');
 const report=a.store.state.it.reports.at(-1)!;expect(report.status).toBe('needs-attention');expect(report.followUps).toContainEqual(expect.objectContaining({id:legacyId,owner:'Morgan'}));expect(report.actions.some(action=>action.includes(candidate.key)&&action.includes('confirms the reported failure cleared'))).toBe(false);expect(a.store.state.it.recoveries[candidate.key].status).toBe('needs-human');
});

test.each(['eligible','paused','draining','running','reserved','remote-uncertain','original-alive','changed-proof','pending-other','already-used'])('IT material partial-cleanup admission preserves exhausted history: %s',async scenario=>{
 const a=await partiallyRemovedCleanup();a.cleanupRequest().status='blocked';const completed=a.store.state.coordination!.requests!.filter(q=>q.action==='reconcile-closeout');for(const q of completed)q.status='completed';
 a.store.state.it={checkedAt:'',nextCheckAt:'',status:'needs-attention',reports:[],services:[],recoveries:{['closeout:'+a.job.id]:{attempts:3,nextAt:'',status:'needs-human',detail:'Old failure retained',requestId:completed.at(-1)!.id}}};
 const candidate=localRemoval.partialLocalCleanupCandidate(a.store,a.job);expect(candidate).toBeTruthy();const old=structuredClone(a.store.state.it.recoveries['closeout:'+a.job.id]);
 if(scenario==='paused')a.store.state.paused=true;if(scenario==='draining')a.store.state.draining=true;if(scenario==='running')a.store.state.workLog!.push({...a.original,id:'still-running',status:'running'});
 if(scenario==='reserved')a.op.localResumption={attempt:1,proofPath:'unknown',proofSha256:'unknown',startedAt:'now'};
 if(scenario==='remote-uncertain')a.store.updateEffect(a.job.closeoutRecovery!.operations.remote.effectId,'verified',e=>{e.status='uncertain';});
 if(scenario==='original-alive')vi.spyOn(processes,'processGroupAlive').mockImplementation(pid=>pid===a.op.processId);
 if(scenario==='changed-proof')writeFileSync(a.job.closeoutRecovery!.proofPath,'{}');
 if(scenario==='pending-other'){const r=enqueueRequest(a.store,'reconcile-closeout',a.job.key,'original');r.status='queued';}
 if(scenario==='already-used')a.store.state.it.recoveries[candidate!.key]={attempts:1,nextAt:'',status:'resolved',detail:'Already used',requestId:completed.at(-1)!.id};
 const count=a.store.state.coordination!.requests!.length,offices={entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine,coordinator:{}}]])},health={report:vi.fn(async()=>({checkedAt:'',context:'',services:[]}))},it=new ITSpecialist(offices as any,health as any);
 await it.tick(new Date(),true);
 const added=a.store.state.coordination!.requests!.slice(count);expect(added).toHaveLength(scenario==='eligible'?1:0);
 if(scenario==='eligible'){expect(added[0]).toMatchObject({action:'reconcile-closeout',key:a.job.key,head:'original',status:'queued'});expect(a.store.state.it.recoveries[candidate!.key]).toMatchObject({attempts:1,requestId:added[0].id});await it.tick(new Date(),true);expect(a.store.state.coordination!.requests).toHaveLength(count+1);expect(a.store.state.it.recoveries[candidate!.key].attempts).toBe(1);}
 expect(a.store.state.it.recoveries['closeout:'+a.job.id].attempts).toBe(old.attempts);expect(a.store.state.it.recoveries['closeout:'+a.job.id].requestId).toBe(old.requestId);expect(a.op.effectId).toBe(a.id);expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree-original']);expect(a.run).toHaveBeenCalledTimes(1);
});


/** Failed transport, positive raw core checkpoint: every write remains the original effect. */
function coreFixture(conflicts=false,historicalUrl=false){
 const a=fixture();a.raw.outcome='passed';a.raw.summary='Core closeout verified; branch cleanup not attempted';a.raw.findings=[];a.raw.receipts=a.raw.receipts.filter((r:any)=>r.id!=='merged-branch-cleanup');a.raw.resolution=null;
 if(historicalUrl)a.job.steps[0].result.evidence.push({...a.source.evidence[0],id:'historical-url',kind:'provider',path:'',url:'https://example.com/retained-source'});
 function ownClaim(work:any,stage:string){const c=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'original-scheduler',stage,'delivery')!;a.store.finishClaim(c.id,'completed');work.claimId=c.id;const p=resolve(a.root,'sessions',work.id,'assignment.json'),assignment=JSON.parse(readFileSync(p,'utf8'));assignment.claimId=c.id;a.put(work.id,'assignment.json',assignment);if(historicalUrl){const row=JSON.parse((a.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(c.id)as any).body);row.claimedAt=work.startedAt;row.endedAt=work.endedAt;a.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify(row),c.id);}}
 function complete(work:any,result:any){const wrapper={session:work.sessionId,result};a.put(work.id,'result.json',wrapper);work.executionStatus='completed';a.put(work.id,'execution-completion.json',{workerId:work.id,session:work.sessionId,provider:work.provider,resultSha256:artifact(a.store,resolve(a.root,'sessions',work.id,'result.json')).sha256});const dir=resolve(a.root,'.codex/sessions/2026/10/30');mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'rollout-'+work.sessionId+'.jsonl'),[{type:'session_meta',payload:{id:work.sessionId,cwd:a.worktree}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(result)}}].map(x=>JSON.stringify(x)).join('\n'));}
 ownClaim(a.original,'closeout');ownClaim(a.lead,'lead-pr');complete(a.lead,a.source);
 for(const[stage,role,readOnly]of[['review','lead',true],['validate','qa',false]]as const){const work=a.worker('source-'+stage,role,'github-'+stage,'completed',readOnly);if(historicalUrl&&stage==='validate'){work.startedAt='2026-10-30T00:02:00Z';work.endedAt='2026-10-30T00:02:30Z';}ownClaim(work,stage);complete(work,a.job.steps.find(s=>s.stage===stage)!.result);}
 // Keep actual Lead selection chronologically last without changing source authority.
 a.store.state.workLog=a.store.state.workLog!.filter(w=>w.id!==a.lead.id).concat(a.lead);
 if(conflicts){
  const anchor='c'.repeat(40),target='d'.repeat(40),base='e'.repeat(40),file=resolve(a.root,'ticket-work/job/conflict-readback-core.json'),sourcePath=resolve(a.worktree,'gate.txt');writeFileSync(sourcePath,'tracked exact bytes');
  for(const stage of['review','validate'])a.job.steps.find(s=>s.stage===stage)!.result.commit=anchor;
  const conflict:any={...structuredClone(a.source),commit:anchor,outcome:'blocked',findings:[{id:'merge-conflicts',status:'open',summary:'Ordinary integration',expected:'Clean',actual:'Conflicts',attempts:1}],resolution:{kind:'conflict-repair',findingIds:['merge-conflicts'],evidenceIds:['conflict']},evidence:[{...a.source.evidence[0],id:'conflict',kind:'provider',commit:anchor,path:file}]};
  writeFileSync(file,JSON.stringify({kind:'verified-conflict-only',projectId:a.store.project.id,repository:a.store.project.repository,jobId:a.job.id,ticket:a.job.key,head:anchor,branch:a.branch,worktree:a.worktree,pr:a.job.pr,target:a.store.project.target,base,targetHead:target}));
  const repair={...structuredClone(a.source),evidence:[{...a.source.evidence[0],kind:'checks' as const}]},publication={...structuredClone(a.source),evidence:[{...a.source.evidence[0],kind:'pr' as const}]};
  a.job.steps.splice(2,0,{stage:'conflict-readback',result:conflict},{stage:'update-base',result:repair},{stage:'draft',result:publication});a.job.repairReason='conflicts';a.job.approach={plan:'none',review:'none',validation:'developer-checks',checks:['Exact-head checks'],reason:'Authorized unchanged approved integration'};a.job.decisions=[{stage:'update-base',role:'pm',at:'',approach:a.job.approach}];
  vi.spyOn(gates,'acceptedNativeGate').mockReturnValue({files:[artifact(a.store,a.source.evidence[0].path)]}as any);vi.spyOn(gates,'preparationGateEvidence').mockReturnValue({files:[artifact(a.store,a.source.evidence[0].path),rootArtifact(a.worktree,sourcePath)],references:[],trackedSources:['gate.txt'],gateSummary:{head:anchor}}as any);
  const execute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args,options)=>{if(program==='git'){if(args[0]==='rev-list')return`${a.head} ${anchor} ${target}`;if(args[0]==='merge-base')return'';if(args[0]==='diff')return'--- a/gate.txt\n+++ b/gate.txt\n-old\n+approved';}return execute(program,args,options);});
 }
 const nativePath=resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-original.jsonl');mkdirSync(resolve(a.root,'.codex/sessions/2026/10/30'),{recursive:true});
 function saveCore(){
  a.put('original','completed-output.json',a.raw);const records:any[]=[{type:'session_meta',payload:{id:a.original.sessionId,cwd:a.worktree}}];
  for(const r of a.raw.receipts){records.push({type:'response_item',payload:{type:'function_call',name:'synthetic-command',call_id:'call-'+r.id,arguments:JSON.stringify({operation:r.action,target:r.target})}},{type:'response_item',payload:{type:'function_call_output',call_id:'call-'+r.id,output:{exit_code:0,verifiedTarget:r.target}}});}
  records.push({type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(a.raw)}});writeFileSync(nativePath,records.map(x=>JSON.stringify(x)).join('\n'));
 }
 saveCore();const candidate=closeoutRecoveryCandidate(a.store,a.job);expect(candidate?.kind).toBe('core-passed');const native=candidate!.native!;
 delete a.assessment.originalDeletionNotCurrentlyApplied;Object.assign(a.assessment,{kind:'core-passed',coverageVersion:2,cleanupFindingId:'',cleanupUnattempted:true,nativeSessionPath:native.file.path,nativeSessionSha256:native.file.sha256,nativeRecordCount:native.recordCount,originalProcessGroupId:a.original.processId,checkpointSha256:candidate!.checkpointSha256,
 operations:native.calls.map(call=>({callId:call.id,inputSha256:call.inputSha256,outputSha256:call.outputSha256,operations:[{ordinal:0,kind:call.id==='call-issue-comment'?'verified-effect':'read',description:'Exact original operation',receiptIds:[call.id.slice(5)],evidence:'Actual original terminal output and current provider readback'}],processes:[{identity:'original-command:'+call.id,state:'terminated',evidence:'Original exact exit0; group ESRCH'}]})),receipts:native.receipts.map(r=>({id:r.id,sha256:r.sha256,evidence:'Original operation and exact current provider target'}))});
 a.run.mockImplementation(async()=>{const result=a.readback(),reader=a.store.state.workLog!.find(w=>w.id==='reader')as any,claim=currentAssignment()!.claim;reader.claimId=claim.id;reader.startedAt='2026-10-30T00:05:00Z';reader.endedAt='2026-10-30T00:06:00Z';const assignment=JSON.parse(readFileSync(resolve(a.root,'sessions/reader/assignment.json'),'utf8'));assignment.claimId=claim.id;a.put('reader','assignment.json',assignment);complete(reader,result);
  const path=resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-reader.jsonl');writeFileSync(path,[{type:'session_meta',payload:{id:reader.sessionId,cwd:a.worktree}},{type:'response_item',payload:{type:'function_call',name:'read',call_id:'reader-call',arguments:'read only complete original evidence'}},{type:'response_item',payload:{type:'function_call_output',call_id:'reader-call',output:'Complete terminal evidence read'}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(result)}}].map(x=>JSON.stringify(x)).join('\n'));return result as any;});
 return{...a,nativePath,saveCore};
}
function legacyCoreAssessment(assessment:any){
 const legacy=structuredClone(assessment);delete legacy.coverageVersion;
 legacy.receipts=legacy.receipts.map((receipt:any)=>({...receipt,callIds:legacy.operations.filter((call:any)=>call.operations.some((operation:any)=>operation.receiptIds.includes(receipt.id))).map((call:any)=>call.callId)}));return legacy;
}
test('new core reader wire requires v2 with one receipt relation and preserves it through fixed cleanup',async()=>{
 const a=coreFixture(),run=a.run.getMockImplementation()!,original=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 a.run.mockImplementation(async(...args)=>{
  const schema=args[2]!;expect(schema.safeParse(a.assessment).success).toBe(true);expect(schema.safeParse(legacyCoreAssessment(a.assessment)).success).toBe(false);
  for(const version of [1,3,'2',null])expect(schema.safeParse({...a.assessment,coverageVersion:version}).success).toBe(false);
  const mixed=structuredClone(a.assessment);mixed.receipts[0].callIds=[mixed.operations[0].callId];expect(schema.safeParse(mixed).success).toBe(false);
  return run(...args);
 });
 await a.reconcile();expect(a.writes).toEqual([]);expect(a.run.mock.calls[0][1]).toContain('Return coverageVersion=2');expect(a.run.mock.calls[0][1]).toContain('single authoritative relation');
 const proof=JSON.parse(readFileSync(a.job.closeoutRecovery!.proofPath,'utf8'));expect(proof.assessment).toEqual(a.assessment);expect(proof.assessment.receipts.every((receipt:any)=>!Object.hasOwn(receipt,'callIds'))).toBe(true);
 expect(JSON.parse(readFileSync(resolve(a.root,'sessions/reader/result.json'),'utf8')).result).toEqual(proof.assessment);
 await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(write=>write.kind)).toEqual(['remote','worktree','branch']);expect(a.run).toHaveBeenCalledOnce();expect(a.original.status).toBe('failed');expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(original);
});
test('legacy core coverage still accepts reciprocal links and rejects the extra known call of the observed old negative unchanged',()=>{
 const a=historicalCoreFixture(),selected=closeoutRecoveryCandidate(a.store,a.job)!,legacy=legacyCoreAssessment(a.assessment);
 expect(()=>assertCoreCloseoutCoverage(selected,legacy)).not.toThrow();expect(Object.hasOwn(legacy,'coverageVersion')).toBe(false);
 legacy.receipts[0].callIds.push('extra-read-0');const bytes=JSON.stringify(legacy);
 expect(()=>assertCoreCloseoutCoverage(selected,legacy)).toThrow('Original receipt identity or operation coverage changed');expect(JSON.stringify(legacy)).toBe(bytes);expect(a.run).not.toHaveBeenCalled();expect(a.writes).toEqual([]);
});
test.each([1,3,'2',null])('persisted core coverage refuses unknown version %s rather than falling back to legacy',version=>{
 const a=coreFixture(),selected=closeoutRecoveryCandidate(a.store,a.job)!;
 expect(()=>assertCoreCloseoutCoverage(selected,{...legacyCoreAssessment(a.assessment),coverageVersion:version})).toThrow();expect(a.writes).toEqual([]);
});
test('valid saved legacy core proof remains eligible for the same three fixed cleanup primitives',async()=>{
 const a=coreFixture();await a.reconcile();const recovery=a.job.closeoutRecovery!,proof=JSON.parse(readFileSync(recovery.proofPath,'utf8')),legacy=legacyCoreAssessment(proof.assessment);
 // Build a coherent synthetic pre-v2 saved packet, including its actual reader bytes and bound hashes.
 const resultPath=resolve(a.root,'sessions/reader/result.json'),result=JSON.parse(readFileSync(resultPath,'utf8'));result.result=legacy;writeFileSync(resultPath,JSON.stringify(result));
 const completionPath=resolve(a.root,'sessions/reader/execution-completion.json'),completion=JSON.parse(readFileSync(completionPath,'utf8'));completion.resultSha256=artifact(a.store,resultPath).sha256;writeFileSync(completionPath,JSON.stringify(completion));
 const rows=readFileSync(proof.readerNative.file.path,'utf8').trim().split('\n').map(line=>JSON.parse(line));rows.at(-1).payload.last_agent_message=JSON.stringify(legacy);writeFileSync(proof.readerNative.file.path,rows.map(row=>JSON.stringify(row)).join('\n'));
 proof.assessment=legacy;proof.readerNative.file=rootArtifact(proof.readerNative.root,proof.readerNative.file.path);proof.readerFiles=proof.readerFiles.map((file:any)=>artifact(a.store,file.path));writeFileSync(recovery.proofPath,JSON.stringify(proof));recovery.proofSha256=artifact(a.store,recovery.proofPath).sha256;
 const bytes=readFileSync(recovery.proofPath,'utf8');await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(write=>write.kind)).toEqual(['remote','worktree','branch']);expect(readFileSync(recovery.proofPath,'utf8')).toBe(bytes);expect(a.run).toHaveBeenCalledOnce();expect(a.original.status).toBe('failed');
});
test.each(['orphan','unknown-call','reverse-index','unknown-version','receipt-digest'])('cleanup re-derives v2 receipt coverage and rejects persisted %s before any write',async scenario=>{
 const a=coreFixture();await a.reconcile();const recovery=a.job.closeoutRecovery!,proof=JSON.parse(readFileSync(recovery.proofPath,'utf8'));
 if(scenario==='orphan')for(const call of proof.assessment.operations)for(const operation of call.operations)operation.receiptIds=operation.receiptIds.filter((id:string)=>id!==proof.assessment.receipts[0].id);
 if(scenario==='unknown-call')proof.assessment.operations[0].callId='unknown';if(scenario==='reverse-index')proof.assessment.receipts[0].callIds=[proof.assessment.operations[0].callId];if(scenario==='unknown-version')proof.assessment.coverageVersion=3;if(scenario==='receipt-digest')proof.assessment.receipts[0].sha256='changed';
 writeFileSync(recovery.proofPath,JSON.stringify(proof));recovery.proofSha256=artifact(a.store,recovery.proofPath).sha256;
 await expect(a.cleanup()).rejects.toThrow();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');expect(a.job.status).toBe('blocked');
});
function historicalCoreFixture(){
 const a=coreFixture(false,true),rows=readFileSync(a.nativePath,'utf8').trim().split('\n').map(line=>JSON.parse(line)),last=rows.pop();
 for(let i=0;i<6;i++)rows.push({type:'response_item',payload:{type:'function_call',name:'read',call_id:`extra-read-${i}`,arguments:JSON.stringify({read:a.source.evidence[0].path})}},{type:'response_item',payload:{type:'function_call_output',call_id:`extra-read-${i}`,output:'Actual retained read output'}});
 rows.find(row=>row.payload?.type==='function_call_output').payload.output={exit_code:0,stdout:'Warning: truncated output; original saved artifacts remain available'};
 for(let i=0;i<11;i++)rows.push({timestamp:'2026-10-30T00:03:30Z',type:'event_msg',payload:{type:'item_completed',thread_id:a.original.sessionId,turn_id:'original-turn',item:{type:'CommandExecution',id:`exec-${i}`,process_id:`handle-${i}`,command:['read',a.source.evidence[0].path],cwd:'file://'+a.worktree,source:'unified_exec_startup',status:i===0?'failed':'completed',exit_code:i===0?1:0,aggregated_output:i===3?'x'.repeat(65536):'Retained command output'}}});
 rows.push(last);writeFileSync(a.nativePath,rows.map(row=>JSON.stringify(row)).join('\n'));
 const selected=closeoutRecoveryCandidate(a.store,a.job)!,native=selected.native!;
 Object.assign(a.assessment,{nativeSessionSha256:native.file.sha256,nativeRecordCount:native.recordCount,operations:native.calls.map(call=>({callId:call.id,inputSha256:call.inputSha256,outputSha256:call.outputSha256,operations:[{ordinal:0,kind:call.id.startsWith('call-')?'verified-effect':'read',description:'Exact original retained operation',receiptIds:call.id.startsWith('call-')?[call.id.slice(5)]:[],evidence:'Full input plus terminal metadata and original saved artifact/current provider readback'}],processes:[{identity:'original-command:'+call.id,state:'terminated',evidence:'Actual original terminal output'}]}))});
 const root=resolve(a.root,'closeout-recovery',a.job.id,'supervision');mkdirSync(root,{recursive:true});
 const bodies:Record<string,any>={},refs:Record<string,{path:string;sha256:string}>={},put=(name:string,value:any)=>{bodies[name]=value;const path=resolve(root,name);writeFileSync(path,typeof value==='string'?value:JSON.stringify(value));return refs[name]={path,sha256:artifact(a.store,path).sha256};};
 const processSource=put('processSource',readFileSync(new URL('../../server/process.ts',import.meta.url),'utf8')),workerRuntimeSource=put('workerRuntimeSource',readFileSync(new URL('../../server/worker-runtime.ts',import.meta.url),'utf8')),head='d'.repeat(40),next='e'.repeat(40),runtimeHash='f'.repeat(64);
 const sourceManifest=put('sourceManifest',{head,files:{'server/process.ts':processSource.sha256,'server/worker-runtime.ts':workerRuntimeSource.sha256}}),runtimeReceipt=put('runtimeReceipt',{status:'complete',completedAt:'2026-10-30T00:02:00Z',verifiedHead:head,pid:100,loadedHash:runtimeHash,expectedRuntimeHash:runtimeHash}),successorTarget=put('successorTarget',{base:head,expectedReviewedHead:next,parentRolloutReceiptSha256:runtimeReceipt.sha256,parentRuntime:{pid:100,loadedHash:runtimeHash,serviceInstanceId:'historical-instance'}}),preDrain=put('preDrain',{status:'draining',startedAt:'2026-10-30T00:05:00Z',pid:100,loadedHash:runtimeHash,serviceInstanceId:'historical-instance',verifiedHead:next});
 const claimBody=(a.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(a.original.claimId)as any).body,envelope={version:1,contract:'owned-group-shutdown-v1',projectId:a.store.project.id,repository:a.store.project.repository,jobId:a.job.id,originalWorkId:a.original.id,nativeSessionId:a.original.sessionId,claimId:a.original.claimId,originalWorkSha256:digest(a.original),originalClaimSha256:sha(claimBody),checkpointSha256:selected.checkpointSha256,errorSha256:artifact(a.store,resolve(a.root,'sessions/original/error.json')).sha256,nativeSessionSha256:native.file.sha256,artifacts:{sourceManifest,processSource,workerRuntimeSource,runtimeReceipt,successorTarget,preDrain}},descriptor=put('envelope',envelope);
 a.assessment.supervisionProofSha256=descriptor.sha256;
 return {...a,descriptor,envelope,supervisionBodies:bodies,supervisionRefs:refs};
}
test('actual core reconciliation receives bound historical shutdown semantics, nine calls and eleven terminal handles while preserving the old negative',async()=>{
 const a=historicalCoreFixture(),oldAudit={...a.original,id:'old-negative-audit',sessionId:'old-negative-session',role:'lead',stage:'closeout-original-readback',status:'blocked',executionStatus:'completed'};
 a.store.state.workLog!.push(oldAudit);a.put(oldAudit.id,'result.json',{session:oldAudit.sessionId,result:{outcome:'blocked',completeNativeExecution:false,cleanupUnattempted:false,noOtherUncertainEffects:false}});a.put(oldAudit.id,'execution-completion.json',{workerId:oldAudit.id,session:oldAudit.sessionId,provider:oldAudit.provider,resultSha256:artifact(a.store,resolve(a.root,'sessions',oldAudit.id,'result.json')).sha256});
 a.intent.status='blocked';const oldRequest=JSON.stringify(a.intent),oldReader=JSON.stringify(oldAudit),original=JSON.stringify(a.original),raw=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');a.store.state.it={reports:[],recoveries:{'consumed-closeout-key':{attempts:1,status:'needs-human',requestId:a.intent.id}}}as any;const it=JSON.stringify(a.store.state.it);
 const fresh=enqueueCloseoutReconciliation(a.store,a.job.key,a.original.id,a.descriptor);expect(fresh.id).not.toBe(a.intent.id);
 await a.claimed(fresh,()=>reconcileOriginalCloseout(a.delivery,a.job.key,a.original.id,a.ownership,fresh.id));
 expect(a.writes).toEqual([]);expect(a.run).toHaveBeenCalledOnce();expect(a.job.closeoutRecovery?.status).toBe('cleanup-pending');expect(a.cleanupRequest().status).toBe('queued');
 const proof=JSON.parse(readFileSync(a.job.closeoutRecovery!.proofPath,'utf8'));expect(proof.original.native.calls).toHaveLength(9);expect(proof.original.native.terminalCommands).toHaveLength(11);expect(proof.original.native.terminalCommands.filter((c:any)=>c.exitCode===0)).toHaveLength(10);expect(proof.original.native.terminalCommands.filter((c:any)=>c.outputTruncated)).toHaveLength(1);expect(proof.original.native.calls.some((c:any)=>c.outputTruncated)).toBe(true);expect(proof.original.native.missingPrintedOutputRecovered).toBe(false);
 expect(proof.supervision.descriptor).toEqual(a.descriptor);expect(proof.original.files).toContainEqual(expect.objectContaining({path:a.descriptor.path,sha256:a.descriptor.sha256}));expect(a.run.mock.calls[0][1]).toContain('not an established separate escaped-survivor report');expect(a.run.mock.calls[0][1]).toContain('no missing stdout was recovered');
 expect(JSON.stringify(a.intent)).toBe(oldRequest);expect(JSON.stringify(oldAudit)).toBe(oldReader);expect(JSON.stringify(a.original)).toBe(original);expect(JSON.stringify(a.store.state.it)).toBe(it);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(raw);
});
test.each(['missing-history','false-native','false-effects','false-cleanup','wrong-proof-ack','history-drift','unfinished-terminal'])('historical shutdown context cannot accept %s',async scenario=>{
 const a=historicalCoreFixture();if(scenario!=='missing-history')a.intent.closeoutSupervisionProof=a.descriptor;
 if(scenario==='false-native')a.assessment.completeNativeExecution=false;if(scenario==='false-effects')a.assessment.noOtherUncertainEffects=false;if(scenario==='false-cleanup')a.assessment.cleanupUnattempted=false;if(scenario==='wrong-proof-ack')a.assessment.supervisionProofSha256='0'.repeat(64);
 if(scenario==='missing-history'){delete a.assessment.supervisionProofSha256;a.assessment.outcome='blocked';a.assessment.completeNativeExecution=false;}
 if(scenario==='history-drift'){const run=a.run.getMockImplementation()!;a.run.mockImplementation(async(...args)=>{const result=await run(...args);writeFileSync(a.supervisionRefs.preDrain.path,'Changed historical receipt');return result;});}
 if(scenario==='unfinished-terminal'){const rows=readFileSync(a.nativePath,'utf8').trim().split('\n').map(line=>JSON.parse(line));rows.splice(-1,0,{type:'event_msg',payload:{type:'item_started',thread_id:a.original.sessionId,item:{type:'CommandExecution',id:'unaccounted-async'}}});writeFileSync(a.nativePath,rows.map(row=>JSON.stringify(row)).join('\n'));}
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.closeoutRecovery).toBeUndefined();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');if(scenario==='unfinished-terminal')expect(a.run).not.toHaveBeenCalled();
});
test('core-passed direct source gates accept historical URL context without a failed-QA readback',()=>{
 const a=coreFixture(false,true),selected=closeoutRecoveryCandidate(a.store,a.job)!;
 expect(selected.kind).toBe('core-passed');expect(selected.gates.references).toContainEqual(expect.objectContaining({kind:'historical-url',url:'https://example.com/retained-source'}));expect(selected.gates.qaProofPath).toContain('execution-completion.json');expect(a.job.steps.flatMap(s=>s.result.evidence).some(e=>e.path.endsWith('-validation-readback.json'))).toBe(false);
});
test.each(['review','validate']as const)('core-passed historical URL context still requires completed native and claim proof for %s',stage=>{
 const a=coreFixture(false,true),worker=a.store.state.workLog!.find(w=>w.id==='source-'+stage)!;
 const completion=resolve(a.root,'sessions',worker.id,'execution-completion.json'),native=resolve(a.root,'.codex/sessions/2026/10/30/rollout-'+worker.sessionId+'.jsonl');
 for(const path of [completion,native]){const bytes=readFileSync(path);rmSync(path);expect(closeoutRecoveryCandidate(a.store,a.job)).toBeUndefined();writeFileSync(path,bytes);expect(closeoutRecoveryCandidate(a.store,a.job)?.kind).toBe('core-passed');}
 a.store.finishClaim(worker.claimId!,'interrupted');expect(closeoutRecoveryCandidate(a.store,a.job)).toBeUndefined();expect(a.writes).toEqual([]);
});
test.each([false,true])('passed core checkpoint with failed transport reconciles %s source path then reuses all3 fixed cleanup primitives',async conflicts=>{
 const a=coreFixture(conflicts),original=structuredClone(a.original),bytes=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');await a.reconcile();expect(a.job.closeoutRecovery?.kind).toBe('core-passed');expect(a.writes).toEqual([]);expect(a.cleanupRequest().detail).toContain('cleanup never attempted');
 await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.job.steps.at(-2)!.result.outcome).toBe('passed');expect(a.job.steps.at(-1)!.result.summary).toContain('passed core checkpoint');expect(a.original).toEqual(original);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(bytes);expect(a.run).toHaveBeenCalledOnce();
});
test.each(['call-missing','call-duplicate','call-input','call-output','receipt-missing','receipt-duplicate','receipt-digest','receipt-origin','unknown-operation-receipt','process-empty','process-running','cleanup-attempted','wrong-kind','receipt-orphan','unknown-call','operation-duplicate','process-duplicate','false-native','false-effects','false-core','false-source','false-hold','blocked'])('passed core reader refuses %s without queueing cleanup',async scenario=>{
 const a=coreFixture();if(scenario==='call-missing')a.assessment.operations.pop();if(scenario==='call-duplicate')a.assessment.operations[1]=a.assessment.operations[0];if(scenario==='call-input')a.assessment.operations[0].inputSha256='tampered';if(scenario==='call-output')a.assessment.operations[0].outputSha256='tampered';if(scenario==='receipt-missing')a.assessment.receipts.pop();if(scenario==='receipt-duplicate')a.assessment.receipts[1]=a.assessment.receipts[0];if(scenario==='receipt-digest')a.assessment.receipts[0].sha256='tampered';if(scenario==='receipt-origin')a.assessment.receipts[0].callIds=['unknown'];if(scenario==='unknown-operation-receipt')a.assessment.operations[0].operations[0].receiptIds=['invented'];if(scenario==='process-empty')a.assessment.operations[0].processes=[];if(scenario==='process-running')a.assessment.operations[0].processes[0].state='running';if(scenario==='cleanup-attempted')a.assessment.cleanupUnattempted=false;if(scenario==='wrong-kind')a.assessment.kind='cleanup-uncertain';if(scenario==='receipt-orphan')a.assessment.operations[0].operations[0].receiptIds=[];if(scenario==='unknown-call')a.assessment.operations[0].callId='unknown';if(scenario==='operation-duplicate')a.assessment.operations[0].operations.push(a.assessment.operations[0].operations[0]);if(scenario==='process-duplicate')a.assessment.operations[0].processes.push(a.assessment.operations[0].processes[0]);if(scenario==='false-native')a.assessment.completeNativeExecution=false;if(scenario==='false-effects')a.assessment.noOtherUncertainEffects=false;if(scenario==='false-core')a.assessment.coreCloseoutVerified=false;if(scenario==='false-source')a.assessment.sourceGatesPreserved=false;if(scenario==='false-hold')a.assessment.noHumanHold=false;if(scenario==='blocked')a.assessment.outcome='blocked';
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.closeoutRecovery).toBeUndefined();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');
});
test.each(['native-change','native-unpaired','claim','lead-completion','source-native','source-finding','merge-effect','paused','draining','profile','foreign-assignment','checkpoint-symlink'])('core candidate never admits changed %s evidence',scenario=>{
 const a=coreFixture();if(scenario==='native-change')writeFileSync(a.nativePath,'{}');if(scenario==='native-unpaired'){const rows=readFileSync(a.nativePath,'utf8').trim().split('\n');rows.splice(2,1);writeFileSync(a.nativePath,rows.join('\n'));}if(scenario==='claim')a.store.finishClaim(a.original.claimId,'interrupted');if(scenario==='lead-completion')a.put('lead','execution-completion.json',{});if(scenario==='source-native')a.put('source-review','result.json',{});if(scenario==='source-finding')a.job.steps[0].result.findings.push({id:'held-source',status:'open'}as any);if(scenario==='merge-effect')a.store.updateEffect(`merge:${a.job.id}:${a.head}`,'verified',e=>{e.status='uncertain';});if(scenario==='paused')a.store.state.paused=true;if(scenario==='draining')a.store.state.draining=true;if(scenario==='profile')a.put('original','capabilities.json',{readOnly:true});if(scenario==='foreign-assignment'){const p=resolve(a.root,'sessions/original/assignment.json'),v=JSON.parse(readFileSync(p,'utf8'));v.work.id='foreign';writeFileSync(p,JSON.stringify(v));}if(scenario==='checkpoint-symlink'){const p=resolve(a.root,'sessions/original/completed-output.json'),copy=p+'.saved';writeFileSync(copy,readFileSync(p));rmSync(p);symlinkSync(copy,p);}expect(closeoutRecoveryCandidate(a.store,a.job)).toBeUndefined();expect(a.writes).toEqual([]);
});
test('core conflict approval requires exact retained forward merge and unchanged source delta; no mere ancestry waiver',async()=>{
 const a=coreFixture(true),execute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args,options)=>program==='git'&&args[0]==='diff'&&args.includes('d'.repeat(40))?'+changed approved claim':execute(program,args,options));await expect(a.reconcile()).rejects.toThrow('source delta');expect(a.run).not.toHaveBeenCalled();expect(a.writes).toEqual([]);
});
test('core cleanup rejects unknown persisted kind rather than falling back to the old uncertain-deletion class',async()=>{const a=coreFixture();await a.reconcile();(a.job.closeoutRecovery as any).kind='unknown';await expect(a.cleanup()).rejects.toThrow('kind');expect(a.writes).toEqual([]);});

test.each(['core','cleanup']as const)('only exact independently verified %s cleanup gets closeout-first priority',async kind=>{const a=kind==='core'?coreFixture():fixture();expect(verifiedCloseoutCleanupRequest(a.store,a.intent)).toBe(false);await a.reconcile();const request=a.cleanupRequest();expect(verifiedCloseoutCleanupRequest(a.store,request)).toBe(true);expect(a.writes).toEqual([]);request.status='completed';await a.cleanup();expect(verifiedCloseoutCleanupRequest(a.store,request)).toBe(false);});
test.each(['request','lane','action','original','hash','kind','merge','source-gates','unknown-effects','foreign-project','proof-original','proof-head','proof-cleanup','missing-proof'])('unqualified cleanup %s stays ordinary priority without changing history',async scenario=>{
 const a=coreFixture();await a.reconcile();const request={...a.cleanupRequest()},r=a.job.closeoutRecovery!,before=JSON.stringify(a.raw);if(scenario==='request')request.id='foreign';if(scenario==='lane')request.lane='operations';if(scenario==='action')request.action='reconcile-closeout';if(scenario==='original')request.head='foreign';if(scenario==='hash')r.proofSha256='bad';if(scenario==='kind')(r as any).kind='unknown';if(scenario==='merge')a.store.updateEffect(`merge:${a.job.id}:${a.head}`,'verified',e=>{e.status='uncertain';});if(scenario==='missing-proof')rmSync(r.proofPath);
 if(['source-gates','unknown-effects','foreign-project','proof-original','proof-head','proof-cleanup'].includes(scenario)){const proof=JSON.parse(readFileSync(r.proofPath,'utf8'));if(scenario==='source-gates')proof.assessment.sourceGatesPreserved=false;if(scenario==='unknown-effects')proof.assessment.noOtherUncertainEffects=false;if(scenario==='foreign-project')proof.project.id='foreign';if(scenario==='proof-original')proof.originalWorkId='foreign';if(scenario==='proof-head')proof.jobIdentity.head='foreign';if(scenario==='proof-cleanup')proof.cleanupRequestId='foreign';writeFileSync(r.proofPath,JSON.stringify(proof));r.proofSha256=artifact(a.store,r.proofPath).sha256;}
 expect(verifiedCloseoutCleanupRequest(a.store,request)).toBe(false);expect(JSON.stringify(a.raw)).toBe(before);expect(a.writes).toEqual([]);
});

test.each(['human-input','head','original-process','reader-native','reader-claim','source-native','hold','provider-scope','unknown-effect'])('core audit cannot commit after %s drift',async scenario=>{
 const a=coreFixture(),run=a.run.getMockImplementation()!;a.run.mockImplementation(async(...args)=>{const value=await run(...args);if(scenario==='human-input'){const m:any={ticket:a.job.key,status:'answered',error:'',receipts:[],createdAt:'now',body:'Human changed requirements'};a.store.state.messages.push({...m,id:'new-human',requestId:'new-human',from:'human',to:'pm'},{...m,id:'pm-answer',requestId:'new-human',from:'pm',to:'pm'});a.store.state.projectNotes.push({id:'new-note',requestId:'new-human',ticket:a.job.key,summary:'Human update',detail:'Changed scope',createdAt:'now'});}if(scenario==='head')a.job.head='f'.repeat(40);if(scenario==='original-process')vi.spyOn(processes,'processGroupAlive').mockImplementation(pid=>pid===a.original.processId);if(scenario==='reader-native')writeFileSync(resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-reader.jsonl'),'{}');if(scenario==='reader-claim')a.store.state.workLog!.find(w=>w.id==='reader')!.claimId='foreign';if(scenario==='source-native')writeFileSync(resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-source-review.jsonl'),'{}');if(scenario==='hold')HOLDS[a.job.key]='Actual human hold';if(scenario==='provider-scope')a.issue.body='Changed exact issue acceptance';if(scenario==='unknown-effect')a.store.putEffect({...a.store.getEffect(`merge:${a.job.id}:${a.head}`)!,id:'unknown-effect',status:'uncertain'});return value;});
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.closeoutRecovery).toBeUndefined();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');
});
test.each(['dirty','dependent','tip','reader-native','source-native'])('core first cleanup remains fenced against %s',async scenario=>{const a=coreFixture();await a.reconcile();if(scenario==='dirty')a.refs.dirty=' M human-file';if(scenario==='dependent')a.refs.dependents.push({number:999});if(scenario==='tip')a.refs.remote='c'.repeat(40);if(scenario==='reader-native')writeFileSync(resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-reader.jsonl'),'{}');if(scenario==='source-native')writeFileSync(resolve(a.root,'.codex/sessions/2026/10/30/rollout-native-source-review.jsonl'),'{}');await expect(a.cleanup()).rejects.toThrow();expect(a.writes).toEqual([]);expect(a.original.status).toBe('failed');});
test('core uncertain first conditional delete keeps the same effect identity and is reconciled without resend',async()=>{const a=coreFixture();await a.reconcile();a.hooks.afterWrite=kind=>{if(kind==='remote')throw Error('Transport lost after actual CAS');};await expect(a.cleanup()).rejects.toThrow();expect(a.writes).toHaveLength(1);a.cleanupRequest().status='blocked';const id=a.cleanupRequest().id;await a.resume();expect(a.cleanupRequest().id).toBe(id);a.hooks.afterWrite=undefined;await a.cleanup();expect(a.job.status).toBe('completed');expect(a.writes.map(w=>w.kind)).toEqual(['remote','worktree','branch']);expect(a.original.status).toBe('failed');});
