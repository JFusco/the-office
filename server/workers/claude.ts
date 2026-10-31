export const DEVELOPER_MODEL='claude-opus-5-5';
export const DEVELOPER_EFFORT='medium';
export function claudeArguments(schema:object,sessionId:string,readOnly:boolean,dirs:string[]) {
  const args=['--print','--model',DEVELOPER_MODEL,'--effort',DEVELOPER_EFFORT,'--output-format','stream-json','--verbose','--json-schema',JSON.stringify(schema),'--session-id',sessionId,
    '--safe-mode','--restricted','--strict-mcp-config','--no-chrome','--settings','{"disableAllHooks":true}',
    '--tools','Read,Glob,Grep,Bash,Edit,Write,WebSearch,WebFetch','--permission-mode',readOnly?'plan':'auto','--permission-prompts','none'];
  for(const dir of new Set(dirs))args.push('--add-dir',dir);
  // Deliberately no fallback model or automatic retry of a writer session.
  return args;
}
export class ClaudeStream {
  session='';models=new Set<string>();result:Record<string,any>|null=null;
  consume(event:Record<string,any>) {
    if(event.session_id)this.session=event.session_id;
    if(event.type==='assistant'&&event.message?.model)this.models.add(event.message.model);
    if(event.type==='result')this.result=event;
  }
  /** Per-model usage includes inline helpers; it is not the assistant's identity. */
  usageTotals() {
    const r=this.result, entries=Object.entries(r?.modelUsage||{});
    const count=(field:string,fallback:string)=>{
      const values=entries.map(([,usage])=>(usage as Record<string,unknown>)?.[field]);
      if(values.length&&values.every(value=>Number.isSafeInteger(value)&&Number(value)>=0)) {
        const total=values.reduce<number>((sum,value)=>sum+Number(value),0);return Number.isSafeInteger(total)?total:null;
      }
      const value=r?.usage?.[fallback];
      return values.every(value=>value===undefined||value===null)&&entries.length===1&&entries[0][0]===DEVELOPER_MODEL&&Number.isSafeInteger(value)&&value>=0?value:null;
    };
    return {input_tokens:count('inputTokens','input_tokens'),output_tokens:count('outputTokens','output_tokens')};
  }
  finish(expectedSession:string) {
    const r=this.result;if(!r||r.is_error||r.subtype!=='success')throw new Error(`Opus 5.5 worker failed: ${r?.errors?.join('; ')||r?.result||r?.subtype||'no completed result'}. Reconcile prior effects before another attempt.`);
    if(this.session!==expectedSession)throw new Error('Claude returned an unexpected session ID');
    const used=Object.keys(r.modelUsage||{});
    if(!this.models.size||[...this.models].some(m=>m!==DEVELOPER_MODEL)||!used.includes(DEVELOPER_MODEL))throw new Error(`Expected ${DEVELOPER_MODEL}; observed ${[...this.models].join(', ')||'no model evidence'}. No fallback accepted.`);
    if(!r.structured_output||typeof r.structured_output!=='object')throw new Error('Claude did not return the required structured result');
    return {data:r.structured_output,model:DEVELOPER_MODEL,usage:this.usageTotals()};
  }
}
