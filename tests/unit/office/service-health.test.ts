import {afterEach,expect,test,vi} from 'vitest';
import {ServiceHealthChecks} from '../../../server/office/service-health';
import type {HealthReport,OfficeSnapshot} from '../../../src/shared';
const state=(workLog:any[]=[])=>({project:{id:'brain',name:'Brain'},paused:false,coordination:{listener:{lastCheckedAt:new Date().toISOString(),error:''}},workLog,slackDeliveries:[]} as unknown as OfficeSnapshot);
function fixture(){
 const calls:{program:string;args:string[]}[]=[];
 const execute=async(program:string,args:string[])=>{
  calls.push({program,args});
  if(program==='curl')return JSON.stringify({status:{indicator:'none',description:'All Systems Operational'},components:[],incidents:[]});
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
 expect(f.calls).toHaveLength(7);expect(a.services.filter(s=>['openai','anthropic','github','atlassian','azure'].includes(s.id)).every(s=>s.status==='connected')).toBe(true);
 expect(JSON.stringify(a)).not.toContain('never-return-this');expect(b.services.find(s=>s.id==='slack')?.status).toBe('unknown');
 await checks.report([state()]);expect(f.calls).toHaveLength(7);expect(f.calls.every(c=>!c.args.includes('--show-token'))).toBe(true);
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
const REFUSED='Failed to authenticate: OAuth session expired and could not be refreshed';
const refusal=(offset:number)=>({provider:'claude',status:'failed',stage:'implement',ticket:'GH-552',endedAt:since(offset),failure:{category:'uncertain-effect',dispatched:true,detail:`claude exited 1: ${REFUSED}`}});
/** A moment `offset` ms after this process started, which is when a worker's refusal starts to count. */
const since=(offset:number)=>new Date(performance.timeOrigin+offset).toISOString();
const anthropic=(report:HealthReport)=>report.services.find(s=>s.id==='anthropic');
const startAfterOrigin=()=>vi.useFakeTimers({toFake:['Date'],now:performance.timeOrigin+60000});
afterEach(()=>{vi.useRealTimers();});
test('a worker’s Claude login refusal counts only after the process started, even before the checks existed',async()=>{
 startAfterOrigin();const checks=new ServiceHealthChecks(fixture().execute as any);
 expect(anthropic(await checks.report([state([refusal(-1000)])]))?.status).toBe('connected');
 expect(anthropic(await checks.report([state([refusal(30000)])]))).toMatchObject({status:'disconnected',failure:REFUSED});
});
test('a refusal in any project signs Claude out on the cached reading until a later completed run',async()=>{
 startAfterOrigin();const f=fixture(),checks=new ServiceHealthChecks(f.execute as any),first=anthropic(await checks.report([state(),state()]))!;
 expect(first.status).toBe('connected');vi.setSystemTime(performance.timeOrigin+70000);
 const refused=refusal(65000),network={...refused,endedAt:since(68000),failure:{...refused.failure,detail:'claude exited 1: API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)'}};
 expect(anthropic(await checks.report([state([refused]),state([network])]))).toEqual({...first,status:'disconnected',detail:'Claude refused the Office’s login during a worker run. Its status command still reports a configured login.',failure:REFUSED,lastFailure:{at:network.endedAt,detail:expect.stringContaining('GH-552')}});
 const cleared=anthropic(await checks.report([state([refused]),state([network,{...network,status:'completed',failure:undefined,endedAt:since(69000)}])]));
 expect(cleared).toMatchObject({status:'connected',detail:first.detail});expect(cleared?.failure).toBeUndefined();
 expect(f.calls.filter(c=>c.program==='claude')).toHaveLength(1);
});
test('the check’s own signed-out reading supersedes an earlier refusal once Claude is signed in again',async()=>{
 startAfterOrigin();let loggedIn=false,release=()=>{};const held=new Promise<void>(resolve=>{release=resolve;}),f=fixture();
 const checks=new ServiceHealthChecks((async(program:string,args:string[])=>{
  if(program==='claude')return JSON.stringify(loggedIn?{loggedIn:true,email:'fixture@example.test'}:{loggedIn:false,authMethod:'none'});
  if(program==='az')await held;
  return f.execute(program,args);
 }) as any);
 // Claude reads signed out at +60 s while Azure holds the batch open until +65 s.
 const pending=checks.report([state()]);await new Promise(resolve=>setImmediate(resolve));
 vi.setSystemTime(performance.timeOrigin+65000);release();
 expect(anthropic(await pending)).toMatchObject({status:'disconnected',failure:'loggedIn: false, authMethod: none'});
 loggedIn=true;vi.setSystemTime(performance.timeOrigin+130000);
 expect(anthropic(await checks.report([state([refusal(60000)])]))?.status).toBe('connected');
 expect(anthropic(await checks.report([state([refusal(62000)])]))).toMatchObject({status:'disconnected',failure:REFUSED});
});
test('a refusal leaves an unverified Claude check as the check reported it',async()=>{
 startAfterOrigin();const f=fixture(),checks=new ServiceHealthChecks((async(program:string,args:string[])=>{if(program==='claude')throw new Error('command timed out');return f.execute(program,args);}) as any);
 const row=anthropic(await checks.report([state([refusal(30000)])]));
 expect(row).toMatchObject({status:'unknown',detail:'The read-only status check timed out after 60 seconds. Login status is unverified.'});expect(row?.failure).toBeUndefined();
});
