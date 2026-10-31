import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {expect,test} from 'vitest';
import {z} from 'zod';
import {ReplySchema} from '../../server/conversations';
import {ResultSchema} from '../../server/agents';
import {MaintenanceSchema} from '../../server/maintenance';
import {assertStrictOutputSchema,completedOutput} from '../../server/structured-output';
import {workerFailure,command} from '../../server/process';
test('every conversation reply field is required, including nullable pickupChange, at every schema depth',()=>{
 for(const schema of [ReplySchema,ResultSchema,MaintenanceSchema])expect(()=>assertStrictOutputSchema(z.toJSONSchema(schema,{target:'draft-7'}))).not.toThrow();
 expect(z.toJSONSchema(ReplySchema).required).toContain('pickupChange');
 expect(()=>assertStrictOutputSchema(z.toJSONSchema(z.object({optional:z.string().optional()}).strict()))).toThrow('required must include optional');
});
test('structured model failures outrank unrelated stderr authentication warnings and redact secrets',()=>{
 const message='Invalid schema: missing pickupChange';
 expect(workerFailure('codex',1,JSON.stringify({type:'turn.failed',error:{message:JSON.stringify({error:{message}})}}),'failed to refresh OAuth tokens for server atlassian')).toBe(`codex exited 1: ${message}`);
 expect(workerFailure('codex',1,JSON.stringify({type:'error',message:'Bearer secret-value'}),'')).not.toContain('secret-value');
});
test('real worker process surfaces its structured stdout error instead of warning-only stderr',async()=>{
 await expect(command(process.execPath,['-e',`process.stderr.write('unrelated startup warning');process.stdout.write(JSON.stringify({type:'turn.failed',error:{message:'Invalid schema: missing field'}})+'\\n');process.exit(1)`])).rejects.toThrow('Invalid schema: missing field');
});

test('output-limit recovery accepts only the completed bounded schema-valid result in this worker session',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'office-output-')),other=mkdtempSync(resolve(tmpdir(),'office-output-other-')),schema=z.object({done:z.boolean()}).strict();
 try{
  expect(completedOutput(root,'max_output_tokens',schema)).toBeUndefined();writeFileSync(resolve(root,'completed-output.json'),JSON.stringify({done:true}));
  expect(completedOutput(root,'max_output_tokens',schema)).toEqual({done:true});expect(completedOutput(root,'network timeout',schema)).toBeUndefined();
  writeFileSync(resolve(root,'completed-output.json'),'{}');expect(completedOutput(root,'max_output_tokens',schema)).toBeUndefined();
  rmSync(resolve(root,'completed-output.json'));writeFileSync(resolve(other,'result.json'),JSON.stringify({done:true}));symlinkSync(resolve(other,'result.json'),resolve(root,'completed-output.json'));expect(completedOutput(root,'max_output_tokens',schema)).toBeUndefined();
 }finally{rmSync(root,{recursive:true,force:true});rmSync(other,{recursive:true,force:true});}
});

test('Claude authentication and structured failures retain the actionable message',()=>{
 const auth={type:'assistant',isApiErrorMessage:true,error:'authentication_failed',message:{content:[{type:'text',text:'Not logged in · Please run /login'}]}};
 expect(workerFailure('claude',1,JSON.stringify(auth),'')).toContain('Not logged in · Please run /login');
 expect(workerFailure('claude',1,JSON.stringify({type:'result',subtype:'error_during_execution',is_error:true,errors:['Usage limit reached']}),'')).toContain('Usage limit reached');
 expect(workerFailure('claude',1,'','')).toContain('No provider diagnostic was returned');
});
