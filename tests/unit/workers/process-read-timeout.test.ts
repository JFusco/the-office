import { afterEach, expect, test } from 'vitest';
import { command as execute } from '../../../server/workers/process';
import { temporaryReadFailure } from '../../../server/scheduling/read-retries';
function deadline<T>(promise:Promise<T>,label:string,ms=2000):Promise<T>{
    let timer:ReturnType<typeof setTimeout>;
    return Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out`)),ms);})]).finally(()=>clearTimeout(timer));
}
const owned:{pid:number;controller:AbortController;settled:Promise<unknown>}[]=[];
function command(program:string,args:string[],options:NonNullable<Parameters<typeof execute>[2]>={}){
    const controller=new AbortController();
    const resource={pid:0,controller,settled:Promise.resolve() as Promise<unknown>};
    owned.push(resource);
    const run=execute(program,args,{timeout:7500,...options,signal:options.signal?AbortSignal.any([controller.signal,options.signal]):controller.signal,onSpawn:pid=>{resource.pid=pid;options.onSpawn?.(pid);}});
    resource.settled=run.catch(()=>{});
    return run;
}
function alive(pid:number){try{process.kill(-pid,0);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ESRCH')return false;throw error;}}
afterEach(async()=>{
    const results=await Promise.allSettled(owned.splice(0).map(async resource=>{
        resource.controller.abort();
        if(resource.pid){
            for(const signal of ['SIGTERM','SIGKILL'] as const){
                if(!alive(resource.pid))break;
                process.kill(-resource.pid,signal);
                const until=Date.now()+500;
                while(alive(resource.pid)&&Date.now()<until)await new Promise(r=>setTimeout(r,25));
            }
            if(alive(resource.pid))throw new Error(`Owned worker group ${resource.pid} survived cleanup`);
        }
        await deadline(resource.settled,'worker settlement after cleanup');
    }));
    const failures=results.filter(result=>result.status==='rejected');
    if(failures.length)throw new AggregateError(failures.map(result=>result.reason),'Worker fixture cleanup failed');
});
async function waitForReady(observed:Promise<void>,run:Promise<string>){
    await deadline(Promise.race([observed,run.then(()=>{throw new Error('Worker exited before readiness');})]),'worker readiness');
}
test('timed-out read commands are safely retryable while unknown writer outcomes stay guarded', async () => {
    for (const readOnly of [true, false]) {
        let message = '';
        try {
            await command(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeout: 30, readOnly });
        }
        catch (e) {
            message = String(e);
        }
        expect(temporaryReadFailure(message)).toBe(readOnly);
        expect(message.includes('must be reconciled')).toBe(!readOnly);
    }
});
test('a failed process-identity checkpoint terminates the owned process before rejecting', async () => { let pid = 0; await expect(command(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { onSpawn: value => { pid = value; throw new Error('checkpoint unavailable'); } })).rejects.toThrow('checkpoint unavailable'); expect(pid).toBeGreaterThan(0); expect(() => process.kill(-pid, 0)).toThrow(); });

function helperProgram(milliseconds: number, code=0) {
    const helper = milliseconds ? `setTimeout(()=>{},${milliseconds})` : 'setInterval(()=>{},1000)';
    return `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(helper)}],{stdio:'ignore'});child.unref();console.log(child.pid);process.exit(${code});`;
}
test('a zero-exit writer waits for short-lived descendants instead of falsely failing completed work', async () => {
    let leader=0;
    const output=await command(process.execPath,['-e',helperProgram(150)],{onSpawn:pid=>{leader=pid;}});
    expect(Number(output.trim())).toBeGreaterThan(0);expect(()=>process.kill(-leader,0)).toThrow();
});
test('successful readers clean up persistent helpers before returning; writers retain uncertainty', async () => {
    for(const readOnly of [true,false]){
        let leader=0;
        const run=command(process.execPath,['-e',helperProgram(0)],{readOnly,onSpawn:pid=>{leader=pid;}});
        if(readOnly)expect(Number((await run).trim())).toBeGreaterThan(0);
        else await expect(run).rejects.toThrow('surviving subprocesses');
        expect(()=>process.kill(-leader,0)).toThrow();
    }
    await expect(command(process.execPath,['-e',helperProgram(0,1)],{readOnly:true})).rejects.toThrow('exited 1');
},10000);
test('cancellation stays active during descendant cleanup and does not release capacity before termination', async () => {
    const controller=new AbortController();let leader=0,settled=false;let ready!:()=>void;
    const observed=new Promise<void>(resolve=>{ready=resolve;});
    const child="process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)";
    const parent=`const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(child)}],{stdio:['ignore','pipe','ignore']});child.unref();child.stdout.once('data',()=>{console.log(child.pid);process.exit(0);});`;
    const run=command(process.execPath,['-e',parent],{readOnly:true,signal:controller.signal,onSpawn:pid=>{leader=pid;},onLine:()=>ready()});
    void run.then(()=>{settled=true;},()=>{settled=true;});await waitForReady(observed,run);controller.abort();
    await new Promise(resolve=>setTimeout(resolve,100));expect(settled).toBe(false);
    await expect(run).rejects.toThrow('Worker paused');expect(()=>process.kill(-leader,0)).toThrow();
},10000);
test('an opted-in zero-exit writer stops persistent helpers and returns its output', async () => {
    let leader=0,cleaned=0;
    const output=await command(process.execPath,['-e',helperProgram(0)],{terminateStragglers:true,onSpawn:pid=>{leader=pid;},onStragglersTerminated:group=>{cleaned=group;}});
    expect(Number(output.trim())).toBeGreaterThan(0);
    expect(cleaned).toBe(leader);
    expect(()=>process.kill(-leader,0)).toThrow();
},10000);
test('straggler opt-in never converts a nonzero exit, timeout or cancellation into success', async () => {
    await expect(command(process.execPath,['-e',helperProgram(0,1)],{terminateStragglers:true})).rejects.toThrow('surviving subprocesses');
    await expect(command(process.execPath,['-e','setInterval(()=>{},1000)'],{terminateStragglers:true,timeout:30})).rejects.toThrow('must be reconciled');
    const controller=new AbortController();let leader=0,settled=false;let ready!:()=>void;
    const observed=new Promise<void>(resolve=>{ready=resolve;});
    const child="process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)";
    const parent=`const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(child)}],{stdio:['ignore','pipe','ignore']});child.unref();child.stdout.once('data',()=>{console.log(child.pid);process.exit(0);});`;
    const run=command(process.execPath,['-e',parent],{terminateStragglers:true,signal:controller.signal,onSpawn:pid=>{leader=pid;},onLine:()=>ready()});
    void run.then(()=>{settled=true;},()=>{settled=true;});await waitForReady(observed,run);controller.abort();
    await new Promise(resolve=>setTimeout(resolve,100));expect(settled).toBe(false);
    await expect(run).rejects.toThrow('Worker paused');expect(()=>process.kill(-leader,0)).toThrow();
},15000);

test('a terminal provider event with a surviving child retains lifecycle evidence and writer uncertainty', async () => {
    let leader = 0, helper = 0; let diagnostic: import('../../../server/workers/lifecycle/contract').LifecycleDiagnostic | undefined;
    const parent = helperProgram(0).replace('console.log(child.pid)', `console.log(JSON.stringify({type:'turn.completed',text:'PRIVATE_PROVIDER_TEXT'}));console.log(child.pid)`);
    await expect(command(process.execPath, ['-e', parent], { onSpawn: pid => { leader = pid; }, onLine: line => { if (/^\d+$/.test(line)) helper = Number(line); }, lifecycleInventory: async () => helper ? `${helper} ${leader} ${leader} Sun Nov 8 14:00:00 2026 /usr/local/bin/node` : '', onLifecycle: value => { diagnostic = value; } })).rejects.toThrow('surviving subprocesses');
    expect(alive(leader)).toBe(false);
    expect(diagnostic).toMatchObject({ providerTerminalObserved: true, outcome: 'failed', failureCategory: 'uncertain-effect' });
    expect(diagnostic!.events).toEqual(expect.arrayContaining([expect.objectContaining({ phase: 'exit', code: 0 }), expect.objectContaining({ phase: 'term' })]));
    expect(diagnostic!.snapshots.some(s => s.members.some(m => m.pid === helper && m.pgid === leader))).toBe(true);
    expect(JSON.stringify(diagnostic)).not.toContain('PRIVATE_PROVIDER_TEXT');
}, 10000);
test('a failing diagnostic consumer cannot change successful read cleanup', async () => {
    const output = await command(process.execPath, ['-e', helperProgram(0)], { readOnly: true, onLifecycle: () => { throw new Error('disk unavailable'); } });
    expect(Number(output.trim())).toBeGreaterThan(0);
}, 10000);
