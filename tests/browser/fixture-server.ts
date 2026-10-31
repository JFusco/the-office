// Isolated browser-test server: serves a built UI (static files) and answers the Office API
// from in-memory synthetic fixtures. It never reads .local data, starts workers or contacts
// providers. Writes only change this process's memory and are recorded for inspection.
//   tsx tests/browser/fixture-server.ts [--port 4460] [--dist dist]
import { createServer, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { createFixtureState, type FixtureState } from './fixtures/office-data';

const arg=(name:string,fallback:string)=>{const i=process.argv.indexOf(`--${name}`);return i>0?process.argv[i+1]:fallback;};
const port=Number(arg('port',process.env.OFFICE_FIXTURE_PORT||'4460')),dist=resolve(arg('dist',process.env.OFFICE_FIXTURE_DIST||'dist'));
if(!existsSync(resolve(dist,'index.html')))throw new Error(`No built UI at ${dist}. Run a Vite build first.`);
let state:FixtureState=createFixtureState();
const writes:{at:string;method:string;path:string;body:unknown}[]=[];
const streams=new Map<string,Set<ServerResponse>>();
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const json=(res:ServerResponse,body:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
let sequence=0;
const snapshot=(project:string)=>{const s=state.snapshots[project];if(s){s.serverTime=new Date().toISOString();s.serviceInstanceId='fixture-service';s.snapshotSequence=++sequence;}return s;};
const push=(project:string)=>{for(const res of streams.get(project)||[])res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot(project))}\n\n`);};
async function body(req:import('node:http').IncomingMessage){let text='';for await(const chunk of req)text+=chunk;try{return text?JSON.parse(text):{};}catch{return text;}}

createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://127.0.0.1:${port}`),project=url.searchParams.get('project')||'cec';
  if(url.pathname==='/__fixture/reset'){state=createFixtureState();writes.length=0;return json(res,{reset:true});}
  if(url.pathname==='/__fixture/snapshot'&&req.method==='POST'){const patch=await body(req) as any;Object.assign(state.snapshots[project],patch);if(url.searchParams.get('push')!=='0')push(project);return json(res,{ok:true});}
  if(url.pathname==='/__fixture/writes')return json(res,writes);
  if(url.pathname.startsWith('/api/')){
    if(req.method==='POST'){
      const data=await body(req) as Record<string,any>;writes.push({at:new Date().toISOString(),method:'POST',path:`${url.pathname}${url.search}`,body:data});
      const s=state.snapshots[project];if(!s)return json(res,{error:'Unknown project'},409);
      if(url.pathname==='/api/commands'){
        const c=s.coordination!;
        if(data.action==='configure-pickup')c.pickup={...c.pickup!,...data.pickup};
        if(data.action==='configure-notifications')c.notices={policy:{...c.notices!.policy,...data.notifications},entries:c.notices!.entries};
        if(data.action==='configure-time')c.time={...c.time!,...data.time};
        if(data.action==='configure-merges')c.merges={enabled:!!data.merges?.enabled,authorizedAt:new Date().toISOString()};
        push(project);return json(res,{accepted:true,action:data.action},202);
      }
      if(url.pathname==='/api/messages')return json(res,{accepted:true,id:data.id},202);
      if(url.pathname==='/api/goals')return json(res,{...data,updatedAt:new Date().toISOString(),requestId:'fixture'});
      return json(res,{error:'Not found'},404);
    }
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
