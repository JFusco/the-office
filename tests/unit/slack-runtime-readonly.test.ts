import {afterEach,expect,test} from 'vitest';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {z} from 'zod';
import {Store} from '../../server/store';
import {projectById} from '../../server/projects';
import {WorkerRuntime} from '../../server/worker-runtime';
import {command,CommandFailure,processGroupAlive} from '../../server/process';
const schema=z.object({ok:z.boolean()}).strict();
const stores:Store[]=[],paths:string[]=[];
afterEach(()=>{for(const store of stores.splice(0))store.close();for(const path of paths.splice(0))rmSync(path,{recursive:true,force:true});});
function fixture(){const path=mkdtempSync(resolve(tmpdir(),'office-slack-reader-'));paths.push(path);const store=new Store(':memory:',projectById('brain'),path);stores.push(store);return store;}
function events(){return [{type:'thread.started',thread_id:crypto.randomUUID()},{type:'item.completed',item:{type:'agent_message',text:'{"ok":true}'}}];}
test.each([
 ['slack-recipient',true,false,true],['slack-verify',true,false,true],
 ['slack-send',true,true,false],['slack-verify',true,true,false],['slack-recipient',true,true,false],
 ['slack-send',true,false,false],['slack-unknown',true,false,false],
 ['slack-verify',false,false,false],['slack-recipient',false,false,false],
 ['github-review',false,false,true],['enhance',false,false,false],
] as const)('actual runtime forwards effect disposition for %s / filesystemReadOnly=%s / send=%s',async(stage,readOnly,slackSend,expected)=>{
 const store=fixture();let observed:boolean|undefined;
 const execute:typeof command=async(_program,_args,options={})=>{observed=options.readOnly;for(const event of events())options.onLine?.(JSON.stringify(event));return '';};
 const runtime=new WorkerRuntime(store,execute);
 await expect(runtime.run('pm','Synthetic transport classification',schema,{stage,readOnly,slackSend})).resolves.toEqual({ok:true});
 expect(observed).toBe(expected);expect(runtime.active.size).toBe(0);expect(store.state.workLog?.at(-1)?.status).toBe('completed');
});
/** Local Node fixture models a native CLI that emits its valid final answer and leaves a helper. */
function helperProgram(ignoreTerm=false){
 const helper=ignoreTerm?"process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)":"console.log('ready');setInterval(()=>{},1000)";
 return `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(helper)}],{stdio:['ignore','pipe','ignore']});child.unref();child.stdout.once('data',()=>{for(const e of ${JSON.stringify(events())})console.log(JSON.stringify(e));process.exit(0);});`;
}
test.each(['slack-recipient','slack-verify'])('actual %s runtime retains a completed read after confirmed helper cleanup',async stage=>{
 const store=fixture();let group=0;
 const execute:typeof command=async(_program,_args,options={})=>command(process.execPath,['-e',helperProgram()],{...options,onSpawn:pid=>{group=pid;options.onSpawn?.(pid);}});
 const runtime=new WorkerRuntime(store,execute);
 await expect(runtime.run('pm','Local read-only Slack verification fixture',schema,{stage,readOnly:true})).resolves.toEqual({ok:true});
 const worker=store.state.workLog!.at(-1)!;
 expect(group).toBeGreaterThan(0);expect(processGroupAlive(group)).toBe(false);expect(worker).toMatchObject({status:'completed',processId:group});
 expect(JSON.parse(readFileSync(resolve(store.dataRoot,'sessions',worker.id,'result.json'),'utf8')).result).toEqual({ok:true});
 expect(existsSync(resolve(store.dataRoot,'sessions',worker.id,'error.json'))).toBe(false);expect(runtime.active.size).toBe(0);
},10000);
test.each([['slack-send',true],['slack-unknown',false]] as const)('actual %s runtime still rejects surviving external-effect helpers',async(stage,slackSend)=>{
 const store=fixture();let group=0;
 const execute:typeof command=async(_program,_args,options={})=>command(process.execPath,['-e',helperProgram()],{...options,onSpawn:pid=>{group=pid;options.onSpawn?.(pid);}});
 const runtime=new WorkerRuntime(store,execute);
 const failure=await runtime.run('pm','Local writer uncertainty fixture',schema,{stage,readOnly:true,slackSend}).catch(error=>error);
 expect(failure).toBeInstanceOf(CommandFailure);expect(failure).toMatchObject({category:'uncertain-effect',dispatched:true});expect(String(failure)).toContain('surviving subprocesses');
 const worker=store.state.workLog!.at(-1)!;expect(worker.status).toBe('failed');expect(processGroupAlive(group)).toBe(false);
 expect(existsSync(resolve(store.dataRoot,'sessions',worker.id,'result.json'))).toBe(false);expect(existsSync(resolve(store.dataRoot,'sessions',worker.id,'error.json'))).toBe(true);expect(runtime.active.size).toBe(0);
},10000);
test('a cancelled actual Slack verifier retains capacity until its whole helper group is stopped',async()=>{
 const store=fixture();let group=0,ready!:()=>void,settled=false;const observed=new Promise<void>(resolve=>{ready=resolve;});
 const execute:typeof command=async(_program,_args,options={})=>command(process.execPath,['-e',helperProgram(true)],{...options,onSpawn:pid=>{group=pid;options.onSpawn?.(pid);},onLine:line=>{options.onLine?.(line);if(JSON.parse(line).type==='item.completed')ready();}});
 const runtime=new WorkerRuntime(store,execute);
 const run=runtime.run('pm','Local verifier cancellation fixture',schema,{stage:'slack-verify',readOnly:true});const outcome=run.then(()=>{settled=true;return undefined;},error=>{settled=true;return error;});
 await observed;runtime.pause();await new Promise(resolve=>setTimeout(resolve,100));
 expect(settled).toBe(false);expect(runtime.active.has('pm')).toBe(true);expect(store.state.workLog!.at(-1)!.status).toBe('stopping');
 const failure=await outcome;expect(String(failure)).toContain('Worker paused');expect(processGroupAlive(group)).toBe(false);expect(runtime.active.size).toBe(0);expect(store.state.workLog!.at(-1)!.status).toBe('interrupted');
},10000);
