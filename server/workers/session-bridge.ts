import WebSocket from 'ws';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {command} from './process';
import type {Store} from '../store/store';
export interface LiveSession {id:string;provider:'codex'|'claude'|'office';cwd:string;title:string;branch:string;status:'active'|'idle'|'waiting'|'loaded';source:string;project?:string;ticket?:string;requestId?:string}
export interface SessionInventory {observedAt:string;expiresAt:string;sessions:LiveSession[];sources:{name:string;ok:boolean;detail:string}[];complete:boolean}
// Connect to the existing runtime. Starting a new app-server would produce an
// empty in-memory inventory and cannot establish ownership in other clients.
export async function codexSessions(socketPath=join(homedir(),'.codex/app-server-control/app-server-control.sock')):Promise<LiveSession[]>{
 const socket=new WebSocket(`ws+unix://${socketPath}:/`,{maxPayload:4*1024*1024});let id=0;
 const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();
 const fail=(e:Error)=>{for(const p of pending.values())p.reject(e);pending.clear();};
 const timer=setTimeout(()=>{fail(new Error('Codex session bridge timed out after 30 seconds'));socket.terminate();},30000);
 socket.on('message',raw=>{try{const m=JSON.parse(raw.toString());const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error('Codex session metadata request failed')):p.resolve(m.result);}}catch{fail(new Error('Invalid Codex session metadata'));}});
 socket.on('error',fail);socket.on('close',()=>fail(new Error('Codex session bridge disconnected')));
 const call=(method:string,params:unknown)=>new Promise<any>((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
 try{
  await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);socket.once('close',()=>reject(new Error('Codex session bridge closed')));});
  await call('initialize',{clientInfo:{name:'office_session_bridge',version:'0.1.0'},capabilities:{experimentalApi:true}});socket.send(JSON.stringify({method:'initialized'}));
  let cursor:string|null=null;const sessions:LiveSession[]=[];const seen=new Set<string>();
  do{
   const page=await call('thread/loaded/list',{limit:100,...(cursor?{cursor}:{})});
   if(!Array.isArray(page.data)||sessions.length+page.data.length>1000)throw new Error('Codex session coverage is incomplete');
   // Bound concurrency so a large loaded-session inventory can finish within
   // one read deadline without dropping sessions or loading conversation turns.
   const readThread=async(threadId:string)=>{
    const {thread:t}=await call('thread/read',{threadId,includeTurns:false});
    if(!t?.id||!t.cwd||!['active','idle','notLoaded','systemError'].includes(t.status?.type))throw new Error('Codex live status is unavailable');
    sessions.push({id:t.id,provider:'codex',cwd:t.cwd,title:String(t.name||'Codex session').split('\n')[0].slice(0,160),branch:t.gitInfo?.branch||'',status:t.status.type==='active'?t.status.activeFlags?.length?'waiting':'active':t.status.type==='idle'?'idle':'loaded',source:'Codex shared app-server'});
   };
   for(let offset=0;offset<page.data.length;offset+=8)await Promise.all(page.data.slice(offset,offset+8).map(readThread));
   if(page.nextCursor&&(seen.has(page.nextCursor)||typeof page.nextCursor!=='string'))throw new Error('Codex session pagination did not advance');
   cursor=page.nextCursor||null;if(cursor)seen.add(cursor);
  }while(cursor);
  return sessions;
 }finally{clearTimeout(timer);socket.terminate();}
}
export function claudeSessions(raw:string):LiveSession[]{
 const data=JSON.parse(raw);if(!Array.isArray(data))throw new Error('Claude session inventory is invalid');
 return data.filter(t=>t.state!=='done').map(t=>{
  if(!t.sessionId||!t.cwd||!['idle','working','running','waiting','busy'].includes(t.status))throw new Error('Claude session activity is unavailable');
  return {id:t.sessionId,provider:'claude',cwd:t.cwd,title:String(t.name||'Claude session').split('\n')[0].slice(0,160),branch:'',status:t.status==='idle'?'idle':t.status==='waiting'?'waiting':'active',source:'Claude native agents inventory'};
 });
}
export function openRollouts(raw:string){
 const found:{pid:number;path:string}[]=[];let pid=0;
 for(const line of raw.split('\n')){if(line[0]==='p')pid=Number(line.slice(1));if(line[0]==='n'&&line.includes('/.codex/sessions/')&&line.endsWith('.jsonl'))found.push({pid,path:line.slice(1)});}
 return found;
}
async function desktopSessions(execute:typeof command){
 // Read open-file identities and metadata only, never transcript contents. A
 // loaded descriptor establishes a live session, not an active turn.
 const raw=await execute('lsof',['-nP','-c','codex','-Fpn'],{timeout:10000});
 const files=openRollouts(raw),db=new DatabaseSync(join(homedir(),'.codex/state_5.sqlite'),{readOnly:true});
 try{return files.map(({path})=>{const t=db.prepare('SELECT id,cwd,name,title,git_branch FROM threads WHERE rollout_path=?').get(path) as any;if(!t)throw new Error('A live Codex session has no metadata');return {id:t.id,provider:'codex' as const,cwd:t.cwd,title:String(t.name||t.title||'Codex session').split('\n')[0].slice(0,160),branch:t.git_branch||'',status:'loaded' as const,source:'Live Codex process; turn activity not exposed'};});}finally{db.close();}
}
export class SessionBridge {
 current:SessionInventory={observedAt:'',expiresAt:'',sessions:[],sources:[],complete:false};polling?:Promise<SessionInventory>;
 constructor(private stores:()=>Store[],private execute:typeof command=command,private native=codexSessions,private desktop=desktopSessions){}
 async refresh(){
  if(this.polling)return this.polling;
  this.polling=this.read();try{return await this.polling;}finally{this.polling=undefined;}
 }
 private async read(){
  const results=await Promise.allSettled([this.native(),this.execute('claude',['agents','--json','--all'],{timeout:60000,readOnly:true}).then(claudeSessions),this.desktop(this.execute)]);
  const names=['Codex live runtime','Claude live sessions','Codex desktop/CLI session identities'];
  const sources=results.map((r,i)=>({name:names[i],ok:r.status==='fulfilled',detail:r.status==='fulfilled'?(i===2?'Loaded sessions are visible; their turn activity is explicitly unknown.':'Live inventory connected.'):`Session inventory could not complete${/timed? out|timeout/i.test(String(r.reason))?' within its read deadline':''}. Ownership remains unverified; this does not establish a login failure.`}));
  const sessions=new Map<string,LiveSession>();
  // Native runtime status is stronger than an open descriptor.
  for(const r of [results[2],results[0],results[1]])if(r.status==='fulfilled')for(const s of r.value)sessions.set(`${s.provider}:${s.id}`,s);
  for(const store of this.stores())for(const w of store.state.workLog||[])if(w.status==='running')sessions.set(`${w.provider}:${w.sessionId}`,{id:w.sessionId||w.id,provider:'office',cwd:store.project.repo,title:w.task,branch:'',ticket:w.ticket,requestId:w.requestId,status:'active',source:'Office live worker claim'});
  const stores=this.stores();const directories=[...new Set([...sessions.values()].map(s=>s.cwd).concat(stores.map(s=>s.project.repo)))];
  const commons=new Map<string,string>();await Promise.all(directories.map(async cwd=>{try{commons.set(cwd,(await this.execute('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd,timeout:5000})).trim());}catch{/* A non-repository chat has no repository identity. */}}));
  for(const s of sessions.values()){const common=commons.get(s.cwd);s.project=stores.find(store=>resolve(s.cwd)===resolve(store.project.repo)||!!common&&common===commons.get(store.project.repo))?.project.id;}
  const now=Date.now();return this.current={observedAt:new Date(now).toISOString(),expiresAt:new Date(now+45000).toISOString(),complete:sources.every(s=>s.ok),sources,sessions:[...sessions.values()]};
 }
 forProject(store:Store,key='',requestId=''){
  const now=Date.now(),fresh=now<=Date.parse(this.current.expiresAt);
  const ownIds=new Set((store.state.workLog||[]).filter(w=>w.requestId===requestId&&w.status==='running').map(w=>w.sessionId));
  const sessions=this.current.sessions.filter(s=>s.requestId!==requestId&&!ownIds.has(s.id)&&(s.project===store.project.id||resolve(s.cwd)===resolve(store.project.repo)||s.cwd.startsWith(store.project.repo+'/')));
  const number=key.match(/^(?:GH|CEC)-(\d+)$/)?.[1];
  const titleMatch=new RegExp(`\\b${key.replace(/[-]/g,'[-]')}(?![a-z0-9])|#${number}(?![0-9])|/issues/${number}(?![0-9])`,'i');
  const branchMatch=new RegExp(`(?:^|/)(?:[a-z][a-z0-9]*[-_])?${number}(?:[-_/]|$)`,'i');
  const matches=key?sessions.filter(s=>s.ticket?s.ticket===key:titleMatch.test(s.title)||branchMatch.test(s.branch)):[];
  const complete=this.current.complete&&fresh;
  const ownership={status:!key?'not-requested':!complete?'unavailable':matches.some(s=>['active','waiting'].includes(s.status))?'owned':matches.length?'uncertain':'clear',matches:matches.map(s=>({id:s.id,status:s.status,title:s.title,branch:s.branch})),detail:matches.length?'Inspect these exact-project, exact-issue session candidates before new development.':'No competing exact-issue claim appears in the current supported session inventory. Unrelated loaded chats are not owners of this issue.'};
  return {...this.current,sessions,fresh,complete,ownership,project:store.project.id,key,limits:'Loaded desktop sessions are live identities with unknown turn activity. Branch/title matches are candidates, not proof of active ownership. Historical sessions are excluded. Never resume, interrupt, or message another session through this read-only bridge.'};
 }
}
