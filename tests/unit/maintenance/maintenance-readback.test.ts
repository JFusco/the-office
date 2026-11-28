import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {z} from 'zod';
import {Store} from '../../../server/store/store';
import {projectById} from '../../../server/office/projects';
import {withAssignment} from '../../../server/workers/assignment-context';
import {workerProfile} from '../../../server/workers/worker-profiles';
import * as processes from '../../../server/workers/process';
import * as readback from '../../../server/maintenance/maintenance-readback';
import {GitHubMaintenance} from '../../../server/maintenance/maintenance';
import {assertStrictOutputSchema} from '../../../server/workers/structured-output';
import {artifact} from '../../../server/store/readback-evidence';
const fixtures:{root:string;store:Store}[]=[];
const launchRecord=(workerId:string,stage:string,policy:string,cwd:string)=>({workerId,stage,policy,cwd,
 executable:{path:'/cli',realpath:'/cli',version:'1',sha256:'a'.repeat(64)},recordSha256:'b'.repeat(64),args:['exec'],at:'2026-11-28T00:00:00Z'});
afterEach(()=>{vi.restoreAllMocks();for(const f of fixtures.splice(0)){f.store.close();rmSync(f.root,{recursive:true,force:true});}});
function fixture({projectId='brain',stage='brain-maintenance',claimStage=stage,readOnly=false}:{projectId?:string;stage?:string;claimStage?:string;readOnly?:boolean}={}){
 const root=mkdtempSync(resolve(tmpdir(),'office-maint-readback-')),store=new Store(':memory:',{...projectById(projectId),repo:root},resolve(root,'office'));fixtures.push({root,store});
 const run:any={id:'run-original',requestedAt:'',startedAt:'2026-10-30T23:00:00Z',endedAt:'2026-10-30T23:05:00Z',status:'blocked',weekly:false,stage,error:'Original surviving-process uncertainty',steps:[],readbackRetry:{attempts:3,nextAt:'',history:[{at:'before',detail:'Original failure'}],exhausted:true}};
 store.state.maintenance={runs:[run],lastDaily:'',lastWeekly:'',ledger:'historical ledger'};
 const claim=store.claimWork({projectId,kind:'maintenance',id:run.id},'original-owner',claimStage)!;store.finishClaim(claim.id,'completed');
 const work:any={id:'worker-original',role:'pm',ticket:'',task:'Synthetic maintenance',stage,requestId:run.id,claimId:claim.id,lane:'delivery',provider:'codex',sessionId:'session-original',status:'failed',startedAt:run.startedAt,lastHeartbeatAt:run.endedAt,endedAt:run.endedAt,processId:2147483500,elapsedMs:300000,queuedMs:0,inputTokens:null,outputTokens:null,model:'',effort:'',durationUncertain:false,reportedAt:''};store.state.workLog=[work];
 const receipt={id:'original-write',action:'publish',target:'https://example.invalid/exact-original',verified:true,uncertain:false,detail:'Saved historical receipt'};
 const checkpoint={outcome:'completed',runId:'native-run',reason:'complete',summary:'Synthetic original claimed completion',ledger:'Full native evidence still required',receipts:[receipt]};
 const dir=resolve(store.dataRoot,'sessions',work.id);mkdirSync(dir,{recursive:true});const put=(name:string,value:unknown)=>writeFileSync(resolve(dir,name),JSON.stringify(value));
 const profile=workerProfile(work.stage,readOnly);
 put('assignment.json',{id:work.id,claimId:claim.id,lane:'delivery',stage:work.stage,role:work.role,work:claim.work,scope:{repository:store.project.repository,worktree:root,artifacts:dir},profile:profile.name});
 put('assignment-identity.json',{attemptId:work.id,requestId:run.id,projectId,repository:store.project.repository,role:'pm',threadId:work.sessionId});
 put('provider.json',{project:projectId,repository:store.project.repository,provider:'codex',role:'pm',readOnly});put('capabilities.json',profile);put('error.json',{session:work.sessionId,provider:'codex',error:run.error});put('completed-output.json',checkpoint);
 run.steps=[{role:'pm',stage:'maintenance-readback',at:'before',result:{outcome:'blocked',summary:'Old reader',ledger:'old',blocker:'Native evidence not inspected',receipts:[{...receipt,id:'previous-disposition',verified:false,uncertain:true}],candidates:[]}}];
 const nativeRoot=resolve(root,'native'),nativeDir=resolve(nativeRoot,'2026/10/30');mkdirSync(nativeDir,{recursive:true});const nativePath=resolve(nativeDir,`rollout-${work.sessionId}.jsonl`);
 const records:any[]=[{type:'session_meta',payload:{id:work.sessionId,cwd:root}},
  {type:'response_item',payload:{type:'custom_tool_call',call_id:'execute',name:'exec',input:'Synthetic async command'}},
  {type:'response_item',payload:{type:'custom_tool_call_output',call_id:'execute',output:{session_id:42}}},
  {type:'response_item',payload:{type:'custom_tool_call',call_id:'poll',name:'exec',input:'Synthetic terminal poll42'}},
  {type:'response_item',payload:{type:'custom_tool_call_output',call_id:'poll',output:{exit_code:0}}},
  {type:'response_item',payload:{type:'function_call',call_id:'delegate',name:'spawn_agent',arguments:'Synthetic delegated read-only review'}},
  {type:'response_item',payload:{type:'function_call_output',call_id:'delegate',output:{task_name:'review',completed:true}}},
  {type:'event_msg',payload:{type:'task_complete',last_agent_message:JSON.stringify(checkpoint)}}];
 const nativeSave=()=>writeFileSync(nativePath,records.map(x=>JSON.stringify(x)).join('\n')+'\n');nativeSave();
 const readerClaim=store.claimWork({projectId,kind:'reconciliation',id:`recovery:${run.id}`},'reader-owner','maintenance-readback')!;
 vi.spyOn(processes,'processGroupAlive').mockReturnValue(false);
 const roots={codex:nativeRoot,claude:resolve(root,'claude')};const owned=<T>(fn:()=>T)=>withAssignment(readerClaim,'delivery',fn);const prepare=()=>owned(()=>readback.prepareMaintenanceReadback(store,run,roots));
 return {root,store,run,work,dir,put,records,nativePath,nativeSave,roots,readerClaim,owned,prepare};
}
function passed(p:readback.MaintenanceReadback['packet']){
 return {originalWorkId:p.originalWorkId,nativeSha256:p.native.file.sha256,completeNativeExecution:true,asyncCommandsComplete:true,delegatedTasksComplete:true,allAttemptedEffectsKnown:true,freshProviderDispositions:true,
 calls:p.calls.map(c=>({id:c.id,inputSha256:c.inputSha256,verified:true,uncertain:false,evidence:'Synthetic full native/output/session and delegated terminal evidence'})),receipts:p.receipts.map(r=>({id:r.id,receiptSha256:r.receiptSha256,verified:true,uncertain:false,evidence:'Synthetic exact current provider disposition'}))};
}
test('maintenance input binds original negative artifacts, native path/calls and every checkpoint/old-run receipt without changing history',()=>{
 const f=fixture(),before=JSON.stringify(f.run),raw=readFileSync(resolve(f.dir,'error.json')),proof=f.prepare();
 expect(proof.packet.calls.map(c=>c.id)).toEqual(['execute','poll','delegate']);expect(proof.packet.native.file.path).toBe(f.nativePath);expect(proof.packet.originalStatus).toBe('failed');
 expect(proof.packet.receipts.map(r=>r.originalId)).toEqual(['original-write','original-write','previous-disposition']);expect(proof.packet.files.map(f=>f.path)).toContain(resolve(f.dir,'completed-output.json'));
 f.owned(()=>proof.assertCurrent());expect(JSON.stringify(f.run)).toBe(before);expect(readFileSync(resolve(f.dir,'error.json'))).toEqual(raw);expect(f.work.status).toBe('failed');
});
test('later CMS worker stage retains the prior scheduler claim stage and full native call inventory',()=>{
 const f=fixture({projectId:'cms-field-vocabulary',stage:'vendor-review',claimStage:'follow-up',readOnly:true}),proof=f.prepare();
 expect(proof.packet.originalClaim.stage).toBe('follow-up');expect(proof.packet.assignment.stage).toBe('vendor-review');expect(proof.packet.originalStatus).toBe('failed');
 expect(proof.packet.calls.map(c=>c.id)).toEqual(['execute','poll','delegate']);f.owned(()=>proof.assertClaimed());
});
test('completed CMS follow-up with a passed uncertain result needs fresh exhaustive effect verification without write replay',async()=>{
 const f=fixture({projectId:'cms-field-vocabulary',stage:'follow-up'}),prepare=readback.prepareMaintenanceReadback;
 vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 const result={outcome:'passed',approach:null,checks:[],summary:'Original follow-up claimed success',ledger:'Unfinished maintenance',blocker:'',receipts:[{id:'original-write',action:'gh issue comment',target:'https://example.invalid/exact-original',verified:false,uncertain:true,detail:'Write disposition unknown'}],candidates:[]};
 f.work.status='completed';f.work.executionStatus='completed';unlinkSync(resolve(f.dir,'error.json'));
 f.put('result.json',{session:f.work.sessionId,provider:'codex',result});f.put('completed-output.json',result);
 f.put('execution-completion.json',{workerId:f.work.id,session:f.work.sessionId,provider:'codex',resultSha256:artifact(f.store,resolve(f.dir,'result.json')).sha256});
 f.records.at(-1).payload.last_agent_message=JSON.stringify(result);f.nativeSave();
 mkdirSync(resolve(f.store.dataRoot,'handover'),{recursive:true});writeFileSync(resolve(f.store.dataRoot,'handover/policies.json'),JSON.stringify([{id:'fixture',prompt:'Synthetic local policy',memory:''}]));
 f.run.status='queued';f.run.error='';f.run.steps=[];
 const agents={active:new Set(),run:vi.fn(async(_role,_prompt,schema,_opts)=>schema.parse(result))},execute=vi.fn(),maintenance=new GitHubMaintenance(f.store,agents as any,execute as any);
 await maintenance.pump(f.run.id);
 expect(f.run.status).toBe('blocked');expect(f.run.error).toContain('Unverified follow-up');expect(agents.run).toHaveBeenCalledTimes(1);
 const worker=structuredClone(f.work),step=structuredClone(f.run.steps[0]),history=structuredClone(f.run.readbackRetry),saved=readFileSync(resolve(f.dir,'result.json')),native=readFileSync(f.nativePath);
 const proof=f.prepare(),packet=proof.packet;
 expect(packet.originalStatus).toBe('completed');expect(packet.originalClaim.stage).toBe('follow-up');expect(packet.assignment.stage).toBe('follow-up');
 expect(packet.calls.map(c=>c.id)).toEqual(['execute','poll','delegate']);expect(packet.receipts.map(r=>r.source)).toEqual([`worker:${f.work.id}`,`checkpoint:${f.work.id}`,`native-terminal:${f.work.id}`,'step:0']);
 expect(packet.receipts.every(r=>r.receipt.uncertain&&!r.receipt.verified)).toBe(true);expect(f.run.status).toBe('blocked');f.owned(()=>proof.assertClaimed());
 let verified=false;
 agents.run.mockImplementation(async(role,prompt,schema,opts)=>{
  expect(role).toBe('pm');expect(opts).toEqual({readOnly:true,stage:'maintenance-readback',requestId:f.run.id});expect(prompt).toContain(f.nativePath);
  const coverage=passed(f.prepare().packet);for(const receipt of coverage.receipts){receipt.verified=verified;receipt.uncertain=!verified;}
  return schema.parse({...result,receipts:[],coverage});
 });
 await f.owned(()=>maintenance.reconcile(f.run.id));expect(f.run.status).toBe('blocked');expect(f.run.error).toBe('Original effects remain uncertain');
 verified=true;await f.owned(()=>maintenance.reconcile(f.run.id));expect(f.run.status).toBe('reconciled');expect(agents.run).toHaveBeenCalledTimes(3);expect(execute).not.toHaveBeenCalled();
 expect(f.work).toEqual(worker);expect(f.run.steps[0]).toEqual(step);expect(f.run.readbackRetry).toEqual(history);expect(readFileSync(resolve(f.dir,'result.json'))).toEqual(saved);expect(readFileSync(f.nativePath)).toEqual(native);
});
test.each(['call-omitted','call-duplicate','call-unknown','receipt-omitted','receipt-duplicate','receipt-unknown'])('fresh strict coverage rejects %s',change=>{
 const p=fixture().prepare().packet,c=passed(p);
 if(change==='call-omitted')c.calls.pop();if(change==='call-duplicate')c.calls[1]=c.calls[0];if(change==='call-unknown')c.calls[0].id='invented';
 if(change==='receipt-omitted')c.receipts.pop();if(change==='receipt-duplicate')c.receipts[1]=c.receipts[0];if(change==='receipt-unknown')c.receipts[0].id='invented';
 expect(()=>readback.maintenanceCoveragePassed(p,c)).toThrow();
});
test.each(['input-hash','receipt-hash','native-hash','worker','call-uncertain','receipt-unverified','asyncCommandsComplete','delegatedTasksComplete','allAttemptedEffectsKnown','freshProviderDispositions','completeNativeExecution'])('paired outer calls or a ledger never imply success: %s',change=>{
 const p=fixture().prepare().packet,c=passed(p);
 if(change==='input-hash')c.calls[0].inputSha256='a'.repeat(64);else if(change==='receipt-hash')c.receipts[0].receiptSha256='b'.repeat(64);else if(change==='native-hash')c.nativeSha256='c'.repeat(64);else if(change==='worker')c.originalWorkId='other';else if(change==='call-uncertain')c.calls[0].uncertain=true;else if(change==='receipt-unverified')c.receipts[0].verified=false;else(c as any)[change]=false;
 expect(readback.maintenanceCoveragePassed(p,c)).toBe(false);
});
test('zero saved receipts has a valid strict schema but still requires full command/nested/provider evidence',()=>{
 const p=fixture().prepare().packet;p.receipts=[];const schema=readback.maintenanceCoverageSchema(p);assertStrictOutputSchema(z.toJSONSchema(schema,{target:'draft-7'}));const c=passed(p);c.allAttemptedEffectsKnown=false;expect(readback.maintenanceCoveragePassed(p,c)).toBe(false);
});
test.each(['artifact','native','worker','run','claim','paused','new-artifact','replaced-reader'])('post-reader proof fence rejects changed %s',change=>{
 const f=fixture(),proof=f.prepare();
 if(change==='artifact')f.put('error.json',{session:f.work.sessionId,provider:'codex',error:'changed'});
 if(change==='native')writeFileSync(f.nativePath,readFileSync(f.nativePath,'utf8')+'\n');
 if(change==='worker')f.work.sessionId='foreign';if(change==='run')f.run.error='changed';if(change==='paused')f.store.state.paused=true;if(change==='new-artifact')f.put('result.json',{});
 if(change==='claim')f.store.finishClaim(f.work.claimId,'interrupted');
 if(change==='replaced-reader')f.store.finishClaim(f.readerClaim.id,'completed');
 expect(()=>f.owned(()=>proof.assertCurrent())).toThrow();
});
test.each(['capability','assignment','identity','error','checkpoint','incomplete-native','conflicting-call','live-process','symlink'])('qualification rejects %s before model dispatch',change=>{
 const f=fixture();
 if(change==='capability')f.put('capabilities.json',workerProfile('maintenance-readback',true));
 if(change==='assignment'){const p=JSON.parse(readFileSync(resolve(f.dir,'assignment.json'),'utf8'));p.scope.repository='foreign/repository';f.put('assignment.json',p);}
 if(change==='identity'){const p=JSON.parse(readFileSync(resolve(f.dir,'assignment-identity.json'),'utf8'));p.threadId='foreign';f.put('assignment-identity.json',p);}
 if(change==='error')f.put('error.json',{session:'foreign',provider:'codex',error:'x'});if(change==='checkpoint')f.put('completed-output.json',{receipts:[{id:'malformed'}]});
 if(change==='incomplete-native'){f.records.splice(2,1);f.nativeSave();}if(change==='conflicting-call'){f.records.push({type:'response_item',payload:{type:'custom_tool_call',call_id:'execute',name:'exec',input:'changed'}});f.nativeSave();}
 if(change==='live-process')vi.mocked(processes.processGroupAlive).mockReturnValue(true);
 if(change==='symlink'){const p=resolve(f.dir,'capabilities.json');unlinkSync(p);symlinkSync(resolve(f.dir,'provider.json'),p);}
 expect(()=>f.prepare()).toThrow();
});
test('successful original-bound read-only maintenance reconciliation retains exhausted history and failed worker without writer replay',async()=>{
 const f=fixture(),prepare=readback.prepareMaintenanceReadback;vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 const history=structuredClone(f.run.readbackRetry),oldStep=structuredClone(f.run.steps[0]),raw=readFileSync(resolve(f.dir,'completed-output.json'));const agents={run:vi.fn(async(role,prompt,schema,opts)=>{
  expect(role).toBe('pm');expect(opts).toEqual({readOnly:true,stage:'maintenance-readback',requestId:f.run.id});expect(prompt).toContain(f.nativePath);expect(prompt).toContain('Paired outer tools do NOT prove');
  const packet=f.owned(()=>prepare(f.store,f.run,f.roots)).packet;
  return schema.parse({outcome:'passed',approach:null,checks:[],summary:'Original effects reconciled only',ledger:'Unfinished maintenance retained',blocker:'',receipts:[],candidates:[],coverage:passed(packet)});
 })};const maintenance=new GitHubMaintenance(f.store,agents as any,vi.fn()as any);
 await f.owned(()=>maintenance.reconcile(f.run.id));expect(agents.run).toHaveBeenCalledTimes(1);expect(f.run.status).toBe('reconciled');expect(f.run.readbackRetry).toEqual(history);expect(f.run.steps[0]).toEqual(oldStep);expect(f.run.steps).toHaveLength(2);expect(f.work.status).toBe('failed');expect(readFileSync(resolve(f.dir,'completed-output.json'))).toEqual(raw);
});
test('reader-reported hidden nested uncertainty keeps maintenance blocked and preserves the negative result',async()=>{
 const f=fixture(),prepare=readback.prepareMaintenanceReadback;vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 const agents={run:vi.fn(async(_r,_p,schema)=>{const p=f.prepare().packet,c=passed(p);c.delegatedTasksComplete=false;return schema.parse({outcome:'blocked',approach:null,checks:[],summary:'Nested evidence missing',ledger:'Unfinished',blocker:'Nested effect unknown',receipts:[],candidates:[],coverage:c});})};
 await f.owned(()=>new GitHubMaintenance(f.store,agents as any).reconcile(f.run.id));expect(f.run.status).toBe('blocked');expect(f.run.error).toBe('Nested effect unknown');expect(f.run.readbackRetry.attempts).toBe(3);
});

