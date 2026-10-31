import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {ProjectProgress} from '../../../../../server/delivery/board/project-progress';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {enqueueRequest} from '../../../../../server/scheduling/requests';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {workerProfile} from '../../../../../server/workers/worker-profiles';
import {artifact,digest} from '../../../../../server/store/readback-evidence';
import {scopeRepairResumeCandidate,scopeRepairResumeInstruction,assertScopeRepairResumeFindings,scopeRepairResumeNextStage} from '../../../../../server/delivery/recovery/scope-repair/scope-repair-resume';
import {reconcileScopeRepairReadback} from '../../../../../server/delivery/recovery/scope-repair/scope-repair-readback';
import * as amendments from '../../../../../server/delivery/recovery/source-amendment/source-amendment';
import * as held from '../../../../../server/delivery/recovery/source-amendment/source-amendment-held';
import {RELEASE_AMENDMENT_PATHS,RELEASE_SOURCE_IDS,sourceHash,sourceJson} from '../../../../../server/delivery/recovery/source-amendment/source-amendment-scope';
import {GH91} from '../../../../../server/delivery/recovery/source-amendment/source-amendment';
import {HOLDS} from '../../../../../server/office/config';
const mockHome=vi.hoisted(()=>({path:'/private/tmp'}));
vi.mock('node:os',async original=>({...await original<any>(),homedir:()=>mockHome.path}));
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();delete HOLDS['GH-91'];stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true}));});
function fixture(amendment=false){
 const root=mkdtempSync(resolve(tmpdir(),'office-scope-resume-'));roots.push(root);mockHome.path=root;
 const project={...projectById('cms-field-vocabulary'),id:amendment?GH91.projectId:'scope-project',repository:amendment?GH91.repository:'example/scoped',repo:resolve(root,'primary')},jobId=amendment?GH91.jobId:'job',number=amendment?91:42;
 const store=new Store(':memory:',project,root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const engine=new Engine(store),head='b'.repeat(40),base='a'.repeat(40),worktree=resolve(root,'candidate'),branch='codex/scoped-repair';
 mkdirSync(worktree);writeFileSync(resolve(worktree,'.git'),'gitdir: /private/existing-owned-gitdir');
 const ticketRoot=resolve(root,'ticket-work',jobId);mkdirSync(ticketRoot,{recursive:true});const diagnostic=resolve(ticketRoot,'blocked.log');writeFileSync(diagnostic,'Retained original technical evidence');
 const finding=(id:string)=>({id,summary:id,expected:'Existing scope',actual:'Unresolved local repair',status:'open',attempts:1});
 const raw:any={outcome:'blocked',summary:'Existing local candidate stopped',commit:head,worktree,branch,prId:0,paidRuns:0,findings:[finding('original-finding'),finding('additional-finding')],evidence:[{id:'diagnostic',kind:'checks',path:diagnostic,commit:head,summary:'Retained',environment:'fixture',url:'',observedAt:''}],receipts:[],prerequisites:null,approach:null,qaRunDir:'',previewUrl:'',blocker:'Concrete local blocker',resolution:null};
 const job:any={id:jobId,key:`GH-${number}`,requestedAt:'2026-10-30T00:00:00Z',stage:'scope-repair',status:'blocked',head,branch,worktree,pr:0,prUrl:'',detail:'Retained blocked original',steps:[{stage:'implement',result:{...structuredClone(raw),findings:[finding('original-finding')]}},{stage:'scope-repair',result:structuredClone(raw)}],candidateRecovery:{head:base,findingIds:['original-finding'],summary:'Original unaccepted candidate'},repairCycle:{attempts:2,findingAttempts:{'original-finding':1},pendingFindingIds:['original-finding'],phase:'repair'}};
 store.state.coordination.jobs=[job];
 const original:any={id:'original',sessionId:'original',requestId:job.id,ticket:job.key,role:'developer',provider:'claude',stage:'github-scope-repair',status:'blocked',executionStatus:'completed',processId:2147483647,startedAt:'2026-10-30T00:02:00Z',endedAt:'2026-10-30T00:03:00Z',claimId:'old-claim',lane:'delivery'};
 store.state.workLog=[original];
 const oldClaim:any={id:original.claimId,work:{projectId:project.id,kind:'delivery',id:job.id},lane:'delivery',stage:'scope-repair',status:'completed',owner:'owner',claimedAt:original.startedAt,endedAt:original.endedAt};
 const saveClaim=()=>store.db.prepare('INSERT OR REPLACE INTO work_claims(id,work_key,status,body) VALUES(?,?,?,?)').run(oldClaim.id,`${project.id}:delivery:${job.id}`,oldClaim.status,JSON.stringify(oldClaim));saveClaim();
 const put=(id:string,name:string,value:any)=>{const dir=resolve(root,'sessions',id);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name),JSON.stringify(value));};
 const workerFiles=(work:any,result:any,readOnly:boolean,kind='delivery',id=job.id)=>{
  put(work.id,'provider.json',{project:project.id,repository:project.repository,role:work.role,provider:work.provider,readOnly,session:work.sessionId});put(work.id,'result.json',{session:work.sessionId,provider:work.provider,result});
  put(work.id,'assignment.json',{id:work.id,stage:work.stage,role:work.role,lane:'delivery',claimId:work.claimId,work:{projectId:project.id,kind,id},scope:{repository:project.repository,worktree,artifacts:resolve(root,'sessions',work.id)},profile:workerProfile(work.stage,readOnly).name});
  put(work.id,'assignment-identity.json',{attemptId:work.id,requestId:job.id,projectId:project.id,repository:project.repository,role:work.role,threadId:work.sessionId});put(work.id,'capabilities.json',workerProfile(work.stage,readOnly));
  put(work.id,'execution-completion.json',{workerId:work.id,session:work.sessionId,provider:work.provider,resultSha256:artifact(store,resolve(root,'sessions',work.id,'result.json')).sha256});
 };workerFiles(original,raw,false);
 put(original.id,'provider-completion.json',{expectedSession:original.sessionId,result:{type:'result',session_id:original.sessionId,subtype:'success',is_error:false,structured_output:raw}});
 const nativePath=resolve(root,'.claude/projects',worktree.replace(/[^a-zA-Z0-9-]/g,'-'),'original.jsonl');mkdirSync(resolve(nativePath,'..'),{recursive:true});
 const nativeRecords:any[]=[{type:'assistant',sessionId:original.sessionId,cwd:worktree,uuid:'call-read',message:{id:'message',role:'assistant',content:[{type:'tool_use',id:'read',name:'Read',input:{file_path:diagnostic}}]}},{type:'user',sessionId:original.sessionId,cwd:worktree,parentUuid:'call-read',message:{role:'user',content:[{type:'tool_result',tool_use_id:'read',content:'Retained evidence'}]}},{type:'assistant',sessionId:original.sessionId,cwd:worktree,uuid:'call-final',message:{id:'final-message',role:'assistant',content:[{type:'tool_use',id:'final',name:'StructuredOutput',input:raw}]}},{type:'user',sessionId:original.sessionId,cwd:worktree,parentUuid:'call-final',message:{role:'user',content:[{type:'tool_result',tool_use_id:'final',content:'Saved'}]}}];
 const saveNative=()=>writeFileSync(nativePath,nativeRecords.map(r=>JSON.stringify(r)).join('\n')+'\n');saveNative();
 let currentHead=head,providerBase=base,remote='';const issue:any={number,html_url:`https://github.com/${project.repository}/issues/${number}`,state:'open',title:'Scoped local repair',body:'Existing scope',updated_at:'2026-10-30T00:00:00Z',labels:[],assignees:[{login:'JFusco'}]};const comments:any[]=[],board:any={items:[{id:'card',number,repository:project.repository,status:'In progress'}]};
 const execute=vi.fn(async(program:string,args:string[],_options?:any)=>{
  if(program==='git'){if(args[0]==='remote')return `https://github.com/${project.repository}.git`;if(args[0]==='rev-parse')return currentHead;if(args[0]==='branch')return branch;if(args[0]==='status')return '';if(args[0]==='ls-remote')return remote;if(args[0]==='merge-base')return args[1]==='--is-ancestor'?'':base;}
  if(program==='gh')return '[[]]';throw new Error('Unexpected fixture operation '+program+' '+args.join(' '));
 });
 const delivery=new GitHubDelivery(store,engine,execute as any);vi.spyOn(delivery,'api').mockImplementation(async(path:string)=>path.startsWith('commits/')?{sha:providerBase}:path.includes('/comments?')?structuredClone(comments):structuredClone(issue));vi.spyOn(engine.github,'board').mockImplementation(async()=>structuredClone(board));
 const ownership=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));const intent=enqueueRequest(store,'reconcile-scope-repair',job.key,original.id);intent.status='working';
 const claim:any={id:'claim',work:{projectId:project.id,kind:'reconciliation',id:intent.id},lane:'delivery',stage:'reconcile-scope-repair',status:'running',owner:'scheduler',claimedAt:'2026-10-30T00:04:00Z',endedAt:''};vi.spyOn(store,'activeClaims').mockReturnValue([claim]);
 let readerCount=0;
 const readback=(extra:Record<string,unknown>={})=>{
  const selected=scopeRepairResumeCandidate(store,job)!;
  const assessment:any={outcome:'passed',originalWorkId:original.id,nativeSessionId:original.sessionId,checkpointSha256:selected.checkpointSha256,head:job.head,nativeSha256:selected.native.file.sha256,nativeRecordCount:selected.native.recordCount,completeNativeExecution:true,noExternalEffects:true,repairWithinExistingScope:true,noHumanHold:true,summary:'All original calls/effects inspected; existing local repair may continue',callEffects:selected.native.calls.flatMap(c=>(c.inputRepresentations||[{namespace:'display',value:c.input,sha256:digest(c.input)}]).map(r=>({id:JSON.stringify([c.id,r.namespace]),inputSha256:r.sha256,classification:'read-only',summary:'No external effect'}))),...extra};
  const reader:any={...original,id:`reader-${++readerCount}`,sessionId:`reader-native-${readerCount}`,role:'lead',provider:'codex',stage:'scope-repair-resume-readback',claimId:claim.id,status:'completed',processId:2147483646,endedAt:'2026-10-30T00:05:00Z'};store.state.workLog!.push(reader);workerFiles(reader,assessment,true,'reconciliation',intent.id);return assessment;
 };
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>readback()as any);
 const reconcile=()=>withAssignment(claim,'delivery',()=>reconcileScopeRepairReadback(delivery,job.key,original.id,ownership,intent.id));
 return{root,store,engine,job,head,base,raw,original,oldClaim,saveClaim,put,workerFiles,nativePath,nativeRecords,saveNative,issue,comments,board,execute,delivery,ownership,intent,claim,run,readback,reconcile,setHead:(s:string)=>currentHead=s,setBase:(s:string)=>providerBase=s,setRemote:(s:string)=>remote=s};
}
function amendmentFixture(){
 const a=fixture(true),root=resolve(a.root,'ticket-work',a.job.id),proposal='Existing human approved bounded local amendment\n';writeFileSync(resolve(root,'cms91-bounded-amendment.md'),proposal);
 const frozen:Record<string,Record<string,string>>={originalBase:Object.fromEntries(RELEASE_AMENDMENT_PATHS.map(path=>[path,`Frozen ${path}\n`])),proposal:{}};frozen.proposal={...frozen.originalBase};
 const topic='wiki/topics/official-source-freshness.md',original='# Official source freshness\n- Catalog binds 54 sources.\n## Current evidence\n- Retained source guidance.\n## Later evidence\n';
 frozen.originalBase[topic]=original;frozen.proposal[topic]=original.replace('54','55').replace('## Later evidence','- Approved release-index guidance.\n## Later evidence');
 for(const path of ['scripts/source-scan.mjs','tests/source-scan.test.mjs']){frozen.originalBase[path]='Original scanner/test input\n';frozen.proposal[path]='Approved scanner/test input\n';}
 const current:Record<string,string>={...frozen.originalBase,[topic]:original.replace('## Later evidence','- Current #114 guidance.\n- Current #115 guidance.\n## Later evidence')};
 a.job.sourceAmendment={id:'existing-authorization',authorization:{...GH91,sourceIds:[...RELEASE_SOURCE_IDS].sort(),approvedBy:'human',proposalSha256:sourceHash(proposal)},authorizedAt:'2026-10-29',adoptedAt:'2026-10-30',proposalFilesSha256:sourceHash(sourceJson(frozen)),receipts:[]};
 a.job.scopeRepairReadback={intentId:'earlier-accepted-scope',originalWorkId:'earlier',fromHead:a.head,head:a.head,proofPath:a.raw.evidence[0].path,proofSha256:artifact(a.store,a.raw.evidence[0].path).sha256,outsideSourceIds:['retained-outside-source'],at:''};
 vi.spyOn(held,'outsideAmendmentFindingIds').mockResolvedValue(new Set(['additional-finding']));
 const originalExecute=a.execute.getMockImplementation()!;
 a.execute.mockImplementation(async(program,args,options)=>{
  if(program==='git'&&args[0]==='cat-file')return `${options.input.trim()} commit\n`;
  if(program==='git'&&['ls-tree','show'].includes(args[0])){
   const [commit,path]=args[0]==='show'?args[1].split(':'):[args[1],args[3]],files=commit===GH91.originalBase?frozen.originalBase:commit===GH91.originalHead?frozen.proposal:current;
   return args[0]==='ls-tree'?`100644 blob ${'a'.repeat(40)}\t${path}\n`:files[path];
  }
  return originalExecute(program,args,options);
 });
 const assessment=(prompt:string,extra:Record<string,unknown>={})=>a.readback({technicalDirectionSha256:prompt.match(/Current code-owned technical direction SHA256 ([a-f0-9]{64})/)?.[1],...extra});
 a.run.mockImplementation(async(_role,prompt)=>assessment(prompt)as any);
 return {...a,frozen,current,topic,assessment};
}
test.each([true,false])('amendment resume binds the advanced provider base with initially cached=%s',async initiallyCached=>{
 const a=amendmentFixture(),execute=a.execute.getMockImplementation()!,providerBase='c'.repeat(40);let cached=initiallyCached;a.setBase(providerBase);
 a.execute.mockImplementation(async(program,args,options)=>{
  if(program==='git'&&args[0]==='cat-file'){expect(args).toEqual(['cat-file','--batch-check=%(objectname) %(objecttype)']);expect(options).toMatchObject({cwd:a.job.worktree,readOnly:true,timeout:30000,input:`${providerBase}\n`});return `${providerBase} ${cached?'commit':'missing'}\n`;}
  if(program==='git'&&args[0]==='fetch'){expect(args).toEqual(['fetch','--no-tags','--no-write-fetch-head','--refmap=','--no-recurse-submodules','--no-auto-maintenance','origin',providerBase]);expect(options).toMatchObject({cwd:a.job.worktree,readOnly:false,timeout:60000});cached=true;return '';}
  if(program==='git'&&args[0]==='ls-tree'&&args[1]===providerBase&&!cached)throw Error('fatal: not a tree object');
  return execute(program,args,options);
 });
 await a.reconcile();expect(a.execute.mock.calls.filter(([p,args])=>p==='git'&&args[0]==='fetch')).toHaveLength(initiallyCached?0:1);expect(a.run).toHaveBeenCalledOnce();expect(a.job.scopeRepairResumes).toHaveLength(1);
 const proof=JSON.parse(readFileSync(a.job.scopeRepairResumes[0].proofPath,'utf8'));expect(proof.technicalDirection.providerBase).toBe(providerBase);expect(proof.candidate.every((c:any)=>c.providerBase===providerBase&&digest(c.technicalDirection)===digest(proof.technicalDirection))).toBe(true);
 expect(proof.technicalDirection.files.find((f:any)=>f.path===a.topic).expectedText).toContain('- Approved release-index guidance.');
});
test.each(['unknown-object','wrong-object-type','foreign-origin','pause','claim','provider-base'])('amendment resume refuses unsafe cache fetch before audit: %s',async scenario=>{
 const a=amendmentFixture(),execute=a.execute.getMockImplementation()!,before=JSON.stringify(a.job);let cacheRead=false;
 a.execute.mockImplementation(async(program,args,options)=>{
  if(program==='git'&&args[0]==='cat-file'){
   cacheRead=true;if(scenario==='pause')a.store.state.paused=true;if(scenario==='claim')a.claim.work.id='foreign';if(scenario==='provider-base')a.setBase('c'.repeat(40));
   return scenario==='unknown-object'?'unexpected diagnostic':`${a.base} ${scenario==='wrong-object-type'?'tree':'missing'}`;
  }
  if(cacheRead&&program==='git'&&args[0]==='remote'&&scenario==='foreign-origin')return 'https://github.com/foreign/owner.git';
  return execute(program,args,options);
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.execute.mock.calls.some(([p,args])=>p==='git'&&args[0]==='fetch')).toBe(false);expect(a.run).not.toHaveBeenCalled();expect(a.job.scopeRepairResumes).toBeUndefined();expect(JSON.stringify(a.job)).toBe(before);
});
test.each(['pause','claim','candidate-head','origin','provider-base','absent-after-fetch','fetch-failure'])('amendment resume refuses changed or unresolved cache fetch: %s',async scenario=>{
 const a=amendmentFixture(),execute=a.execute.getMockImplementation()!,before=JSON.stringify(a.job);let fetched=false;
 a.execute.mockImplementation(async(program,args,options)=>{
  if(program==='git'&&args[0]==='cat-file')return `${a.base} ${fetched&&scenario!=='absent-after-fetch'?'commit':'missing'}`;
  if(program==='git'&&args[0]==='fetch'){
   fetched=true;if(scenario==='pause')a.store.state.paused=true;if(scenario==='claim')a.claim.work.id='foreign';if(scenario==='provider-base')a.setBase('c'.repeat(40));if(scenario==='fetch-failure')throw Error('Exact object cache transport failed');return '';
  }
  if(fetched&&program==='git'&&args[0]==='rev-parse'&&scenario==='candidate-head')return 'c'.repeat(40);
  if(fetched&&program==='git'&&args[0]==='remote'&&scenario==='origin')return `git@github.com:${a.store.project.repository}.git`;
  return execute(program,args,options);
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.execute.mock.calls.filter(([p,args])=>p==='git'&&args[0]==='fetch')).toHaveLength(1);expect(a.run).not.toHaveBeenCalled();expect(a.job.scopeRepairResumes).toBeUndefined();expect(JSON.stringify(a.job)).toBe(before);expect(a.intent.status).toBe('working');
});
test('fresh amendment resume proves current approved composition while preserving the blocked audit, 29 representations and all gates',async()=>{
 const a=amendmentFixture(),oldRequest={...structuredClone(a.intent),id:'old-negative-intent',status:'blocked',detail:'Historical topic conflict'},oldAudit={...a.original,id:'old-negative-reader',sessionId:'old-negative-native-session',claimId:'old-negative-claim',role:'lead',provider:'codex',stage:'scope-repair-resume-readback',status:'blocked'};
 a.store.state.coordination!.requests!.push(oldRequest as any);a.store.state.workLog!.push(oldAudit as any);a.workerFiles(oldAudit,{outcome:'blocked',repairWithinExistingScope:false,noHumanHold:false},true,'reconciliation',oldRequest.id);
 a.store.state.it={reports:[],recoveries:{'consumed-material-key':{attempts:1,status:'needs-human'}}}as any;
 const retained=JSON.stringify({oldRequest,oldAudit,it:a.store.state.it,steps:a.job.steps,cycle:a.job.repairCycle}),raw=readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8');
 const records=[];for(let i=0;i<27;i++)records.push({type:'assistant',sessionId:a.original.sessionId,cwd:a.job.worktree,uuid:`call-${i}`,message:{content:[{type:'tool_use',id:`read-${i}`,name:'Read',input:{file_path:a.raw.evidence[0].path}}]}},{type:'user',sessionId:a.original.sessionId,cwd:a.job.worktree,parentUuid:`call-${i}`,message:{content:[{type:'tool_result',tool_use_id:`read-${i}`,content:'Retained original read'}]}});
 a.nativeRecords.splice(2,0,...records);a.saveNative();expect(scopeRepairResumeCandidate(a.store,a.job)!.native.calls).toHaveLength(29);
 await a.reconcile();expect(a.run).toHaveBeenCalledOnce();expect(a.intent.status).toBe('completed');expect(a.job).toMatchObject({stage:'scope-repair',status:'queued',approach:{review:'full',validation:'independent-checks'}});
 const proof=JSON.parse(readFileSync(a.job.scopeRepairResumes[0].proofPath,'utf8')),direction=proof.technicalDirection,topic=direction.files.find((f:any)=>f.path===a.topic);
 expect(direction).toMatchObject({authorizationId:a.job.sourceAmendment.id,proposalFilesSha256:a.job.sourceAmendment.proposalFilesSha256,originalBase:GH91.originalBase,proposalHead:GH91.originalHead,providerBase:a.base});
 for(const line of ['- Catalog binds 55 sources.','- Current #114 guidance.','- Current #115 guidance.','- Approved release-index guidance.'])expect(topic.expectedText.split('\n').filter((l:string)=>l===line)).toHaveLength(1);
 expect(sourceHash(topic.expectedText)).toBe(topic.expectedSha256);expect(proof.assessment.callEffects).toHaveLength(29);expect(proof.candidate.every((c:any)=>digest(c.technicalDirection)===digest(direction))).toBe(true);
 expect(scopeRepairResumeInstruction(a.store,a.job)).toContain(a.job.scopeRepairResumes[0].proofPath);expect(scopeRepairResumeInstruction(a.store,a.job)).toContain(digest(direction));expect(scopeRepairResumeNextStage(a.job)).toBe('review');
 expect(JSON.stringify({oldRequest,oldAudit,it:a.store.state.it,steps:a.job.steps,cycle:a.job.repairCycle})).toBe(retained);expect(readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8')).toBe(raw);
 expect(a.run.mock.calls[0][1]).toContain('Historical technical conflicts');expect(a.run.mock.calls[0][1]).toContain('does not prove the actual candidate');
});
test.each(['overlap','frozen-proposal','frozen-digest','foreign-git-path','symlink-blob','actual-human-hold'])('current amendment direction refuses %s before audit',async scenario=>{
 const a=amendmentFixture();if(scenario==='overlap')a.current[a.topic]=a.current[a.topic].replace('54','56');if(scenario==='frozen-proposal')a.frozen.proposal[a.topic]+='Changed frozen proposal\n';if(scenario==='frozen-digest')a.job.sourceAmendment.proposalFilesSha256='0'.repeat(64);if(scenario==='actual-human-hold')HOLDS[a.job.key]='Current explicit human hold';
 if(['foreign-git-path','symlink-blob'].includes(scenario)){const execute=a.execute.getMockImplementation()!;a.execute.mockImplementation(async(program,args,options)=>program==='git'&&args[0]==='ls-tree'?`${scenario==='symlink-blob'?'120000':'100644'} blob ${'a'.repeat(40)}\t${scenario==='foreign-git-path'?'outside-scope.ts':args[3]}\n`:execute(program,args,options));}
 await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(a.job.scopeRepairResumes).toBeUndefined();
});
test.each(['after','final','direction-ack','canonical-human-hold'])('amendment direction/authorization drift refuses %s without accepting the old result',async scenario=>{
 const a=amendmentFixture();
 a.run.mockImplementation(async(_role,prompt)=>{const result=a.assessment(prompt,scenario==='direction-ack'?{technicalDirectionSha256:'f'.repeat(64)}:scenario==='canonical-human-hold'?{outcome:'blocked',noHumanHold:false}:{});if(scenario==='after')a.current[a.topic]=a.current[a.topic].replace('## Later evidence','- A changed current-base addition.\n## Later evidence');return result as any;});
 if(scenario==='final'){const api=vi.mocked(a.delivery.api).getMockImplementation()!;let count=0;vi.mocked(a.delivery.api).mockImplementation(async(path:string)=>{if(path.startsWith('commits/')&&++count===3)a.current[a.topic]=a.current[a.topic].replace('## Later evidence','- Late current-base addition.\n## Later evidence');return api(path);});}
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.status).toBe('blocked');expect(a.job.scopeRepairResumes).toBeUndefined();expect(a.intent.status).toBe('working');expect(a.original.status).toBe('blocked');
});
test('a deliberately new intent preserves blocked history and deduplicates queued, working and completed resume requests',()=>{
 const a=fixture();a.intent.status='blocked';const previous=JSON.stringify(a.intent),cycle=JSON.stringify(a.job.repairCycle),fresh=enqueueRequest(a.store,'reconcile-scope-repair',a.job.key,a.original.id);
 expect(fresh.id).not.toBe(a.intent.id);for(const status of ['queued','working','completed']as const){fresh.status=status;expect(enqueueRequest(a.store,'reconcile-scope-repair',a.job.key,a.original.id).id).toBe(fresh.id);}
 expect(JSON.stringify(a.intent)).toBe(previous);expect(JSON.stringify(a.job.repairCycle)).toBe(cycle);expect(a.run).not.toHaveBeenCalled();
});
test('existing exact-original action resumes one same candidate atomically and preserves raw findings, old head and counters',async()=>{
 const a=fixture(),steps=JSON.stringify(a.job.steps),work=JSON.stringify(a.original),native=readFileSync(a.nativePath,'utf8'),result=readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8'),claims=a.store.db.prepare('SELECT body FROM work_claims').all();
 expect(scopeRepairResumeCandidate(a.store,a.job)?.work.id).toBe('original');await a.reconcile();
 expect(a.job).toMatchObject({status:'queued',stage:'scope-repair',head:a.head,candidateRecovery:{head:a.base,findingIds:['original-finding','additional-finding']},repairCycle:{attempts:2,findingAttempts:{'original-finding':1}},approach:{review:'full',validation:'independent-checks'}});
 expect(a.job.scopeRepairResumes).toHaveLength(1);expect(a.job.scopeRepairResumes[0]).toMatchObject({originalWorkId:'original',intentId:a.intent.id,head:a.head,afterStep:2});expect(a.intent.status).toBe('completed');
 const proof=JSON.parse(readFileSync(a.job.scopeRepairResumes[0].proofPath,'utf8'));expect(proof.findings).toEqual(a.raw.findings);expect(proof.originalClaimRows).toEqual(claims);
 expect(JSON.stringify(a.job.steps)).toBe(steps);expect(JSON.stringify(a.original)).toBe(work);expect(readFileSync(a.nativePath,'utf8')).toBe(native);expect(readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8')).toBe(result);
 expect(enqueueRequest(a.store,'reconcile-scope-repair',a.job.key,'original').id).toBe(a.intent.id);await expect(a.reconcile()).rejects.toThrow('Exact stopped');expect(a.run).toHaveBeenCalledTimes(1);
 expect(scopeRepairResumeInstruction(a.store,a.job)).toContain('additional-finding');expect(scopeRepairResumeNextStage(a.job)).toBe('review');
});
test.each(['brain','native-continuation','discovery','saved-prerequisite','published','active-worker','failed-transport','missing-completion','bad-completion','native-incomplete','native-duplicate','changed-original-claim','wrong-original-stage','wrong-assignment','unknown-finding-loss','duplicate-finding','uncertain-receipt','attempted-effect','uncertain-effect','exhausted'])('refuses unsafe original before any audit: %s',async kind=>{
 const a=fixture();
 if(kind==='brain')(a.store.project as any).id='brain';if(kind==='native-continuation')a.job.implementationContinuation={};if(kind==='discovery')a.job.discoveryRecovery={};if(kind==='saved-prerequisite')a.job.savedPrerequisiteHandoff={};if(kind==='published')a.job.pr=5;
 if(kind==='active-worker')a.original.status='running';if(kind==='failed-transport')a.original.executionStatus='failed';if(kind==='missing-completion')rmSync(resolve(a.root,'sessions/original/execution-completion.json'));if(kind==='bad-completion')a.put('original','execution-completion.json',{});
 if(kind==='native-incomplete'){a.nativeRecords.pop();a.saveNative();}if(kind==='native-duplicate'){a.nativeRecords.push({...a.nativeRecords[0],message:{content:[{type:'tool_use',id:'read',name:'Read',input:{file_path:'different'}}]}});a.saveNative();}
 if(kind==='changed-original-claim'){a.oldClaim.status='running';a.saveClaim();}if(kind==='wrong-original-stage'){a.oldClaim.stage='implement';a.saveClaim();}if(kind==='wrong-assignment')a.put('original','assignment.json',{});
 if(kind==='unknown-finding-loss'){a.job.candidateRecovery.findingIds.push('missing');}if(kind==='duplicate-finding'){a.raw.findings.push(a.raw.findings[0]);a.workerFiles(a.original,a.raw,false);}if(kind==='uncertain-receipt'){a.raw.receipts.push({id:'write',action:'push',target:'remote',verified:false,uncertain:true,detail:''});a.workerFiles(a.original,a.raw,false);}
 if(kind==='attempted-effect'||kind==='uncertain-effect')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect','scope-project:delivery:job',kind==='uncertain-effect'?'uncertain':'verified',JSON.stringify({status:kind==='uncertain-effect'?'uncertain':'verified',dispatchedAt:'2026-10-30T00:00:00Z'}));
 if(kind==='exhausted')a.job.repairCycle.phase='diagnosis';
 expect(scopeRepairResumeCandidate(a.store,a.job)).toBeUndefined();await expect(a.reconcile()).rejects.toThrow();expect(a.run).not.toHaveBeenCalled();expect(a.job.scopeRepairResumes).toBeUndefined();
});
test.each(['pause','claim','owner','input','issue','comments','board','head','provider-base','published','native','original-claim','uncertain-effect','missing-call','duplicate-call','wrong-hash','external','no-scope'])('refuses changed/unknown audit or current inputs: %s',async kind=>{
 const a=fixture();const original=a.execute.getMockImplementation()!;
 a.run.mockImplementation(async()=>{const r=a.readback();
  if(kind==='pause')a.store.state.paused=true;if(kind==='claim')a.claim.work.id='foreign';if(kind==='owner')a.ownership.mockResolvedValue({complete:true,fresh:true,ownership:{status:'conflict'}});
  if(kind==='input'){a.store.state.messages.push({id:'human',from:'human',to:'pm',ticket:a.job.key,status:'answered',body:'Changed human scope',error:''}as any,{id:'pm',requestId:'human',from:'pm',ticket:a.job.key,status:'answered',error:'',receipts:[]}as any);a.store.state.projectNotes.push({id:'new',ticket:a.job.key,requestId:'human',summary:'Changed human scope',createdAt:'2026-10-30T00:06:00Z'}as any);}
  if(kind==='issue')a.issue.body='Changed scope';if(kind==='comments')a.comments.push({id:1,issue_url:'https://api.github.com/repos/example/scoped/issues/42',html_url:'https://github.com/example/scoped/issues/42#issuecomment-1',body:'Changed human input',user:{login:'JFusco'},author_association:'OWNER',created_at:'2026-10-30T00:00:00Z',updated_at:'2026-10-30T00:00:00Z'});
  if(kind==='board')a.board.items[0].status='Backlog';if(kind==='head')a.setHead('c'.repeat(40));if(kind==='provider-base')a.setBase('c'.repeat(40));if(kind==='published')a.setRemote('b\trefs/heads/codex/scoped-repair');if(kind==='native')writeFileSync(a.nativePath,'changed');if(kind==='original-claim'){a.oldClaim.owner='foreign';a.saveClaim();}
  if(kind==='uncertain-effect')a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect','scope-project:delivery:job','uncertain',JSON.stringify({status:'uncertain'}));
  if(kind==='missing-call')r.callEffects.pop();if(kind==='duplicate-call')r.callEffects[1]=r.callEffects[0];if(kind==='wrong-hash')r.callEffects[0].inputSha256='f'.repeat(64);if(kind==='external')r.callEffects[0].classification='external';if(kind==='no-scope')r.repairWithinExistingScope=false;return r as any;
 });
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.status).toBe('blocked');expect(a.job.scopeRepairResumes).toBeUndefined();expect(a.intent.status).toBe('working');expect(a.job.candidateRecovery.findingIds).toEqual(['original-finding']);
});
test('admitted exact claim may finish a drain while pause remains a hard fence',async()=>{const a=fixture();a.run.mockImplementation(async()=>{const result=a.readback();a.store.state.draining=true;return result as any;});await a.reconcile();expect(a.job.status).toBe('queued');expect(a.store.state.draining).toBe(true);});
test('queue, provenance and request completion roll back together without altering raw negative evidence',async()=>{const a=fixture(),job=structuredClone(a.job),intent=structuredClone(a.intent);vi.spyOn(a.store,'emit').mockImplementation(()=>{throw new Error('Injected persistence failure');});await expect(a.reconcile()).rejects.toThrow('Injected');expect(a.store.state.coordination!.jobs![0]).toEqual(job);expect(a.store.state.coordination!.requests!.find(r=>r.id===intent.id)).toEqual(intent);expect(JSON.parse(readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8')).result.outcome).toBe('blocked');});
test.each(['missing','open','duplicate','qa-not-verified'])('every resumed finding remains required through independent stages: %s',async kind=>{const a=fixture();await a.reconcile();const r=structuredClone(a.raw);r.outcome='passed';r.findings.forEach((f:any)=>f.status='verified');if(kind==='missing')r.findings.pop();if(kind==='open')r.findings[1].status='open';if(kind==='duplicate')r.findings.push(r.findings[1]);if(kind==='qa-not-verified')r.findings[1].status='fixed';expect(()=>assertScopeRepairResumeFindings(a.store,a.job,'validate',r,new Set())).toThrow('explicit independent dispositions');});
test('a proven outside hold stays OPEN while all other findings resolve, without modifying the native result',async()=>{const a=fixture();await a.reconcile();const r=structuredClone(a.raw);r.findings[0].status='verified';const before=JSON.stringify(r);expect(()=>assertScopeRepairResumeFindings(a.store,a.job,'validate',r,new Set(['additional-finding']))).not.toThrow();expect(JSON.stringify(r)).toBe(before);});
test('old same-head reviews cannot skip the newly required independent stages',async()=>{const a=fixture();a.job.steps.unshift({stage:'review',workerId:'old',result:{...a.raw,outcome:'passed'}},{stage:'validate',workerId:'older',result:{...a.raw,outcome:'passed'}});await a.reconcile();expect(scopeRepairResumeNextStage(a.job)).toBe('review');a.job.steps.push({stage:'review',workerId:'new',result:{...a.raw,outcome:'passed'}});a.job.stage='review';expect(scopeRepairResumeNextStage(a.job)).toBe('validate');a.job.steps.push({stage:'validate',workerId:'new-qa',result:{...a.raw,outcome:'passed'}});a.job.stage='validate';expect(scopeRepairResumeNextStage(a.job)).toBe('draft');});
test.each(['proof','metadata','old-result','old-claim','native','input'])('saved resume provenance cannot be changed before the next worker: %s',async kind=>{const a=fixture();await a.reconcile();if(kind==='proof')writeFileSync(a.job.scopeRepairResumes[0].proofPath,'{}');if(kind==='metadata')a.job.scopeRepairResumes[0].findingIds.pop();if(kind==='old-result')a.put('original','result.json',{});if(kind==='old-claim'){a.oldClaim.owner='changed';a.saveClaim();}if(kind==='native')writeFileSync(a.nativePath,'changed');if(kind==='input'){a.store.state.messages.push({id:'human',from:'human',to:'pm',ticket:a.job.key,status:'answered',body:'Changed human scope',error:''}as any,{id:'pm',requestId:'human',from:'pm',ticket:a.job.key,status:'answered',error:'',receipts:[]}as any);a.store.state.projectNotes.push({id:'changed',ticket:a.job.key,requestId:'human',summary:'New human scope'}as any);}expect(()=>scopeRepairResumeInstruction(a.store,a.job)).toThrow();});

async function deliveryStages(a:ReturnType<typeof fixture>,mutate?:(stage:string,result:any)=>void){
 vi.spyOn(ProjectProgress.prototype,'reconcile').mockResolvedValue(undefined);vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
 const roles:string[]=[],next='c'.repeat(40);let count=0;
 a.run.mockImplementation(async(role,prompt)=>{
  const stage=a.job.stage;roles.push(role);expect(prompt).toContain('additional-finding');expect(prompt).toContain('RESUMED SCOPE-REPAIR FINDINGS');
  const result=structuredClone(a.raw);Object.assign(result,{outcome:'passed',blocker:'',commit:next});result.evidence[0].commit=next;result.evidence[0].kind=stage==='review'?'review':'checks';result.findings.forEach((f:any)=>f.status=stage==='validate'?'verified':'fixed');
  mutate?.(stage,result);if(stage==='scope-repair')a.setHead(next);
  const worker:any={...a.original,id:`stage-${++count}`,sessionId:role==='developer'?`stage-${count}`:`native-stage-${count}`,role,provider:role==='developer'?'claude':'codex',stage:`github-${stage}`,claimId:a.claim.id,status:'completed',processId:2147483645,endedAt:'2026-10-30T00:07:00Z'};
  const failedTransport=(result as any).fixtureTransportFailure;delete (result as any).fixtureTransportFailure;a.store.state.workLog!.push(worker);a.workerFiles(worker,result,stage==='review');if(failedTransport){rmSync(resolve(a.root,'sessions',worker.id,'execution-completion.json'));}return result as any;
 });
 while(['scope-repair','review','validate'].includes(a.job.stage)&&a.job.status==='queued'&&count<3){
  Object.assign(a.claim,{work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},stage:a.job.stage});await withAssignment(a.claim,'delivery',()=>a.delivery.step(a.job));
 }
 return roles;
}
test('actual delivery step carries every finding through repair, a fresh full review and independent QA before draft',async()=>{
 const a=fixture();await a.reconcile();const old=JSON.stringify(a.job.steps);const roles=await deliveryStages(a);
 expect(roles,a.job.detail).toEqual(['developer','lead','qa']);expect(a.job).toMatchObject({stage:'draft',status:'queued',head:'c'.repeat(40)});expect(JSON.stringify(a.job.steps.slice(0,2))).toBe(old);expect(a.job.steps.filter((s:any)=>['review','validate'].includes(s.stage)).every((s:any)=>!!s.workerId)).toBe(true);expect(a.execute.mock.calls.some(([p,args])=>p==='git'&&['push','commit','fetch'].includes(args[0]))).toBe(false);
});
test.each(['review-missing','qa-unverified','approach-downgrade','reroute'])('actual delivery caller cannot bypass a resumed independent gate: %s',async kind=>{
 const a=fixture();await a.reconcile();const roles=await deliveryStages(a,(stage,result)=>{
  if(kind==='review-missing'&&stage==='review')result.findings.pop();
  if(kind==='qa-unverified'&&stage==='validate')result.findings[1].status='fixed';
  if(kind==='approach-downgrade'&&stage==='scope-repair')result.approach={plan:'none',review:'none',validation:'developer-checks',checks:['Focused'],reason:'Skip original failure'};
  if(kind==='reroute'&&stage==='scope-repair'){result.outcome='reroute';result.approach={plan:'none',review:'full',validation:'independent-checks',checks:['Focused'],reason:'Route elsewhere'};}
 });
 expect(a.job.status).toBe('blocked');expect(a.job.stage).not.toBe('draft');expect(a.job.scopeRepairResumes).toHaveLength(1);expect(JSON.parse(readFileSync(resolve(a.root,'sessions/original/result.json'),'utf8')).result.outcome).toBe('blocked');expect(roles.length).toBeLessThanOrEqual(3);
});

test('saved resume proof retains display/wire references and owned artifact CWD identity across JSON persistence',async()=>{
 const a=fixture(),dir=resolve(a.root,'ticket-work/job/tools');mkdirSync(dir);
 const issued=a.nativeRecords[0],output=a.nativeRecords[1];issued.wireToolInputs={read:{file_path:resolve(a.root,'ticket-work/job/other.log')}};issued.cwd=dir;output.cwd=dir;output.uuid='result-read';
 a.nativeRecords.splice(2,0,{type:'api-request-blob',sessionId:'original',hash:'e'.repeat(64),message:{role:'assistant',content:[{...issued.message.content[0],input:issued.wireToolInputs.read}]}},{type:'api-request-blob',sessionId:'original',hash:'f'.repeat(64),message:{role:'user',content:[output.message.content[0]]}});a.saveNative();
 await a.reconcile();expect(scopeRepairResumeInstruction(a.store,a.job)).toContain('additional-finding');
 const proof=JSON.parse(readFileSync(a.job.scopeRepairResumes[0].proofPath,'utf8'));expect(proof.nativeInputBindings[0].inputRepresentations).toHaveLength(2);expect(proof.assessment.callEffects).toHaveLength(3);expect(proof.nativeArtifactCwd.directories[0].path).toBe(dir);
 renameSync(dir,dir+'-retained');mkdirSync(dir);expect(()=>scopeRepairResumeInstruction(a.store,a.job)).toThrow('CWD ownership changed');
});
test('a resume audit must independently classify the distinct wire representation, not only its display input',async()=>{
 const a=fixture(),issued=a.nativeRecords[0];issued.wireToolInputs={read:{file_path:resolve(a.root,'ticket-work/job/other.log')}};a.nativeRecords[1].uuid='result-read';
 a.nativeRecords.splice(2,0,{type:'api-request-blob',sessionId:'original',hash:'e'.repeat(64),message:{role:'assistant',content:[{...issued.message.content[0],input:issued.wireToolInputs.read}]}});a.saveNative();
 a.run.mockImplementation(async()=>{const result=a.readback();result.callEffects=result.callEffects.filter((r:any)=>r.id!==JSON.stringify(['read','wire']));return result as any;});
 await expect(a.reconcile()).rejects.toThrow();expect(a.job.status).toBe('blocked');expect(a.job.scopeRepairResumes).toBeUndefined();
});

test('actual resumed review cannot advance without confirmed completed execution transport',async()=>{const a=fixture();await a.reconcile();await deliveryStages(a,(stage,result)=>{if(stage==='review')(result as any).fixtureTransportFailure=true;});expect(a.job.status).toBe('blocked');expect(a.job.stage).toBe('review');expect(a.job.detail).toContain('completed actual independent');});

test('a display-only resume audit is refused for an issued wire input without any history blob',async()=>{
 const a=fixture();a.nativeRecords[0].wireToolInputs={read:{file_path:resolve(a.root,'ticket-work/job/other.log')}};a.nativeRecords[1].uuid='result-read';a.saveNative();
 expect(scopeRepairResumeCandidate(a.store,a.job)!.native.calls[0].inputRepresentations).toHaveLength(2);
 a.run.mockImplementation(async()=>{const result=a.readback();result.callEffects=result.callEffects.filter((r:any)=>r.id!==JSON.stringify(['read','wire']));return result as any;});
 await expect(a.reconcile()).rejects.toThrow();expect(a.run).toHaveBeenCalledOnce();expect(a.job.status).toBe('blocked');expect(a.job.scopeRepairResumes).toBeUndefined();expect(a.intent.status).toBe('working');
});

test.each(['review','validate']as const)('resumed amendment %s requires completed transport and its current scheduler claim',async stage=>{
 // Isolate transport/claim admission; amendment authorization and outside scope have their own suites.
 for(const scenario of ['missing-completion','foreign-claim','current-claim']){
  const a=fixture();await a.reconcile();a.job.stage=stage;a.job.sourceAmendment={id:'retained-amendment',authorization:{},receipts:[]};
  vi.spyOn(amendments,'amendmentInstruction').mockReturnValue('Retained amendment authorization');vi.spyOn(amendments,'requireSourceAmendmentAcceptance').mockResolvedValue(undefined);
  vi.spyOn(held,'outsideAmendmentFindingIds').mockResolvedValue(new Set(['additional-finding']));
  vi.spyOn(ProjectProgress.prototype,'reconcile').mockResolvedValue(undefined);vi.spyOn(ProjectProgress.prototype,'reviewStarted').mockResolvedValue(undefined);
  Object.assign(a.claim,{work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},stage});
  const result=structuredClone(a.raw);Object.assign(result,{outcome:'passed',blocker:''});result.findings[0].status='verified';result.evidence[0].kind=stage==='review'?'review':'checks';
  a.run.mockImplementation(async role=>{const worker={...a.original,id:'amendment-'+stage,sessionId:'amendment-native-'+stage,role,provider:'codex',stage:'github-'+stage,status:'completed',claimId:scenario==='foreign-claim'?'foreign-claim':a.claim.id};a.store.state.workLog!.push(worker as any);a.workerFiles(worker,result,stage==='review');if(scenario==='missing-completion')rmSync(resolve(a.root,'sessions',worker.id,'execution-completion.json'));return structuredClone(result)as any;});
  await withAssignment(a.claim,'delivery',()=>a.delivery.step(a.job));
  if(scenario==='current-claim'){
   expect(a.job.status,a.job.detail).toBe('queued');expect(a.job.stage).toBe(stage==='review'?'validate':'review');
   expect(a.job.steps.at(-1)).toMatchObject({workerId:'amendment-'+stage,nativeResultSha256:sourceHash(sourceJson(result))});expect(a.job.steps.at(-1).result.findings[1].status).toBe('open');expect(a.job.scopeRepairResumes).toHaveLength(1);
  }else{expect(a.job).toMatchObject({stage,status:'blocked'});expect(a.job.detail).toContain(scenario==='missing-completion'?'One completed actual independent resumed scope-repair worker required':'Resumed independent result/claim differs');}
  vi.restoreAllMocks();
 }
});
