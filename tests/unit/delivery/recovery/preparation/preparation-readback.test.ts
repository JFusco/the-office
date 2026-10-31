import * as processTools from '../../../../../server/workers/process';
import * as checkpoints from '../../../../../server/delivery/recovery/preparation/preparation-checkpoint';
import {completedConflictDraftCandidate,reconcileCompletedConflictDraft,postConflictPreparationEvidence,routeReadyPostConflictPublication} from '../../../../../server/delivery/recovery/preparation/post-conflict-preparation';
import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync,symlinkSync,renameSync,lstatSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname,resolve} from 'node:path';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {postConflictReadbackCandidate,preparationReadbackCandidate,reconcilePreparationReadback,preparationRequestResolved} from '../../../../../server/delivery/recovery/preparation/preparation-readback';
import {ITSpecialist} from '../../../../../server/it/it-specialist';
import {enqueueRequest,executeRequest} from '../../../../../server/scheduling/requests';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {startMeasurement} from '../../../../../server/time/work-time';
import {preparationReceiptBindings} from '../../../../../server/delivery/recovery/preparation/preparation-receipts';
import {artifact,digest,rootArtifact} from '../../../../../server/store/readback-evidence';
import {workKey,type StageResult,type TicketJob} from '../../../../../src/shared';
const mockHome=vi.hoisted(()=>({path:'/private/tmp'}));
vi.mock('node:os',async original=>({...await original<any>(),homedir:()=>mockHome.path}));
const roots:string[]=[],stores:Store[]=[],processes:number[]=[];
function liveProcess(){const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});child.unref();processes.push(child.pid!);return child.pid!;}
afterEach(()=>{for(const pid of processes.splice(0))try{process.kill(-pid,'SIGKILL');}catch{}vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true}));});
function fixture(external=false){
 const root=mkdtempSync(resolve(tmpdir(),'office-preparation-proof-'));roots.push(root);
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo:resolve(root,'primary')},root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const engine=new Engine(store),head='a'.repeat(40),branch='codex/113-fixture',worktree=external?mkdtempSync(resolve(tmpdir(),'office-external-candidate-')):resolve(root,'candidate');if(external){roots.push(worktree);writeFileSync(resolve(worktree,'.git'),'gitdir: /private/fixture');}else mkdirSync(worktree);
 const job:TicketJob={id:'job',key:'GH-113',requestedAt:'2026-10-30T00:00:00Z',stage:'prepare-pr',status:'blocked',head,branch,worktree,pr:120,prUrl:'https://github.com/JFusco/cms-field-vocabulary/pull/120',detail:'Error: Worker exited with surviving subprocesses; effects require reconciliation',steps:[]};store.state.coordination.jobs=[job];
 const evidence=resolve(root,'ticket-work/job/provider.json');mkdirSync(resolve(root,'ticket-work/job'),{recursive:true});writeFileSync(evidence,'{"ready":true}');
 const source:StageResult={outcome:'passed',summary:'Exact-head source acceptance',commit:head,worktree,branch,prId:0,findings:[],receipts:[],evidence:[{id:'source',kind:'review',path:evidence,commit:head,summary:'Independent proof',environment:'fixture',url:'',observedAt:''}],paidRuns:0,qaRunDir:'',previewUrl:'',blocker:'',prerequisites:null,approach:null};
 job.steps=[{stage:'review',result:structuredClone(source)},{stage:'validate',result:structuredClone(source)},{stage:'draft',result:{...structuredClone(source),prId:120}}];
 for(const [index,stage]of ['review','validate'].entries()){
  const path=resolve(root,'ticket-work/job',stage,'evidence.json');mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify({stage,commit:head}));
  job.steps[index].result.evidence[0]={...job.steps[index].result.evidence[0],id:stage,kind:stage==='review'?'review':'checks',path};
 }
 const original:any={id:'original',sessionId:'original-native',requestId:job.id,ticket:job.key,role:'lead',provider:'codex',stage:'github-prepare-pr',status:'failed',processId:2147483647,startedAt:'2026-10-30T00:02:00Z',endedAt:'2026-10-30T00:03:00Z'};store.state.workLog=[original];
 const raw:any={outcome:'passed',summary:'Ready once; pending CI is not passed',commit:head,worktree,branch,prId:120,findings:[],receipts:[{id:'ready',action:'gh pr ready',target:job.prUrl,verified:true,uncertain:false,detail:'Exactly once; read back'}],evidence:[{id:'readback',kind:'pr',path:evidence,summary:'Exact PR readback'}],paidRuns:0};
 const put=(id:string,name:string,value:any)=>{const dir=resolve(root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 const provider=(readOnly:boolean)=>({project:store.project.id,repository:store.project.repository,role:'lead',provider:'codex',readOnly});
 const identity=(id:string,session:string)=>({attemptId:id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,role:'lead',threadId:session});
 put('original','provider.json',provider(false));put('original','completed-output.json',raw);put('original','error.json',{provider:'codex',session:original.sessionId,error:job.detail});
 put('original','capabilities.json',{name:'github-native',readOnly:false});put('original','assignment-identity.json',identity('original',original.sessionId));
 put('original','assignment.json',{id:'original',work:{projectId:store.project.id,kind:'delivery',id:job.id},lane:'delivery',stage:original.stage,role:'lead',scope:{repository:store.project.repository,worktree,artifacts:resolve(root,'sessions/original')},profile:'github-native'});
 const sha=createHash('sha256').update(readFileSync(resolve(root,'sessions/original/completed-output.json'))).digest('hex');
 const assessment={outcome:'passed',originalWorkId:'original',nativeSessionId:original.sessionId,checkpointSha256:sha,commit:head,prId:120,completeNativeExecution:true,onlyReadyEffect:true,effectsVerified:true,noHumanHold:true,sourceGatesPreserved:true,historicalEffectsVerified:true,receiptBindingsSha256:digest([]),nativeRecordCount:42,nativeSessionPath:'/private/native-original.jsonl',summary:'Complete native execution and only exact ready effect verified',evidence:[{path:'/private/native-original.jsonl:42',summary:'Every actual tool result and effect verified'}]};
 const readback=()=>{const id='reader-'+store.state.workLog!.length,session='native-'+id;store.state.workLog!.push({id,sessionId:session,requestId:job.id,ticket:job.key,role:'lead',provider:'codex',stage:'preparation-readback',status:'completed',processId:2147483646,endedAt:'2026-10-30T00:05:00Z',effortKind:'administrative'}as any);put(id,'provider.json',provider(true));put(id,'result.json',{session,result:assessment});put(id,'assignment-identity.json',identity(id,session));put(id,'capabilities.json',{name:'reader',readOnly:true});return structuredClone(assessment);};
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback()as any);
 const issue:any={number:113,html_url:'https://github.com/JFusco/cms-field-vocabulary/issues/113',state:'open',title:'Scope',body:'Preserve holds',labels:[],assignees:[{login:'JFusco'}],updated_at:'2026-10-30T00:00:00Z'};
 const pull:any={number:120,html_url:job.prUrl,state:'open',draft:false,merged_at:null,title:'PR',body:'Closes #113',updated_at:'2026-10-30T00:02:30Z',head:{sha:head,ref:branch,repo:{full_name:store.project.repository}},base:{ref:'main',sha:'b'.repeat(40),repo:{full_name:store.project.repository}}};
 const timeline:any[]=[{id:10,event:'ready_for_review',actor:{login:'JFusco'},created_at:'2026-10-30T00:02:30Z'}],comments:any[]=[];
 const execute=vi.fn(async(program:string,args:string[])=>{
  if(program==='git'){if(args[0]==='rev-parse')return head;if(args[0]==='branch')return branch;if(args[0]==='status')return '';if(args[0]==='ls-remote')return `${head}\trefs/heads/${branch}`;}
  if(args[0]==='pr')return JSON.stringify({closingIssuesReferences:[{url:issue.html_url}]});
  if(program==='git'&&args[0]==='--literal-pathspecs')return args.at(-1)!;
  const path=args[1];if(path.includes('/pulls?'))return '[[]]';
  if(path.includes('/timeline?'))return JSON.stringify(timeline);
  if(path.includes('issues/120/comments?'))return JSON.stringify(comments);
  if(path.includes('/comments?')||path.includes('/reviews?'))return '[]';
  if(path.includes('/check-runs?'))return JSON.stringify({total_count:1,check_runs:[{head_sha:head,status:'in_progress',conclusion:null}]});
  if(path.endsWith('/status'))return JSON.stringify({sha:head,total_count:0,statuses:[],state:'pending'});
  if(path.endsWith('/pulls/120'))return JSON.stringify(pull);
  return JSON.stringify(issue);
 });
 const delivery=new GitHubDelivery(store,engine,execute as any),board:any={items:[{id:'item',number:113,repository:store.project.repository,status:'In review'}]};vi.spyOn(engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}})),intent=enqueueRequest(store,'reconcile-preparation',job.key,'original');intent.status='working';
 const reconcile=()=>reconcilePreparationReadback(delivery,job.key,'original',ownership,intent.id);
 return {root,store,engine,job,original,raw,put,run,readback,assessment,issue,pull,timeline,comments,delivery,board,ownership,intent,reconcile,execute};
}
test('adopts only fresh independently proven ready metadata; original failure and pending CI remain truthful',async()=>{
 const a=fixture(),original=JSON.stringify(a.original),checkpoint=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 const candidate=preparationReadbackCandidate(a.store,a.job);expect(candidate?.work.id).toBe('original');await a.reconcile();
 expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',head:a.raw.commit});expect(a.intent.status).toBe('completed');expect(JSON.stringify(a.original)).toBe(original);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(checkpoint);
 expect(a.run.mock.calls[0]).toMatchObject(['lead',expect.stringContaining('COMPLETE original native session'),expect.anything(),expect.objectContaining({readOnly:true,effortKind:'administrative',stage:'preparation-readback'})]);
 const step=a.job.steps.at(-1)!,proof=JSON.parse(readFileSync(step.result.evidence.at(-1)!.path,'utf8'));expect(step).toMatchObject({workerId:'reader-1',stage:'prepare-pr'});expect(proof.terminationObservations).toHaveLength(2);expect(proof.providerObservations).toHaveLength(2);
 for(const gate of a.job.steps.slice(0,2)){
  const file=candidate!.files.find(f=>f.path===gate.result.evidence[0].path);expect(file).toBeDefined();expect(proof.evidenceDigests).toContainEqual(file);
 }
 await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).toHaveBeenCalledTimes(1);
 const duplicate=enqueueRequest(a.store,'reconcile-preparation',a.job.key,'original');expect(duplicate.id).toBe(a.intent.id);
});
test('a completed legacy empty-head preparation request allows another queued recovery',()=>{
 const a=fixture(),completed=enqueueRequest(a.store,'reconcile-preparation',a.job.key,'');completed.status='completed';
 const next=enqueueRequest(a.store,'reconcile-preparation',a.job.key,'');expect(next.id).not.toBe(completed.id);expect(next).toMatchObject({key:'GH-113',head:'',status:'queued'});
 expect(enqueueRequest(a.store,'reconcile-preparation',a.job.key,'').id).toBe(next.id);
});
test('unrelated cross-reference metadata may change while Sam reads',async()=>{
 const a=fixture(),reference={id:11,event:'cross-referenced',created_at:'2026-10-30T00:01:00Z',actor:{login:'JFusco'},source:{type:'issue',issue:{number:999,html_url:'https://github.com/JFusco/cms-field-vocabulary/issues/999',updated_at:'before'}}};a.timeline.push(reference);
 a.run.mockImplementation(async()=>{reference.source.issue.updated_at='after';return a.readback()as any;});await a.reconcile();
 expect(a.job.stage).toBe('lead-pr');expect(a.intent.status).toBe('completed');
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));
 for(const observation of proof.providerObservations)expect(observation.timeline[1].source).toEqual({type:'issue',issue:{number:999,html_url:reference.source.issue.html_url}});
});
test('cross-reference identity changes still block acceptance',async()=>{
 const a=fixture(),reference={id:11,event:'cross-referenced',source:{type:'issue',issue:{number:999,html_url:'https://github.com/JFusco/cms-field-vocabulary/issues/999'}}};a.timeline.push(reference);
 a.run.mockImplementation(async()=>{reference.source.issue.number=998;return a.readback()as any;});
 await expect(a.reconcile()).rejects.toThrow('Provider or independent preparation evidence changed');expect(a.intent.status).toBe('working');expect(a.job.stage).toBe('prepare-pr');
});
test('raw cross-reference metadata retains the provider response size bound',async()=>{
 const a=fixture();a.timeline.push({id:11,event:'cross-referenced',source:{type:'issue',issue:{number:999,body:'x'.repeat(1024*1024)}}});
 await expect(a.reconcile()).rejects.toThrow('Preparation provider records exceed bounded packet');expect(a.run).not.toHaveBeenCalled();expect(a.intent.status).toBe('working');
});
test.each(['commit','environment','url','observedAt'])('normalizes only nullish historical evidence display values: %s',field=>{
 const a=fixture();
 for(const value of [undefined,null]){
  if(value===undefined)delete a.raw.evidence[0][field];else a.raw.evidence[0][field]=value;
  a.put('original','completed-output.json',a.raw);const candidate=preparationReadbackCandidate(a.store,a.job);expect(candidate?.work.id).toBe('original');expect(candidate!.result.evidence[0][field as keyof StageResult['evidence'][number]]).toBe('');
 }
 a.raw.evidence[0][field]=42;a.put('original','completed-output.json',a.raw);expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();
});
test.each(['result-commit','receipt-verified','evidence-path'])('display compatibility does not invent missing acceptance data: %s',field=>{
 const a=fixture();if(field==='result-commit')delete a.raw.commit;if(field==='receipt-verified')delete a.raw.receipts[0].verified;if(field==='evidence-path')delete a.raw.evidence[0].path;
 a.put('original','completed-output.json',a.raw);expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();
});
test.each(['review','validate'])('rejects missing, foreign, symlinked or oversized %s evidence before dispatch',async stage=>{
 for(const scenario of ['missing','foreign','leaf-symlink','parent-symlink','oversized']){
  const a=fixture(),evidence=a.job.steps.find(s=>s.stage===stage)!.result.evidence[0],path=evidence.path,parent=dirname(path);
  if(scenario==='missing')rmSync(path);
  if(scenario==='foreign')evidence.path=resolve(a.root,'sessions/original/provider.json');
  if(scenario==='leaf-symlink'){renameSync(path,path+'-saved');symlinkSync(path+'-saved',path);}
  if(scenario==='parent-symlink'){renameSync(parent,parent+'-saved');symlinkSync(parent+'-saved',parent);}
  if(scenario==='oversized')writeFileSync(path,'x'.repeat(8*1024*1024+1));
  const prior=JSON.stringify(a.job);await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);expect(a.intent.status).toBe('working');
 }
});
test.each(['review','validate'])('fences %s evidence contents and parent inodes during Sam readback',async stage=>{
 for(const scenario of ['contents','parent']){
  const a=fixture(),path=a.job.steps.find(s=>s.stage===stage)!.result.evidence[0].path,prior=JSON.stringify(a.job);
  a.run.mockImplementation(async()=>{
   if(scenario==='contents')writeFileSync(path,'Changed gate evidence');
   if(scenario==='parent'){const parent=dirname(path);renameSync(parent,parent+'-saved');mkdirSync(parent);renameSync(resolve(parent+'-saved','evidence.json'),path);}
   return a.readback()as any;
  });
  await expect(a.reconcile()).rejects.toThrow('Preparation identity, authorization, evidence or ownership changed');expect(JSON.stringify(a.job)).toBe(prior);expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
 }
});
test.each(['wrong-provider','active-group','uncertain-write','extra-mutation','source-amendment','stale-review','open-QA-finding','foreign-artifact','missing-field','wrong-native','wrong-head','unknown-failure'])('does not dispatch or mutate an unsafe original: %s',async scenario=>{
 const a=fixture();
 if(scenario==='wrong-provider')a.original.provider='claude';
 if(scenario==='active-group')a.original.processId=liveProcess();
 if(scenario==='uncertain-write'){a.raw.receipts[0].uncertain=true;a.put('original','completed-output.json',a.raw);}
 if(scenario==='extra-mutation'){a.raw.receipts.push({...a.raw.receipts[0],action:'gh pr reopen'});a.put('original','completed-output.json',a.raw);}
 if(scenario==='source-amendment')a.job.sourceAmendment={}as any;
 if(scenario==='stale-review')a.job.steps[0].result.commit='c'.repeat(40);
 if(scenario==='open-QA-finding')a.job.steps[1].result.findings.push({id:'hold',status:'open'}as any);
 if(scenario==='foreign-artifact'){a.raw.evidence[0].path=resolve(a.root,'sessions/original/provider.json');a.put('original','completed-output.json',a.raw);}
 if(scenario==='missing-field'){delete a.raw.commit;a.put('original','completed-output.json',a.raw);}
 if(scenario==='wrong-native')a.put('original','assignment-identity.json',{threadId:'foreign'});
 if(scenario==='wrong-head')a.job.head='c'.repeat(40);
 if(scenario==='unknown-failure')a.job.detail='Unclassified writable failure';
 const prior=JSON.stringify(a.job);await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);
});
test.each(['head','pr','base','draft','issue','comment','timeline','ownership','pause','drain','checkpoint','parent-symlink','reader','reader-active','incomplete-native','extra-effect','source-gates'])('rechecks the exact positive proof and scope before commit: %s',async scenario=>{
 const a=fixture(),prior=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{const r=a.readback();
  if(scenario==='head')a.pull.head.sha='b'.repeat(40);
  if(scenario==='pr')a.pull.number=121;
  if(scenario==='base')a.pull.base.ref='foreign';
  if(scenario==='draft')a.pull.draft=true;
  if(scenario==='issue')a.issue.body='Human changed scope';
  if(scenario==='comment')a.comments.push({id:77,issue_url:'https://api.github.com/repos/JFusco/cms-field-vocabulary/issues/120',html_url:a.job.prUrl+'#issuecomment-77',body:'Human hold',user:{login:'JFusco'},created_at:'now',updated_at:'now'});
  if(scenario==='timeline')a.timeline[0].created_at='2026-10-30T00:00:01Z';
  if(scenario==='ownership')a.ownership.mockResolvedValue({complete:true,fresh:true,ownership:{status:'owned'}});
  if(scenario==='pause')a.store.state.paused=true;
  if(scenario==='drain')a.store.state.draining=true;
  if(scenario==='checkpoint')a.put('original','completed-output.json',{...a.raw,summary:'Replaced'});
  if(scenario==='parent-symlink'){const old=resolve(a.root,'sessions/original');renameSync(old,old+'-saved');symlinkSync(old+'-saved',old);}
  if(scenario==='reader')a.put('reader-1','result.json',{session:'wrong',result:r});
  if(scenario==='reader-active')a.store.state.workLog!.at(-1)!.processId=liveProcess();
  if(scenario==='incomplete-native')r.completeNativeExecution=false;
  if(scenario==='extra-effect')r.onlyReadyEffect=false;
  if(scenario==='source-gates')r.sourceGatesPreserved=false;
  return r as any;
 });
 await expect(a.reconcile()).rejects.toThrow();expect(JSON.stringify(a.job)).toBe(prior);expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
});
test('literal native schema rejects corrupt immutable identities',async()=>{
 const a=fixture();a.run.mockImplementation(async(_role,_prompt,schema)=>{expect(schema.safeParse({...a.assessment,checkpointSha256:a.assessment.checkpointSha256+'c'}).success).toBe(false);expect(schema.safeParse({...a.assessment,prId:121}).success).toBe(false);return a.readback()as any;});await a.reconcile();
});
test('atomic failure rolls back accepted step, stage and durable intent together',async()=>{
 const a=fixture(),prior=structuredClone(a.job);vi.spyOn(a.store,'emit').mockImplementation(()=>{throw new Error('Injected commit failure');});await expect(a.reconcile()).rejects.toThrow('Injected');
 expect(a.store.state.coordination!.jobs?.[0]).toEqual(prior);expect(a.store.state.coordination!.requests?.find(r=>r.id===a.intent.id)?.status).toBe('working');expect(a.original.status).toBe('failed');
});
test('legacy failed empty-head projection resolves only the original at its request time and a bound positive proof',async()=>{
 const a=fixture(),legacy={...a.intent,id:'legacy',head:'',status:'blocked',requestedAt:'2026-10-30T00:04:00Z'}as any;expect(preparationRequestResolved(a.store,legacy)).toBe(false);await a.reconcile();expect(preparationRequestResolved(a.store,legacy)).toBe(true);
 legacy.requestedAt='2026-10-30T00:02:30Z';expect(preparationRequestResolved(a.store,legacy)).toBe(false);legacy.requestedAt='2026-10-30T00:04:00Z';legacy.head='different';expect(preparationRequestResolved(a.store,legacy)).toBe(false);
});
test('metadata stage classification is prospective and does not relabel historical measurements',()=>{
 const a=fixture(),old=JSON.stringify(a.original),work={...a.original,id:'new',effortKind:undefined}as any;startMeasurement(work,a.store.clock);expect(work.effortKind).toBe('administrative');expect(JSON.stringify(a.original)).toBe(old);
});
test.each(['blocked','interrupted']as const)('IT queues and reuses one exact-original intent for qualified %s preparation',async status=>{
 const a=fixture();a.job.status=status;a.store.state.coordination!.requests=[];expect(preparationReadbackCandidate(a.store,a.job)?.work.id).toBe('original');
 const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 await it.tick(new Date('2026-10-30T01:00Z'),true);const request=a.store.state.coordination!.requests![0];expect(a.store.state.coordination!.requests).toHaveLength(1);expect(request).toMatchObject({action:'reconcile-preparation',key:a.job.key,head:'original',status:'queued'});
 await it.tick(new Date('2026-10-30T01:01Z'),true);expect(a.store.state.coordination!.requests).toEqual([request]);expect(a.store.state.it!.recoveries['pr-preparation:job']).toMatchObject({attempts:1,status:'retrying',requestId:request.id});expect(a.run).not.toHaveBeenCalled();
});
test.each(['blocked','interrupted']as const)('legacy preparation fallback retains its blocked-only boundary: %s',async status=>{
 const a=fixture();a.job.status=status;a.job.detail='Saved legacy preparation';a.store.state.coordination!.requests=[];
 const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 await it.tick(new Date('2026-10-30T01:00Z'),true);expect(a.store.state.coordination!.requests).toHaveLength(status==='blocked'?1:0);
 if(status==='blocked')expect(a.store.state.coordination!.requests![0]).toMatchObject({action:'reconcile-preparation',head:'',status:'queued'});
});
test.each(['blocked','interrupted']as const)('IT preserves exhausted %s preparation budget across drain and pause; resolves it only after stage advances',async status=>{
 const a=fixture();a.job.status=status;a.intent.status='blocked';a.store.state.it={status:'monitoring',reports:[],recoveries:{'pr-preparation:job':{attempts:3,status:'needs-human',nextAt:'',detail:'Original retained'}}}as any;
 const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 await it.tick(new Date('2026-10-30T00:59Z'),true);expect(a.store.state.it!.recoveries['pr-preparation:job']).toMatchObject({attempts:3,status:'needs-human'});expect(a.store.state.coordination!.requests).toHaveLength(1);
 a.store.state.paused=true;await it.tick(new Date('2026-10-30T01:00Z'),true);expect(a.store.state.it!.recoveries['pr-preparation:job'].attempts).toBe(3);
 a.store.state.paused=false;a.store.state.draining=true;await it.tick(new Date('2026-10-30T01:01Z'),true);expect(a.store.state.it!.recoveries['pr-preparation:job'].attempts).toBe(3);expect(a.store.state.it!.recoveries['pr-preparation:job'].status).not.toBe('resolved');
 a.store.state.draining=false;a.intent.status='working';await a.reconcile();await it.tick(new Date('2026-10-30T01:02Z'),true);expect(a.store.state.it!.recoveries['pr-preparation:job'].status).toBe('resolved');expect(a.store.state.it!.recoveries['pr-preparation:job'].attempts).toBe(3);
});
test('only the exact admitted durable preparation claim may finish a drain',async()=>{
 const a=fixture(),claim:any={id:'claim',work:{projectId:a.store.project.id,kind:'reconciliation',id:a.intent.id},lane:'delivery',stage:'reconcile-preparation',expectedVersion:'1',status:'running',claimedAt:'2026-10-30T00:04Z'};
 vi.spyOn(a.store,'activeClaims').mockReturnValue([claim]);a.run.mockImplementation(async()=>{a.store.state.draining=true;return a.readback()as any;});
 await withAssignment(claim,'delivery',()=>a.reconcile());expect(a.intent.status).toBe('completed');expect(a.job.stage).toBe('lead-pr');
});