test('blocked saved result is input evidence only and its execution completion hash must match',()=>{
 const f=fixture();f.work.status='blocked';unlinkSync(resolve(f.dir,'error.json'));
 const result={session:f.work.sessionId,provider:'codex',result:{receipts:[]}};f.put('result.json',result);
 f.put('execution-completion.json',{workerId:f.work.id,session:f.work.sessionId,provider:'codex',resultSha256:'a'.repeat(64)});
 expect(()=>f.prepare()).toThrow('completion differs');
});
test('duplicate original receipts are rejected even when the checkpoint matches native bytes',()=>{
 const f=fixture(),checkpoint=JSON.parse(readFileSync(resolve(f.dir,'completed-output.json'),'utf8'));checkpoint.receipts.push(checkpoint.receipts[0]);f.put('completed-output.json',checkpoint);f.records.at(-1).payload.last_agent_message=JSON.stringify(checkpoint);f.nativeSave();expect(()=>f.prepare()).toThrow('Duplicate saved attempted');
});
test.each(['native','run','reader-claim'])('actual reconciliation refuses changed %s after the reader without advancing or refunding history',async change=>{
 const f=fixture(),prepare=readback.prepareMaintenanceReadback;vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));const retry=structuredClone(f.run.readbackRetry);
 const agents={run:vi.fn(async(_r,_p,schema)=>{const packet=f.prepare().packet,value=schema.parse({outcome:'passed',approach:null,checks:[],summary:'Reader claim',ledger:'Ledger',blocker:'',receipts:[],candidates:[],coverage:passed(packet)});
  if(change==='native')writeFileSync(f.nativePath,readFileSync(f.nativePath,'utf8')+'\n');if(change==='run')f.run.error='Concurrent edit';if(change==='reader-claim')f.store.finishClaim(f.readerClaim.id,'interrupted');return value;})};
 await expect(f.owned(()=>new GitHubMaintenance(f.store,agents as any).reconcile(f.run.id))).rejects.toThrow();expect(f.run.status).toBe('blocked');expect(f.run.steps).toHaveLength(1);expect(f.run.readbackRetry).toEqual(retry);
});
test('a model passed label cannot overrule incomplete provider disposition coverage',async()=>{
 const f=fixture(),prepare=readback.prepareMaintenanceReadback;vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 const agents={run:vi.fn(async(_r,_p,schema)=>{const c=passed(f.prepare().packet);c.freshProviderDispositions=false;return schema.parse({outcome:'passed',approach:null,checks:[],summary:'Insufficient claim',ledger:'Unfinished',blocker:'',receipts:[],candidates:[],coverage:c});})};
 await f.owned(()=>new GitHubMaintenance(f.store,agents as any).reconcile(f.run.id));expect(f.run.status).toBe('blocked');expect(f.run.error).toBe('Original effects remain uncertain');expect(f.work.status).toBe('failed');
});

