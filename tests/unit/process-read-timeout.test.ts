import { expect, test } from 'vitest';
import { command } from '../../server/process';
import { temporaryReadFailure } from '../../server/read-retries';
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
    void run.then(()=>{settled=true;},()=>{settled=true;});await observed;controller.abort();
    await new Promise(resolve=>setTimeout(resolve,100));expect(settled).toBe(false);
    await expect(run).rejects.toThrow('Worker paused');expect(()=>process.kill(-leader,0)).toThrow();
},10000);