/** Synthetic already-accepted Riley proof: real disk files, no provider or native execution. */
function nativeGate(a:ReturnType<typeof fixture>){
 const lead:any={id:'source-lead',sessionId:'native-source-lead',requestId:a.job.id,ticket:a.job.key,stage:'github-review',role:'lead',provider:'codex',status:'completed',processId:2147483630,startedAt:'2026-10-30T00:00:00Z',endedAt:'2026-10-30T00:00:10Z'};
 const original:any={...lead,id:'source-qa-original',sessionId:'native-source-qa-original',stage:'github-validate',role:'qa',status:'failed',processId:2147483631,startedAt:'2026-10-30T00:00:20Z',endedAt:'2026-10-30T00:00:50Z'};
 const reader:any={...lead,id:'source-qa-reader',sessionId:'native-source-qa-reader',stage:'validation-readback',role:'qa',processId:2147483632,startedAt:'2026-10-30T00:00:51Z',endedAt:'2026-10-30T00:01:00Z',effortKind:'administrative'};
 a.store.state.workLog!.unshift(lead,original,reader);
 const provider=(role:string,readOnly:boolean)=>({project:a.store.project.id,repository:a.store.project.repository,role,provider:'codex',readOnly});
 a.put(lead.id,'provider.json',provider('lead',true));a.put(lead.id,'result.json',{session:lead.sessionId,result:structuredClone(a.job.steps[0].result)});
 a.put(original.id,'provider.json',provider('qa',false));a.put(original.id,'completed-output.json',structuredClone(a.job.steps[1].result));
 for(const name of ['assignment.json','assignment-identity.json','capabilities.json','error.json'])a.put(original.id,name,{fixture:'synthetic accepted prior gate',id:original.id});
 const checkpoint=artifact(a.store,resolve(a.root,'sessions',original.id,'completed-output.json'));
 const assessment={outcome:'passed',originalWorkId:original.id,nativeSessionId:original.sessionId,checkpointSha256:checkpoint.sha256,commit:a.job.head,completeNativeExecution:true,checksVerified:true,effectsVerified:true,noHumanHold:true,nativeRecordCount:42,nativeSessionPath:'/synthetic-native-source-qa.jsonl',verifiedFindingIds:[],summary:'Fixture independently accepted source checks',evidence:[{path:'synthetic',summary:'Fixture'}]};
 a.put(reader.id,'provider.json',provider('qa',true));a.put(reader.id,'result.json',{session:reader.sessionId,result:assessment});
 a.put(reader.id,'assignment-identity.json',{attemptId:reader.id,requestId:a.job.id,role:'qa'});a.put(reader.id,'capabilities.json',{name:'reader',readOnly:true});
 const entries=[[lead.id,['provider.json','result.json']],[original.id,['provider.json','assignment.json','assignment-identity.json','capabilities.json','error.json','completed-output.json']],[reader.id,['provider.json','result.json','assignment-identity.json','capabilities.json']]]as [string,string[]][];
 const proofPath=resolve(a.root,'ticket-work/job/source-validation-readback.json');
 const proof={intentId:'qa-intent',originalWorkId:original.id,originalSessionId:original.sessionId,readerId:reader.id,readerSessionId:reader.sessionId,assessment,evidenceDigests:entries.flatMap(([id,names])=>names.map(n=>artifact(a.store,resolve(a.root,'sessions',id,n)))),terminationObservations:[1,2].map(()=>({workerId:original.id,nativeSessionId:original.sessionId,processGroupId:original.processId,result:'ESRCH'}))};
 writeFileSync(proofPath,JSON.stringify(proof));
 const qa=a.job.steps[1];qa.workerId=reader.id;qa.nativeResultSha256=digest(assessment);qa.result.evidence.push({id:'qa-proof',kind:'checks',path:proofPath,commit:a.job.head,summary:'Synthetic accepted proof',environment:'unit fixture',url:'',observedAt:''});qa.result.receipts.push({id:'qa-bound',action:'validation-readback',target:original.id,verified:true,uncertain:false,detail:'Fixture'});
 a.store.state.coordination!.requests!.push({id:'qa-intent',action:'reconcile-validation',key:a.job.key,head:original.id,lane:'delivery',status:'completed',requestedAt:'2026-10-30T00:00:51Z',detail:'Synthetic prior gate'});
 return {lead,original,reader,proofPath,proof};
}
function historicalInputs(){
 const a=fixture(),source=resolve(a.job.worktree,'profile.json'),directory=resolve(a.root,'ticket-work/job/checks');writeFileSync(source,'{"claim":"unchanged"}');mkdirSync(directory);writeFileSync(resolve(directory,'verify.log'),'original verified check: exit 0');
 a.job.steps[0].result.evidence.push({id:'source-file',kind:'review',path:source,commit:a.job.head,summary:'Tracked candidate source reference',environment:'source',url:'',observedAt:''},
 {id:'memory-routing',kind:'review',path:'/synthetic/historical/MEMORY.md',commit:a.job.head,summary:'Historical routing only',environment:'historical routing, independently revalidated',url:'',observedAt:''});
 a.job.steps[2].result.evidence.push({id:'grouped-checks',kind:'checks',path:directory,commit:a.job.head,summary:'Owned grouped logs',environment:'fixture',url:'',observedAt:''},
 {id:'url-only',kind:'provider',path:'',commit:a.job.head,summary:'Historical URL',environment:'fixture',url:a.job.prUrl,observedAt:''});
 const gate=nativeGate(a);a.job.steps[2].result.evidence.push({id:'source-native-identity',kind:'provider',path:resolve(a.root,'sessions',gate.lead.id,'provider.json'),commit:a.job.head,summary:'Actual owning native identity',environment:'fixture',url:'',observedAt:''});
 return {a,source,directory,gate};
}
test('positive native gates protect actual artifact roots, tracked source, grouped logs and context-only references',async()=>{
 const {a,source}=historicalInputs();const selected=preparationReadbackCandidate(a.store,a.job)!;expect(selected).toBeDefined();expect(selected.files.some(f=>f.path===source)).toBe(true);expect(selected.gates.references).toEqual(expect.arrayContaining([expect.objectContaining({kind:'historical-routing-context'}),expect.objectContaining({kind:'owned-artifact-directory'})]));
 const stat=lstatSync(a.job.worktree);expect(selected.gates.references).toContainEqual(expect.objectContaining({kind:'candidate-directory-context',path:a.job.worktree,identity:{dev:stat.dev,ino:stat.ino}}));
 await a.reconcile();expect(a.intent.status).toBe('completed');expect(a.job.stage).toBe('lead-pr');expect(a.execute).toHaveBeenCalledWith('git',['--literal-pathspecs','ls-files','--error-unmatch','--','profile.json'],expect.objectContaining({readOnly:true}));
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.historicalReferenceProjection.some((r:any)=>r.kind==='historical-routing-context')).toBe(true);expect(proof.historicalReferenceProjection).toEqual(selected.gates.references);expect(a.run.mock.calls[0][1]).toContain('Do not dereference context-only historical references');
});
test('a file-only historical worktree reference rejects a symlinked candidate root before dispatch',async()=>{
 const {a}=historicalInputs(),prior=JSON.stringify(a.job),worktree=a.job.worktree;
 expect(a.job.steps.flatMap(s=>s.result.evidence).some(e=>e.path===worktree)).toBe(false);
 renameSync(worktree,worktree+'-saved');symlinkSync(worktree+'-saved',worktree);
 expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();
 await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(prior);expect(a.intent.status).toBe('working');
});
test('a file-only historical worktree reference fences root replacement with unchanged file bytes and inode',async()=>{
 const {a,source}=historicalInputs(),prior=JSON.stringify(a.job),worktree=a.job.worktree,rootBefore=lstatSync(worktree),fileBefore=lstatSync(source),bytesBefore=readFileSync(source,'utf8');
 expect(a.job.steps.flatMap(s=>s.result.evidence).some(e=>e.path===worktree)).toBe(false);
 expect(preparationReadbackCandidate(a.store,a.job)).toBeDefined();
 a.run.mockImplementation(async()=>{
  const result=a.readback();renameSync(worktree,worktree+'-saved');mkdirSync(worktree);
  for(const name of readdirSync(worktree+'-saved'))renameSync(resolve(worktree+'-saved',name),resolve(worktree,name));
  return result as any;
 });
 await expect(a.reconcile()).rejects.toThrow('Preparation identity, authorization, evidence or ownership changed');expect(a.run).toHaveBeenCalledTimes(1);
 expect(lstatSync(worktree).ino).not.toBe(rootBefore.ino);expect(lstatSync(source)).toMatchObject({dev:fileBefore.dev,ino:fileBefore.ino});expect(readFileSync(source,'utf8')).toBe(bytesBefore);
 expect(JSON.stringify(a.job)).toBe(prior);expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
});
test.each(['review-result','qa-proof','original-qa-artifact','source-file','directory-log','directory-parent','new-directory-file','missing-native-proof','foreign-artifact','untracked-source'])('legacy boundary remains fail closed: %s',async scenario=>{
 const {a,source,directory,gate}=historicalInputs(),prior=JSON.stringify(a.job);
 const change=()=>{
  if(scenario==='review-result')a.put(gate.lead.id,'result.json',{session:gate.lead.sessionId,result:{...a.job.steps[0].result,summary:'Changed native approval'}});
  if(scenario==='qa-proof')writeFileSync(gate.proofPath,JSON.stringify({...gate.proof,readerId:'other'}));
  if(scenario==='original-qa-artifact')a.put(gate.original.id,'error.json',{changed:true});
  if(scenario==='source-file')writeFileSync(source,'Changed');
  if(scenario==='directory-log')writeFileSync(resolve(directory,'verify.log'),'Changed');
  if(scenario==='directory-parent'){renameSync(directory,directory+'-old');mkdirSync(directory);writeFileSync(resolve(directory,'verify.log'),'original verified check: exit 0');}
  if(scenario==='new-directory-file')writeFileSync(resolve(directory,'extra.log'),'Unexpected addition');
  if(scenario==='missing-native-proof')rmSync(gate.proofPath);
  if(scenario==='foreign-artifact')a.job.steps[2].result.evidence.push({...a.job.steps[2].result.evidence[0],path:'/synthetic/foreign/required.log'});
  if(scenario==='untracked-source')a.execute.mockImplementation(async(program,args)=>program==='git'&&args[0]==='--literal-pathspecs'?'':JSON.stringify(a.issue));
 };
 if(['missing-native-proof','foreign-artifact','untracked-source'].includes(scenario))change();
 else a.run.mockImplementation(async()=>{const result=a.readback();change();return result as any;});
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');if(scenario!=='foreign-artifact')expect(JSON.stringify(a.job)).toBe(prior);
});
test('grouped artifact invalid UTF-8 byte substitutions block preparation acceptance',async()=>{
 const {a,directory}=historicalInputs(),path=resolve(directory,'binary.dat'),prior=JSON.stringify(a.job);
 writeFileSync(path,Buffer.from([0x80]));const before=artifact(a.store,path);
 expect(preparationReadbackCandidate(a.store,a.job)).toBeDefined();
 a.run.mockImplementation(async()=>{writeFileSync(path,Buffer.from([0x81]));return a.readback()as any;});
 await expect(a.reconcile()).rejects.toThrow('Preparation identity, authorization, evidence or ownership changed');
 expect(a.run).toHaveBeenCalledTimes(1);expect(artifact(a.store,path).ownership).toEqual(before.ownership);expect(readFileSync(path)).toEqual(Buffer.from([0x81]));
 expect(JSON.stringify(a.job)).toBe(prior);expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
});
test('grouped private history rejects a symlink or excess inventory before a reader',async()=>{
 const {a,directory}=historicalInputs();symlinkSync(resolve(a.root,'sessions/original/provider.json'),resolve(directory,'alias'));await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();rmSync(resolve(directory,'alias'));
 for(let i=0;i<513;i++)writeFileSync(resolve(directory,`extra-${i}.log`),'x');await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();
});
test('exact inherited receipts and canonical explicit repository are retained without relaxing unknown alias checks',async()=>{
 const a=fixture(),historic={id:'prior-push',action:'git push',target:a.job.branch,verified:true,uncertain:false,detail:'Earlier verified receipt'};a.job.steps[2].result.receipts.push(historic);a.raw.receipts.unshift({...historic,detail:'Preserved historical receipt; actual native audit still required'});a.raw.receipts[1].action=`gh pr ready ${a.job.pr} --repo ${a.store.project.repository}`;a.put('original','completed-output.json',a.raw);
 a.assessment.checkpointSha256=createHash('sha256').update(readFileSync(resolve(a.root,'sessions/original/completed-output.json'))).digest('hex');const before=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');await a.reconcile();expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(before);expect(a.job.steps.at(-1)!.result.receipts[0]).toEqual(a.raw.receipts[0]);
});
test.each(['foreign-repository','foreign-pr','extra-flags','unknown-inherited-target','reused-ready-id'])('does not infer receipt aliases from narrative: %s',scenario=>{
 const a=fixture();if(scenario==='foreign-repository')a.raw.receipts[0].action='gh pr ready 120 --repo Other/repo';if(scenario==='foreign-pr')a.raw.receipts[0].action='gh pr ready 121';if(scenario==='extra-flags')a.raw.receipts[0].action='gh pr ready 120 --repo JFusco/cms-field-vocabulary --undo';if(scenario==='unknown-inherited-target'){a.job.steps[2].result.receipts.push({id:'old',action:'git push',target:'original',verified:true,uncertain:false,detail:''});a.raw.receipts.unshift({id:'old',action:'git push',target:'different',verified:true,uncertain:false,detail:'Preserved, not replayed'});}
 if(scenario==='reused-ready-id'){a.job.steps[2].result.receipts.push({id:'old',action:'git push',target:'original',verified:true,uncertain:false,detail:''});a.raw.receipts[0].id='old';}
 a.put('original','completed-output.json',a.raw);expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();
});

