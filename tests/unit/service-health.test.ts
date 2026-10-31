import {expect,test} from 'vitest';
import {ServiceHealthChecks} from '../../server/service-health';
import type {OfficeSnapshot} from '../../src/shared';
const state=(workLog:any[]=[])=>({project:{id:'brain',name:'Brain'},paused:false,coordination:{listener:{lastCheckedAt:new Date().toISOString(),error:''}},workLog,slackDeliveries:[]} as unknown as OfficeSnapshot);
function fixture(){
 const calls:{program:string;args:string[]}[]=[];
 const execute=async(program:string,args:string[])=>{
  calls.push({program,args});
  if(program==='claude')return JSON.stringify({loggedIn:true,email:'fixture@example.test',accessToken:'never-return-this'});
  if(program==='codex')return '';
  if(program==='gh')return JSON.stringify({hosts:{'github.com':[{active:true,state:'success',login:'fixture',token:'never-return-this'}]}});
  if(program==='twg')return JSON.stringify({data:{accountId:'fixture',name:'Fixture User',token:'never-return-this'}});
  return '"project-id"';
 };
 return {calls,execute};
}
test('service checks use status/read commands, coalesce requests and never return credentials',async()=>{
 const f=fixture(),checks=new ServiceHealthChecks(f.execute as any),[a,b]=await Promise.all([checks.report([state()]),checks.report([state()])]);
 expect(f.calls).toHaveLength(5);expect(a.services.filter(s=>['openai','anthropic','github','atlassian','azure'].includes(s.id)).every(s=>s.status==='connected')).toBe(true);
 expect(JSON.stringify(a)).not.toContain('never-return-this');expect(b.services.find(s=>s.id==='slack')?.status).toBe('unknown');
 await checks.report([state()]);expect(f.calls).toHaveLength(5);expect(f.calls.every(c=>!c.args.includes('--show-token'))).toBe(true);
});
test('a delivery failure remains in history without turning a verified login into an outage',async()=>{
 const f=fixture(),checks=new ServiceHealthChecks(f.execute as any),failed={provider:'claude',status:'failed',stage:'github-update-base',ticket:'GH-255',endedAt:'2026-10-28T20:27:13Z'};
 const report=await checks.report([state([failed])]);expect(report.services.find(s=>s.id==='anthropic')).toMatchObject({status:'connected',lastFailure:{at:failed.endedAt}});
 const recovered=await checks.report([state([failed,{...failed,status:'completed',endedAt:'2026-10-28T20:28:00Z'}])]);expect(recovered.services.find(s=>s.id==='anthropic')?.status).toBe('connected');expect(f.calls.find(c=>c.program==='claude')?.args).toEqual(['auth','status','--json']);
});
test('authentication denial differs from a timeout or unavailable status command',async()=>{
 const checks=new ServiceHealthChecks(async(program)=>{throw new Error(program==='claude'?'Not logged in':'command timed out');});
 const report=await checks.report([state()]);expect(report.services.find(s=>s.id==='anthropic')?.status).toBe('disconnected');expect(report.services.find(s=>s.id==='github')?.status).toBe('unknown');
 expect(report.services.find(s=>s.id==='github')?.nextStep).not.toContain('gh auth');expect(report.services.find(s=>s.id==='github')?.detail).toContain('timed out');
});
