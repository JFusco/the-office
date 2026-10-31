import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,readFileSync,renameSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../../../../server/store/store';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {artifact,digest,sha} from '../../../../../server/store/readback-evidence';
import {readCloseoutSupervisionProof} from '../../../../../server/delivery/recovery/closeout/closeout-supervision-proof';
import {enqueueCloseoutReconciliation} from '../../../../../server/scheduling/requests';

const home=vi.hoisted(()=>({path:''}));vi.mock('node:os',async original=>({...await original<typeof import('node:os')>(),homedir:()=>home.path}));
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{stores.splice(0).forEach(store=>store.close());roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true}));});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'supervision-proof-'));roots.push(root);home.path=root;
 const store=new Store(':memory:',structuredClone(projectById('cms-field-vocabulary')),root);stores.push(store);store.state.coordination=coordination();
 const job:any={id:'job',key:'GH-42',worktree:resolve(root,'candidate'),stage:'closeout',status:'blocked'},work:any={id:'original',sessionId:'original-session',claimId:'original-claim',requestId:job.id,ticket:job.key,role:'pm',provider:'codex',stage:'github-closeout',status:'failed',lane:'delivery',processId:12345,startedAt:'2026-10-30T00:03:00Z',endedAt:'2026-10-30T00:04:00Z'};
 store.state.coordination.jobs=[job];store.state.workLog=[work];mkdirSync(job.worktree);
 const claim={id:work.claimId,status:'completed',stage:'closeout',lane:'delivery',work:{projectId:store.project.id,kind:'delivery',id:job.id},claimedAt:'2026-10-30T00:02:00Z',endedAt:'2026-10-30T00:05:00Z'},claimBody=JSON.stringify(claim);
 store.db.prepare('INSERT INTO work_claims(id,work_key,status,body) VALUES(?,?,?,?)').run(work.claimId,`${store.project.id}:delivery:${job.id}`,'completed',claimBody);
 const originalRoot=resolve(root,'sessions',work.id);mkdirSync(originalRoot,{recursive:true});writeFileSync(resolve(originalRoot,'completed-output.json'),'{}');writeFileSync(resolve(originalRoot,'error.json'),JSON.stringify({session:work.sessionId,provider:'codex',error:'Error: Worker exited with surviving subprocesses; effects require reconciliation'}));
 const nativePath=resolve(root,'.codex/sessions/2026/10/30/rollout-'+work.sessionId+'.jsonl');mkdirSync(resolve(nativePath,'..'),{recursive:true});writeFileSync(nativePath,[{type:'session_meta',payload:{id:work.sessionId,cwd:job.worktree}},{type:'response_item',payload:{type:'function_call',call_id:'read',name:'read',arguments:'retained inputs'}},{type:'response_item',payload:{type:'function_call_output',call_id:'read',output:'terminal output'}},{type:'event_msg',payload:{type:'task_complete',last_agent_message:'{}'}}].map(row=>JSON.stringify(row)).join('\n'));
 const owned=resolve(root,'closeout-recovery',job.id);mkdirSync(owned,{recursive:true});
 const refs:Record<string,{path:string;sha256:string}>={},bodies:Record<string,any>={};
 const put=(name:string,value:any)=>{bodies[name]=value;const path=resolve(owned,name);writeFileSync(path,typeof value==='string'?value:JSON.stringify(value));return refs[name]={path,sha256:artifact(store,path).sha256};};
 const processSource=put('processSource',readFileSync(new URL('../../../../fixtures/historical-supervision/process.ts.txt',import.meta.url),'utf8')),workerRuntimeSource=put('workerRuntimeSource',readFileSync(new URL('../../../../fixtures/historical-supervision/worker-runtime.ts.txt',import.meta.url),'utf8')),accepted='a'.repeat(40),next='b'.repeat(40),runtimeHash='c'.repeat(64);
 const sourceManifest=put('sourceManifest',{head:accepted,files:{'server/process.ts':processSource.sha256,'server/worker-runtime.ts':workerRuntimeSource.sha256}}),runtimeReceipt=put('runtimeReceipt',{status:'complete',completedAt:'2026-10-30T00:01:00Z',verifiedHead:accepted,pid:100,loadedHash:runtimeHash,expectedRuntimeHash:runtimeHash}),successorTarget=put('successorTarget',{base:accepted,expectedReviewedHead:next,parentRolloutReceiptSha256:runtimeReceipt.sha256,parentRuntime:{pid:100,loadedHash:runtimeHash,serviceInstanceId:'original-instance'}}),preDrain=put('preDrain',{status:'draining',startedAt:'2026-10-30T01:00:00Z',pid:100,loadedHash:runtimeHash,serviceInstanceId:'original-instance',verifiedHead:next});
 const envelope:any={version:1,contract:'owned-group-shutdown-v1',projectId:store.project.id,repository:store.project.repository,jobId:job.id,originalWorkId:work.id,nativeSessionId:work.sessionId,claimId:work.claimId,originalWorkSha256:digest(work),originalClaimSha256:sha(claimBody),checkpointSha256:artifact(store,resolve(originalRoot,'completed-output.json')).sha256,errorSha256:artifact(store,resolve(originalRoot,'error.json')).sha256,nativeSessionSha256:sha(readFileSync(nativePath,'utf8')),artifacts:{sourceManifest,processSource,workerRuntimeSource,runtimeReceipt,successorTarget,preDrain}};
 const descriptor={path:resolve(owned,'envelope.json'),sha256:''},save=()=>{writeFileSync(descriptor.path,JSON.stringify(envelope));descriptor.sha256=artifact(store,descriptor.path).sha256;};save();
 const change=(name:string,edit:(body:any)=>void)=>{edit(bodies[name]);envelope.artifacts[name]=put(name,bodies[name]);save();};
 return {root,store,job,work,claimBody,nativePath,owned,refs,bodies,put,envelope,descriptor,save,change,read:()=>readCloseoutSupervisionProof(store,job,work,descriptor)};
}
test('owned historical source/runtime receipts positively bind only the recognized original in-group shutdown semantics',()=>{
 const a=fixture(),proof=a.read();expect(proof.binding).toMatchObject({head:'a'.repeat(40),pid:100,loadedHash:'c'.repeat(64),serviceInstanceId:'original-instance'});expect(proof.files).toHaveLength(9);expect(proof.semantics).toContain('no proof of no escaped effects');expect(proof.semantics).toContain('no cleanup or acceptance authority');
 expect(()=>readCloseoutSupervisionProof(a.store,a.job,a.work,undefined)).toThrow();
});
test.each(['project','job','worker','session','claim','work-hash','claim-hash','checkpoint','error','native','source-hash','source-manifest','runtime-head','successor-base','receipt-link','pid','loaded-hash','instance','successor-head','incomplete-rollout','late-rollout','early-drain'])('historical provenance rejects %s',scenario=>{
 const a=fixture();
 if(scenario==='project')a.envelope.projectId='foreign';if(scenario==='job')a.envelope.jobId='foreign';if(scenario==='worker')a.envelope.originalWorkId='foreign';if(scenario==='session')a.envelope.nativeSessionId='foreign';if(scenario==='claim')a.envelope.claimId='foreign';
 const fields:Record<string,string>={'work-hash':'originalWorkSha256','claim-hash':'originalClaimSha256',checkpoint:'checkpointSha256',error:'errorSha256',native:'nativeSessionSha256'};if(fields[scenario])a.envelope[fields[scenario]]='f'.repeat(64);
 if(scenario==='source-hash'){a.envelope.artifacts.processSource=a.put('processSource','Current source alone or unknown historical source');a.change('sourceManifest',body=>body.files['server/process.ts']=a.envelope.artifacts.processSource.sha256);}
 if(scenario==='source-manifest')a.change('sourceManifest',body=>body.files['server/worker-runtime.ts']='f'.repeat(64));
 if(scenario==='runtime-head')a.change('runtimeReceipt',body=>body.verifiedHead='f'.repeat(40));if(scenario==='successor-base')a.change('successorTarget',body=>body.base='f'.repeat(40));if(scenario==='receipt-link')a.change('successorTarget',body=>body.parentRolloutReceiptSha256='f'.repeat(64));
 if(scenario==='pid')a.change('preDrain',body=>body.pid=101);if(scenario==='loaded-hash')a.change('preDrain',body=>body.loadedHash='f'.repeat(64));if(scenario==='instance')a.change('preDrain',body=>body.serviceInstanceId='other');if(scenario==='successor-head')a.change('preDrain',body=>body.verifiedHead='f'.repeat(40));
 if(scenario==='incomplete-rollout')a.change('runtimeReceipt',body=>body.status='failed');if(scenario==='late-rollout')a.change('runtimeReceipt',body=>body.completedAt='2026-10-30T00:03:01Z');if(scenario==='early-drain')a.change('preDrain',body=>body.startedAt='2026-10-30T00:03:59Z');
 a.save();expect(a.read).toThrow();
});
test.each(['outside-job','symlink','missing','changed-hash','oversize'])('historical proof files reject %s',scenario=>{
 const a=fixture(),ref=a.envelope.artifacts.sourceManifest;
 if(scenario==='outside-job'){const path=resolve(a.root,'foreign.json');writeFileSync(path,readFileSync(ref.path));ref.path=path;}
 if(scenario==='symlink'){renameSync(ref.path,ref.path+'-retained');symlinkSync(ref.path+'-retained',ref.path);}
 if(scenario==='missing')rmSync(ref.path);if(scenario==='changed-hash')writeFileSync(ref.path,'{}');if(scenario==='oversize'){writeFileSync(ref.path,' '.repeat(1024*1024+1));ref.sha256=sha(readFileSync(ref.path,'utf8'));}
 a.save();expect(a.read).toThrow();
});
test('artifact inode replacement with identical historical bytes changes the revalidated proof identity',()=>{
 const a=fixture(),before=a.read(),path=a.envelope.artifacts.processSource.path;renameSync(path,path+'-original');writeFileSync(path,readFileSync(path+'-original'));expect(a.read()).not.toEqual(before);
});
test('new deliberate closeout proof input preserves blocked history and never overwrites a different active or completed intent',()=>{
 const a=fixture(),old:any={id:'old-negative',action:'reconcile-closeout',key:a.job.key,head:a.work.id,lane:'delivery',status:'blocked',requestedAt:'old',detail:'Preserved negative'};a.store.state.coordination!.requests=[old];const prior=JSON.stringify(old),fresh=enqueueCloseoutReconciliation(a.store,a.job.key,a.work.id,a.descriptor);expect(fresh.id).not.toBe(old.id);expect(fresh.closeoutSupervisionProof).toEqual(a.descriptor);
 for(const status of ['queued','working','completed']as const){fresh.status=status;expect(enqueueCloseoutReconciliation(a.store,a.job.key,a.work.id,a.descriptor).id).toBe(fresh.id);expect(()=>enqueueCloseoutReconciliation(a.store,a.job.key,a.work.id,{...a.descriptor,sha256:'f'.repeat(64)})).toThrow('different');expect(()=>enqueueCloseoutReconciliation(a.store,a.job.key,a.work.id)).toThrow('different');}
 expect(JSON.stringify(old)).toBe(prior);
});
