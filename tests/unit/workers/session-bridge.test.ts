import {afterEach,expect,test} from 'vitest';
import {createServer} from 'node:http';
import {WebSocketServer} from 'ws';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {codexSessions,claudeSessions,guardianReview,loadedCodexSession,openRollouts,SessionBridge} from '../../../server/workers/session-bridge';
const cleanup:(()=>void)[]=[];afterEach(()=>cleanup.splice(0).forEach(f=>f()));
test('native bridge reads loaded live metadata only and follows pagination without resuming or loading turns',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'office-session-'));const server=createServer(),wss=new WebSocketServer({server});cleanup.push(()=>{wss.clients.forEach(c=>c.terminate());wss.close();server.close();rmSync(dir,{recursive:true,force:true});});const socket=join(dir,'test.sock');await new Promise<void>(resolve=>server.listen(socket,resolve));const methods:string[]=[];
 wss.on('connection',ws=>ws.on('message',raw=>{const m=JSON.parse(raw.toString());methods.push(m.method);if(m.id==null)return;let result:any={};
  if(m.method==='thread/loaded/list')result=m.params.cursor?{data:['2','g'],nextCursor:null}:{data:['1'],nextCursor:'next'};
  if(m.method==='thread/read'){expect(m.params.includeTurns).toBe(false);result={thread:{id:m.params.threadId,cwd:'/test/brain',name:'Task\nprivate body excluded',gitInfo:{branch:'issue-255'},status:{type:m.params.threadId==='1'?'active':'idle',activeFlags:[]},...(m.params.threadId==='g'?{threadSource:'guardian_review'}:{})}};}
  ws.send(JSON.stringify({id:m.id,result}));
 }));
 const sessions=await codexSessions(socket);expect(sessions.map(s=>s.status)).toEqual(['active','idle']);expect(sessions[0].title).toBe('Task');expect(methods.every(m=>['initialize','initialized','thread/loaded/list','thread/read'].includes(m))).toBe(true);
});
test('Claude includes live interactive and background identities but excludes completed records',()=>{
 expect(claudeSessions(JSON.stringify([{sessionId:'1',cwd:'/brain',status:'working',kind:'interactive'},{sessionId:'2',cwd:'/brain',status:'waiting'},{sessionId:'3',cwd:'/brain',state:'done'}])).map(s=>s.status)).toEqual(['active','waiting']);expect(()=>claudeSessions('[{"sessionId":"x","cwd":"/brain"}]')).toThrow();
});
test('descriptor metadata means loaded, not active; unrelated and historical paths are ignored',()=>{
 expect(openRollouts('p5\nn/tmp/unrelated.jsonl\nn/Users/test/.codex/sessions/2026/rollout.jsonl')).toEqual([{pid:5,path:'/Users/test/.codex/sessions/2026/rollout.jsonl'}]);
});
test('loaded Guardian approval reviewers are not checkout identities; other loaded sessions and missing metadata keep failing closed',()=>{
 expect(loadedCodexSession({id:'g',cwd:'/brain',title:'Guardian review',thread_source:'guardian_review'})).toBeNull();
 expect(loadedCodexSession({id:'old',cwd:'/brain',title:'Guardian review',thread_source:'subagent',source:'{"subagent":{"other":"guardian"}}'})).toBeNull();
 expect(guardianReview(undefined,{subagent:{other:'guardian'}})).toBe(true);expect(guardianReview('user','not json')).toBe(false);expect(guardianReview(null,'exec')).toBe(false);
 expect(loadedCodexSession({id:'u',cwd:'/brain',name:'Database guidance\nbody',git_branch:'codex/261',thread_source:'user'})).toMatchObject({id:'u',title:'Database guidance',branch:'codex/261',status:'loaded'});
 expect(()=>loadedCodexSession(undefined)).toThrow();
});
test('missing provider visibility fails closed, excludes the current worker and maps outside worktrees by Git identity',async()=>{
 const store:any={project:{id:'brain',repo:'/brain'},state:{workLog:[{status:'running',sessionId:'self',id:'s',provider:'codex',requestId:'review',ticket:'GH-255',task:'Investigating'}]}};
 const execute:any=async(bin:string,_args:string[],opts:any)=>bin==='claude'?'[]':opts.cwd==='/brain'||opts.cwd==='/tmp/worktree'?'/brain/.git':'/other/.git';
 const native=async()=>[{id:'outside',provider:'codex' as const,cwd:'/tmp/worktree',title:'GH-255',branch:'issue-255',status:'active' as const,source:'test'}];
 const bridge=new SessionBridge(()=>[store],execute,native,async()=>[]);await bridge.refresh();const view=bridge.forProject(store,'GH-255','review');expect(view.complete).toBe(true);expect(view.sessions.map(s=>s.id)).toEqual(['outside']);
 const broken=new SessionBridge(()=>[store],execute,async()=>{throw Error('offline');},async()=>[]);await broken.refresh();expect(broken.forProject(store).complete).toBe(false);expect(broken.current.sources[0].ok).toBe(false);
 bridge.current.expiresAt='2000-01-01T00:00:00Z';expect(bridge.forProject(store).fresh).toBe(false);
});
test('ownership is exact-project and exact-issue; unrelated loaded chats and the current reviewer are not competing owners',()=>{
 const store:any={project:{id:'brain',repo:'/brain'},state:{workLog:[{requestId:'review',sessionId:'self',status:'running'}]}};const b=new SessionBridge(()=>[store]);b.current={observedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+45000).toISOString(),complete:true,sources:[],sessions:[{id:'other',provider:'codex',project:'brain',cwd:'/brain',title:'Database guidance',branch:'codex/261-supabase',status:'loaded',source:'test'},{id:'self',provider:'codex',cwd:'/brain',title:'Review GH-255',branch:'',status:'loaded',source:'test'}]};
 expect(b.forProject(store,'GH-255','review').ownership.status).toBe('clear');expect(b.forProject(store,'GH-261','review').ownership.status).toBe('uncertain');b.current.sessions[0].status='active';expect(b.forProject(store,'GH-261','review').ownership.status).toBe('owned');expect(b.forProject(store,'GH-26','review').ownership.status).toBe('clear');
});
