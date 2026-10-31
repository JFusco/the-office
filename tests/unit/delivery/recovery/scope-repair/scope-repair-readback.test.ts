import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {GH91} from '../../../../../server/delivery/recovery/source-amendment/source-amendment';
import {sourceHash} from '../../../../../server/delivery/recovery/source-amendment/source-amendment-scope';
import {scopeRepairReadbackCandidate,reconcileScopeRepairReadback,outsideScanSources} from '../../../../../server/delivery/recovery/scope-repair/scope-repair-readback';
import {outsideAmendmentFindingIds,proveOutsideAmendmentUnchanged,amendmentRepairView} from '../../../../../server/delivery/recovery/source-amendment/source-amendment-held';
import {enqueueRequest} from '../../../../../server/scheduling/requests';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {workerProfile} from '../../../../../server/workers/worker-profiles';
import {artifact,digest} from '../../../../../server/store/readback-evidence';
const mockHome=vi.hoisted(()=>({path:'/private/tmp'}));
vi.mock('node:os',async importOriginal=>({...await importOriginal<any>(),homedir:()=>mockHome.path}));
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true}));});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'office-scope-readback-'));roots.push(root);mockHome.path=root;
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo:resolve(root,'primary')},root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const engine=new Engine(store),head='b'.repeat(40),branch='codex/scoped-repair',worktree=resolve(root,'candidate'),base=GH91.originalBase;
 mkdirSync(worktree);writeFileSync(resolve(worktree,'.git'),'gitdir: /private/existing-owned-gitdir');
 const approved=['optimizely-paas.cms13-release-notes-index','optimizely-paas.release-notes-index','optimizely-saas.release-notes-index'];
 const job:any={id:GH91.jobId,key:'GH-91',requestedAt:'2026-10-30T00:00Z',stage:'scope-repair',status:'blocked',head:GH91.originalHead,branch,worktree,pr:0,prUrl:'',detail:'Saved passed result not accepted',steps:[],candidateRecovery:{head:GH91.originalHead,findingIds:['f-lock-acceptance','f-other-index-drift'],summary:'Unaccepted'}};
 store.state.coordination.jobs=[job];const ticketRoot=resolve(root,'ticket-work',job.id);mkdirSync(ticketRoot,{recursive:true});
 const proposal='Exact bounded three-source amendment';writeFileSync(resolve(ticketRoot,'cms91-bounded-amendment.md'),proposal);
 job.sourceAmendment={id:'amendment',authorizedAt:'2026-10-30T00:00Z',adoptedAt:'2026-10-30T00:01Z',proposalFilesSha256:'f'.repeat(64),receipts:[],authorization:{projectId:GH91.projectId,repository:GH91.repository,jobId:GH91.jobId,issue:91,originalHead:GH91.originalHead,originalBase:base,sourceIds:approved,approvedBy:'human',questionItemId:GH91.questionItemId,proposalSha256:sourceHash(proposal)}};
 const evidence=resolve(ticketRoot,'check.log');writeFileSync(evidence,'Required checks passed; native proof remains unaccepted');
 const raw:any={outcome:'passed',summary:'Local saved repair; no acceptance',commit:head,worktree,branch,prId:0,paidRuns:0,findings:[{id:'f-lock-acceptance',summary:'Proposed capture repair',expected:'Independent acceptance',actual:'Proposed capture',status:'fixed',attempts:1},{id:'f-other-index-drift',summary:'Outside freshness',expected:'Separate delivery',actual:'Outside source unchanged',status:'open',attempts:0}],evidence:[{id:'checks',kind:'checks',path:evidence,commit:head,summary:'Checks',environment:'fixture',url:'',observedAt:''}],receipts:[],prerequisites:null,approach:null,qaRunDir:'',previewUrl:'',blocker:'',resolution:null};
 job.steps=[{stage:'implement',result:{...structuredClone(raw),commit:job.head}},{stage:'scope-repair',result:structuredClone(raw)}];
 const original:any={id:'original',sessionId:'original-native',requestId:job.id,ticket:job.key,role:'developer',provider:'claude',stage:'github-scope-repair',status:'completed',processId:2147483647,startedAt:'2026-10-30T00:02:00Z',endedAt:'2026-10-30T00:03:00Z',claimId:'old-claim',lane:'delivery'};store.state.workLog=[original];
 const put=(id:string,name:string,value:any)=>{const dir=resolve(root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 const workerFiles=(work:any,result:any,readOnly:boolean,kind='delivery',id=job.id)=>{
  put(work.id,'provider.json',{project:store.project.id,repository:store.project.repository,role:work.role,provider:work.provider,readOnly,session:work.sessionId});put(work.id,'result.json',{session:work.sessionId,result});
  put(work.id,'assignment.json',{id:work.id,stage:work.stage,role:work.role,lane:'delivery',claimId:work.claimId,work:{projectId:store.project.id,kind,id},scope:{repository:store.project.repository,worktree,artifacts:resolve(root,'sessions',work.id)},profile:workerProfile(work.stage,readOnly).name});
  put(work.id,'assignment-identity.json',{attemptId:work.id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,role:work.role,threadId:work.sessionId});put(work.id,'capabilities.json',workerProfile(work.stage,readOnly));
 };workerFiles(original,raw,false);put('original','provider-completion.json',{expectedSession:original.sessionId,result:{session_id:original.sessionId,terminal_reason:'completed',is_error:false,subtype:'success'}});
 const observation=(sourceId:string,classification='cosmetic')=>({sourceId,classification,observedAt:'2026-10-30T00:02:30Z',rawSha256:'a'.repeat(64)});
 const scans:any[]=[];for(const mode of ['index','full']){const scan={schemaVersion:2,mode,attentionRequired:true,observedAt:'2026-10-30T00:02:30Z',observations:[...approved.map(id=>observation(id)),observation('outside.source','claim-changing')]};scans.push(scan);writeFileSync(resolve(ticketRoot,`amendment-scan-${mode}.json`),JSON.stringify(scan));writeFileSync(resolve(ticketRoot,`amendment-scan-${mode}.log`),`head=${head} startedAt=2026-10-30T00:02:20Z\nnode scripts/source-scan.mjs --mode ${mode} --output ${ticketRoot}/amendment-scan-${mode}.json\nexitCode=2\n`);}
 const files:Record<string,{base:string;candidate:string}>={};
 for(const [path,key]of [['sources.lock.json','sourceId'],['sources/official-sources.json','id'],['sources/evidence-locators.json','sourceId']]as const){const data=JSON.stringify({sources:[...approved,'outside.source'].map(id=>({[key]:id,value:'old',role:'release-index'}))});files[path]={base:data,candidate:data};}
 files['catalog/catalog.json']={base:JSON.stringify({profiles:[{id:'profile',sourceIds:[...approved,'outside.source'],claims:['unchanged']}]}),candidate:JSON.stringify({profiles:[{id:'profile',sourceIds:[...approved,'outside.source'],claims:['unchanged']}]})};
 const issue:any={number:91,html_url:'https://github.com/JFusco/cms-field-vocabulary/issues/91',state:'open',title:'Bounded release source repair',body:'Human bounded amendment preserved',updated_at:'2026-10-30T00:00Z',labels:[],assignees:[{login:'JFusco'}]};let providerBase=base as string;
 const execute=vi.fn(async(program:string,args:string[],_options?:any)=>{
  if(program==='git'){if(args[0]==='remote')return `https://github.com/${store.project.repository}.git`;if(args[0]==='rev-parse')return head;if(args[0]==='branch')return branch;if(args[0]==='status'||args[0]==='ls-remote')return '';if(args[0]==='cat-file')return `${providerBase} commit`;if(args[0]==='merge-base')return args[1]==='--is-ancestor'?'':base;if(args[0]==='diff')return args[1]==='--name-only'?'sources.lock.json\n':'';if(args[0]==='show'){const [revision,...parts]=args[1].split(':');return files[parts.join(':')][revision===head?'candidate':'base'];}}
  if(program==='gh')return '[[]]';throw new Error('Unmodeled operation');
 });
 const delivery=new GitHubDelivery(store,engine,execute as any);vi.spyOn(delivery,'api').mockImplementation(async(path:string)=>path.startsWith('commits/')?{sha:providerBase}:path.includes('/comments?')?[]:structuredClone(issue));
 const board:any={items:[{id:'card',number:91,repository:store.project.repository,status:'In progress'}]};vi.spyOn(engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}})),intent=enqueueRequest(store,'reconcile-scope-repair',job.key,original.id);intent.status='working';
 const claim:any={id:'claim',work:{projectId:store.project.id,kind:'reconciliation',id:intent.id},lane:'delivery',stage:'reconcile-scope-repair',status:'running',expectedVersion:'1',claimedAt:'2026-10-30T00:04Z'};vi.spyOn(store,'activeClaims').mockReturnValue([claim]);
 const nativePath=resolve(root,'.claude/projects/candidate/original-native.jsonl');mkdirSync(resolve(nativePath,'..'),{recursive:true});writeFileSync(nativePath,JSON.stringify({sessionId:original.sessionId,type:'assistant'})+'\n');
 const comparison=()=>({providerBase,fork:base,candidate:head,fromHead:job.head,changedPaths:['sources.lock.json'],approvedSourceIds:[...approved],outsideSourceIds:['outside.source'],maskInputsSha256:digest(files),metadataSha256:digest('')});
 const assessment:any={scopeBase:base,currentProviderBase:providerBase,scopeComparisonSha256:digest(comparison()),outcome:'passed',originalWorkId:'original',nativeSessionId:original.sessionId,checkpointSha256:artifact(store,resolve(root,'sessions/original/result.json')).sha256,commit:head,completeNativeExecution:true,noExternalEffects:true,scansVerified:true,noHumanHold:true,nativeSessionPath:nativePath,nativeRecordCount:1,summary:'Complete actual calls and retained scans accounted for',evidence:[{path:nativePath,summary:'Full original transcript'}]};
 const readback=()=>{const work:any={...original,id:'reader',sessionId:'reader-native',role:'lead',provider:'codex',stage:'scope-repair-readback',claimId:claim.id,status:'completed',processId:2147483646,endedAt:'2026-10-30T00:05Z'};store.state.workLog!.push(work);workerFiles(work,assessment,true,'reconciliation',intent.id);return structuredClone(assessment);};
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback()as any);
 const reconcile=()=>withAssignment(claim,'delivery',()=>reconcileScopeRepairReadback(delivery,job.key,original.id,ownership,intent.id));
 return{root,store,engine,job,raw,original,put,scans,head,base,files,issue,board,claim,intent,ownership,delivery,run,readback,assessment,reconcile,ticketRoot,nativePath,execute,approved,comparison,setBase:(head:string)=>providerBase=head};
}
test('recovers only the exact unaccepted descendant and queues Alex without changing original evidence/history/counters',async()=>{
 const a=fixture(),oldSteps=JSON.stringify(a.job.steps),oldOriginal=JSON.stringify(a.original),native=readFileSync(a.nativePath,'utf8');a.job.repairCycle={attempts:5,findingAttempts:{'f-lock-acceptance':2}};
 expect(scopeRepairReadbackCandidate(a.store,a.job)?.result.commit).toBe(a.head);await a.reconcile();
 expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',head:a.head,candidateRecovery:{head:GH91.originalHead},repairCycle:{attempts:5,findingAttempts:{'f-lock-acceptance':2}}});expect(a.intent.status).toBe('completed');
 expect(JSON.stringify(a.job.steps)).toBe(oldSteps);expect(JSON.stringify(a.original)).toBe(oldOriginal);expect(readFileSync(a.nativePath,'utf8')).toBe(native);expect(a.job.sourceAmendment.receipts).toEqual([]);
 expect(await outsideAmendmentFindingIds(a.delivery,a.job)).toEqual(new Set(['f-other-index-drift']));
 expect(a.raw.findings[1].status).toBe('open');expect(enqueueRequest(a.store,'reconcile-scope-repair',a.job.key,'original').id).toBe(a.intent.id);
 await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).toHaveBeenCalledTimes(1);
});
test.each(['new-original','authorization','unknown-finding','approved-drift','unknown-scan','duplicate-scan','scan-head','source-receipt','completion','capabilities','missing-proposal'])('refuses unsafe saved originals before any read-back: %s',async scenario=>{
 const a=fixture();
 if(scenario==='new-original')a.original.status='running';if(scenario==='authorization')a.job.sourceAmendment.authorization.sourceIds[0]='outside.source';
 if(scenario==='unknown-finding'){a.raw.findings.push({...a.raw.findings[1],id:'unknown'});a.put('original','result.json',{session:a.original.sessionId,result:a.raw});}
 if(['approved-drift','unknown-scan','duplicate-scan'].includes(scenario)){if(scenario==='approved-drift')a.scans[0].observations[0].classification='version-changing';if(scenario==='unknown-scan')a.scans[0].observations[0].classification='unreachable';if(scenario==='duplicate-scan')a.scans[0].observations.push(a.scans[0].observations[0]);writeFileSync(resolve(a.ticketRoot,'amendment-scan-index.json'),JSON.stringify(a.scans[0]));}
 if(scenario==='scan-head')writeFileSync(resolve(a.ticketRoot,'amendment-scan-index.log'),'head=wrong\nexitCode=2\n');
 if(scenario==='source-receipt'){a.raw.receipts.push({id:'unknown',action:'write',target:'remote',verified:false,uncertain:true,detail:''});a.put('original','result.json',{session:a.original.sessionId,result:a.raw});}
 if(scenario==='completion')a.put('original','provider-completion.json',{expectedSession:'wrong'});if(scenario==='capabilities')a.put('original','capabilities.json',{name:'reader',readOnly:true});if(scenario==='missing-proposal')rmSync(resolve(a.ticketRoot,'cms91-bounded-amendment.md'));
 const before=JSON.stringify(a.job);await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(before);
});
test.each(['pause','claim','job','scope','base','scan-bytes','reader-assignment','incomplete','effects','native-count','outside-row','outside-claim','uncertain-effect'])('fences mutation and unknown evidence before adoption: %s',async scenario=>{
 const a=fixture(),before=JSON.stringify(a.job);
 a.run.mockImplementation(async()=>{const result=a.readback();
  if(scenario==='pause')a.store.state.paused=true;if(scenario==='claim')a.claim.work.id='foreign';if(scenario==='job')a.job.detail='Changed';if(scenario==='scope')a.issue.body='Human hold';if(scenario==='base')a.setBase('c'.repeat(40));
  if(scenario==='scan-bytes')writeFileSync(resolve(a.ticketRoot,'amendment-scan-index.log'),'replaced');if(scenario==='reader-assignment')a.put('reader','assignment.json',{});
  if(scenario==='incomplete')result.completeNativeExecution=false;if(scenario==='effects')result.noExternalEffects=false;if(scenario==='native-count')result.nativeRecordCount++;
  if(scenario==='outside-row')a.files['sources.lock.json'].candidate=a.files['sources.lock.json'].candidate.replace('outside.source','changed.source');if(scenario==='outside-claim')a.files['catalog/catalog.json'].candidate=a.files['catalog/catalog.json'].candidate.replace('unchanged','new claim');
  if(scenario==='uncertain-effect')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect',`cms-field-vocabulary:delivery:${a.job.id}`,'uncertain',JSON.stringify({status:'uncertain'}));
  return result as any;
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.scopeRepairReadback).toBeUndefined();expect(a.job.head).toBe(GH91.originalHead);expect(a.intent.status).toBe('working');if(scenario!=='job')expect(JSON.stringify(a.job)).toBe(before);
});
test('exact admitted scheduler claim may finish a drain without reopening paused work',async()=>{const a=fixture();a.run.mockImplementation(async()=>{a.store.state.draining=true;return a.readback()as any;});await a.reconcile();expect(a.intent.status).toBe('completed');});
test('fails atomically without changing original head/history',async()=>{const a=fixture(),before=structuredClone(a.job);vi.spyOn(a.store,'emit').mockImplementation(()=>{throw new Error('Injected commit failure');});await expect(a.reconcile()).rejects.toThrow('Injected');expect(a.store.state.coordination!.jobs![0]).toEqual(before);expect(a.store.state.coordination!.requests![0].status).toBe('working');});
test('outside OPEN proof never permits changed rows, claims or a changed audited transcript',async()=>{const a=fixture();await a.reconcile();a.files['catalog/catalog.json'].candidate=a.files['catalog/catalog.json'].candidate.replace('unchanged','new claim');await expect(outsideAmendmentFindingIds(a.delivery,a.job)).rejects.toThrow('Outside profile claims');a.files['catalog/catalog.json'].candidate=a.files['catalog/catalog.json'].base;writeFileSync(a.nativePath,'changed');await expect(outsideAmendmentFindingIds(a.delivery,a.job)).rejects.toThrow('native transcript changed');});
test('repair selection projection excludes only proven outside work and preserves native results',()=>{const a=fixture();a.raw.outcome='blocked';a.raw.resolution={kind:'source-repair',findingIds:['f-lock-acceptance','f-other-index-drift'],evidenceIds:['checks']};const before=JSON.stringify(a.raw),view=amendmentRepairView(a.raw,new Set(['f-other-index-drift']));expect(view.findings.map(f=>f.id)).toEqual(['f-lock-acceptance']);expect(view.resolution!.findingIds).toEqual(['f-lock-acceptance']);expect(JSON.stringify(a.raw)).toBe(before);});
test('a normal Alex result with the proven outside finding OPEN reaches independent review; no fake acceptance',async()=>{
 const a=fixture();await a.reconcile();a.raw.evidence.push({id:'source-amendment-held-finding',kind:'provider',path:a.job.scopeRepairReadback.proofPath,commit:a.head,environment:'fixture',url:'',observedAt:'',summary:JSON.stringify({version:1,authorizationId:a.job.sourceAmendment.id,readbackSha256:a.job.scopeRepairReadback.proofSha256,findingId:'f-other-index-drift',scope:'wholly-outside-unchanged',sourceIds:a.job.scopeRepairReadback.outsideSourceIds})});a.run.mockImplementation(async()=>structuredClone(a.raw)as any);await a.delivery.step(a.job);
 expect(a.job).toMatchObject({status:'queued',stage:'review',head:a.head});expect(a.job.steps.at(-1).result.findings.find((f:any)=>f.id==='f-other-index-drift').status).toBe('open');expect(a.job.sourceAmendment.receipts).toEqual([]);
});
test('incomplete native scan inventory blocks before any independent model audit',async()=>{
 const a=fixture();a.scans[0].observations.pop();writeFileSync(resolve(a.ticketRoot,'amendment-scan-index.json'),JSON.stringify(a.scans[0]));
 await expect(a.reconcile()).rejects.toThrow('complete candidate registry');expect(a.run).not.toHaveBeenCalled();expect(a.job.head).toBe(GH91.originalHead);
});

test('an ID alone or a mismatched result scope never holds an OPEN finding',async()=>{const a=fixture();await a.reconcile();await expect(outsideAmendmentFindingIds(a.delivery,a.job,a.head,a.raw)).rejects.toThrow('scope binding required');a.raw.evidence.push({id:'source-amendment-held-finding',kind:'provider',path:a.job.scopeRepairReadback.proofPath,commit:a.head,summary:JSON.stringify({version:1,authorizationId:a.job.sourceAmendment.id,readbackSha256:a.job.scopeRepairReadback.proofSha256,findingId:'f-other-index-drift',scope:'wholly-outside-unchanged',sourceIds:[...a.job.scopeRepairReadback.outsideSourceIds,a.approved[0]]}),environment:'fixture',url:'',observedAt:''});await expect(outsideAmendmentFindingIds(a.delivery,a.job,a.head,a.raw)).rejects.toThrow('scope binding required');});
test.each(['unrelated-path','mode-change'])('refuses unapproved saved candidate changes before native audit: %s',async scenario=>{
 const a=fixture(),original=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args)=>program==='git'&&args[0]==='diff'?(args[1]==='--name-only'?(scenario==='unrelated-path'?'unrelated-secret.ts\n':'sources.lock.json\n'):' mode change 100644 => 120000 sources.lock.json\n'):original(program,args));
 await expect(a.reconcile()).rejects.toThrow('bounded amendment paths');expect(a.run).not.toHaveBeenCalled();expect(a.job.head).toBe(GH91.originalHead);
});


