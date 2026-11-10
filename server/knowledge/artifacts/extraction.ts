import { StringDecoder } from 'node:string_decoder';
import { spawn,execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { z } from 'zod';
export const Extraction = z.object({ outcome:z.enum(['extracted','unsupported','malformed','encrypted','no-text','oversized','page-limit','text-limit','timeout','memory-limit','unavailable']), text:z.string().max(500000).optional(), extractor:z.string().optional(), references:z.array(z.record(z.string(),z.number().int().nonnegative())).max(250001).optional(), warnings:z.array(z.string()).max(100).optional() }).strict();
export type Extraction = z.infer<typeof Extraction>;
export type Extractor = (path:string,kind:'text'|'pdf'|'docx')=>Promise<Extraction>;
/** Private child process group: no provider or model, 30s / 256 MiB heap / 512 MiB RSS. */
export function createExtractor(spawnChild:typeof spawn=spawn,readMemory:typeof execFile=execFile,terminate:(pid:number)=>void=pid=>process.kill(-pid,'SIGKILL')):Extractor { return (path,kind) => new Promise(resolveResult=>{
    const child=spawnChild(process.execPath,['--max-old-space-size=256',resolve(import.meta.dirname,'extract-worker.mjs'),path,kind],{detached:true,stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,NODE_NO_WARNINGS:'1'}});
    const decoder=new StringDecoder('utf8');
    let output='', probeFailures=0, bytes=0, stderr='', forced:Extraction['outcome']|undefined, finished=false, probing=false;
    const kill=(outcome:Extraction['outcome'])=>{if(finished)return;forced ||= outcome;try{if(child.pid)terminate(child.pid);}catch{/* Already exited. */}};
    const deadline=setTimeout(()=>kill('timeout'),30000);
    const failedProbe=()=>{probing=false;if(!finished&&++probeFailures>=3)kill('unavailable');};
    const memory=setInterval(()=>{if(!child.pid||probing)return;probing=true;try{readMemory('/bin/ps',['-o','rss=','-g',String(child.pid)],{timeout:1000,maxBuffer:16384},(error,stdout)=>{probing=false;if(finished)return;if(error){failedProbe();return;}probeFailures=0;if(stdout.trim().split(/\s+/).reduce((n,v)=>n+Number(v),0)>512*1024)kill('memory-limit');});}catch{failedProbe();}},100);
    child.stdout.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>2*1024*1024)kill('text-limit');else output+=decoder.write(chunk);});
    child.stderr.on('data',(chunk:Buffer)=>{if(stderr.length<16384)stderr+=chunk.toString('utf8');});
    const finish=(value:Extraction)=>{if(finished)return;finished=true;clearTimeout(deadline);clearInterval(memory);resolveResult(value);};
    child.on('error',()=>finish({outcome:'unavailable'}));child.on('close',code=>{
        if(forced)return finish({outcome:forced});
        if(code!==0)return finish({outcome:/heap out of memory|allocation failed/i.test(stderr)?'memory-limit':'malformed'});
        try {output+=decoder.end();const result=Extraction.parse(JSON.parse(output));if(result.outcome==='extracted'&&(!result.text||!result.extractor||Buffer.byteLength(result.text)>1024*1024))throw Error();finish(result);}catch{finish({outcome:'malformed'});}
    });
}); }
export const extractDocument=createExtractor();
