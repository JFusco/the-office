import {scanClaudeToolRecords} from './claude-tool-inventory';
import {existsSync,readFileSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {artifact,rootArtifact,ownedPath} from '../store/readback-evidence';
import {sanitizeObject} from '../office/security';
import type {Store} from '../store/store';
import type {WorkTime} from '../../src/shared';
import type {continuationWorkerProof} from '../delivery/recovery/implementation/continuation-evidence';
/** A completed transport is not a passed task. Failures never acquire this receipt in catch/finally. */
export function completedExecution(store:Store,work:WorkTime){
 if(work.executionStatus!=='completed'||!work.endedAt||!work.sessionId)return false;
 const dir=resolve(store.dataRoot,'sessions',work.id);
 if(['error.json','output-error.json'].some(name=>existsSync(resolve(dir,name))))return false;
 try{const result=artifact(store,resolve(dir,'result.json')),proof=artifact(store,resolve(dir,'execution-completion.json'));
  const saved=JSON.parse(readFileSync(proof.path,'utf8'));
  return saved.workerId===work.id&&saved.session===work.sessionId&&saved.provider===work.provider&&saved.resultSha256===result.sha256;
 }catch{return false;}
}
/** Full retained Claude tool inventory. Repeated records are permitted only byte-equivalent by tool identity. */
export function claudeExecution(store:Store,work:WorkTime,cwd:string,nativePath:string,root=resolve(homedir(),'.claude','projects'),options?:{scopeRepairOriginal:ReturnType<typeof continuationWorkerProof>}){
 if(work.provider!=='claude'||work.sessionId!==work.id||!work.endedAt||!work.sessionId||nativePath!==resolve(root,cwd.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`))throw new Error('Original Claude native identity mismatch');
 const dir=resolve(store.dataRoot,'sessions',work.id);
 if(['error.json','output-error.json'].some(n=>existsSync(resolve(dir,n))))throw new Error('Original execution has a transport/process error');
 const files=['provider-completion.json','result.json'].map(n=>artifact(store,resolve(dir,n))),completion=JSON.parse(readFileSync(files[0].path,'utf8')),saved=JSON.parse(readFileSync(files[1].path,'utf8'));
 if(completion.expectedSession!==work.sessionId||completion.result?.session_id!==work.sessionId||completion.result?.type!=='result'||completion.result?.subtype!=='success'||completion.result?.is_error!==false||!isDeepStrictEqual(sanitizeObject(completion.result.structured_output),saved.result))throw new Error('Original provider terminal/result mismatch');
 let artifactCwd:{root:string;ownership:ReturnType<typeof ownedPath>;directories:{path:string;dev:number;ino:number;ownership:ReturnType<typeof ownedPath>}[]}|undefined;
 if(options){
  const original=options.scopeRepairOriginal,a=original.assignment,assignmentPath=resolve(store.dataRoot,'sessions',work.id,'assignment.json'),bound=original.files.filter(f=>f.path===assignmentPath);
  if(!work.requestId||!/^[a-zA-Z0-9-]+$/.test(work.requestId)||work.stage!=='github-scope-repair'||work.role!=='developer'||work.status!=='blocked'||!isDeepStrictEqual(original.worker,work)||
   a.id!==work.id||a.claimId!==work.claimId||a.stage!==work.stage||a.role!==work.role||a.lane!=='delivery'||a.work?.kind!=='delivery'||a.work.id!==work.requestId||a.work.projectId!==store.project.id||a.scope?.repository!==store.project.repository||a.scope.worktree!==cwd||a.scope.artifacts!==resolve(store.dataRoot,'sessions',work.id)||
   bound.length!==1||!isDeepStrictEqual(artifact(store,assignmentPath),bound[0])||!isDeepStrictEqual(JSON.parse(readFileSync(assignmentPath,'utf8')),a))throw new Error('Owned native artifact CWD requires the exact original assignment');
  const ownedRoot=resolve(store.dataRoot,'ticket-work',work.requestId),ownership=ownedPath(store,ownedRoot);if(!lstatSync(ownedRoot).isDirectory())throw new Error('Owned native artifact root must be a directory');artifactCwd={root:ownedRoot,ownership,directories:[]};
 }
 const admitCwd=(value:string)=>{
  if(value===cwd)return true;if(!artifactCwd||value!==resolve(value))return false;
  const suffix=relative(artifactCwd.root,value);if(suffix==='..'||suffix.startsWith(`..${sep}`)||isAbsolute(suffix))return false;
  const ownership=ownedPath(store,value),stat=lstatSync(value);if(!stat.isDirectory())return false;
  if(!artifactCwd.directories.some(d=>d.path===value))artifactCwd.directories.push({path:value,dev:stat.dev,ino:stat.ino,ownership});return true;
 };
 const file=rootArtifact(root,nativePath),records=readFileSync(file.path,'utf8').trim().split('\n').map(line=>JSON.parse(line));
 const {calls,outputs}=scanClaudeToolRecords(records,work.sessionId,admitCwd);
 if(!calls.size||calls.size>512||calls.size!==outputs.size||[...calls.keys()].some(id=>!outputs.has(id))||[...outputs.keys()].some(id=>!calls.has(id)))throw new Error('Incomplete original native tool execution');
 const finals=[...calls.values()].filter(c=>c.name==='StructuredOutput');
 if(finals.length!==1||!isDeepStrictEqual(sanitizeObject(finals[0].input),saved.result))throw new Error('Original native structured result mismatch');
 return {file,files,recordCount:records.length,calls:[...calls.values()],result:saved.result,...(artifactCwd?{artifactCwd}:{})};
}
/** Legacy completion is admitted only from the original full native session, never a status rewrite. */
export function executionProof(store:Store,work:WorkTime,cwd:string){
 if(completedExecution(store,work))return {kind:'runtime' as const,files:['execution-completion.json','result.json'].map(n=>artifact(store,resolve(store.dataRoot,'sessions',work.id,n)))};
 if(work.executionStatus||work.provider!=='claude')return undefined;
 try{return {kind:'legacy-native' as const,native:claudeExecution(store,work,cwd,resolve(homedir(),'.claude','projects',cwd.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`))};}catch{return undefined;}
}
/** Retained offline tool inventory for a terminated failed reader; it never asserts no effects. */
export function offlineNativeEvidence(store:Store,work:WorkTime,cwd:string,roots={claude:resolve(homedir(),'.claude','projects'),codex:resolve(homedir(),'.codex','sessions')}){
 if(!work.sessionId||!work.endedAt||!Number.isFinite(Date.parse(work.startedAt)))throw new Error('Original offline native identity missing');
 let root:string,path:string;
 if(work.provider==='claude'){root=roots.claude;path=resolve(root,cwd.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`);}
 else if(work.provider==='codex'){
  root=roots.codex;const matches:string[]=[];
  for(const delta of [-1,0,1]){const dir=resolve(root,new Date(Date.parse(work.startedAt)+delta*86400000).toISOString().slice(0,10).replaceAll('-','/'));if(!existsSync(dir))continue;const names=readdirSync(dir);if(names.length>10000)throw new Error('Native offline directory exceeds bound');matches.push(...names.filter(n=>n.endsWith(`-${work.sessionId}.jsonl`)).map(n=>resolve(dir,n)));}
  if(matches.length!==1)throw new Error('One original offline native session required');path=matches[0];
 }else throw new Error('Unknown offline provider');
 const file=rootArtifact(root,path),records=readFileSync(path,'utf8').trim().split('\n').map(line=>JSON.parse(line)),calls=new Map<string,{id:string;name:string;input:unknown}>(),outputs=new Map<string,unknown>();
 const add=(call:{id:string;name:string;input:unknown})=>{if(!call.id||!call.name||calls.has(call.id)&&!isDeepStrictEqual(calls.get(call.id),call))throw new Error('Conflicting original offline tool identity');calls.set(call.id,call);};
 const output=(id:string,value:unknown)=>{if(!id||outputs.has(id)&&!isDeepStrictEqual(outputs.get(id),value))throw new Error('Conflicting original offline output');outputs.set(id,value);};
 if(work.provider==='codex'){
  const meta=records.filter(r=>r.type==='session_meta');if(meta.length!==1||meta[0].payload.id!==work.sessionId||meta[0].payload.cwd!==cwd)throw new Error('Original offline native session mismatch');
  for(const r of records.filter(r=>r.type==='response_item')){const p=r.payload;if(['function_call','custom_tool_call'].includes(p.type))add({id:p.call_id,name:p.name,input:p.arguments??p.input});if(['function_call_output','custom_tool_call_output'].includes(p.type))output(p.call_id,p);}
 }else for(const r of records){
  if(r.sessionId&&r.sessionId!==work.sessionId||r.cwd&&r.cwd!==cwd)throw new Error('Original offline native session mismatch');
  for(const p of r.message?.content||[]){if(p.type==='tool_use')add({id:p.id,name:p.name,input:p.input});if(p.type==='tool_result')output(p.tool_use_id,p);}
 }
 if(!calls.size||calls.size>512||calls.size!==outputs.size||[...calls.keys()].some(id=>!outputs.has(id))||[...outputs.keys()].some(id=>!calls.has(id)))throw new Error('Complete paired offline native execution is required; unknown/incomplete transport remains stopped');
 return {root,file,recordCount:records.length,calls:[...calls.values()]};
}