function legacyAliases(){
 const a=fixture(),repository=a.store.project.repository,item='PVTI_legacy-item';
 a.board.items[0].id=item;a.job.boardUpdates=[{stage:'review',head:a.job.head,project:'PVT_fixture',item,field:'field',option:'review',target:'In review',at:'2026-10-30T00:01:00Z',status:'verified',detail:'saved verified card'}];
 const pairs=[
  {id:'board-implement',action:'project item-edit Status -> In progress',old:`JFusco project 6 item ${item} (issue 113)`,target:'JFusco project 6 issue 113'},
  {id:'comment',action:'gh issue comment',old:`${repository}#113`,target:`${repository}#113 comment 77`},
  {id:'commit',action:'git worktree add + commit',old:a.job.worktree,target:a.job.branch,oldAction:'git worktree add + commit (local only)'},
  {id:'board-review',action:'project item-edit Status -> In review',old:`JFusco project 6 item ${item}`,target:'JFusco project 6 issue 113'},
  {id:'push',action:`git push -u origin ${a.job.branch}`,old:`${repository} refs/heads/${a.job.branch}`,target:repository},
  {id:'draft',action:'gh pr create --draft',old:`${repository}#120`,target:`${repository}#120`},
  {id:'board-draft',action:'project item-edit Status -> In review',old:`JFusco project 6 item ${item} (issue 113)`,target:'JFusco project 6 issue 113'}
 ];
 for(const row of pairs){
  a.job.steps[2].result.receipts.push({id:row.id,action:row.oldAction??row.action,target:row.old,verified:true,uncertain:false,detail:'Historical description is not authority'});
  a.raw.receipts.unshift({id:row.id,action:row.action,target:row.target,verified:true,uncertain:false,detail:'Rephrased preserved description is not authority'});
 }
 a.raw.receipts.at(-1).action='gh pr ready 120 --repo JFusco/cms-field-vocabulary';
 const comment={id:77,issue_url:`https://api.github.com/repos/${repository}/issues/113`,html_url:`https://github.com/${repository}/issues/113#issuecomment-77`,body:'Original receipt',user:{login:'JFusco'},author_association:'OWNER',created_at:'2026-10-30T00:01:00Z',updated_at:'2026-10-30T00:01:00Z'};
 const base=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args)=>args[1]?.includes('issues/113/comments?')?JSON.stringify([comment]):base(program,args));
 a.put('original','completed-output.json',a.raw);
 a.assessment.checkpointSha256=artifact(a.store,resolve(a.root,'sessions/original/completed-output.json')).sha256;
 const bindings=preparationReceiptBindings(a.store,a.job,a.raw);a.assessment.receiptBindingsSha256=digest(bindings);
 return {...a,comment,bindings};
}
test('binds the seven saved receipt shapes without rewriting the original checkpoint or historical rows',async()=>{
 const a=legacyAliases(),raw=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8'),history=JSON.stringify(a.job.steps),original=JSON.stringify(a.original);
 expect(a.bindings).toHaveLength(6);expect(preparationReadbackCandidate(a.store,a.job)?.receiptBindings).toEqual(a.bindings);
 await a.reconcile();expect(a.job.stage).toBe('lead-pr');expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(JSON.stringify(a.original)).toBe(original);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(raw);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.historicalReceiptBindings).toEqual(a.bindings);expect(a.run.mock.calls[0][1]).toContain('actual originating operations for every alias');
});
test.each(['foreign-card','foreign-project','foreign-comment','unknown-action','unknown-id','duplicate-ready','missing-ready','extra-effect'])('typed historical compatibility rejects unsupported identity before reader: %s',scenario=>{
 const a=legacyAliases();
 const row=(id:string)=>a.raw.receipts.find((r:any)=>r.id===id);
 if(scenario==='foreign-card')a.job.boardUpdates![0].item='foreign';
 if(scenario==='foreign-project')row('board-review').target='JFusco project 8 issue 113';
 if(scenario==='foreign-comment')row('comment').target='JFusco/other#113 comment 77';
 if(scenario==='unknown-action')row('push').action='git push --force';
 if(scenario==='unknown-id')row('comment').id='not-in-history';
 if(scenario==='duplicate-ready')a.raw.receipts.push({...a.raw.receipts.at(-1),id:'another-ready'});
 if(scenario==='missing-ready')a.raw.receipts.pop();
 if(scenario==='extra-effect')a.raw.receipts.push({id:'new',action:'gh pr reopen',target:a.job.prUrl,verified:true,uncertain:false,detail:'Preserved'});
 a.put('original','completed-output.json',a.raw);expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();expect(a.run).not.toHaveBeenCalled();
});
test.each(['missing-comment','foreign-author','late-comment','wrong-card'])('requires exact current provider corroboration before reader: %s',async scenario=>{
 const a=legacyAliases();if(scenario==='missing-comment'){a.comment.id=78;a.comment.html_url=a.comment.html_url.replace('-77','-78');}if(scenario==='foreign-author')a.comment.user.login='Other';if(scenario==='late-comment')a.comment.created_at=a.original.startedAt;if(scenario==='wrong-card')a.board.items[0].id='other';
 await expect(a.reconcile()).rejects.toThrow('Historical');expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('prepare-pr');
});
test.each(['unverified-historical-effects','binding-digest','historical-change','comment-during-audit'])('requires positive immutable alias audit through final adoption: %s',async scenario=>{
 const a=legacyAliases(),before=structuredClone(a.job);a.run.mockImplementation(async()=>{
  if(scenario==='unverified-historical-effects')a.assessment.historicalEffectsVerified=false;
  if(scenario==='binding-digest')a.assessment.receiptBindingsSha256='wrong';
  if(scenario==='historical-change')a.job.steps[2].result.receipts[0].detail='changed historical reference';
  if(scenario==='comment-during-audit')a.comment.body='changed';return a.readback()as any;
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.intent.status).toBe('working');expect(a.job.stage).toBe('prepare-pr');expect(a.original.status).toBe('failed');expect(a.job.steps).toHaveLength(before.steps.length);
});

/** Synthetic historical Office-owned transition plus accepted native QA; never a provider write. */
function harnessBoardAlias(){
 const a=fixture(),item='PVTI_harness-card';a.board.items[0].id=item;
 const update:any={stage:'review',head:a.job.head,project:'PVT_harness',item,field:'status-field',option:'review-option',target:'In review',at:'2026-10-30T00:00:04Z',status:'verified',detail:'Historical description alone proves nothing'};
 a.job.boardUpdates=[update];
 const receipt={id:'rcpt-review-board',action:'project item-edit Status -> In review',target:`JFusco project 6 item ${item}`,verified:true,uncertain:false,detail:'Original unmodified historical receipt'};
 a.job.steps[1].result.receipts.push(receipt);a.job.steps[2].result.receipts.push({...receipt});
 a.raw.receipts.unshift({...receipt,target:'JFusco project 6 issue 113',detail:'Alias text is not authority'});
 a.put('original','completed-output.json',a.raw);a.assessment.checkpointSha256=artifact(a.store,resolve(a.root,'sessions/original/completed-output.json')).sha256;
 a.job.steps[2].result.evidence.push({id:'historical-worktree',kind:'review',path:a.job.worktree,commit:a.job.head,summary:'Context only',environment:'fixture',url:'',observedAt:''});
 const gate=nativeGate(a),observation=(at:string)=>({source:'Office read-only GitHub adapter',projectId:a.store.project.id,repository:a.store.project.repository,ticket:a.job.key,observedAt:at,board:{url:a.store.project.githubProject!.url,item:{...a.board.items[0]}},ownership:{complete:true,fresh:true,status:'clear'}});
 const proof:any=gate.proof;proof.providerObservations={before:{...observation('2026-10-30T00:01:00Z'),savedBoardReceipts:structuredClone(a.job.boardUpdates)},after:observation('2026-10-30T00:01:10Z')};writeFileSync(gate.proofPath,JSON.stringify(proof));
 const event={id:6156,at:'2026-10-30T00:00:05Z',kind:'review-board-status',role:'lead',ticket:a.job.key,message:`${a.job.key}: In review verified; Sam has claimed the candidate for review.`};
 a.store.db.prepare('INSERT INTO events(id,body) VALUES(?,?)').run(event.id,JSON.stringify(event));
 const claim={id:'historical-claim',work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},owner:'original-office-owner',stage:'review',lane:'delivery',status:'completed',claimedAt:'2026-10-30T00:00:00Z',endedAt:'2026-10-30T00:00:10Z'};
 a.store.db.prepare('INSERT INTO work_claims(id,work_key,status,body) VALUES(?,?,?,?)').run(claim.id,workKey(claim.work as any),'completed',JSON.stringify(claim));
 const live:any={data:{node:{id:item,project:{id:update.project},content:{number:113,repository:{nameWithOwner:a.store.project.repository}},fieldValues:{nodes:[{optionId:update.option,field:{id:update.field}}],pageInfo:{hasNextPage:false}}}}};
 const base=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args)=>args[0]==='api'&&args[1]==='graphql'?JSON.stringify(live):base(program,args));
 const refresh=()=>{const selected=preparationReadbackCandidate(a.store,a.job);if(selected)a.assessment.receiptBindingsSha256=digest(selected.receiptBindings);return selected;};
 refresh();return {...a,gate,proof,event,claim,live,update,refresh};
}
test('reconciles a harness-owned board alias with exact persisted event, claim, accepted QA and fresh exact readbacks',async()=>{
 const a=harnessBoardAlias(),selected=a.refresh()!,history=JSON.stringify(a.job.steps),original=JSON.stringify(a.original),raw=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8');
 expect(selected.receiptBindings[0].harnessOrigin).toMatchObject({kind:'office-harness-review-board',event:{id:6156},claim:{id:a.claim.id},update:{item:a.update.item,field:a.update.field,option:a.update.option,head:a.job.head}});
 await a.reconcile();expect(a.job).toMatchObject({status:'queued',stage:'lead-pr'});expect(a.intent.status).toBe('completed');expect(a.original.status).toBe('failed');expect(JSON.stringify(a.original)).toBe(original);expect(JSON.stringify(a.job.steps.slice(0,-1))).toBe(history);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(raw);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.historicalReceiptBindings).toEqual(selected.receiptBindings);expect(proof.harnessBoardObservations).toHaveLength(2);expect(proof.harnessBoardObservations[0]).toEqual(proof.harnessBoardObservations[1]);expect(a.run.mock.calls[0][1]).toContain('outside model native sessions');
 const providerCalls=a.execute.mock.calls.filter(c=>c[0]==='gh');expect(providerCalls.every(c=>c[1][0]!=='pr'||c[1][1]==='view')).toBe(true);expect(a.execute.mock.calls.filter(c=>c[1][1]==='graphql')).toHaveLength(2);
});
test.each(['event-missing','event-duplicate','event-role','event-message','event-id','claim-missing','claim-foreign-project','claim-foreign-job','claim-late','claim-incomplete','update-head','update-unverified','update-duplicate-time','qa-ownership','qa-card','qa-option','qa-late','qa-missing'])('rejects unsupported historical harness origin before native reader: %s',async scenario=>{
 const a=harnessBoardAlias(),prior=JSON.stringify(a.original);
 if(scenario==='event-missing')a.store.db.prepare('DELETE FROM events WHERE id=6156').run();
 if(scenario==='event-duplicate')a.store.db.prepare('INSERT INTO events(id,body) VALUES(?,?)').run(6157,JSON.stringify({...a.event,id:6157}));
 if(scenario==='event-role')a.event.role='pm';if(scenario==='event-message')a.event.message='Model says the board was moved';if(scenario==='event-id')a.event.id=999;
 if(['event-role','event-message','event-id'].includes(scenario))a.store.db.prepare('UPDATE events SET body=? WHERE id=6156').run(JSON.stringify(a.event));
 if(scenario==='claim-missing')a.store.db.prepare('DELETE FROM work_claims').run();
 if(scenario==='claim-foreign-project')a.claim.work.projectId='brain';if(scenario==='claim-foreign-job')a.claim.work.id='other';if(scenario==='claim-late')a.claim.claimedAt='2026-10-30T00:00:06Z';if(scenario==='claim-incomplete')a.claim.status='running';
 if(scenario.startsWith('claim-')&&scenario!=='claim-missing')a.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify(a.claim),a.claim.id);
 if(scenario==='update-head')a.update.head='b'.repeat(40);if(scenario==='update-unverified')a.update.status='uncertain';if(scenario==='update-duplicate-time')a.job.boardUpdates!.push({...a.update});
 if(scenario==='qa-ownership')a.proof.providerObservations.before.ownership.fresh=false;
 if(scenario==='qa-card')a.proof.providerObservations.after.board.item.id='foreign';
 if(scenario==='qa-option')a.proof.providerObservations.before.savedBoardReceipts[0].option='wrong';
 if(scenario==='qa-late')a.proof.providerObservations.after.observedAt=a.original.startedAt;
 if(scenario==='qa-missing')delete a.proof.providerObservations;
 if(scenario.startsWith('qa-'))writeFileSync(a.gate.proofPath,JSON.stringify(a.proof));
 expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.original)).toBe(prior);expect(a.intent.status).toBe('working');
});
test.each(['project','card','repository','ticket','field','option','pagination','duplicate-field','provider-error'])('fresh exact harness board identity blocks without replay: %s',async scenario=>{
 const a=harnessBoardAlias(),node=a.live.data.node;
 if(scenario==='project')node.project.id='foreign';if(scenario==='card')node.id='foreign';if(scenario==='repository')node.content.repository.nameWithOwner='Other/repo';if(scenario==='ticket')node.content.number=999;
 if(scenario==='field')node.fieldValues.nodes[0].field.id='foreign';if(scenario==='option')node.fieldValues.nodes[0].optionId='foreign';if(scenario==='pagination')node.fieldValues.pageInfo.hasNextPage=true;if(scenario==='duplicate-field')node.fieldValues.nodes.push({...node.fieldValues.nodes[0]});if(scenario==='provider-error')a.live.errors=[{message:'Denied'}];
 await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');
});
test.each(['event','claim','provider','ownership','qa-proof','extra-native-effect'])('fences harness origin and still requires full native/non-replay proof: %s',async scenario=>{
 const a=harnessBoardAlias();a.run.mockImplementation(async()=>{
  if(scenario==='event')a.store.db.prepare('DELETE FROM events WHERE id=6156').run();
  if(scenario==='claim')a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.claim.id);
  if(scenario==='provider')a.live.data.node.fieldValues.nodes[0].optionId='other';
  if(scenario==='ownership')a.ownership.mockResolvedValue({complete:true,fresh:true,ownership:{status:'owned'}});
  if(scenario==='qa-proof'){a.proof.providerObservations.before.ownership.status='owned';writeFileSync(a.gate.proofPath,JSON.stringify(a.proof));}
  if(scenario==='extra-native-effect')a.assessment.onlyReadyEffect=false;return a.readback()as any;
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
});
test('a new original-bound durable intent can consume new harness proof while preserving the negative readback',async()=>{
 const a=harnessBoardAlias();a.intent.status='blocked';a.intent.detail='Original negative historical effect audit retained';
 const negative={id:'old-reader',requestId:a.job.id,ticket:a.job.key,stage:'preparation-readback',role:'lead',provider:'codex',status:'blocked',sessionId:'negative-native',endedAt:'2026-10-30T00:04:00Z'}as any;
 a.store.state.workLog!.push(negative);a.put(negative.id,'result.json',{session:negative.sessionId,result:{outcome:'blocked',historicalEffectsVerified:false,summary:'Historical native board origin unavailable'}});
 const oldIntent=JSON.stringify(a.intent),oldWorker=JSON.stringify(negative),negativeBytes=readFileSync(resolve(a.root,'sessions',negative.id,'result.json'),'utf8');
 const next=enqueueRequest(a.store,'reconcile-preparation',a.job.key,'original');expect(next.id).not.toBe(a.intent.id);expect(next.status).toBe('queued');expect(enqueueRequest(a.store,'reconcile-preparation',a.job.key,'original').id).toBe(next.id);
 next.status='working';await reconcilePreparationReadback(a.delivery,a.job.key,'original',a.ownership,next.id);
 expect(next.status).toBe('completed');expect(JSON.stringify(a.intent)).toBe(oldIntent);expect(JSON.stringify(negative)).toBe(oldWorker);expect(readFileSync(resolve(a.root,'sessions',negative.id,'result.json'),'utf8')).toBe(negativeBytes);expect(a.original.status).toBe('failed');expect(a.job.stage).toBe('lead-pr');
});
test('a pause during the final exact board read is fenced before adopting preparation',async()=>{
 const a=harnessBoardAlias(),base=a.execute.getMockImplementation()!;let reads=0;
 a.execute.mockImplementation(async(program,args)=>{const result=await base(program,args);if(args[0]==='api'&&args[1]==='graphql'&&++reads===2)a.store.state.paused=true;return result;});
 await expect(a.reconcile()).rejects.toThrow('Preparation identity, authorization, evidence or ownership changed');expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');expect(a.original.status).toBe('failed');
});

function conflictPreparationFixture(external=false){
 const a=fixture(external);
 if(external){const path=resolve(a.job.worktree,'profile.json');writeFileSync(path,'{"claim":"approved"}');a.job.steps[0].result.evidence.push({id:'tracked-profile',kind:'review',path,commit:a.job.head,summary:'Actual external tracked source',environment:'fixture',url:'',observedAt:''});nativeGate(a);}
 const anchor=a.job.head,newHead='c'.repeat(40),target='b'.repeat(40),base='d'.repeat(40),artifactRoot=resolve(a.root,'ticket-work/job');
 const approval={plan:'none',review:'none',validation:'developer-checks',checks:['required'],reason:'Verified conflict-only integration; unchanged approved scope'}as const;
 const conflict:StageResult={...structuredClone(a.job.steps[0].result),outcome:'blocked',prId:a.job.pr,findings:[{id:'main-integration-conflict',status:'open',summary:'Conflict only',expected:'Clean',actual:'DIRTY',attempts:1}]};
 const proofPath=resolve(artifactRoot,'conflict-readback-fixture.json');writeFileSync(proofPath,JSON.stringify({kind:'verified-conflict-only',projectId:a.store.project.id,repository:a.store.project.repository,jobId:a.job.id,ticket:a.job.key,head:anchor,branch:a.job.branch,worktree:a.job.worktree,pr:a.job.pr,target:a.store.project.target,targetHead:target,base}));
 conflict.evidence.push({id:'conflict-proof',kind:'provider',path:proofPath,commit:anchor,environment:'Office conflict readback',url:'',summary:'Canonical provider proof',observedAt:''});
 const repair:StageResult={...structuredClone(a.job.steps[1].result),commit:newHead,prId:a.job.pr};repair.evidence=repair.evidence.map(e=>({...e,commit:newHead}));
 const published:StageResult={...structuredClone(repair),evidence:repair.evidence.map(e=>({...e,kind:'pr'}))};
 a.job.steps.splice(2,1,{stage:'conflict-readback',result:conflict},{stage:'update-base',result:repair},{stage:'draft',result:published});
 a.job.head=newHead;a.job.repairReason='conflicts';a.job.approach=structuredClone(approval)as any;a.job.decisions=[{stage:'update-base',role:'pm',approach:structuredClone(approval),at:'2026-10-30T00:01Z'}]as any;
 a.raw.commit=newHead;a.raw.receipts=[{id:'already-ready',action:'verify existing ready state (no mutation)',target:a.job.prUrl,verified:true,uncertain:false,detail:'This text is not proof of non-execution'}];a.put('original','completed-output.json',a.raw);
 a.assessment.commit=newHead;
 const originalClaim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'original-fixture','prepare-pr')!;a.store.finishClaim(originalClaim.id,'completed');
 const savedClaim=JSON.parse((a.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(originalClaim.id)as any).body);savedClaim.claimedAt='2026-10-30T00:01:59Z';savedClaim.endedAt='2026-10-30T00:03:01Z';a.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify(savedClaim),originalClaim.id);a.original.claimId=originalClaim.id;
 const assignmentPath=resolve(a.root,'sessions/original/assignment.json'),assignment=JSON.parse(readFileSync(assignmentPath,'utf8'));assignment.claimId=originalClaim.id;a.put('original','assignment.json',assignment);
 a.assessment.checkpointSha256=artifact(a.store,resolve(a.root,'sessions/original/completed-output.json')).sha256;
 a.pull.head.sha=newHead;a.timeline[0].created_at='2026-10-30T00:01:00Z';
 const nativeRoot=resolve(a.root,'native'),nativePath=resolve(nativeRoot,'2026/10/30/rollout-original-native.jsonl');mkdirSync(dirname(nativePath),{recursive:true});
 const nativeRecords=[{type:'session_meta',payload:{id:a.original.sessionId,cwd:a.job.worktree}},
  {type:'response_item',payload:{type:'custom_tool_call',call_id:'read',name:'exec',input:'Untrusted command body; auditor must inspect it'}},
  {type:'response_item',payload:{type:'custom_tool_call_output',call_id:'read',output:'Read-only observed result'}},
  {type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(a.raw)}}];
 writeFileSync(nativePath,nativeRecords.map(r=>JSON.stringify(r)).join('\n')+'\n');
 const realNative=checkpoints.preparationNativeCheckpoint;vi.spyOn(checkpoints,'preparationNativeCheckpoint').mockImplementation((work,result)=>realNative(work,result,nativeRoot));
 delete (a.assessment as any).onlyReadyEffect;Object.assign(a.assessment,{preparationClass:'post-conflict-zero-write',noExternalEffects:true,privateWritesOnly:true,unchangedApprovedDelta:true,approvalAnchor:anchor,nativeSessionSha256:artifact({dataRoot:nativeRoot}as any,nativePath).sha256,nativeSessionPath:nativePath,nativeRecordCount:nativeRecords.length});
 const realAssessment=checkpoints.preparationNativeAssessment;vi.spyOn(checkpoints,'preparationNativeAssessment').mockImplementation((work,worktree,result)=>realAssessment(work,worktree,result,nativeRoot));
 a.run.mockImplementation(async()=>{
  const result=a.readback(),reader=a.store.state.workLog!.at(-1)!;reader.startedAt='2026-10-30T00:04:00Z';
  const readerPath=resolve(nativeRoot,'2026/10/30/rollout-'+reader.sessionId+'.jsonl');
  const records=[{type:'session_meta',payload:{id:reader.sessionId,cwd:a.job.worktree}},{type:'response_item',payload:{type:'custom_tool_call',call_id:'audit',name:'exec',input:'Read saved original native session'}},{type:'response_item',payload:{type:'custom_tool_call_output',call_id:'audit',output:'Actual original native execution'}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(result)}}];writeFileSync(readerPath,records.map(r=>JSON.stringify(r)).join('\n')+'\n');return result as any;
 });
 const originalExecute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args)=>{
  if(program==='git'){
   if(args[0]==='remote')return 'https://github.com/'+a.store.project.repository+'.git';
   if(args[0]==='rev-parse')return a.job.head;if(args[0]==='branch')return a.job.branch;
   if(args[0]==='status'||args[0]==='merge-base')return '';
   if(args[0]==='ls-remote')return a.job.head+'\trefs/heads/'+a.job.branch;
  }
  if(program==='gh'&&args[1]?.includes('/check-runs?'))return JSON.stringify({total_count:1,check_runs:[{head_sha:a.job.head,status:'in_progress',conclusion:null}]});
  if(program==='gh'&&args[1]?.endsWith('/status'))return JSON.stringify({sha:a.job.head,total_count:0,statuses:[],state:'pending'});
  return originalExecute(program,args);
 });
 const reconcile=()=>{const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:a.intent.id},'fixture','reconcile-preparation')!;return withAssignment(claim,'delivery',()=>a.reconcile());};
 return {...a,anchor,newHead,nativePath,nativeRecords,published,reconcile,proofPath};
}
test('post-conflict zero-write checkpoint uses actual native completion and retained anchor without replaying preparation',async()=>{
 const a=conflictPreparationFixture(),raw=readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8'),original=structuredClone(a.original),source=structuredClone(a.job.steps.slice(0,2));
 expect(preparationReadbackCandidate(a.store,a.job)).toBeUndefined();expect(postConflictReadbackCandidate(a.store,a.job)?.native?.recordCount).toBe(4);
 await a.reconcile();expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',head:a.newHead,pr:120});expect(a.intent.status).toBe('completed');expect(a.original).toEqual(original);expect(a.original.status).toBe('failed');expect(a.job.steps.slice(0,2)).toEqual(source);expect(readFileSync(resolve(a.root,'sessions/original/completed-output.json'),'utf8')).toBe(raw);
 expect(a.run).toHaveBeenCalledTimes(1);expect(a.run.mock.calls[0][1]).toContain('ZERO external mutations');expect(a.run.mock.calls[0][1]).toContain('arbitrary Python/subprocess');expect(a.execute.mock.calls.every(([program,args])=>program==='git'||!args.includes('--method'))).toBe(true);
 const proof=JSON.parse(readFileSync(a.job.steps.at(-1)!.result.evidence.at(-1)!.path,'utf8'));expect(proof.postConflict).toBe(true);expect(proof.nativeCheckpoint.file.sha256).toBe((a.assessment as any).nativeSessionSha256);expect(proof.assessment.approvalAnchor).toBe(a.anchor);
});
test.each(['external-effect','private-write','approved-delta','native-hash','native-count','approval-anchor','ready-during-worker','missing-native','missing-output','tampered-terminal','uncertain-prior-effect','failed-source','mixed-source-finding','changed-head','paused','foreign-claim'])('zero-write recovery rejects %s without replay or rewriting original',async scenario=>{
 const a=conflictPreparationFixture(),prior=JSON.stringify(a.original);
 if(scenario==='external-effect')(a.assessment as any).noExternalEffects=false;
 if(scenario==='private-write')(a.assessment as any).privateWritesOnly=false;
 if(scenario==='approved-delta')(a.assessment as any).unchangedApprovedDelta=false;
 if(scenario==='native-hash')(a.assessment as any).nativeSessionSha256='0'.repeat(64);
 if(scenario==='native-count')a.assessment.nativeRecordCount++;
 if(scenario==='approval-anchor')(a.assessment as any).approvalAnchor=a.newHead;
 if(scenario==='ready-during-worker')a.timeline[0].created_at='2026-10-30T00:02:30Z';
 if(scenario==='missing-native')rmSync(a.nativePath);
 if(scenario==='missing-output'){a.nativeRecords.splice(2,1);writeFileSync(a.nativePath,a.nativeRecords.map(r=>JSON.stringify(r)).join('\n'));}
 if(scenario==='tampered-terminal'){a.nativeRecords.at(-1)!.payload.last_agent_message=JSON.stringify({...a.raw,summary:'Changed native result'});writeFileSync(a.nativePath,a.nativeRecords.map(r=>JSON.stringify(r)).join('\n'));}
 if(scenario==='uncertain-prior-effect')a.job.steps[3].result.receipts.push({id:'unknown',action:'write',target:'provider',verified:false,uncertain:true,detail:''});
 if(scenario==='failed-source')a.job.steps[0].result.outcome='blocked';
 if(scenario==='mixed-source-finding')a.job.steps[2].result.findings.push({id:'unrelated-source',status:'open',summary:'Source bug',expected:'Fixed',actual:'Bug',attempts:1});
 if(scenario==='changed-head')a.pull.head.sha='f'.repeat(40);
 if(scenario==='paused')a.store.state.paused=true;
 if(scenario==='foreign-claim')a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'foreign','prepare-pr');
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.stage).toBe('prepare-pr');expect(a.intent.status).toBe('working');expect(JSON.stringify(a.original)).toBe(prior);
});
test('verified already-ready conflict publication directly queues current-head Lead readiness without a metadata worker',async()=>{
 const a=conflictPreparationFixture();a.job.stage='draft';a.job.status='working';a.store.state.workLog=[];const old=JSON.stringify(a.job.steps.slice(0,2));
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'fixture','draft')!;
 expect(await withAssignment(claim,'delivery',()=>routeReadyPostConflictPublication(a.delivery,a.job,a.published))).toBe(true);
 expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',head:a.newHead});expect(JSON.stringify(a.job.steps.slice(0,2))).toBe(old);expect(a.run).not.toHaveBeenCalled();expect(a.job.detail).toContain('no metadata writer');
});
test.each(['draft','changed-head','missing-source','uncertain-receipt','provider-change'])('post-conflict publication retains gates for %s',async scenario=>{
 const a=conflictPreparationFixture();a.job.stage='draft';a.job.status='working';a.store.state.workLog=[];
 if(scenario==='draft')a.pull.draft=true;if(scenario==='changed-head')a.pull.head.sha='e'.repeat(40);if(scenario==='missing-source')a.job.steps[0].result.outcome='blocked';
 if(scenario==='uncertain-receipt')a.job.steps[4].result.receipts.push({id:'uncertain',action:'push',target:a.job.branch,verified:false,uncertain:true,detail:''});
 if(scenario==='provider-change'){let calls=0;const original=a.delivery.api.bind(a.delivery);vi.spyOn(a.delivery,'api').mockImplementation(async path=>{const value=await original(path);if(path.includes('issues/120/timeline')&&++calls===1)a.pull.title='Changed scope';return value;});}
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'fixture','draft')!;
 const next=withAssignment(claim,'delivery',()=>routeReadyPostConflictPublication(a.delivery,a.job,a.published));
 if(scenario==='draft')expect(await next).toBe(false);else await expect(next).rejects.toThrow();expect(a.job.stage).toBe('draft');expect(a.run).not.toHaveBeenCalled();
});
test('IT durably admits one exact original post-conflict readback without dispatching a model',async()=>{
 const a=conflictPreparationFixture();a.store.state.coordination!.requests=[];const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 await it.tick(new Date('2026-10-30T01:00Z'),true);expect(a.store.state.coordination!.requests).toEqual([expect.objectContaining({action:'reconcile-preparation',head:'original',status:'queued'})]);
 await it.tick(new Date('2026-10-30T01:01Z'),true);expect(a.store.state.coordination!.requests).toHaveLength(1);expect(a.run).not.toHaveBeenCalled();
});
test('IT records legacy recovery and finishes its tick when conflict proof is missing',async()=>{
 const a=conflictPreparationFixture();a.job.status='blocked';a.job.detail='Saved legacy preparation';a.store.state.coordination!.requests=[];
 rmSync(resolve(a.root,'ticket-work/job/conflict-readback-fixture.json'));
 expect(()=>postConflictPreparationEvidence(a.store,a.job)).toThrow();
 const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any),now=new Date('2026-10-30T01:00Z');
 await expect(it.tick(now,true)).resolves.toBeUndefined();
 expect(a.store.state.it!.checkedAt).toBe(now.toISOString());
 const request=a.store.state.coordination!.requests![0];expect(a.store.state.coordination!.requests).toHaveLength(1);expect(request).toMatchObject({action:'reconcile-preparation',key:a.job.key,head:'',status:'queued'});
 expect(a.store.state.it!.recoveries['pr-preparation:job']).toMatchObject({attempts:1,status:'retrying',requestId:request.id});
 expect(a.job).toMatchObject({stage:'prepare-pr',status:'blocked'});expect(a.original.status).toBe('failed');expect(a.run).not.toHaveBeenCalled();
});
test.each(['blocked','interrupted']as const)('IT preserves the post-conflict %s retry budget across pause, drain and a running reader',async status=>{
 const a=conflictPreparationFixture();a.job.status=status;a.store.state.coordination!.requests=[];const requests=a.store.state.coordination!.requests;
 const it=new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 let now=Date.parse('2026-10-30T01:00Z');
 const tick=async(at=now+1000)=>{now=at;await it.tick(new Date(now),true);expect(requests.every(r=>r.action!=='reconcile-preparation'||r.head==='original')).toBe(true);};
 await tick(now);expect(requests).toEqual([expect.objectContaining({action:'reconcile-preparation',key:a.job.key,head:'original',status:'queued'})]);
 const recovery=a.store.state.it!.recoveries['post-conflict-preparation:job:original'];
 const waitThroughIneligibility=async()=>{
  const saved=structuredClone(recovery),count=requests.length;
  a.store.state.paused=true;await tick();expect(recovery).toEqual(saved);a.store.state.paused=false;
  a.store.state.draining=true;await tick();expect(recovery).toEqual(saved);a.store.state.draining=false;
  a.store.state.workLog!.push({...a.original,id:'running-reader',stage:'preparation-readback',status:'running'});
  expect(postConflictReadbackCandidate(a.store,a.job)).toBeUndefined();
  await tick();expect(recovery).toEqual(saved);a.store.state.workLog!.pop();
  expect(requests).toHaveLength(count);
 };
 for(let attempt=1;attempt<=3;attempt++){
  const request=requests.at(-1)!;expect(recovery).toMatchObject({attempts:attempt,status:'retrying',requestId:request.id});request.status='blocked';
  await waitThroughIneligibility();
  if(attempt<3){
   const nextAt=Date.parse(recovery.nextAt);await tick(nextAt-1);expect(recovery.attempts).toBe(attempt);expect(requests).toHaveLength(attempt);
   await tick(nextAt);expect(requests).toHaveLength(attempt+1);
  }
 }
 await tick();expect(recovery).toMatchObject({attempts:3,status:'needs-human'});expect(requests).toHaveLength(3);
 await waitThroughIneligibility();await tick();expect(recovery).toMatchObject({attempts:3,status:'needs-human'});expect(requests).toHaveLength(3);
 a.job.stage='lead-pr';a.job.status='queued';await tick();expect(recovery).toMatchObject({attempts:3,status:'resolved',nextAt:''});
 expect(a.run).not.toHaveBeenCalled();
});

