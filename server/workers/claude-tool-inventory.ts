import { isDeepStrictEqual } from 'node:util';
import { digest } from '../store/readback-evidence';

export type NativeClaudeCall = {
 id: string; name: string; input: unknown;
 inputRepresentations?: { namespace: 'display' | 'wire'; value: unknown; sha256: string }[];
 referenceProvenance?: unknown[];
};

/** Native invocation/result provenance only. Missing output never becomes completion or no-effects proof. */
export function scanClaudeToolRecords(records: any[], sessionId: string, admitCwd: (value: string) => boolean) {
 type Call = NativeClaudeCall;
 const calls = new Map<string, Call>(), outputs = new Map<string, unknown>();
 const issued=new Map<string,{index:number;uuid:string;messageId:string;cwd:string;wirePresent:boolean;wireInput:unknown}[]>(),genuineResults=new Map<string,{index:number;uuid:string;parentUuid:string;cwd:string;value:unknown}[]>(),references:{record:any;index:number;item:any}[]=[];
 for(const [index,record]of records.entries()){
  if(record.sessionId&&record.sessionId!==sessionId||record.cwd&&!admitCwd(record.cwd))throw new Error('Native session changed identity');
  const content=Array.isArray(record.message?.content)?record.message.content:[];
  if(record.type==='api-request-blob'){
   // API-history snapshots are references, never a second invocation or a result receipt.
   const toolReferences=content.filter((item:any)=>['tool_use','tool_result'].includes(item.type));
   if(toolReferences.length&&(record.sessionId!==sessionId||!['assistant','user'].includes(record.message?.role)||!/^[a-f0-9]{64}$/.test(record.hash||'')))throw new Error('Unbound native API-history reference');
   for(const item of toolReferences)references.push({record,index,item});
   continue;
  }
  for(const item of content){
   if(item.type==='tool_use'){
    const call={id:item.id,name:item.name,input:item.input};if(!call.id||!['Bash','Read','Write','Edit','Glob','Grep','StructuredOutput'].includes(call.name))throw new Error('Unknown original native tool');
    if(calls.has(call.id)&&!isDeepStrictEqual(calls.get(call.id),call))throw new Error('Conflicting duplicate native tool');calls.set(call.id,call);
    if(record.type==='assistant'&&record.message.role==='assistant'&&record.sessionId===sessionId&&typeof record.cwd==='string'&&admitCwd(record.cwd)&&typeof record.uuid==='string'&&!!record.uuid&&typeof record.message.id==='string'&&!!record.message.id){
     const wire=record.wireToolInputs,wirePresent=!!wire&&typeof wire==='object'&&!Array.isArray(wire)&&Object.hasOwn(wire,call.id),entry={index,uuid:record.uuid,messageId:record.message.id,cwd:record.cwd,wirePresent,wireInput:wirePresent?wire[call.id]:undefined},prior=issued.get(call.id)||[];
     if(prior.some(p=>p.wirePresent!==entry.wirePresent||!isDeepStrictEqual(p.wireInput,entry.wireInput)))throw new Error('Conflicting native wire tool input');
     if(!prior.some(p=>p.uuid===entry.uuid&&p.messageId===entry.messageId))prior.push(entry);issued.set(call.id,prior);
    }
   }else if(item.type==='tool_result'){
    if(outputs.has(item.tool_use_id)&&!isDeepStrictEqual(outputs.get(item.tool_use_id),item))throw new Error('Conflicting duplicate native output');outputs.set(item.tool_use_id,item);
    if(record.type==='user'&&record.message.role==='user'&&record.sessionId===sessionId&&typeof record.cwd==='string'&&admitCwd(record.cwd)&&typeof record.uuid==='string'&&!!record.uuid&&typeof record.parentUuid==='string'&&!!record.parentUuid){const list=genuineResults.get(item.tool_use_id)||[];list.push({index,uuid:record.uuid,parentUuid:record.parentUuid,cwd:record.cwd,value:item});genuineResults.set(item.tool_use_id,list);}
   }
  }
 }
 // Issued wire inputs remain audit inputs even when no API-history blob repeats them.
 for(const [id,execution]of issued){
  const call=calls.get(id)!,entry=execution[0];
  if(execution.length===1&&entry.wirePresent&&!isDeepStrictEqual(call.input,entry.wireInput))call.inputRepresentations=[{namespace:'display',value:call.input,sha256:digest(call.input)},{namespace:'wire',value:entry.wireInput,sha256:digest(entry.wireInput)}];
 }
 for(const {record,index,item}of references){
  const toolId=item.type==='tool_use'?item.id:item.tool_use_id,call=calls.get(toolId),execution=issued.get(toolId),results=genuineResults.get(toolId)||[];
  if(!call||execution?.length!==1||execution[0].index>=index||!results.some(r=>r.index<index&&r.parentUuid===execution[0].uuid))throw new Error('Native API reference lacks one paired issued execution');
  const issuedInput=execution[0];
  if(item.type==='tool_use'){
   if(record.message.role!=='assistant'||item.name!==call.name||!isDeepStrictEqual(item.input,call.input)&&!(issuedInput.wirePresent&&isDeepStrictEqual(item.input,issuedInput.wireInput)))throw new Error('Native API reference input differs from issued display/wire input');
  }else if(record.message.role!=='user'||!isDeepStrictEqual(item,outputs.get(toolId)))throw new Error('Native API result reference differs from genuine execution result');
  const representations:NonNullable<Call['inputRepresentations']>=[{namespace:'display',value:call.input,sha256:digest(call.input)}];
  if(issuedInput.wirePresent&&!isDeepStrictEqual(call.input,issuedInput.wireInput))representations.push({namespace:'wire',value:issuedInput.wireInput,sha256:digest(issuedInput.wireInput)});
  call.inputRepresentations=representations;
  (call.referenceProvenance??=[]).push({recordIndex:index,type:'api-request-blob',sessionId:record.sessionId,role:record.message.role,referenceKind:item.type,recordSha256:digest(record),providerHash:record.hash,issuedRecordIndex:issuedInput.index,issuedRecordUuid:issuedInput.uuid,issuedMessageId:issuedInput.messageId,pairedResultRecords:results.filter(r=>r.index<index&&r.parentUuid===issuedInput.uuid).map(r=>({index:r.index,uuid:r.uuid})),...(item.type==='tool_use'?{inputSha256:digest(item.input)}:{})});
 }
 return { calls, outputs, issued, genuineResults,
  missingResults: [...calls.keys()].filter(id => !outputs.has(id)),
  orphanResults: [...outputs.keys()].filter(id => !calls.has(id)) };
}