test('pure original evidence preparation grants no execution without the real scheduler reader claim',()=>{
 const f=fixture(),proof=readback.prepareMaintenanceReadback(f.store,f.run,f.roots);
 expect(proof.packet.calls).toHaveLength(3);proof.assertCurrent();
 expect(()=>proof.assertClaimed()).toThrow('Scheduler-owned maintenance reader required');
 const prepare=readback.prepareMaintenanceReadback;vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 const agents={run:vi.fn()} as any;
 return expect(new GitHubMaintenance(f.store,agents).reconcile(f.run.id)).rejects.toThrow('Scheduler-owned maintenance reader required').then(()=>expect(agents.run).not.toHaveBeenCalled());
});

test('contradictory raw checkpoint and native final stay separate unaccepted claims with exhaustive receipt coverage',()=>{
 const f=fixture(),checkpoint=JSON.parse(readFileSync(resolve(f.dir,'completed-output.json'),'utf8'));
 checkpoint.ledger='Different historical model checkpoint';checkpoint.receipts[0].detail='Conflicting historical effect description';f.put('completed-output.json',checkpoint);
 const proof=f.prepare(),p=proof.packet;expect(p.checkpointMatchesNative).toBe(false);expect(p.receipts).toHaveLength(3);
 expect(p.receipts[0].receiptSha256).not.toBe(p.receipts[1].receiptSha256);
 expect(p.receipts[0].source).toMatch(/^checkpoint:/);expect(p.receipts[1].source).toMatch(/^native-terminal:/);
 const c=passed(p);c.receipts[0].verified=false;expect(readback.maintenanceCoveragePassed(p,c)).toBe(false);
 expect(f.run.status).toBe('blocked');expect(f.work.status).toBe('failed');expect(JSON.parse(readFileSync(resolve(f.dir,'completed-output.json'),'utf8'))).toEqual(checkpoint);
});

