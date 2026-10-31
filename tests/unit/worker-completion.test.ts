import {afterEach,expect,test} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {claudeExecution} from '../../server/worker-completion';
import {digest} from '../../server/readback-evidence';
import {continuationWorkerProof} from '../../server/continuation-evidence';
import {workerProfile} from '../../server/worker-profiles';
const roots:string[]=[];afterEach(()=>roots.splice(0).forEach(p=>rmSync(p,{recursive:true,force:true})));
function fixture(typed=true){
 const root=mkdtempSync(resolve(tmpdir(),'office-native-events-'));roots.push(root);const cwd=resolve(root,'candidate'),nativeRoot=resolve(root,'native'),work:any={id:'worker',sessionId:'worker',provider:'claude',endedAt:'2026-10-30T00:01:00Z'};
 const dir=resolve(root,'sessions/worker');mkdirSync(dir,{recursive:true});const result={outcome:'blocked',summary:'Synthetic structured result'};
 writeFileSync(resolve(dir,'result.json'),JSON.stringify({session:work.sessionId,result}));writeFileSync(resolve(dir,'provider-completion.json'),JSON.stringify({expectedSession:work.sessionId,result:{session_id:work.sessionId,type:'result',subtype:'success',is_error:false,structured_output:result}}));
 const display={command:'read displayed value',description:'Synthetic local read'},wire={command:'read wire value',description:'Synthetic local read'},call={type:'tool_use',id:'read',name:'Bash',input:display},output={type:'tool_result',tool_use_id:'read',content:'Synthetic output',is_error:false};
 const record=(type:string,uuid:string,content:any[])=>typed?{type,sessionId:work.sessionId,cwd,uuid,parentUuid:type==='user'?'issued-read':undefined,message:{id:type==='assistant'?'message-'+uuid:undefined,role:type,content}}:{message:{content}};
 const issued:any=record('assistant','issued-read',[call]);if(typed)issued.wireToolInputs={read:wire};
 const actualOutput:any=record('user','result-read',[output]);const final:any=record('assistant','issued-final',[{type:'tool_use',id:'final',name:'StructuredOutput',input:result}]);const finalOutput:any=record('user','result-final',[{type:'tool_result',tool_use_id:'final',content:'Saved'}]);if(typed)finalOutput.parentUuid='issued-final';
 const blob:any={type:'api-request-blob',sessionId:work.sessionId,hash:'a'.repeat(64),message:{role:'assistant',content:[{...call,input:wire}]}};
 const records:any[]=[issued,actualOutput,...(typed?[blob]:[]),final,finalOutput],path=resolve(nativeRoot,cwd.replace(/[^a-zA-Z0-9-]/g,'-'),'worker.jsonl');mkdirSync(resolve(path,'..'),{recursive:true});
 const save=()=>writeFileSync(path,records.map(r=>JSON.stringify(r)).join('\n')+'\n');save();const store:any={dataRoot:root};const run=()=>claudeExecution(store,work,cwd,path,nativeRoot);
 return{root,cwd,work,records,path,save,run,display,wire,call,output,blob,issued,actualOutput,nativeRoot,store};
}
test('typed API-history wire reference binds both exact representations and genuine execution provenance without changing raw bytes',()=>{
 const f=fixture(),raw=readFileSync(f.path,'utf8'),proof=f.run(),call=proof.calls.find(c=>c.id==='read')!;
 expect(call.input).toEqual(f.display);expect(call.inputRepresentations).toEqual([{namespace:'display',value:f.display,sha256:digest(f.display)},{namespace:'wire',value:f.wire,sha256:digest(f.wire)}]);
 expect(call.referenceProvenance).toMatchObject([{recordIndex:2,type:'api-request-blob',issuedRecordIndex:0,issuedRecordUuid:'issued-read',issuedMessageId:'message-issued-read',pairedResultRecords:[{index:1,uuid:'result-read'}],inputSha256:digest(f.wire)}]);expect(readFileSync(f.path,'utf8')).toBe(raw);expect(proof.calls).toHaveLength(2);
});
test('an exact display-input reference is bound as context without selecting a different invocation',()=>{const f=fixture();f.blob.message.content[0].input=f.display;f.save();expect(f.run().calls[0].inputRepresentations).toHaveLength(2);expect(f.run().calls[0].input).toEqual(f.display);});
test('typed issued wire input retains both exact representations without an API-history reference',()=>{
 const f=fixture();f.records.splice(f.records.indexOf(f.blob),1);f.save();const call=f.run().calls.find(c=>c.id==='read')!;
 expect(call.inputRepresentations).toEqual([{namespace:'display',value:f.display,sha256:digest(f.display)},{namespace:'wire',value:f.wire,sha256:digest(f.wire)}]);expect(call.referenceProvenance).toBeUndefined();
});
test('a result-history reference never replaces the genuine user result',()=>{const f=fixture();f.records.splice(3,0,{...f.blob,message:{role:'user',content:[f.output]}});f.save();expect(f.run().calls[0].referenceProvenance).toHaveLength(2);});
test.each(['wrong-session','wrong-cwd','wrong-tool-id','wrong-name','wrong-input','untyped-issued','ambiguous-issued','missing-user-result','blob-result-only','wrong-parent','mismatched-result-reference','missing-reference-hash','wrong-namespace-role','conflicting-execution','conflicting-result','conflicting-wire'])('typed references reject %s without selecting first/latest evidence',kind=>{
 const f=fixture();
 if(kind==='wrong-session')f.blob.sessionId='foreign';if(kind==='wrong-cwd')f.blob.cwd='foreign';if(kind==='wrong-tool-id')f.blob.message.content[0].id='foreign';if(kind==='wrong-name')f.blob.message.content[0].name='Read';if(kind==='wrong-input')f.blob.message.content[0].input={command:'unbound third input'};
 if(kind==='untyped-issued')delete f.issued.uuid;if(kind==='ambiguous-issued')f.records.splice(1,0,{...structuredClone(f.issued),uuid:'another-issued',message:{...f.issued.message,id:'another-message'}});
 if(kind==='missing-user-result')f.records.splice(1,1);if(kind==='blob-result-only'){f.records.splice(1,1);f.records.splice(1,0,{...f.blob,message:{role:'user',content:[f.output]}});}
 if(kind==='wrong-parent')f.actualOutput.parentUuid='foreign';if(kind==='mismatched-result-reference')f.records.splice(3,0,{...f.blob,message:{role:'user',content:[{...f.output,content:'Different'}]}});if(kind==='missing-reference-hash')delete f.blob.hash;if(kind==='wrong-namespace-role')f.blob.message.role='user';
 if(kind==='conflicting-execution')f.records.push({...f.issued,message:{...f.issued.message,content:[{...f.call,input:{command:'conflicting issued command'}}]}});
 if(kind==='conflicting-result')f.records.push({...f.actualOutput,message:{role:'user',content:[{...f.output,content:'Conflicting'}]}});
 if(kind==='conflicting-wire')f.records.push({...f.issued,wireToolInputs:{read:{command:'different wire'}}});
 f.save();expect(f.run).toThrow();
});
test('legacy untyped calls keep their original proof shape and identical-duplicate handling',()=>{const f=fixture(false);f.records.push(structuredClone(f.records[0]));f.save();const proof=f.run();expect(proof.calls[0]).toEqual({id:'read',name:'Bash',input:f.display});expect(proof.calls).toHaveLength(2);});
test.each(['call','result'])('legacy conflicting duplicate %s remains rejected',kind=>{const f=fixture(false);if(kind==='call')f.records.push({message:{content:[{...f.call,input:{command:'Different'}}]}});else f.records.push({message:{content:[{...f.output,content:'Different'}]}});f.save();expect(f.run).toThrow('Conflicting duplicate native');});

