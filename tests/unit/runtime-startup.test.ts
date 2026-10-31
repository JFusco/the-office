import { expect, test } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { ROOT } from '../../server/config';

// Exercise real Node HTTP/SSE and process ownership, using only temporary state.
test('Node startup preserves a running owner, releases failed-start locks and streams snapshots',async()=>{
  const root=mkdtempSync(resolve(tmpdir(),'office-node-runtime-'));
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=(probe.address() as {port:number}).port;await new Promise<void>(r=>probe.close(()=>r()));
  const children:ChildProcess[]=[];
  const launch=(data:string)=>{
    const child=spawn(process.execPath,['--import','tsx',resolve(ROOT,'server/index.ts')],{cwd:ROOT,env:{...process.env,OFFICE_DATA_ROOT:data,OFFICE_PORT:String(port),OFFICE_NO_POLL:'1',OFFICE_DEV:'0'},stdio:['ignore','pipe','pipe']});
    children.push(child);let output='';child.stdout!.on('data',b=>{output+=b;});child.stderr!.on('data',b=>{output+=b;});
    const exited=once(child,'exit');return {child,exited,output:()=>output};
  };
  try{
    const ownerRoot=resolve(root,'owner'),owner=launch(ownerRoot);
    await expect.poll(owner.output,{timeout:15000}).toContain('The Office is open');
    const base=`http://127.0.0.1:${port}`;
    expect((await(await fetch(`${base}/api/health`)).json()).pid).toBe(owner.child.pid);
    const html=await fetch(`${base}/`);expect(html.headers.get('content-type')).toContain('text/html');expect(html.headers.get('cache-control')).toBe('no-store');
    expect((await fetch(`${base}/api/office`,{headers:{Origin:'https://example.invalid'}})).status).toBe(403);
    const stream=await fetch(`${base}/api/events?project=brain`);expect(stream.headers.get('content-type')).toBe('text/event-stream');
    const reader=stream.body!.getReader();expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: snapshot');await reader.cancel();
    const submit=(data:unknown)=>fetch(`${base}/api/commands?project=cms-field-vocabulary`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const adopted=await submit({action:'adopt-candidate',key:'GH-91'});expect(adopted.status).toBe(202);const accepted=await adopted.json();expect(accepted.id).toMatch(/^[a-f0-9-]{36}$/);
    expect((await(await submit({action:'adopt-candidate',key:'GH-91'})).json()).id).toBe(accepted.id);
    const queued=await(await fetch(`${base}/api/office?project=cms-field-vocabulary`)).json();expect(queued.coordination.requests.find((request:any)=>request.id===accepted.id).status).toBe('queued');expect(queued.workLog||[]).toHaveLength(0);
    expect((await submit({action:'retry-daily-cto',checkpointId:{invalid:true}})).status).toBe(400);
    const duplicate=launch(ownerRoot);await duplicate.exited;expect(duplicate.output()).toContain('already owns this state');
    expect(Number(readFileSync(resolve(ownerRoot,'service.pid'),'utf8'))).toBe(owner.child.pid);
    const blockedRoot=resolve(root,'port-blocked'),blocked=launch(blockedRoot);await blocked.exited;expect(blocked.output()).toContain('EADDRINUSE');expect(existsSync(resolve(blockedRoot,'service.pid'))).toBe(false);
    expect((await fetch(`${base}/api/health`)).ok).toBe(true);
    owner.child.kill('SIGTERM');await owner.exited;expect(existsSync(resolve(ownerRoot,'service.pid'))).toBe(false);
  }finally{
    for(const child of children)if(child.exitCode===null&&!child.signalCode){child.kill('SIGTERM');await once(child,'exit');}
    rmSync(root,{recursive:true,force:true});
  }
},30000);