test('historical unaccepted receipt missing detail remains raw without schema defaults',()=>{
 const f=fixture(),checkpoint=JSON.parse(readFileSync(resolve(f.dir,'completed-output.json'),'utf8'));delete checkpoint.receipts[0].detail;f.put('completed-output.json',checkpoint);
 const p=f.prepare().packet;expect(p.receipts[0].receipt).toEqual(checkpoint.receipts[0]);expect(p.receipts[0].receipt).not.toHaveProperty('detail');
 expect(p.checkpointMatchesNative).toBe(false);expect(p.receipts[1].receipt).toHaveProperty('detail');expect(f.work.status).toBe('failed');
});
test('an interrupted versioned checks worker is read back bound to its candidate while its native session shows its recorded scratch',()=>{
 const checks=()=>{
  const f=fixture({projectId:'cms-field-vocabulary',stage:'package-verification'}),candidate=resolve(f.root,'candidate'),scratch=resolve(f.root,'scratch-1');mkdirSync(candidate);mkdirSync(scratch);
  f.run.publication={version:1,evidence:[],candidates:[{index:0,key:'k',candidate:{worktree:candidate}}]};
  const assignment=JSON.parse(readFileSync(resolve(f.dir,'assignment.json'),'utf8'));
  f.put('assignment.json',{...assignment,scope:{...assignment.scope,worktree:candidate},maintenancePolicy:{version:1,kind:'checks',browser:false,cwd:candidate,id:'codex-checks',scratch}});
  f.put('maintenance-launch.json',launchRecord(f.work.id,f.work.stage,'codex-checks',scratch));
  f.records[0].payload.cwd=scratch;f.nativeSave();
  return {f,candidate,scratch};
 };
 const ok=checks(),proof=ok.f.prepare();expect(proof.packet.native.file.path).toBe(ok.f.nativePath);
 expect(proof.packet.files.map(file=>file.path)).toContain(resolve(ok.f.dir,'maintenance-launch.json'));
 ok.f.put('maintenance-launch.json',{...launchRecord(ok.f.work.id,ok.f.work.stage,'codex-checks',ok.scratch),recordSha256:'c'.repeat(64)});
 expect(()=>ok.f.owned(proof.assertCurrent)).toThrow(/evidence changed/);
 const missing=checks();unlinkSync(resolve(missing.f.dir,'maintenance-launch.json'));expect(()=>missing.f.prepare()).toThrow(/maintenance-launch.json missing/);
 const malformed=checks();malformed.f.put('maintenance-launch.json',{cwd:malformed.scratch});expect(()=>malformed.f.prepare()).toThrow(/missing or malformed/);
 const foreign=checks();foreign.f.put('maintenance-launch.json',launchRecord('other',foreign.f.work.stage,'codex-checks',foreign.scratch));expect(()=>foreign.f.prepare()).toThrow(/another worker/);
 // The session recorded in the candidate instead of the scratch, or a launch record naming another scratch, is a mismatch.
 const candidateCwd=checks();candidateCwd.f.records[0].payload.cwd=candidateCwd.candidate;candidateCwd.f.nativeSave();expect(()=>candidateCwd.f.prepare()).toThrow(/native session mismatch/);
 const otherScratch=checks();otherScratch.f.put('maintenance-launch.json',launchRecord(otherScratch.f.work.id,otherScratch.f.work.stage,'codex-checks',resolve(otherScratch.f.root,'scratch-2')));expect(()=>otherScratch.f.prepare()).toThrow(/another cwd/);
 const otherCandidate=checks();const a=JSON.parse(readFileSync(resolve(otherCandidate.f.dir,'assignment.json'),'utf8'));
 otherCandidate.f.put('assignment.json',{...a,scope:{...a.scope,worktree:resolve(otherCandidate.f.root,'elsewhere')}});expect(()=>otherCandidate.f.prepare()).toThrow(/assignment\/capability\/session mismatch/);
});

