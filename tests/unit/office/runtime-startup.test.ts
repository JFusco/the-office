import { expect, test } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { ROOT } from '../../../server/office/config';

// Exercise real Node HTTP/SSE and process ownership, using only temporary state.
function deadline<T>(promise:Promise<T>, label:string, ms=5000):Promise<T>{
  let timer:ReturnType<typeof setTimeout>;
  return Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out after ${ms}ms`)),ms);})]).finally(()=>clearTimeout(timer));
}
function alive(pid:number){try{process.kill(-pid,0);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ESRCH')return false;throw error;}}
async function stop(pid:number){
  for(const signal of ['SIGTERM','SIGKILL'] as const){
    if(!alive(pid))return;
    process.kill(-pid,signal);
    const until=Date.now()+1000;
    while(alive(pid)&&Date.now()<until)await new Promise(r=>setTimeout(r,25));
  }
  if(alive(pid))throw new Error(`Owned runtime group ${pid} survived cleanup`);
}

test('Node startup preserves a running owner, releases failed-start locks and streams snapshots',async({onTestFinished})=>{
  // Reserve seven seconds of the 60s test budget for bounded cleanup.
  // Each additional Node startup loads the full module graph before it can reject a lock/port;
  // keep those waits bounded without assuming a warm filesystem or idle host.
  const expires=Date.now()+53000;
  const remaining=()=>Math.max(1,expires-Date.now());
  const wait=<T>(promise:Promise<T>,label:string,ms=5000)=>deadline(promise,label,Math.min(ms,remaining()));
  const root=mkdtempSync(resolve(tmpdir(),'office-node-runtime-'));
  const probe=createServer();
  const children:ChildProcess[]=[];
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  onTestFinished(async()=>{
    const results=await Promise.allSettled([
      deadline(reader?.cancel()??Promise.resolve(),'SSE cancellation'),
      deadline(new Promise<void>((resolve,reject)=>probe.close(error=>error&&(error as NodeJS.ErrnoException).code!=='ERR_SERVER_NOT_RUNNING'?reject(error):resolve())),'port probe close'),
      ...children.filter(child=>child.pid).map(child=>stop(child.pid!)),
    ]);
    const failures=results.filter(result=>result.status==='rejected');
    if(failures.length)throw new AggregateError(failures.map(result=>result.reason),'Runtime fixture cleanup failed');
    rmSync(root,{recursive:true,force:true});
  });
  probe.listen(0,'127.0.0.1');await wait(once(probe,'listening'),'port probe listening');
  const port=(probe.address() as {port:number}).port;
  await wait(new Promise<void>((resolve,reject)=>probe.close(error=>error?reject(error):resolve())),'port probe close');
  const launch=(data:string)=>{
    const child=spawn(process.execPath,['--import','tsx',resolve(ROOT,'server/index.ts')],{cwd:ROOT,env:{...process.env,OFFICE_DATA_ROOT:data,OFFICE_PORT:String(port),OFFICE_NO_POLL:'1',OFFICE_DEV:'0'},detached:true,stdio:['ignore','pipe','pipe']});
    children.push(child);let output='';child.stdout!.on('data',b=>{output+=b;});child.stderr!.on('data',b=>{output+=b;});
    let stopped=false,failure:unknown;const exited=once(child,'exit');void exited.then(()=>{stopped=true;},error=>{failure=error;});return {child,exited,output:()=>output,failed:()=>{if(failure)throw failure;return stopped;}};
  };
  {
    const ownerRoot=resolve(root,'owner'),owner=launch(ownerRoot);
    const until=Math.min(Date.now()+15000,expires);
    while(!owner.output().includes('The Office is open')){
      if(owner.failed())throw new Error(`Owner exited before readiness: ${owner.output()}`);
      if(Date.now()>=until)throw new Error(`Owner readiness timed out: ${owner.output()}`);
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    const base=`http://127.0.0.1:${port}`;
    const request=(url:string,options:RequestInit={})=>fetch(url,{...options,signal:AbortSignal.timeout(Math.min(5000,remaining()))});
    expect((await(await request(`${base}/api/health`)).json()).pid).toBe(owner.child.pid);
    const html=await request(`${base}/`);expect(html.headers.get('content-type')).toContain('text/html');expect(html.headers.get('cache-control')).toBe('no-store');
    expect((await request(`${base}/api/office`,{headers:{Origin:'https://example.invalid'}})).status).toBe(403);
    const stream=await request(`${base}/api/events?project=brain`);expect(stream.headers.get('content-type')).toBe('text/event-stream');
    reader=stream.body!.getReader();expect(new TextDecoder().decode((await wait(reader.read(),'first SSE snapshot')).value)).toContain('event: snapshot');await wait(reader.cancel(),'SSE cancellation');reader=undefined;
    const submit=(data:unknown)=>request(`${base}/api/commands?project=cms-field-vocabulary`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const adopted=await submit({action:'adopt-candidate',key:'GH-91'});expect(adopted.status).toBe(202);const accepted=await adopted.json();expect(accepted.id).toMatch(/^[a-f0-9-]{36}$/);
    expect((await(await submit({action:'adopt-candidate',key:'GH-91'})).json()).id).toBe(accepted.id);
    const queued=await(await request(`${base}/api/office?project=cms-field-vocabulary`)).json();expect(queued.coordination.requests.find((request:any)=>request.id===accepted.id).status).toBe('queued');expect(queued.workLog||[]).toHaveLength(0);
    expect((await submit({action:'retry-daily-cto',checkpointId:{invalid:true}})).status).toBe(400);
    const duplicate=launch(ownerRoot);await wait(duplicate.exited,'duplicate exit',15000);expect(duplicate.output()).toContain('already owns this state');
    expect(Number(readFileSync(resolve(ownerRoot,'service.pid'),'utf8'))).toBe(owner.child.pid);
    const blockedRoot=resolve(root,'port-blocked'),blocked=launch(blockedRoot);await wait(blocked.exited,'blocked startup exit',15000);expect(blocked.output()).toContain('EADDRINUSE');expect(existsSync(resolve(blockedRoot,'service.pid'))).toBe(false);
    expect((await request(`${base}/api/health`)).ok).toBe(true);
    owner.child.kill('SIGTERM');await wait(owner.exited,'owner exit');expect(existsSync(resolve(ownerRoot,'service.pid'))).toBe(false);
  }
},60000);
