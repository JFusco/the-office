import { featureFixture } from './feature-fixture';
// Isolated browser-test server: serves a built UI (static files) and answers the Office API
// from in-memory synthetic fixtures. It never reads .local data, starts workers or contacts
// providers. Writes only change this process's memory and are recorded for inspection.
//   tsx tests/browser/fixture-server.ts [--port 4460] [--dist dist]
import { createServer, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { createFixtureState, type FixtureState } from './fixtures/office-data';
import { telemetryReport } from '../../src/telemetry/report';

const arg=(name:string,fallback:string)=>{const i=process.argv.indexOf(`--${name}`);return i>0?process.argv[i+1]:fallback;};
const port=Number(arg('port',process.env.OFFICE_FIXTURE_PORT||'4460')),dist=resolve(arg('dist',process.env.OFFICE_FIXTURE_DIST||'dist'));
if(!existsSync(resolve(dist,'index.html')))throw new Error(`No built UI at ${dist}. Run a Vite build first.`);
let state:FixtureState=createFixtureState();
const writes:{at:string;method:string;path:string;body:unknown}[]=[];
const streams=new Map<string,Set<ServerResponse>>();
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const json=(res:ServerResponse,body:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
let sequence=0;
const snapshot=(project:string)=>{const s=state.snapshots[project];if(s){s.serverTime=new Date().toISOString();s.serviceInstanceId='fixture-service';s.snapshotSequence=++sequence;s.preferences={...state.preferences};}return s;};
const WRITABLE=['quality','reducedMotion','keyboardShortcuts','deliveryToasts','coffeeBreaks'];
// Merge writable preference fields; returns false for an unknown or empty patch, like the real route's 400.
const mergePreferences=(patch:Record<string,unknown>)=>{const keys=Object.keys(patch||{});if(!keys.length||keys.some(k=>!WRITABLE.includes(k)))return false;state.preferences={...state.preferences,...patch,revision:state.preferences.revision+1};for(const project of streams.keys())push(project);return true;};
const push=(project:string)=>{for(const res of streams.get(project)||[])res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot(project))}\n\n`);};
async function body(req:import('node:http').IncomingMessage){let text='';for await(const chunk of req)text+=chunk;try{return text?JSON.parse(text):{};}catch{return text;}}

createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://127.0.0.1:${port}`),project=url.searchParams.get('project')||'cec';
  if(url.pathname==='/__fixture/reset'){state=createFixtureState();writes.length=0;return json(res,{reset:true});}
  if(url.pathname==='/__fixture/snapshot'&&req.method==='POST'){const patch=await body(req) as any;Object.assign(state.snapshots[project],patch);if(url.searchParams.get('push')!=='0')push(project);return json(res,{ok:true});}
  if(url.pathname==='/__fixture/writes')return json(res,writes);
  // Test seeding only: not recorded in writes, so no-write assertions stay meaningful.
  if(url.pathname==='/__fixture/preferences'&&req.method==='POST'){const patch=await body(req) as Record<string,unknown>;return mergePreferences(patch)?json(res,{...state.preferences,serviceInstanceId:'fixture-service'}):json(res,{error:'Invalid preferences'},400);}
  // Office-wide routes run before project-specific dispatch, as in the real server.
  if(url.pathname==='/api/preferences'){
    if(req.method==='GET')return json(res,{...state.preferences,serviceInstanceId:'fixture-service'});
    if(req.method!=='POST')return json(res,{error:'GET or POST required'},405);
    const patch=await body(req) as Record<string,unknown>;writes.push({at:new Date().toISOString(),method:'POST',path:url.pathname,body:patch});
    return mergePreferences(patch)?json(res,{...state.preferences,serviceInstanceId:'fixture-service'}):json(res,{error:'Invalid preferences'},400);
  }
  if(url.pathname==='/api/office-config')return req.method==='GET'?json(res,state.config):json(res,{error:'GET required'},405);
  if(url.pathname==='/api/telemetry'){
    const scope=url.searchParams.get('scope')||'office',projectId=url.searchParams.get('projectId'),days=url.searchParams.get('days')||'30',ticket=url.searchParams.get('ticket');
    if(!['office','project'].includes(scope)||!['7','30','all'].includes(days)||scope==='project'&&!state.snapshots[projectId||'']||ticket&&scope!=='project')return json(res,{error:'Invalid telemetry query'},400);
    const projects=Object.values(state.snapshots).map(s=>({id:s.project!.id,name:s.project!.name,provider:s.project!.provider,workLog:s.workLog||[],time:s.coordination?.time,hasBoard:!!s.project!.githubProject}));
    return json(res,telemetryReport(projects as any,{scope:scope as 'office'|'project',projectId,ticket,days:days==='all'?'all':Number(days) as 7|30}));
  }
  if(url.pathname==='/api/time/scope-preview')return json(res,{applied:true,applicable:false,expectedSha256:null,rows:[],tickets:[],blockers:{disabled:false,liveWork:[],publications:[],manual:[]}});
  if(url.pathname.startsWith('/api/')){
    if(req.method==='POST'){
      const data=await body(req) as Record<string,any>;writes.push({at:new Date().toISOString(),method:'POST',path:`${url.pathname}${url.search}`,body:data});
      const s=state.snapshots[project];if(!s)return json(res,{error:'Unknown project'},409);
      if(url.pathname.startsWith('/api/features')){try{const result=featureFixture(s,url.pathname,data);push(project);return json(res,result);}catch(error){return json(res,{error:String(error)},409);}}
      if(url.pathname==='/api/commands'){
        const c=s.coordination!;
        if(data.action==='configure-pickup')c.pickup={...c.pickup!,...data.pickup};
        if(data.action==='configure-notifications')c.notices={policy:{...c.notices!.policy,...data.notifications},entries:c.notices!.entries};
        if(data.action==='configure-time')c.time={...c.time!,...data.time};
        if(data.action==='configure-merges')c.merges={enabled:!!data.merges?.enabled,authorizedAt:new Date().toISOString()};
        if(data.action==='configure-knowledge'&&s.knowledge)s.knowledge={...s.knowledge,enabled:!!data.knowledge?.enabled};
        if(data.action==='retire-lesson'&&s.knowledge)s.knowledge={...s.knowledge,lessons:s.knowledge.lessons.map(l=>l.id===data.lessonId?{...l,status:'retired' as const,retiredAt:new Date().toISOString(),retiredBy:'human' as const}:l)};
        const lessons=(map:(l:import('../../src/shared').Lesson)=>import('../../src/shared').Lesson)=>{if(s.knowledge)s.knowledge={...s.knowledge,lessons:s.knowledge.lessons.map(l=>l.id===data.lessonId?map(l):l)};};
        if(data.action==='reactivate-lesson')lessons(l=>({...l,status:'active',recurrences:[],reactivatedAt:new Date().toISOString()}));
        if(data.action==='decline-lesson-issue')lessons(l=>({...l,repositoryInstruction:{status:'declined'}}));
        if(data.action==='file-lesson-issue')lessons(l=>({...l,repositoryInstruction:{status:'filed',issueUrl:'https://github.com/JFusco/brain/issues/999',filedAt:new Date().toISOString()}}));
        if(['accept-office-lesson','decline-office-lesson','retire-office-lesson'].includes(data.action)){
          // Office-wide: the fixture keeps one copy and stamps it onto every project, like the control store.
          const office=s.officeKnowledge||{proposals:[],lessons:[]},at=new Date().toISOString(),proposal=office.proposals.find(p=>p.id===data.lessonId);
          if(data.action==='retire-office-lesson')office.lessons=office.lessons.map(l=>l.id===data.lessonId?{...l,status:'retired' as const,retiredAt:at}:l);
          else if(proposal){proposal.status=data.action==='accept-office-lesson'?'accepted':'declined';proposal.decidedAt=at;if(proposal.status==='accepted')office.lessons.push({id:proposal.id,scope:'office',kind:proposal.kind,statement:proposal.statement,detail:proposal.detail,stages:proposal.stages,paths:[],status:'active',evidence:[],sourceRetrospectiveId:proposal.rollupId,recurrences:[],createdAt:at,updatedAt:at});}
          for(const other of Object.values(state.snapshots))other.officeKnowledge=structuredClone(office);
        }
        if(data.action==='configure-channel-notifications')c.notices={policy:{...c.notices!.policy,channel:{...data.channel,enabledAt:data.channel.enabled?new Date().toISOString():'',version:crypto.randomUUID()}},entries:c.notices!.entries};
        push(project);return json(res,{accepted:true,action:data.action},202);
      }
      if(url.pathname==='/api/messages')return json(res,{accepted:true,id:data.id},202);
      if(url.pathname==='/api/goals')return json(res,{...data,updatedAt:new Date().toISOString(),requestId:'fixture'});
      return json(res,{error:'Not found'},404);
    }
    if(url.pathname.startsWith('/api/features'))return json(res,featureFixture(state.snapshots[project],url.pathname));
    if(url.pathname==='/api/health')return json(res,{ok:true,mode:'fixture'});
    if(url.pathname==='/api/projects')return json(res,{projects:state.projects});
    if(url.pathname==='/api/service-health')return json(res,state.health);
    if(url.pathname==='/api/office'){const s=snapshot(project);return s?json(res,s):json(res,{error:'Unknown project'},409);}
    if(url.pathname==='/api/events'){
      const s=snapshot(project);if(!s)return json(res,{error:'Unknown project'},409);
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store',Connection:'keep-alive'});res.write(`event: snapshot\ndata: ${JSON.stringify(s)}\n\n`);
      const set=streams.get(project)||new Set();set.add(res);streams.set(project,set);
      const beat=setInterval(()=>res.write(': fixture\n\n'),15000);req.on('close',()=>{clearInterval(beat);set.delete(res);});return;
    }
    return json(res,{error:'Not found'},404);
  }
  let file=resolve(dist,'.'+decodeURIComponent(url.pathname));
  if(!(file===dist||file.startsWith(dist+sep))||!existsSync(file)||statSync(file).isDirectory())file=resolve(dist,'index.html');
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file));
}).listen(port,'127.0.0.1',()=>console.log(`Office fixture server http://127.0.0.1:${port} (dist: ${dist})`));
