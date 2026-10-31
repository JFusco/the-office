import { existsSync,readFileSync,realpathSync,statSync } from 'node:fs';
import { resolve,sep } from 'node:path';
import type { z } from 'zod';
// Codex strict output schemas require every object property to be required.
// Optional values must use null so model requests fail locally, before startup.
export function assertStrictOutputSchema(schema:unknown,path='schema'):void{
 if(!schema||typeof schema!=='object')return;
 const node=schema as Record<string,any>;
 if(node.type==='object'||node.properties){
  const missing=Object.keys(node.properties||{}).filter(k=>!node.required?.includes(k));
  if(missing.length)throw new Error(`Invalid Office response schema at ${path}: required must include ${missing.join(', ')}. Use nullable fields instead of optional fields.`);
 }
 for(const [key,value] of Object.entries(node)){
  if(Array.isArray(value))value.forEach((child,index)=>assertStrictOutputSchema(child,`${path}.${key}[${index}]`));
  else if(value&&typeof value==='object')assertStrictOutputSchema(value,`${path}.${key}`);
 }
}

// Recover a completed writable worker's own result, never repeat its actions.
export function completedOutput<T>(root:string,error:unknown,schema:z.ZodType<T>):T|undefined{
 if(!/max_output_tokens/.test(String(error)))return;
 const path=resolve(root,'completed-output.json');
 if(!existsSync(path)||!realpathSync(path).startsWith(realpathSync(root)+sep)||statSync(path).size>256000)return;
 try{return schema.parse(JSON.parse(readFileSync(path,'utf8')));}catch{return;}
}