test.each(['proposal','proposal-issue'])('a completed %s worker with no saved maintenance result uses its original native read-back',async stage=>{
 const f=fixture({projectId:'cms-field-vocabulary',stage,readOnly:stage==='proposal-issue'}),prepare=readback.prepareMaintenanceReadback;
 vi.spyOn(readback,'prepareMaintenanceReadback').mockImplementation((s,r)=>prepare(s,r,f.roots));
 f.run.stop={kind:'authority',at:f.work.endedAt};
 f.run.steps=[];
 Object.assign(f.work,{role:'developer',provider:'claude',sessionId:f.work.id,status:'completed',executionStatus:'completed'});
 const assignment=JSON.parse(readFileSync(resolve(f.dir,'assignment.json'),'utf8'));
 const decision={outcome:'adopt',issue:7,title:'',body:'',labels:[],identity:{source:'s',locator:'l',change:'c',profile:'p'},approach:null,summary:'Existing issue',blocker:''};
 const result={outcome:'passed',approach:null,checks:[],summary:'Completed provider execution',ledger:'Unfinished',blocker:'',receipts:[],candidates:[]};
 if(stage==='proposal-issue'){
  assignment.maintenancePolicy={id:'claude-reader',version:1,kind:'reader',cwd:f.root,scratch:null};
  f.put('maintenance-launch.json',launchRecord(f.work.id,stage,'claude-reader',f.root));
 }
 f.put('assignment.json',{...assignment,role:'developer'});
 f.put('assignment-identity.json',{attemptId:f.work.id,requestId:f.run.id,projectId:f.store.project.id,repository:f.store.project.repository,role:'developer',threadId:f.work.sessionId});
 f.put('provider.json',{project:f.store.project.id,repository:f.store.project.repository,provider:'claude',role:'developer',readOnly:stage==='proposal-issue',session:f.work.sessionId});
 f.put('result.json',{session:f.work.sessionId,provider:'claude',result:stage==='proposal-issue'?decision:result});
 for(const file of ['error.json','completed-output.json'])unlinkSync(resolve(f.dir,file));
 const nativeDir=resolve(f.roots.claude,f.root.replace(/[^a-zA-Z0-9-]/g,'-'));
 mkdirSync(nativeDir,{recursive:true});
 const native=[{type:'tool_use',id:'read-original',name:'Read',input:{file_path:'README.md'}},{type:'tool_result',tool_use_id:'read-original',content:'fixture'}]
  .map(content=>({sessionId:f.work.sessionId,cwd:f.root,message:{content:[content]}}));
 writeFileSync(resolve(nativeDir,`${f.work.sessionId}.jsonl`),native.map(record=>JSON.stringify(record)).join('\n'));
 // A subsequent refusal did not start a process and cannot replace the unresolved original worker.
 f.store.state.workLog!.push({...f.work,id:'refused',processId:undefined,sessionId:'refused',executionStatus:undefined});
 const agents={run:vi.fn(async(_role,_prompt,schema,options)=>{
  expect(f.run.status).toBe('blocked');
  expect(options).toMatchObject({readOnly:true,stage:'maintenance-readback'});
  const {packet}=f.prepare();
  expect(packet.originalWorkId).toBe(f.work.id);
  expect(packet.calls.map(call=>call.id)).toEqual(['read-original']);
  expect(packet.receipts).toEqual([]);
  return schema.parse({...result,coverage:passed(packet)});
 })};
 const execute=vi.fn();
 await f.owned(()=>new GitHubMaintenance(f.store,agents as any,execute as any).reconcile(f.run.id));
 expect(agents.run).toHaveBeenCalledTimes(1);
 expect(f.run.status).toBe('reconciled');
 expect(execute).not.toHaveBeenCalled();
});