test('actual draft stage publishes same ready PR then skips the preparation writer after conflict-only repair',async()=>{
 const a=conflictPreparationFixture();a.job.stage='draft';a.job.status='queued';a.store.state.workLog=[];a.job.steps.pop();
 a.store.state.tickets.push({key:a.job.key,summary:'Conflict fixture',url:a.issue.html_url,status:'open',stage:'review',activity:'waiting',results:{},findings:[],evidence:[],attempt:0,prId:a.job.pr}as any);
 a.run.mockImplementation(async role=>{expect(role).toBe('developer');return structuredClone(a.published)as any;});
 const originalExecute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args)=>args[1]?.includes('issues/113/comments?')&&args.includes('--slurp')?JSON.stringify([[{body:'Office delivery '+a.job.id}]]):originalExecute(program,args));
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'fixture','draft')!;
 await withAssignment(claim,'delivery',()=>a.delivery.step(a.job));
 expect(a.job.status,a.job.detail).toBe('queued');expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',pr:120,head:a.newHead});expect(a.run).toHaveBeenCalledTimes(1);expect(a.store.state.workLog).toHaveLength(0);expect(a.job.steps.filter(s=>s.stage==='review')).toHaveLength(1);expect(a.job.steps.filter(s=>s.stage==='validate')).toHaveLength(1);expect(a.job.detail).toContain('no metadata writer');
});