test('caches one exact missing provider commit before ancestry; retained cached objects never fetch again',async()=>{
 const a=fixture(),original=a.execute.getMockImplementation()!,before=JSON.stringify(a.job.steps);let cached=false;
 a.execute.mockImplementation(async(program,args,...rest)=>{
  if(program==='git'&&args[0]==='cat-file')return `${a.base} ${cached?'commit':'missing'}`;
  if(program==='git'&&args[0]==='fetch'){expect(args).toEqual(['fetch','--no-tags','--no-write-fetch-head','--refmap=','--no-recurse-submodules','--no-auto-maintenance','origin',a.base]);expect(rest[0]).toMatchObject({cwd:a.job.worktree,readOnly:false,timeout:60000});cached=true;return '';}
  if(program==='git'&&args[0]==='merge-base'&&args[1]!=='--is-ancestor')expect(cached).toBe(true);
  return original(program,args);
 });
 await a.reconcile();expect(a.execute.mock.calls.filter(([p,args])=>p==='git'&&args[0]==='fetch')).toHaveLength(1);
 expect(a.job.head).toBe(a.head);expect(JSON.stringify(a.job.steps)).toBe(before);expect(a.job.sourceAmendment.receipts).toEqual([]);expect(a.run).toHaveBeenCalledTimes(1);
});
test('a cached current provider commit needs no Git fetch',async()=>{const a=fixture();await a.reconcile();expect(a.execute.mock.calls.some(([p,args])=>p==='git'&&args[0]==='fetch')).toBe(false);});
test.each(['invalid-base','foreign-origin','unknown-object','wrong-object-type','pause-before-fetch','claim-before-fetch','base-before-fetch'])('refuses an unsafe missing-base fetch before any native reader: %s',async scenario=>{
 const a=fixture(),original=a.execute.getMockImplementation()!,before=JSON.stringify(a.job);let origins=0;
 if(scenario==='invalid-base')a.setBase('main');
 a.execute.mockImplementation(async(program,args)=>{
  if(program==='git'&&args[0]==='remote'){origins++;if(scenario==='foreign-origin'&&origins>=3)return 'https://github.com/foreign/owner.git';}
  if(program==='git'&&args[0]==='cat-file'){
   if(scenario==='pause-before-fetch')a.store.state.paused=true;
   if(scenario==='claim-before-fetch')a.claim.work.id='foreign';
   if(scenario==='base-before-fetch')a.setBase('c'.repeat(40));
   return scenario==='unknown-object'?'unexpected diagnostic':`${a.base} ${scenario==='wrong-object-type'?'tree':'missing'}`;
  }
  return original(program,args);
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.execute.mock.calls.some(([p,args])=>p==='git'&&args[0]==='fetch')).toBe(false);expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(before);
});
test.each(['pause','claim','candidate-head','origin','provider-base','absent-after-fetch','fetch-failure'])('a cache fetch never admits changed or unresolved facts: %s',async scenario=>{
 const a=fixture(),original=a.execute.getMockImplementation()!,before=JSON.stringify(a.job);let fetched=false;
 a.execute.mockImplementation(async(program,args)=>{
  if(program==='git'&&args[0]==='cat-file')return `${a.base} ${fetched&&scenario!=='absent-after-fetch'?'commit':'missing'}`;
  if(program==='git'&&args[0]==='fetch'){
   fetched=true;if(scenario==='pause')a.store.state.paused=true;if(scenario==='claim')a.claim.work.id='foreign';if(scenario==='provider-base')a.setBase('c'.repeat(40));if(scenario==='fetch-failure')throw new Error('Exact object cache transport failed');return '';
  }
  if(fetched&&program==='git'&&args[0]==='rev-parse'&&scenario==='candidate-head')return 'c'.repeat(40);
  if(fetched&&program==='git'&&args[0]==='remote'&&scenario==='origin')return `git@github.com:${a.store.project.repository}.git`;
  return original(program,args);
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.execute.mock.calls.filter(([p,args])=>p==='git'&&args[0]==='fetch')).toHaveLength(1);expect(a.run).not.toHaveBeenCalled();expect(JSON.stringify(a.job)).toBe(before);expect(a.intent.status).toBe('working');
});


test('advanced main is explicit integration context while actual fork owns the bounded comparison',async()=>{
 const a=fixture(),current='c'.repeat(40),oldSteps=JSON.stringify(a.job.steps);a.setBase(current);Object.assign(a.assessment,{currentProviderBase:current,scopeComparisonSha256:digest(a.comparison())});
 a.run.mockImplementation(async(_role,prompt,schema)=>{expect(prompt).toContain(`actual merge-base fork ${a.base} -> immutable candidate ${a.head}`);expect(prompt).toContain(`Current provider base ${current} is integration/freshness context, NOT the baseline`);expect(schema.safeParse({...a.assessment,scopeBase:current}).success).toBe(false);expect(schema.safeParse({...a.assessment,scopeComparisonSha256:'f'.repeat(64)}).success).toBe(false);return a.readback()as any;});
 await a.reconcile();const proof=JSON.parse(readFileSync(a.job.scopeRepairReadback.proofPath,'utf8'));expect(proof).toMatchObject({base:current,scopeComparison:{providerBase:current,fork:a.base,candidate:a.head,changedPaths:['sources.lock.json']}});expect(proof.scopeComparisonSha256).toBe(digest(proof.scopeComparison));expect(proof.assessment.scopeBase).toBe(a.base);expect(a.job.head).toBe(a.head);expect(JSON.stringify(a.job.steps)).toBe(oldSteps);expect(a.job.sourceAmendment.receipts).toEqual([]);
});
test.each(['fork','comparison','provider'])('scope reader cannot return a different %s comparison identity',async kind=>{
 const a=fixture();if(kind==='fork')a.assessment.scopeBase='f'.repeat(40);if(kind==='comparison')a.assessment.scopeComparisonSha256='f'.repeat(64);if(kind==='provider')a.assessment.currentProviderBase='f'.repeat(40);
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.scopeRepairReadback).toBeUndefined();expect(a.job.head).toBe(GH91.originalHead);expect(a.intent.status).toBe('working');
});
test.each(['fork','mask','paths','commit-mask'])('full code-owned comparison rejects %s drift without adopting or rewriting original',async kind=>{
 const a=fixture(),execute=a.execute.getMockImplementation()!,old=JSON.stringify(a.job.steps);let finished=false,comparisons=0,maskChanged=false;
 a.run.mockImplementation(async()=>{finished=true;return a.readback()as any;});
 a.execute.mockImplementation(async(program,args)=>{
  if(program==='git'&&args[0]==='merge-base'&&args[1]!=='--is-ancestor'){comparisons++;if(kind==='fork'&&finished)return 'f'.repeat(40);if(kind==='commit-mask'&&comparisons===3)a.files['sources.lock.json'].candidate=a.files['sources.lock.json'].candidate.replace('old','new');}
  if(finished&&kind==='mask'&&!maskChanged){maskChanged=true;a.files['sources.lock.json'].candidate=a.files['sources.lock.json'].candidate.replace('old','new');}
  if(program==='git'&&finished&&kind==='paths'&&args[0]==='diff'&&args[1]==='--name-only')return 'sources.lock.json\nwiki/connections.md\n';return execute(program,args);
 });
 await expect(a.reconcile()).rejects.toThrow('comparison changed');expect(a.job.scopeRepairReadback).toBeUndefined();expect(a.job.head).toBe(GH91.originalHead);expect(JSON.stringify(a.job.steps)).toBe(old);expect(a.job.sourceAmendment.receipts).toEqual([]);
});
