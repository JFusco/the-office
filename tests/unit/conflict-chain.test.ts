import {test,expect,vi,afterEach} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../server/store';
import {projectById} from '../../server/projects';
import {coordination} from '../../server/coordination';
import {artifact,digest} from '../../server/readback-evidence';
import {retainedConflictChain,verifyConflictChainGit,repeatConflictRepairAdmission,repeatConflictRepairUnresolved} from '../../server/conflict-chain';
import {conflictOnlyAssessment} from '../../server/conflict-repair';
import {postConflictPreparationEvidence} from '../../server/post-conflict-preparation';
import {ITSpecialist} from '../../server/it-specialist';
import {HOLDS} from '../../server/config';
import * as gates from '../../server/preparation-gates';
import * as continuation from '../../server/continuation-evidence';
import * as checkpoints from '../../server/preparation-checkpoint';
import * as processTools from '../../server/process';
import {GitHubDelivery} from '../../server/github-delivery';
import {enqueueRequest,executeRequest} from '../../server/requests';
import {withAssignment} from '../../server/assignment-context';
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();delete HOLDS['GH-114'];stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(r=>rmSync(r,{recursive:true,force:true}));});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'conflict-chain-'));roots.push(root);let now=new Date('2026-10-30T22:00:00Z');const store=new Store(':memory:',projectById('cms-field-vocabulary'),root,{now:()=>now,monotonic:()=>0});stores.push(store);store.state.coordination=coordination();const c=store.state.coordination!;c.enabled=true;c.jobs=[];c.requests=[];
 const anchor='a'.repeat(40),head='c'.repeat(40),target='b'.repeat(40),base='d'.repeat(40),worktree=resolve(root,'candidate');mkdirSync(worktree);const job:any={id:'job',key:'GH-114',stage:'lead-pr',status:'blocked',head,worktree,branch:'codex/114-example',pr:117,prUrl:'https://github.com/JFusco/cms-field-vocabulary/pull/117',repairReason:'conflicts',detail:'Historical exact-head gate rejected the otherwise valid repeat conflict',steps:[]};c.jobs=[job];
 const put=(p:string,value:unknown)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(value));return artifact(store,p);},owned=resolve(root,'ticket-work/job');mkdirSync(owned,{recursive:true});const evidence=(id:string,commit:string,kind='checks')=>({id,kind,path:put(resolve(owned,id+'.json'),{id}).path,commit,environment:'fixture',url:'',summary:'Owned evidence',observedAt:''});
 const result=(commit:string):any=>({outcome:'passed',summary:'Original result',commit,worktree,branch:job.branch,prId:job.pr,paidRuns:0,prerequisites:null,approach:null,findings:[],receipts:[],evidence:[evidence('check-'+commit,commit)],previewUrl:'',qaRunDir:'',blocker:'',resolution:null});
 const sourceFile=put(resolve(owned,'source-gate.json'),{anchor});vi.spyOn(gates,'acceptedNativeGate').mockReturnValue({files:[sourceFile]}as any);vi.spyOn(gates,'preparationGateEvidence').mockReturnValue({files:[sourceFile],trackedSources:['sources/profile.json'],references:[],gateSummary:{head:anchor}}as any);
 const source=result(anchor);source.evidence=[evidence('source-review',anchor,'review')];const qa=result(anchor);job.steps=[{stage:'review',result:source},{stage:'validate',result:qa}];
 const approved={plan:'none',review:'none',validation:'developer-checks',checks:['required'],reason:'Unchanged conflict integration'};job.approach=approved;job.decisions=[{stage:'update-base',role:'pm',approach:approved}];
 const nativeMap=new Map<string,any>(),proofMap=new Map<string,any>();vi.spyOn(checkpoints,'preparationNativeCheckpoint').mockImplementation(w=>nativeMap.get(w.id));vi.spyOn(checkpoints,'preparationNativeAssessment').mockImplementation(w=>nativeMap.get(w.id));vi.spyOn(continuation,'continuationWorkerProof').mockImplementation((_s,_j,w)=>{const p=proofMap.get(w.id);if(!p)throw Error('Unknown native proof');return p;});vi.spyOn(continuation,'continuationNativeReview').mockImplementation((_s,w)=>{const n=nativeMap.get(w.id);if(!n)throw Error('Missing native result');return n;});
 const addHop=(from:string,to:string,tgt:string,oldBase:string,prepare=true)=>{
  const conflict=result(from);Object.assign(conflict,{outcome:'blocked',findings:[{id:'main-integration-conflict',status:'open',summary:'Conflict',expected:'Clean',actual:'DIRTY',attempts:1}]});
  const pp=put(resolve(owned,'conflict-readback-'+to+'.json'),{kind:'verified-conflict-only',projectId:store.project.id,repository:store.project.repository,jobId:job.id,ticket:job.key,head:from,branch:job.branch,worktree,pr:job.pr,target:store.project.target,targetHead:tgt,base:oldBase});conflict.evidence.push({...evidence('unused-'+to,from,'provider'),path:pp.path});
  const repaired=result(to),published=result(to);published.evidence=[evidence('published-'+to,to,'pr')];job.steps.push({stage:'conflict-readback',result:conflict},{stage:'update-base',result:repaired},{stage:'draft',result:published});job.head=to;
  if(!prepare)return;
  const originalId='original-'+to,readerId='reader-'+to,intentId='intent-'+to,origClaim=store.claimWork({projectId:store.project.id,kind:'delivery',id:job.id},'scheduler','prepare-pr','delivery')!;store.finishClaim(origClaim.id,'completed');const originalClaim=JSON.parse((store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(origClaim.id)as any).body);
  const readerClaim=store.claimWork({projectId:store.project.id,kind:'reconciliation',id:intentId},'scheduler','reconcile-preparation','delivery')!;store.finishClaim(readerClaim.id,'completed');const original:any={id:originalId,sessionId:'native-'+originalId,claimId:origClaim.id,requestId:job.id,ticket:job.key,stage:'github-prepare-pr',role:'lead',provider:'codex',status:'failed',processId:99999991,lane:'delivery',startedAt:'2026-10-30T19:00Z',endedAt:'2026-10-30T19:05Z'},reader:any={...original,id:readerId,sessionId:'native-'+readerId,claimId:readerClaim.id,stage:'preparation-readback',status:'completed',processId:99999992};store.state.workLog??=[];store.state.workLog.push(original,reader);
  const originalRoot=resolve(root,'sessions',originalId),raw=result(to),originalFiles=[put(resolve(originalRoot,'completed-output.json'),raw),put(resolve(originalRoot,'provider.json'),{project:store.project.id,repository:store.project.repository,provider:'codex',role:'lead',readOnly:false}),put(resolve(originalRoot,'assignment.json'),{id:originalId,claimId:original.claimId,stage:original.stage,role:'lead',lane:'delivery',work:{id:job.id,kind:'delivery',projectId:store.project.id},scope:{repository:store.project.repository,worktree,artifacts:originalRoot},profile:'github-native'}),put(resolve(originalRoot,'assignment-identity.json'),{attemptId:originalId,requestId:job.id,threadId:original.sessionId,projectId:store.project.id,repository:store.project.repository,role:'lead'}),put(resolve(originalRoot,'capabilities.json'),{name:'github-native',readOnly:false}),put(resolve(originalRoot,'error.json'),{session:original.sessionId,provider:'codex',error:'Error: Worker exited with surviving subprocesses; effects require reconciliation'})];
  const native={root,file:put(resolve(root,'native-'+originalId+'.json'),{originalId}),recordCount:6,callCount:1},rn={root,file:put(resolve(root,'native-'+readerId+'.json'),{readerId}),recordCount:6,callCount:1};nativeMap.set(originalId,native);nativeMap.set(readerId,rn);
  const a={outcome:'passed',originalWorkId:originalId,nativeSessionId:original.sessionId,checkpointSha256:originalFiles[0].sha256,commit:to,prId:job.pr,approvalAnchor:anchor,preparationClass:'post-conflict-zero-write',completeNativeExecution:true,noExternalEffects:true,privateWritesOnly:true,unchangedApprovedDelta:true,sourceGatesPreserved:true,historicalEffectsVerified:true,effectsVerified:true,noHumanHold:true,nativeSessionSha256:native.file.sha256,nativeSessionPath:native.file.path,nativeRecordCount:native.recordCount};
  const readerFiles=[put(resolve(root,'sessions',readerId,'result.json'),{session:reader.sessionId,result:a})];proofMap.set(readerId,{worker:reader,result:a,assignment:{work:{id:intentId}},files:readerFiles});c.requests!.push({id:intentId,action:'reconcile-preparation',key:job.key,head:originalId,status:'completed',lane:'delivery',requestedAt:now.toISOString(),detail:''});
  const audit=put(resolve(owned,to+'-preparation-readback.json'),{postConflict:true,intentId,originalWorkId:originalId,originalSessionId:original.sessionId,readerId,readerSessionId:reader.sessionId,assessment:a,originalClaim,nativeCheckpoint:native,readerNative:rn,evidenceDigests:[...originalFiles,...readerFiles,pp],terminationObservations:[1,2].map(()=>({workerId:originalId,nativeSessionId:original.sessionId,processGroupId:original.processId,result:'ESRCH'})),conflictObservations:[1,2].map(()=>({evidence:{anchor,repair:{stage:'update-base',result:repaired},publication:{stage:'draft',result:published},proof:JSON.parse(readFileSync(pp.path,'utf8'))}}))});const prep=result(to);prep.evidence=[{...evidence('audit-'+to,to,'review'),path:audit.path}];prep.receipts=[{id:'readback-'+to,action:'preparation-readback',target:originalId,verified:true,uncertain:false,detail:''}];job.steps.push({stage:'prepare-pr',workerId:readerId,nativeResultSha256:digest(a),result:prep});return {audit,pp,reader,original,originalFiles};
 };
 const hop=addHop(anchor,head,target,base)!;const negative=result(head);negative.outcome='blocked';negative.findings=[{id:'merge-conflicts',status:'open',summary:'Renewed main conflict',expected:'Clean',actual:'DIRTY',attempts:1}];const claim=store.claimWork({projectId:store.project.id,kind:'delivery',id:job.id},'scheduler','lead-pr','delivery')!;store.finishClaim(claim.id,'completed');const lead:any={id:'completed-negative',sessionId:'negative-native',requestId:job.id,ticket:job.key,role:'lead',provider:'codex',stage:'github-lead-pr',status:'blocked',claimId:claim.id,processId:99999993,lane:'delivery',startedAt:'2026-10-30T20:00Z',endedAt:'2026-10-30T20:05Z'};store.state.workLog!.push(lead);job.steps.push({stage:'lead-pr',result:negative});proofMap.set(lead.id,{worker:lead,result:negative,files:[],assignment:{work:{id:job.id}}});nativeMap.set(lead.id,{root,file:put(resolve(root,'negative-native.json'),{negative})});
 const execute=vi.fn(async(program:string,args:string[])=>{if(program!=='git')throw Error('Provider calls forbidden');if(args[0]==='rev-list'){const link=retainedConflictChain(store,job,conflictOnlyAssessment)!.links.find(l=>l.head===args.at(-1))!;return `${link.head} ${link.from} ${link.target}`;}if(args[0]==='merge-base')return '';if(args[0]==='diff')return 'diff --git a/sources/profile.json b/sources/profile.json\n-approved\n+qualified';throw Error('Unknown Git read');});
 const engine:any={agents:{active:new Map(),run:vi.fn()},busy:false},coordinator:any={poll:vi.fn()},health:any={report:vi.fn(async()=>({services:[{id:'github',name:'GitHub',status:'connected',detail:'Available',checkedAt:''}]}))},it=new ITSpecialist({entries:new Map([[store.project.id,{store,engine,coordinator}]])}as any,health);
 return {root,store,c,job,anchor,head,target,base,hop,lead,negative,proofMap,nativeMap,addHop,execute,engine,it,chain:()=>retainedConflictChain(store,job,conflictOnlyAssessment),select:()=>repeatConflictRepairAdmission(store,job,conflictOnlyAssessment),tick:async(ms=0)=>{now=new Date(+now+ms);await it.tick(now,true);},requests:()=>c.requests!.filter(r=>r.action==='repair-pr-conflicts')};
}
test('actual retained native-audited source anchor admits the same completed negative through IT once',async()=>{const a=fixture(),before=JSON.stringify(a.job.steps);expect(a.chain()?.anchor).toBe(a.anchor);await verifyConflictChainGit({store:a.store,execute:a.execute}as any,a.job,a.chain()!);await a.tick();await a.tick(60000);expect(a.requests()).toMatchObject([{key:'GH-114',head:a.head,status:'queued'}]);expect(a.engine.agents.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job.steps)).toBe(before);});
function conflictRequestFixture(){
 const a=fixture();a.job.status='interrupted';
 const repository=a.store.project.repository,target=a.store.project.target,freshTarget='e'.repeat(40),issue={number:114,html_url:`https://github.com/${repository}/issues/114`,state:'open'},pr={number:a.job.pr,html_url:a.job.prUrl,state:'open',merged_at:null,draft:false,mergeable:false,updated_at:'2026-10-30T22:00:00Z',head:{sha:a.head,ref:a.job.branch,repo:{full_name:repository}},base:{sha:freshTarget,ref:target,repo:{full_name:repository}}};
 const graph={number:pr.number,url:pr.html_url,state:'OPEN',isDraft:false,headRefOid:a.head,headRefName:a.job.branch,baseRefOid:freshTarget,baseRefName:target,mergeable:'CONFLICTING',mergeStateStatus:'DIRTY',headRepository:{nameWithOwner:repository},baseRepository:{nameWithOwner:repository}};
 const onGraph=vi.fn(),command=vi.spyOn(processTools,'command').mockImplementation(async(program,args,options)=>{
  if(program==='git'){
   expect(options?.readOnly).toBe(true);
   if(args[0]==='remote')return `https://github.com/${repository}.git`;
   if(args[0]==='rev-parse')return a.head;
   if(args[0]==='branch')return a.job.branch;
   if(args[0]==='status')return '';
   return a.execute(program,args);
  }
  if(program==='gh'&&args[0]==='pr'&&args[1]==='view')return JSON.stringify({closingIssuesReferences:[{url:issue.html_url}]});
  if(program==='gh'&&args[0]==='api'){
   expect(options?.readOnly).toBe(true);
   if(args[1]==='graphql'){onGraph();return JSON.stringify({data:{repository:{pullRequest:graph}}});}
   if(args[1]===`repos/${repository}/pulls/${pr.number}`)return JSON.stringify(pr);
   if(args[1]===`repos/${repository}/issues/114`)return JSON.stringify(issue);
   if(args[1]===`repos/${repository}/commits/${target}`)return JSON.stringify({sha:freshTarget});
  }
  throw Error(`Unexpected fixture command ${program} ${args.join(' ')}`);
 });
 const request=()=>enqueueRequest(a.store,'repair-pr-conflicts',a.job.key,a.head);
 const execute=async(r:ReturnType<typeof request>)=>{
  const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:r.id},'scheduler',r.action,'delivery')!;
  try{await withAssignment(claim,'delivery',()=>executeRequest(a.store,a.engine,{} as any,r));}finally{a.store.finishClaim(claim.id,'completed');}
 };
 return {...a,command,onGraph,request,execute,freshTarget};
}
test('qualified interrupted original executes one exact-head IT intent through fresh conflict proof on the same job',async()=>{
 const a=conflictRequestFixture(),id=a.select()!.id,steps=structuredClone(a.job.steps),workers=structuredClone(a.store.state.workLog),jobs=a.c.jobs;
 await a.tick();await a.tick(60000);expect(a.requests()).toHaveLength(1);expect(a.requests()[0]).toMatchObject({head:a.head,key:a.job.key,status:'queued'});expect(a.command).not.toHaveBeenCalled();
 await a.execute(a.requests()[0]);
 expect(a.requests()[0].status).toBe('completed');expect(a.job).toMatchObject({id:'job',head:a.head,stage:'update-base',status:'queued',repairReason:'conflicts',pr:117});expect(a.c.jobs).toBe(jobs);expect(a.c.jobs).toHaveLength(1);
 expect(a.job.steps.slice(0,-1)).toEqual(steps);expect(a.store.state.workLog).toEqual(workers);expect(a.engine.agents.run).not.toHaveBeenCalled();expect(a.store.state.it!.recoveries[id].attempts).toBe(1);
 const readback=a.job.steps.at(-1);expect(readback.stage).toBe('conflict-readback');const proof=JSON.parse(readFileSync(readback.result.evidence.at(-1).path,'utf8'));
 expect(proof).toMatchObject({head:a.head,sourceAnchor:a.anchor,targetHead:a.freshTarget,kind:'verified-conflict-only'});expect(proof.priorConflictChain).toHaveLength(1);
});
test.each(['native','claim','chain','running','stopping','hold','head','uncertain'] as const)('interrupted conflict intent refuses changed %s proof without spending another IT attempt',async kind=>{
 const a=conflictRequestFixture(),id=a.select()!.id;await a.tick();const request=a.requests()[0];
 if(kind==='native')a.nativeMap.delete(a.lead.id);
 if(kind==='claim')a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.lead.claimId);
 if(kind==='chain')writeFileSync(a.hop.audit.path,'{}');
 if(kind==='running'||kind==='stopping')a.store.state.workLog!.push({id:'active',requestId:a.job.id,status:kind} as any);
 if(kind==='hold')HOLDS[a.job.key]='Human hold';
 if(kind==='head')a.job.head='9'.repeat(40);
 if(kind==='uncertain')a.job.steps[0].result.receipts.push({id:'unknown',action:'write',target:'original',verified:false,uncertain:true,detail:''});
 const steps=structuredClone(a.job.steps);await a.tick(60000);expect(a.requests()).toHaveLength(1);expect(a.select()).toBeUndefined();await a.execute(request);
 expect(request.status).toBe('blocked');expect(a.job).toMatchObject({stage:'lead-pr',status:'interrupted'});expect(a.job.steps).toEqual(steps);expect(a.command).not.toHaveBeenCalled();expect(a.store.state.it!.recoveries[id].attempts).toBe(1);expect(a.engine.agents.run).not.toHaveBeenCalled();
});
test.each(['native','claim','chain'] as const)('interrupted original rechecks %s qualification after fresh provider reads',async kind=>{
 const a=conflictRequestFixture(),request=a.request(),steps=structuredClone(a.job.steps);
 a.onGraph.mockImplementation(()=>{if(kind==='native')a.nativeMap.delete(a.lead.id);if(kind==='claim')a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.lead.claimId);if(kind==='chain')writeFileSync(a.hop.audit.path,'{}');});
 await a.execute(request);expect(a.onGraph).toHaveBeenCalledTimes(1);expect(request.status).toBe('blocked');expect(request.detail).toContain('qualification changed during readback');expect(a.job).toMatchObject({stage:'lead-pr',status:'interrupted'});expect(a.job.steps).toEqual(steps);expect(a.engine.agents.run).not.toHaveBeenCalled();
});
test('interrupted conflict exception retains the CI status restriction and three-update-base limit',async()=>{
 const a=conflictRequestFixture(),delivery=new GitHubDelivery(a.store,a.engine);
 await expect(delivery.queueConflictRepair(a.job.key,'ci')).rejects.toThrow('certain owned published candidate');
 for(const commit of ['8'.repeat(40),'9'.repeat(40)])a.job.steps.push({stage:'update-base',result:{...a.negative,outcome:'passed',commit}});
 expect(a.select()).toBeDefined();const request=a.request();await a.execute(request);expect(request.status).toBe('blocked');expect(request.detail).toContain('Repeated base changes');expect(a.command).not.toHaveBeenCalled();expect(a.job).toMatchObject({stage:'lead-pr',status:'interrupted'});
});
test('second and third audited integration links preserve the original source anchor; fourth refuses',()=>{const a=fixture();a.addHop(a.head,'e'.repeat(40),'f'.repeat(40),a.target);a.addHop('e'.repeat(40),'1'.repeat(40),'2'.repeat(40),'f'.repeat(40));expect(a.chain()?.links).toHaveLength(3);expect(a.chain()?.anchor).toBe(a.anchor);a.addHop('1'.repeat(40),'3'.repeat(40),'4'.repeat(40),'2'.repeat(40));expect(a.chain).toThrow(/hop limit/);});
test('post-publication projection walks repeated links while retaining original gates',()=>{const a=fixture();a.addHop(a.head,'e'.repeat(40),'f'.repeat(40),a.target,false);const p=postConflictPreparationEvidence(a.store,a.job);expect(p?.anchor).toBe(a.anchor);expect(p?.chain?.links).toHaveLength(2);expect(a.job.steps.filter((s:any)=>s.stage==='review')[0].result.commit).toBe(a.anchor);});
test.each(['missing-native','altered-artifact','wrong-claim','wrong-anchor','uncertain-publication','mixed-source-stage','cycle'])('%s cannot inherit original approval',kind=>{const a=fixture();if(kind==='missing-native')a.nativeMap.set(a.hop.reader.id,undefined);if(kind==='altered-artifact')writeFileSync(a.hop.originalFiles[0].path,'{}');if(kind==='wrong-claim')a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.hop.original.claimId);if(kind==='wrong-anchor'){const p=JSON.parse(readFileSync(a.hop.audit.path,'utf8'));p.assessment.approvalAnchor='0'.repeat(40);writeFileSync(a.hop.audit.path,JSON.stringify(p));}if(kind==='uncertain-publication')a.job.steps.find((s:any)=>s.stage==='draft').result.receipts.push({verified:false,uncertain:true});if(kind==='mixed-source-stage')a.job.steps.push({stage:'implement',result:a.negative});if(kind==='cycle')a.job.steps.find((s:any)=>s.stage==='conflict-readback').result.commit=a.head;expect(a.chain).toThrow();expect(a.select()).toBeUndefined();});
test('mixed approved source delta or a different merge parent fails fresh deterministic Git verification',async()=>{const a=fixture(),chain=a.chain()!;a.execute.mockImplementation(async(_p,args)=>args[0]==='rev-list'?`${a.head} ${a.anchor} ${a.target}`:args[0]==='diff'?(args.includes(a.base)?'+approved':'+different claim'):'');await expect(verifyConflictChainGit({store:a.store,execute:a.execute}as any,a.job,chain)).rejects.toThrow(/source delta/);a.execute.mockResolvedValue(`${a.head} ${a.anchor} ${'0'.repeat(40)}`);await expect(verifyConflictChainGit({store:a.store,execute:a.execute}as any,a.job,chain)).rejects.toThrow(/forward merge/);});
test.each(['paused','draining','running','hold','unknown-native'])('%s preserves original admission budget and never replays unknown work',async kind=>{const a=fixture(),id=a.select()!.id;await a.tick();a.requests()[0].status='blocked';if(kind==='paused')a.store.state.paused=true;if(kind==='draining')a.store.state.draining=true;if(kind==='running')a.store.state.workLog!.push({id:'active',requestId:a.job.id,status:'running'}as any);if(kind==='hold')HOLDS[a.job.key]='Human hold';if(kind==='unknown-native')a.proofMap.delete(a.lead.id);await a.tick(60000);expect(a.requests()).toHaveLength(1);expect(a.store.state.it!.recoveries[id].attempts).toBe(1);expect(a.store.state.it!.recoveries[id].status).not.toBe('resolved');expect(repeatConflictRepairUnresolved(a.store,id)).toBe(true);});
test('bounded recovery survives ineligibility and resolves only when actual original conflict readback exists',async()=>{const a=fixture(),id=a.select()!.id;for(const delay of [0,60000,180000,600000]){for(const r of a.requests())r.status='blocked';await a.tick(delay);}expect(a.requests()).toHaveLength(3);a.store.state.draining=true;await a.tick(60000);a.store.state.draining=false;await a.tick(60000);expect(a.requests()).toHaveLength(3);a.job.steps.push({stage:'conflict-readback',result:a.negative});expect(repeatConflictRepairUnresolved(a.store,id)).toBe(false);});
test('native evidence changed during asynchronous Git verification cannot authorize the next repair',async()=>{const a=fixture(),chain=a.chain()!,original=a.execute.getMockImplementation()!;let changed=false;a.execute.mockImplementation(async(p,args)=>{const value=await original(p,args);if(!changed){changed=true;writeFileSync(chain.nativeArtifacts[0].file.path,'changed native bytes');}return value;});await expect(verifyConflictChainGit({store:a.store,execute:a.execute}as any,a.job,chain)).rejects.toThrow(/native history changed/);});