test('system API-history without tool records stays retained nonexecution context',()=>{const f=fixture();f.records.splice(0,0,{type:'api-request-blob',sessionId:f.work.sessionId,hash:'b'.repeat(64),message:{role:'system',content:[{type:'text',text:'Synthetic retained context'}]}});f.save();expect(f.run().calls).toHaveLength(2);});

function ownedCapability(f:ReturnType<typeof fixture>){
 Object.assign(f.work,{requestId:'job',ticket:'GH-42',stage:'github-scope-repair',role:'developer',status:'blocked',lane:'delivery',claimId:'claim',processId:2147483647});
 f.store.project={id:'project',repository:'example/repository'};f.store.state={workLog:[f.work]};f.store.clock={now:()=>new Date('2026-10-30T00:02:00Z')};
 const directory=resolve(f.root,'sessions',f.work.id),assignment={id:f.work.id,claimId:'claim',stage:f.work.stage,role:f.work.role,lane:'delivery',work:{kind:'delivery',id:'job',projectId:'project'},scope:{repository:'example/repository',worktree:f.cwd,artifacts:directory},profile:workerProfile(f.work.stage,false).name};
 for(const [name,value]of Object.entries({'assignment.json':assignment,'assignment-identity.json':{attemptId:f.work.id,requestId:'job',projectId:'project',repository:'example/repository',role:'developer',threadId:f.work.sessionId},'capabilities.json':workerProfile(f.work.stage,false),'provider.json':{project:'project',repository:'example/repository',role:'developer',provider:'claude',session:f.work.sessionId,readOnly:false}}))writeFileSync(resolve(directory,name),JSON.stringify(value));
 const artifactRoot=resolve(f.root,'ticket-work/job'),subdir=resolve(artifactRoot,'tools');mkdirSync(subdir,{recursive:true});
 const original=continuationWorkerProof(f.store,{id:'job',key:'GH-42'}as any,f.work,false,f.cwd);
 const run=()=>claudeExecution(f.store,f.work,f.cwd,f.path,f.nativeRoot,{scopeRepairOriginal:original});
 return {original,artifactRoot,subdir,assignment,directory,run};
}
test('only an explicitly bound scope-repair original may retain its canonical owned artifact CWD',()=>{
 const f=fixture(),bound=ownedCapability(f);f.records[0].cwd=bound.subdir;f.records[1].cwd=bound.subdir;f.save();
 expect(f.run).toThrow('Native session changed identity');const proof=bound.run();expect(proof.artifactCwd?.root).toBe(bound.artifactRoot);expect(proof.artifactCwd?.directories).toMatchObject([{path:bound.subdir,dev:expect.any(Number),ino:expect.any(Number)}]);expect(proof.calls[0].inputRepresentations).toHaveLength(2);
 expect(proof.file.path).toBe(f.path);expect(f.path).toContain(f.cwd.replace(/[^a-zA-Z0-9-]/g,'-'));
});
test.each(['sibling','prefix-lookalike','foreign-project','root','escape','noncanonical','file','symlink','missing-request','foreign-request','foreign-assignment','foreign-project-assignment','changed-assignment','foreign-work','missing-root'])('owned artifact CWD capability rejects %s',kind=>{
 const f=fixture(),bound=ownedCapability(f);let cwd=bound.subdir;
 if(kind==='sibling'){cwd=resolve(f.root,'ticket-work/other/tools');mkdirSync(cwd,{recursive:true});}
 if(kind==='prefix-lookalike'){cwd=resolve(f.root,'ticket-work/job-other');mkdirSync(cwd,{recursive:true});}
 if(kind==='foreign-project'){cwd=resolve(f.root,'other-project/ticket-work/job');mkdirSync(cwd,{recursive:true});}
 if(kind==='root')cwd=f.root;if(kind==='escape')cwd=resolve(bound.artifactRoot,'../..');if(kind==='noncanonical')cwd=bound.subdir+'/../tools';
 if(kind==='file'){cwd=resolve(bound.artifactRoot,'not-a-directory');writeFileSync(cwd,'file');}
 if(kind==='symlink'){cwd=resolve(bound.artifactRoot,'link');symlinkSync(bound.subdir,cwd);}
 if(kind==='missing-request')delete f.work.requestId;if(kind==='foreign-request')f.work.requestId='other';
 if(kind==='foreign-assignment')bound.original.assignment.work.id='other';if(kind==='foreign-project-assignment')bound.original.assignment.work.projectId='foreign';
 if(kind==='changed-assignment')writeFileSync(resolve(bound.directory,'assignment.json'),JSON.stringify({...bound.assignment,claimId:'changed'}));
 if(kind==='foreign-work')bound.original.worker.ticket='foreign';if(kind==='missing-root')rmSync(bound.artifactRoot,{recursive:true});
 f.records[0].cwd=cwd;f.save();expect(bound.run).toThrow();
});
test('owned CWD directory replacement changes the captured inode proof, preventing later proof reuse',()=>{
 const f=fixture(),bound=ownedCapability(f);f.records[0].cwd=bound.subdir;f.save();const prior=bound.run().artifactCwd;
 renameSync(bound.subdir,bound.subdir+'-retained');mkdirSync(bound.subdir);expect(bound.run().artifactCwd).not.toEqual(prior);
});