test.each([true,false])('empty diagnostic locator is context only when retained in bound actual native source review: %s',bound=>{
 const a=fixture(),context={id:'tool-diagnostic',kind:'provider' as const,path:'',url:'',commit:a.job.head,summary:'Original read failure was recovered; no source acceptance or current provider proof',environment:'Native tool diagnostics',observedAt:''};
 if(bound)a.job.steps[0].result.evidence.push(context);nativeGate(a);if(!bound)a.job.steps[0].result.evidence.push(context);
 const candidate=preparationReadbackCandidate(a.store,a.job);
 if(bound)expect(candidate?.gates.references).toContainEqual(expect.objectContaining({id:context.id,kind:'native-review-diagnostic-context'}));else expect(candidate).toBeUndefined();
});

// Static actual20-row113 shape:19 paraphrased historical IDs and one new GET observation.
// Canonical fixture history stays separate; neither alias action nor target becomes authority.
const inheritedReceiptShape=[{"id":"rcpt-board-move","action":"project Status -> In progress","target":"issue 113","verified":true,"uncertain":false,"detail":"Prior implementation receipt preserved; not replayed."},{"id":"rcpt-issue-comment","action":"gh issue comment","target":"issue 113 comment 6512097160","verified":true,"uncertain":false,"detail":"Prior receipt preserved; comment read live."},{"id":"rcpt-local-commit","action":"git worktree add + commit","target":"codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Prior implementation receipt preserved; no new commit."},{"id":"rcpt-review-board","action":"project Status -> In review","target":"issue 113","verified":true,"uncertain":false,"detail":"Prior review receipt and recorded drift preserved; not replayed."},{"id":"rcpt-push","action":"git push","target":"codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Prior 3368fe2 push receipt preserved; not replayed."},{"id":"rcpt-draft-pr","action":"gh pr create --draft","target":"PR 118","verified":true,"uncertain":false,"detail":"Prior receipt preserved; same PR, no duplicate."},{"id":"rcpt-board-in-review","action":"project Status -> In review","target":"issue 113","verified":true,"uncertain":false,"detail":"Prior draft receipt preserved; not replayed."},{"id":"45d708c2-0311-47dc-9416-c632901a57a2","action":"implementation-readback","target":"24e82f12-5b2d-49de-a624-445ef6ac6a8f","verified":true,"uncertain":false,"detail":"Prior verified reconciliation preserved."},{"id":"99b4cd7a-072a-43d3-a631-c7a21e5a6776","action":"validation-readback","target":"3010f9f7-9f98-4957-8a03-3b2f7afc0d2a","verified":true,"uncertain":false,"detail":"Prior verified reconciliation preserved; original transport failure retained."},{"id":"36a17344-8fb4-4838-9f49-1d5029f91370","action":"preparation-readback","target":"a178f618-8729-4f4f-9889-d3a6a5f40511","verified":true,"uncertain":false,"detail":"Prior verified reconciliation preserved; original preparation failure retained."},{"id":"rcpt-ub-board-issue","action":"project Status -> In progress","target":"issue 113","verified":true,"uncertain":false,"detail":"Prior update-base receipt preserved."},{"id":"rcpt-ub-board-pr","action":"project Status -> In progress","target":"PR 118","verified":true,"uncertain":false,"detail":"Prior update-base receipt preserved."},{"id":"rcpt-ub-comment","action":"gh issue comment","target":"issue 113 comment 6531577976","verified":true,"uncertain":false,"detail":"Prior receipt preserved; comment read live."},{"id":"rcpt-ub-merge-commit","action":"git merge origin/main + commit","target":"codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Prior local merge receipt preserved; HEAD b3739703."},{"id":"rcpt-d2-push","action":"git push origin codex/113-cms12-string-wording","target":"refs/heads/codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Prior single normal push receipt preserved; live head b3739703."},{"id":"rcpt-d2-pr-body","action":"gh pr edit 118 --body-file","target":"PR 118","verified":true,"uncertain":false,"detail":"Prior verified body edit receipt preserved; not replayed."},{"id":"rcpt-d2-board-issue","action":"project Status -> In review","target":"issue 113","verified":true,"uncertain":false,"detail":"Prior verified In review receipt preserved; not replayed."},{"id":"rcpt-d2-board-pr","action":"project Status -> In review","target":"PR 118","verified":true,"uncertain":false,"detail":"Prior verified In review receipt preserved; not replayed."},{"id":"rcpt-ready-for-review","action":"gh pr ready 118 --repo JFusco/cms-field-vocabulary","target":"https://github.com/JFusco/cms-field-vocabulary/pull/118","verified":true,"uncertain":false,"detail":"Ready transition attempted once; read back OPEN, draft=false, base=main, exact head unchanged. No merge, retarget, reopen or branch mutation. Preserved originating receipt; live ready state verified on b3739703, transition not replayed."},{"id":"rcpt-ready-state-b3739703","action":"verify existing ready-for-review state (GET only)","target":"https://github.com/JFusco/cms-field-vocabulary/pull/118","verified":true,"uncertain":false,"detail":"Already open and ready; final GET verifies main base, exact head, mergeable=true, merged=false, auto_merge=null. No external mutations attempted in this stage."}];
const canonicalReceiptOrigins=[{"id":"rcpt-board-move","action":"project item-edit Status -> In progress","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEoGy8 (issue 113)","verified":true,"uncertain":false,"detail":"Exit 0; read-back shows status 'In progress' (was Backlog)."},{"id":"rcpt-issue-comment","action":"gh issue comment","target":"JFusco/cms-field-vocabulary#113","verified":true,"uncertain":false,"detail":"Comment 6512097160 created and read back via API."},{"id":"rcpt-local-commit","action":"git worktree add + commit (local only)","target":"/Users/joe.fusco/Projects/cms-field-vocabulary-worktrees/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Branch codex/113-cms12-string-wording from origin/main 043311a; HEAD 3368fe208dfe7410dd3eb415137c151a43bb80db; not pushed."},{"id":"rcpt-review-board","action":"project item-edit Status -> In review","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEoGy8","verified":true,"uncertain":false,"detail":"Preserved Office review-stage verified board update; this QA stage made no external mutations."},{"id":"rcpt-push","action":"git push -u origin codex/113-cms12-string-wording","target":"JFusco/cms-field-vocabulary refs/heads/codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Exit 0; ls-remote reads back 3368fe208dfe7410dd3eb415137c151a43bb80db."},{"id":"rcpt-draft-pr","action":"gh pr create --draft","target":"JFusco/cms-field-vocabulary#118","verified":true,"uncertain":false,"detail":"Created once after confirming zero existing PRs. Read back as draft, base main, head 3368fe2, closes #113; the saved body passes lint:pr."},{"id":"rcpt-board-in-review","action":"project item-edit Status -> In review","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEoGy8 (issue 113)","verified":true,"uncertain":false,"detail":"Exit 0. Read back Status 'In review' (optionId df73e18b); it was 'In progress' before. Not marked Done."},{"id":"45d708c2-0311-47dc-9416-c632901a57a2","action":"implementation-readback","target":"24e82f12-5b2d-49de-a624-445ef6ac6a8f","verified":true,"uncertain":false,"detail":"{\"outcome\":\"passed\",\"originalWorkId\":\"24e82f12-5b2d-49de-a624-445ef6ac6a8f\",\"verifiedNoEffects\":true,\"summary\":\"Verified the exact clean, isolated candidate at 3368fe208dfe7410dd3eb415137c151a43bb80db for adoption into independent review and QA only. Its parent matches current remote main. Prior receipts are reconciled; no conflicting implementation owner or PR was found. Preserve cms12-string-wording, open locator-registry-addition, every GH-100 source hold, Sam\u2019s review, Riley\u2019s verification, and required checks. No source acceptance or new effects occurred.\",\"evidence\":[{\"path\":\"/Users/joe.fusco/Projects/the-office/.local/projects/cms-field-vocabulary/sessions/24e82f12-5b2d-49de-a624-445ef6ac6a8f/result.json\",\"summary\":\"Saved provider result matches candidate, finding and receipts.\"},{\"path\":\"/Users/joe.fusco/.claude/projects/-Users-joe-fusco-Projects-cms-field-vocabulary/24e82f12-5b2d-49de-a624-445ef6ac6a8f.jsonl\",\"summary\":\"Native calls have corresponding results; confirms commit and successful checks. Preserves pre-execution Write rejection and failed first validation.\"},{\"path\":\"/Users/joe.fusco/Projects/cms-field-vocabulary-worktrees/113-cms12-string-wording\",\"summary\":\"Origin, branch, HEAD, clean status and bounded diff verified; source lock unchanged.\"},{\"path\":\"/Users/joe.fusco/Projects/the-office/.local/projects/cms-field-vocabulary/ticket-work/1e0b7a81-66a9-4537-8518-064f2816dd34\",\"summary\":\"Saved logs confirm 86 passing tests, packed consumer and pack dry-run; initial failures retained.\"},{\"path\":\"https://github.com/JFusco/cms-field-vocabulary/issues/113\",\"summary\":\"Live issue, comment 6512097160 and project card reconcile receipts. Remote inventory shows no candidate branch or PR; candidate Actions count is zero.\"},{\"path\":\"/Users/joe.fusco/.codex/sessions/2026/10/30/rollout-2026-10-30T02-49-10-01a18b91-ca73-7610-a5cf-7c809beec1f5.jsonl\",\"summary\":\"Bridge ownership match is this recovery\u2019s completed Guardian review, not a competing implementation worker.\"}]}"},{"id":"99b4cd7a-072a-43d3-a631-c7a21e5a6776","action":"validation-readback","target":"3010f9f7-9f98-4957-8a03-3b2f7afc0d2a","verified":true,"uncertain":false,"detail":"Riley ef0566be-0d4f-4c94-9da0-178ae9059b15; native session 01a18c47-a83b-7ab1-8c8b-69009e9e80f9; checkpoint 93a9cb4225b5810c74f3156aea6589e3bb01ba87afa515bb552bf9c421b487f9; proof /Users/joe.fusco/Projects/the-office/.local/projects/cms-field-vocabulary/ticket-work/1e0b7a81-66a9-4537-8518-064f2816dd34/99b4cd7a-072a-43d3-a631-c7a21e5a6776-validation-readback.json"},{"id":"36a17344-8fb4-4838-9f49-1d5029f91370","action":"preparation-readback","target":"a178f618-8729-4f4f-9889-d3a6a5f40511","verified":true,"uncertain":false,"detail":"Sam 77071a84-bf54-41df-9227-79ed18e12145; native session 01a18e31-82e5-7590-b147-a85db87ca835; checkpoint 9cc707d342c763f6a55ea833d33fee1803d8302710a95bb0f64a49b6a46b0b14; proof /Users/joe.fusco/Projects/the-office/.local/projects/cms-field-vocabulary/ticket-work/1e0b7a81-66a9-4537-8518-064f2816dd34/36a17344-8fb4-4838-9f49-1d5029f91370-preparation-readback.json"},{"id":"rcpt-ub-board-issue","action":"project item-edit Status -> In progress","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEoGy8 (issue 113)","verified":true,"uncertain":false,"detail":"Exit 0; read back as In progress (was In review)."},{"id":"rcpt-ub-board-pr","action":"project item-edit Status -> In progress","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEvBxo (PR 118)","verified":true,"uncertain":false,"detail":"Exit 0; read back as In progress (was In review)."},{"id":"rcpt-ub-comment","action":"gh issue comment","target":"JFusco/cms-field-vocabulary#113 comment 6531577976","verified":true,"uncertain":false,"detail":"Created once and read back via the API; gives the reason and next owner."},{"id":"rcpt-ub-merge-commit","action":"git merge origin/main + commit (local only)","target":"codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"HEAD b3739703f4c85ed653ef79303d1859cace224329, parents 3368fe2 and 685f45a; not pushed, with no force or reset."},{"id":"rcpt-d2-push","action":"git push origin codex/113-cms12-string-wording (normal, once)","target":"JFusco/cms-field-vocabulary refs/heads/codex/113-cms12-string-wording","verified":true,"uncertain":false,"detail":"Exit 0, fast-forward 3368fe2..b373970, with no force push. ls-remote and the PR API read back b3739703f4c85ed653ef79303d1859cace224329."},{"id":"rcpt-d2-pr-body","action":"gh pr edit 118 --body-file","target":"JFusco/cms-field-vocabulary#118","verified":true,"uncertain":false,"detail":"Exit 0, run once. Read back: body matches, lint:pr passes, still OPEN and not draft, same head branch, base main, closes #113."},{"id":"rcpt-d2-board-issue","action":"project item-edit Status -> In review","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEoGy8 (issue 113)","verified":true,"uncertain":false,"detail":"Exit 0; was In progress, read back In review (df73e18b)."},{"id":"rcpt-d2-board-pr","action":"project item-edit Status -> In review","target":"JFusco project 6 item PVTI_lAHOAAdqoc4BpHxozhEvBxo (PR 118)","verified":true,"uncertain":false,"detail":"Exit 0; was In progress, read back In review (df73e18b)."},{"id":"rcpt-ready-for-review","action":"gh pr ready 118 --repo JFusco/cms-field-vocabulary","target":"https://github.com/JFusco/cms-field-vocabulary/pull/118","verified":true,"uncertain":false,"detail":"Attempted once, exit 0; GET verified open, draft=false, main base, exact head unchanged. No retarget, reopen, branch mutation or merge."}];
function inheritedConflictFixture(){
 const a=conflictPreparationFixture();
 a.job.steps[4].result.receipts.push(...structuredClone(canonicalReceiptOrigins));
 a.raw.receipts=structuredClone(inheritedReceiptShape);a.raw.receipts.at(-1)!.target=a.job.prUrl;
 const save=()=>{
  const checkpoint={...a.raw}as any;delete checkpoint.prerequisites;delete checkpoint.previewUrl;delete checkpoint.qaRunDir;
  a.put('original','completed-output.json',checkpoint);
  a.nativeRecords.at(-1)!.payload.last_agent_message=JSON.stringify({...checkpoint,prerequisites:null,previewUrl:'',qaRunDir:''});
  writeFileSync(a.nativePath,a.nativeRecords.map(r=>JSON.stringify(r)).join('\n')+'\n');
  a.assessment.checkpointSha256=artifact(a.store,resolve(a.root,'sessions/original/completed-output.json')).sha256;
  (a.assessment as any).nativeSessionSha256=createHash('sha256').update(readFileSync(a.nativePath)).digest('hex');
 };
 save();return {...a,save};
}
test('actual inherited20 receipt shape remains untrusted context after full zero-write audit without promoting aliases',async()=>{
 const a=inheritedConflictFixture(),path=resolve(a.root,'sessions/original/completed-output.json'),raw=readFileSync(path,'utf8'),original=structuredClone(a.original);
 const selected=postConflictReadbackCandidate(a.store,a.job)!;expect(selected.native?.callCount).toBe(1);expect(selected.receiptContext?.historical).toHaveLength(19);
 expect(selected.receiptContext?.historical[0].target).toBe('issue 113');expect(a.job.steps[4].result.receipts.find(r=>r.id==='rcpt-board-move')?.target).not.toBe('issue 113');
 await a.reconcile();expect(a.job).toMatchObject({stage:'lead-pr',status:'queued'});expect(a.original).toEqual(original);expect(readFileSync(path,'utf8')).toBe(raw);
 const step=a.job.steps.at(-1)!,proof=JSON.parse(readFileSync(step.result.evidence.at(-1)!.path,'utf8'));
 expect(step.result.receipts).toEqual([expect.objectContaining({action:'preparation-readback',target:'original',verified:true,uncertain:false})]);
 expect(proof.untrustedReceiptContext.classification).toBe('untrusted-historical-receipt-context');expect(proof.untrustedReceiptContext.historical).toEqual(selected.receiptContext!.historical);
 expect(a.run.mock.calls[0][1]).toContain('Known IDs do not prove originating operations');expect(a.run.mock.calls[0][1]).toContain('ZERO external mutations');
});
test.each(['unknown-id','duplicate','uncertain','observation-target','observation-action','removed-origin'])('inherited context rejects %s without alias authority or replay',scenario=>{
 const a=inheritedConflictFixture();
 if(scenario==='unknown-id')a.raw.receipts[0].id='unknown-history';
 if(scenario==='duplicate')a.raw.receipts.push({...a.raw.receipts[0]});
 if(scenario==='uncertain')a.raw.receipts[0].uncertain=true;
 if(scenario==='observation-target')a.raw.receipts.at(-1)!.target='https://github.com/foreign/repo/pull/120';
 if(scenario==='observation-action')a.raw.receipts.at(-1)!.action='gh pr ready';
 if(scenario==='removed-origin')a.job.steps[4].result.receipts=a.job.steps[4].result.receipts.filter(r=>r.id!==a.raw.receipts[0].id);
 a.save();expect(postConflictReadbackCandidate(a.store,a.job)).toBeUndefined();expect(a.run).not.toHaveBeenCalled();expect(a.original.status).toBe('failed');expect(a.job.stage).toBe('prepare-pr');
});

function completedDraftFixture(){
 const a=conflictPreparationFixture(true);mockHome.path=a.root;a.job.stage='draft';a.job.status='blocked';a.job.detail='Error: Owned validation path required';
 const originalClaim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'original-scheduler','draft')!;a.store.finishClaim(originalClaim.id,'completed');
 const original:any={id:'published-draft',sessionId:'published-draft',claimId:originalClaim.id,requestId:a.job.id,ticket:a.job.key,role:'developer',provider:'claude',stage:'github-draft',lane:'delivery',status:'completed',executionStatus:'completed',processId:2147483600,startedAt:'2026-10-30T00:05:00Z',endedAt:'2026-10-30T00:06:00Z'};
 const savedClaim=JSON.parse((a.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(originalClaim.id)as any).body);savedClaim.claimedAt='2026-10-30T00:04:59Z';savedClaim.endedAt='2026-10-30T00:06:01Z';a.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify(savedClaim),originalClaim.id);
 const result=structuredClone(a.published);result.receipts=[{id:'published-push',action:'git push origin (normal, no force)',target:'refs/heads/'+a.job.branch,verified:true,uncertain:false,detail:'Original exact publication retained'}];a.job.steps.at(-1)!.result=result;a.store.state.workLog!.push(original);
 a.put(original.id,'provider.json',{project:a.store.project.id,repository:a.store.project.repository,role:'developer',provider:'claude',readOnly:false,session:original.sessionId});a.put(original.id,'result.json',{session:original.sessionId,result});
 a.put(original.id,'assignment.json',{id:original.id,claimId:original.claimId,role:original.role,stage:original.stage,lane:'delivery',work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},scope:{repository:a.store.project.repository,worktree:a.job.worktree,artifacts:resolve(a.root,'sessions',original.id)},profile:'github-native'});
 a.put(original.id,'assignment-identity.json',{attemptId:original.id,requestId:a.job.id,projectId:a.store.project.id,repository:a.store.project.repository,role:'developer',threadId:original.sessionId});a.put(original.id,'capabilities.json',{name:'github-native',readOnly:false,cutover:'native'});
 a.put(original.id,'execution-completion.json',{workerId:original.id,session:original.sessionId,provider:original.provider,resultSha256:artifact(a.store,resolve(a.root,'sessions',original.id,'result.json')).sha256});
 a.put(original.id,'provider-completion.json',{expectedSession:original.sessionId,result:{type:'result',session_id:original.sessionId,subtype:'success',terminal_reason:'completed',is_error:false,structured_output:result}});
 const nativePath=resolve(a.root,'.claude/projects',a.job.worktree.replace(/[^a-zA-Z0-9-]/g,'-'),original.sessionId+'.jsonl');mkdirSync(dirname(nativePath),{recursive:true});
 const records=[{sessionId:original.sessionId,cwd:a.job.worktree,message:{content:[{type:'tool_use',id:'push',name:'Bash',input:{command:'git push origin '+a.job.branch}},{type:'tool_use',id:'final',name:'StructuredOutput',input:result}]}},{sessionId:original.sessionId,cwd:a.job.worktree,message:{content:[{type:'tool_result',tool_use_id:'push',content:'Exact pushed head'},{type:'tool_result',tool_use_id:'final',content:'Recorded'}]}}];writeFileSync(nativePath,records.map(x=>JSON.stringify(x)).join('\n')+'\n');
 a.store.state.coordination!.requests=a.store.state.coordination!.requests!.filter(r=>r.id==='qa-intent');
 const request=()=>enqueueRequest(a.store,'reconcile-preparation',a.job.key,original.id);
 const reconcile=async(r:ReturnType<typeof request>)=>{const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:r.id},'new-scheduler','reconcile-preparation')!;r.status='working';try{return await withAssignment(claim,'delivery',()=>reconcileCompletedConflictDraft(a.delivery,a.job.key,original.id,a.ownership,r.id));}finally{a.store.finishClaim(claim.id,'completed');}};
 const it=()=>new ITSpecialist({entries:new Map([[a.store.project.id,{store:a.store,engine:a.engine}]])}as any,{report:async()=>({services:[]})}as any);
 return {...a,draft:original,draftResult:result,draftNativePath:nativePath,request,reconcileDraft:reconcile,it,select:()=>completedConflictDraftCandidate(a.store,a.job)};
}
test('mixed private artifacts and real external tracked source reach Lead from an already-ready conflict draft',async()=>{
 const a=conflictPreparationFixture(true);a.job.stage='draft';a.job.status='working';const before=JSON.stringify(a.job.steps);const claim=a.store.claimWork({projectId:a.store.project.id,kind:'delivery',id:a.job.id},'fixture','draft')!;
 expect(postConflictPreparationEvidence(a.store,a.job)!.gates.trackedSources).toContain('profile.json');
 expect(await withAssignment(claim,'delivery',()=>routeReadyPostConflictPublication(a.delivery,a.job,a.published))).toBe(true);expect(a.job.stage).toBe('lead-pr');expect(JSON.stringify(a.job.steps)).toBe(before);expect(a.run).not.toHaveBeenCalled();
});
test('exact completed draft recovers durably once after IT restart without model or mutation replay',async()=>{
 const a=completedDraftFixture(),workLog=JSON.stringify(a.store.state.workLog),steps=JSON.stringify(a.job.steps),worker=JSON.stringify(a.draft),raw=readFileSync(resolve(a.root,'sessions',a.draft.id,'result.json'),'utf8'),native=readFileSync(a.draftNativePath,'utf8');expect(a.select()?.work.id).toBe(a.draft.id);
 await a.it().tick(new Date('2026-10-30T01:00Z'),true);const request=a.store.state.coordination!.requests!.find(r=>r.head===a.draft.id)!;expect(request.action).toBe('reconcile-preparation');await a.it().tick(new Date('2026-10-30T01:01Z'),true);expect(a.store.state.coordination!.requests!.filter(r=>r.head===a.draft.id)).toHaveLength(1);
 await a.reconcileDraft(request);expect(request.status).toBe('completed');expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',head:a.newHead});expect(JSON.stringify(a.store.state.workLog)).toBe(workLog);expect(JSON.stringify(a.job.steps)).toBe(steps);expect(JSON.stringify(a.draft)).toBe(worker);expect(readFileSync(resolve(a.root,'sessions',a.draft.id,'result.json'),'utf8')).toBe(raw);expect(readFileSync(a.draftNativePath,'utf8')).toBe(native);expect(a.request().id).toBe(request.id);expect(a.run).not.toHaveBeenCalled();expect(a.execute.mock.calls.every(([program,args]:any)=>program==='git'||!args.includes('--method'))).toBe(true);
});
test.each(['native','native-pair','claim','capabilities','result','active-worker','source-symlink','worktree-symlink','uncertain','unknown-effect','head'])('completed conflict draft refuses changed %s before any provider or model read',async kind=>{
 const a=completedDraftFixture();
 if(kind==='native')writeFileSync(a.draftNativePath,'{}\n');if(kind==='native-pair'){const rows=readFileSync(a.draftNativePath,'utf8').trim().split('\n').map(x=>JSON.parse(x));rows[1].message.content.pop();writeFileSync(a.draftNativePath,rows.map(x=>JSON.stringify(x)).join('\n')+'\n');}
 if(kind==='claim')a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.draft.claimId);
 if(kind==='capabilities')a.put(a.draft.id,'capabilities.json',{name:'reader',readOnly:true});if(kind==='result')a.put(a.draft.id,'result.json',{session:a.draft.sessionId,result:{...a.draftResult,commit:'f'.repeat(40)}});
 if(kind==='active-worker')a.draft.status='running';if(kind==='source')writeFileSync(resolve(a.job.worktree,'profile.json'),'changed');
 if(kind==='source-symlink'){const path=resolve(a.job.worktree,'profile.json');rmSync(path);symlinkSync(resolve(a.root,'ticket-work/job/provider.json'),path);}
 if(kind==='worktree-symlink'){const moved=a.job.worktree+'-retained';renameSync(a.job.worktree,moved);roots.push(moved);symlinkSync(moved,a.job.worktree);}
 if(kind==='uncertain')a.job.steps.at(-1)!.result.receipts[0].uncertain=true;if(kind==='unknown-effect')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unknown',workKey({projectId:a.store.project.id,kind:'delivery',id:a.job.id}),'uncertain',JSON.stringify({status:'uncertain'}));if(kind==='head')a.job.head='f'.repeat(40);
 expect(a.select()).toBeUndefined();await expect(a.reconcileDraft(a.request())).rejects.toThrow('Exact completed');expect(a.run).not.toHaveBeenCalled();expect(a.delivery.execute).not.toHaveBeenCalled();expect(a.job.stage).toBe('draft');
});
test.each(['pause','claim','foreign-claim','ownership','native','source','foreign','untracked','head','effects','verified-effect'])('completed draft readback fences %s changes before atomic handoff',async kind=>{
 const a=completedDraftFixture(),base=a.execute.getMockImplementation()!;let changed=false;if(kind==='verified-effect')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('verified',workKey({projectId:a.store.project.id,kind:'delivery',id:a.job.id}),'verified',JSON.stringify({status:'verified',head:a.job.head}));
 a.execute.mockImplementation(async(program,args)=>{const output=await base(program,args);if(!changed){changed=true;if(kind==='pause')a.store.state.paused=true;if(kind==='claim'){const claim=a.store.activeClaims()[0];a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(claim.id);}if(kind==='foreign-claim'){const claim=a.store.activeClaims()[0];a.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify({...claim,owner:'foreign'}),claim.id);}if(kind==='verified-effect')a.store.db.prepare('UPDATE effects SET body=? WHERE id=?').run(JSON.stringify({status:'verified',head:a.job.head,changedReceipt:true}),'verified');if(kind==='ownership')a.ownership.mockResolvedValue({complete:true,fresh:false,ownership:{status:'clear'}});if(kind==='native')writeFileSync(a.draftNativePath,'{}\n');if(kind==='source')writeFileSync(resolve(a.job.worktree,'profile.json'),'changed');if(kind==='head')a.pull.head.sha='f'.repeat(40);if(kind==='effects')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unknown',workKey({projectId:a.store.project.id,kind:'delivery',id:a.job.id}),'uncertain',JSON.stringify({status:'uncertain'}));if(kind==='foreign'||kind==='untracked')a.job.steps[0].result.evidence.push({...a.job.steps[0].result.evidence[0],id:'foreign',path:kind==='foreign'?'/private/foreign.json':resolve(a.job.worktree,'untracked.json')});}return output;});
 const request=a.request();await expect(a.reconcileDraft(request)).rejects.toThrow();expect(a.job.stage).toBe('draft');expect(request.status).toBe('working');expect(a.run).not.toHaveBeenCalled();
});
test('completed draft consumed admission survives controls, proof loss and restart without duplicate intents',async()=>{
 const a=completedDraftFixture();await a.it().tick(new Date('2026-10-30T01:00Z'),true);const selected=a.select()!,id=selected.id;expect(a.store.state.it!.recoveries[id].attempts).toBe(1);
 for(const mode of ['paused','draining','missing-proof'] as const){a.store.state.paused=mode==='paused';a.store.state.draining=mode==='draining';if(mode==='missing-proof')rmSync(a.draftNativePath);await a.it().tick(new Date('2026-10-30T01:01Z'),true);expect(a.store.state.it!.recoveries[id].attempts).toBe(1);expect(a.store.state.it!.recoveries[id].status).not.toBe('resolved');}
 expect(a.store.state.coordination!.requests!.filter(r=>r.head===a.draft.id)).toHaveLength(1);expect(a.run).not.toHaveBeenCalled();
});


test('existing durable reconcile-preparation executes the exact completed-draft branch with no writer',async()=>{
 const a=completedDraftFixture(),workers=JSON.stringify(a.store.state.workLog),steps=JSON.stringify(a.job.steps),request=a.request();vi.spyOn(processTools,'command').mockImplementation(a.execute as any);
 const coordinator:any={sessionBridge:{refresh:vi.fn(async()=>{}),forProject:()=>({complete:true,fresh:true,ownership:{status:'clear'}})}};
 const claim=a.store.claimWork({projectId:a.store.project.id,kind:'reconciliation',id:request.id},'scheduler','reconcile-preparation')!;
 await withAssignment(claim,'delivery',()=>executeRequest(a.store,a.engine,coordinator,request));expect(request.status).toBe('completed');expect(a.job.stage).toBe('lead-pr');expect(JSON.stringify(a.store.state.workLog)).toBe(workers);expect(JSON.stringify(a.job.steps)).toBe(steps);expect(a.run).not.toHaveBeenCalled();expect(a.request().id).toBe(request.id);
 expect(a.execute.mock.calls.every(([program,args])=>program==='git'||!args.includes('--method'))).toBe(true);
});
