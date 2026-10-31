import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {ResultSchema} from './agents';
import {rootArtifact} from './readback-evidence';
import {sanitizeObject} from './security';
import type {StageResult,WorkTime} from '../src/shared';
/** Historical display compatibility only; never default authority, result identity, classification or effects. */
export function preparationCheckpoint(raw:any){return ResultSchema.parse({...raw,prerequisites:raw.prerequisites??null,approach:raw.approach??null,blocker:raw.blocker??'',qaRunDir:raw.qaRunDir??'',previewUrl:raw.previewUrl??'',
 evidence:raw.evidence?.map((e:Record<string,unknown>)=>({...e,commit:e.commit??'',environment:e.environment??'',url:e.url??'',observedAt:e.observedAt??''}))});}
/** Immutable native completion and all paired tool responses. This is not an assertion that arbitrary tools were read-only. */
function nativeCompletion(work:WorkTime,worktree:string,expected:unknown,parse:(value:any)=>unknown,root:string){
 if(work.provider!=='codex'||!work.sessionId||!/^[a-zA-Z0-9-]+$/.test(work.sessionId)||!Number.isFinite(Date.parse(work.startedAt))||!Number.isFinite(Date.parse(work.endedAt||''))||Date.parse(work.endedAt!)<Date.parse(work.startedAt))throw Error('Original preparation native identity missing');
 const paths:string[]=[];
 for(const delta of [-1,0,1]){
  const dir=resolve(root,new Date(Date.parse(work.startedAt)+delta*86400000).toISOString().slice(0,10).replaceAll('-','/'));
  if(!existsSync(dir))continue;const names=readdirSync(dir);if(names.length>10000)throw Error('Native directory exceeds bound');
  paths.push(...names.filter(n=>n.endsWith('-'+work.sessionId+'.jsonl')).map(n=>resolve(dir,n)));
 }
 if(paths.length!==1)throw Error('One original preparation native session required');
 const file=rootArtifact(root,paths[0]),records=readFileSync(file.path,'utf8').trim().split('\n').map(line=>JSON.parse(line));
 if(records.length>100000)throw Error('Native record bound exceeded');
 const metadata=records.filter(r=>r.type==='session_meta'),last=records.at(-1);
 if(metadata.length!==1||metadata[0].payload.id!==work.sessionId||metadata[0].payload.cwd!==worktree||last?.type!=='event_msg'||last.payload.type!=='task_complete'||
  !isDeepStrictEqual(parse(sanitizeObject(JSON.parse(last.payload.last_agent_message))),expected))throw Error('Original native terminal checkpoint mismatch');
 const calls=new Set<string>(),outputs=new Set<string>();
 for(const record of records){
  if(record.type!=='response_item')continue;const p=record.payload;
  if(['custom_tool_call','function_call'].includes(p.type)){if(!p.call_id||calls.has(p.call_id))throw Error('Duplicate native call');calls.add(p.call_id);}
  if(['custom_tool_call_output','function_call_output'].includes(p.type)){if(!p.call_id||outputs.has(p.call_id)||!calls.has(p.call_id))throw Error('Unknown native output');outputs.add(p.call_id);}
 }
 if(!calls.size||calls.size!==outputs.size||!isDeepStrictEqual(rootArtifact(root,file.path),file))throw Error('Incomplete or changed native execution');
 return {root,file,recordCount:records.length,callCount:calls.size};
}

export function preparationNativeCheckpoint(work:WorkTime,result:StageResult,root=resolve(homedir(),'.codex','sessions')){return nativeCompletion(work,result.worktree,result,preparationCheckpoint,root);}
export function preparationNativeAssessment(work:WorkTime,worktree:string,assessment:unknown,root=resolve(homedir(),'.codex','sessions')){return nativeCompletion(work,worktree,assessment,value=>value,root);}
