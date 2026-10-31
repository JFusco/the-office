import { afterEach, expect, test } from 'vitest';
import { rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Agents } from '../../../server/workers/agents';
import { Store } from '../../../server/store/store';
import { CEC, ROOT, SKILLS } from '../../../server/office/config';
import { projectById } from '../../../server/office/projects';
import { GITHUB_ISSUE_SKILL } from '../../../server/github/github-context';
import { ClaudeStream, DEVELOPER_MODEL } from '../../../server/workers/claude';
const stores:Store[]=[],sessions:string[]=[];afterEach(()=>{for(const s of stores.splice(0))s.close();for(const path of sessions.splice(0))rmSync(path,{recursive:true,force:true});});
const schema=z.object({ok:z.boolean()}).strict();
function setup(extra:Record<string,unknown>={},project='cec'){const store=new Store(':memory:',projectById(project));stores.push(store);const calls:{program:string;args:string[];input:string;identity?:any}[]=[];const agents=new Agents(store,async(program,args,options)=>{calls.push({program,args,input:options?.input||''});if(program==='codex'){const events=[{type:'thread.started',thread_id:'codex-unit'},{type:'item.completed',item:{type:'agent_message',text:'{"ok":true}'}}];for(const e of events)options?.onLine?.(JSON.stringify(e));return events.map(e=>JSON.stringify(e)).join('\n');}
  const session=args[args.indexOf('--session-id')+1];calls.at(-1)!.identity=JSON.parse(readFileSync(resolve(store.dataRoot,'sessions',session,'assignment-identity.json'),'utf8'));sessions.push(resolve(store.dataRoot,'sessions',session));const result={type:'result',subtype:'success',is_error:false,session_id:session,structured_output:{ok:true},modelUsage:{[DEVELOPER_MODEL]:{}},usage:{input_tokens:10,output_tokens:3},...extra};
  for(const e of [{type:'system',subtype:'init',session_id:session,model:DEVELOPER_MODEL},{type:'assistant',session_id:session,message:{id:'fixture-assistant',model:(extra as any).assistantModel||DEVELOPER_MODEL,content:[]}},result])options?.onLine?.(JSON.stringify(e));return JSON.stringify(result);
});return{store,agents,calls};}
test('implementation uses the pinned Claude provider and validates its structured result and model evidence',async()=>{
  const{agents,store,calls}=setup();expect(await agents.run('developer','Synthetic implementation transport test; no actual work',schema,{ticket:'CEC-999',stage:'implement'})).toEqual({ok:true});expect(calls).toHaveLength(1);expect(calls[0].program).toBe('claude');expect(calls[0].args[calls[0].args.indexOf('--permission-mode')+1]).toBe('auto');expect(calls[0].args).not.toContain('--fallback-model');expect(calls[0].args).not.toContain('--dangerously-skip-permissions');expect(store.state.agents.find(a=>a.id==='developer')?.observedModel).toBe(DEVELOPER_MODEL);expect(agents.active.size).toBe(0);expect(store.state.workLog![0]).toMatchObject({ticket:'CEC-999',stage:'implement',status:'completed',model:DEVELOPER_MODEL,inputTokens:10,outputTokens:3});expect(store.state.workLog![0].reportedAt).not.toBe('');
});
test('developer read-only messages retain plan permissions, while PM keeps Codex',async()=>{
  const{agents,calls}=setup();await agents.run('developer','Synthetic read-only test',schema,{readOnly:true});expect(calls[0].args[calls[0].args.indexOf('--permission-mode')+1]).toBe('plan');expect(calls[0].input).toContain('do not change files or external services');await agents.run('pm','Synthetic PM test',schema,{readOnly:true});expect(calls[1].program).toBe('codex');expect(calls[1].args).toContain('--sandbox');
});
test('CMS developer write permissions include only its repository and relevant skills',async()=>{
  const cms=setup({},'cms-field-vocabulary');await cms.agents.run('developer','Synthetic CMS proposal',schema,{stage:'proposal'});
  const args=cms.calls[0].args,dirs=args.flatMap((arg,i)=>arg==='--add-dir'?[args[i+1]]:[]);expect(args[args.indexOf('--permission-mode')+1]).toBe('auto');expect(dirs).toContain(cms.store.project.repo);expect(dirs).toContain(cms.store.dataRoot);expect(dirs).toContain(GITHUB_ISSUE_SKILL.replace('/SKILL.md',''));
  expect(dirs).not.toContain(ROOT);expect(dirs).not.toContain(CEC.repo);expect(dirs).not.toContain(SKILLS.jira);expect(dirs).not.toContain(SKILLS.qa);
  const cec=setup();await cec.agents.run('developer','Synthetic CEC implementation',schema);const cecDirs=cec.calls[0].args.flatMap((arg,i)=>arg==='--add-dir'?[cec.calls[0].args[i+1]]:[]);expect(cecDirs).toContain(ROOT);expect(cecDirs).toContain(CEC.repo);expect(cecDirs).toContain(SKILLS.jira);expect(cecDirs).toContain(SKILLS.qa);
});
test('wrong or unobserved models, provider error envelopes, and invalid results fail without retrying the writer',async()=>{
  for(const extra of [{modelUsage:{'claude-sonnet-other':{}}},{modelUsage:{}},{is_error:true,result:'Rate limit exceeded'},{structured_output:{ok:'not boolean'}},{session_id:'unexpected-session'}]){const{agents,calls}=setup(extra);await expect(agents.run('developer','Synthetic failure test',schema)).rejects.toThrow();expect(calls).toHaveLength(1);expect(agents.active.size).toBe(0);}
});

test('Claude identity exists before provider execution and binds the actual session, project and request', async()=>{
 const {agents,calls}=setup({},'cms-field-vocabulary');
 await agents.run('developer','Synthetic identity preflight',schema,{stage:'github-implement',requestId:'identity-request',ticket:'GH-114'});
 const call=calls[0], session=call.args[call.args.indexOf('--session-id')+1];
 expect(call.identity).toMatchObject({attemptId:session,threadId:session,requestId:'identity-request',projectId:'cms-field-vocabulary',repository:'JFusco/cms-field-vocabulary',role:'developer'});
 expect(call.input).toContain('Non-Brain work must not claim Brain maintenance');
});


test('developer discovery has native public research tools without loosening the session restrictions', async()=>{
 for (const readOnly of [false,true]) {
  const {agents,calls}=setup({},'brain'); await agents.run('developer','Synthetic research capability boundary',schema,{stage:'github-implement',readOnly});
  const args=calls[0].args,tools=args[args.indexOf('--tools')+1].split(',');
  expect(tools).toContain('WebSearch'); expect(tools).toContain('WebFetch');
  for (const restriction of ['--safe-mode','--restricted','--strict-mcp-config','--no-chrome']) expect(args).toContain(restriction);
  expect(args[args.indexOf('--settings')+1]).toBe('{"disableAllHooks":true}');
  expect(args[args.indexOf('--permission-mode')+1]).toBe(readOnly?'plan':'auto');
  expect(args[args.indexOf('--permission-prompts')+1]).toBe('none');
  expect(args).not.toContain('--dangerously-skip-permissions'); expect(args).not.toContain('--fallback-model');
 }
});


test('aggregate inline-helper usage is retained without accepting a different assistant model',async()=>{
 const modelUsage={[DEVELOPER_MODEL]:{inputTokens:100,outputTokens:10},'claude-haiku-5-5':{inputTokens:50,outputTokens:5}};
 const {agents,store,calls}=setup({modelUsage});await agents.run('developer','Synthetic inline helper accounting',schema,{readOnly:true});
 const work=store.state.workLog![0],root=resolve(store.dataRoot,'sessions',work.id);
 expect(work).toMatchObject({observedModel:DEVELOPER_MODEL,inputTokens:150,outputTokens:15,status:'completed'});
 const completion=JSON.parse(readFileSync(resolve(root,'provider-completion.json'),'utf8'));expect(completion.result.modelUsage).toEqual(modelUsage);expect(completion.observedAssistantModels).toEqual([DEVELOPER_MODEL]);
 expect(JSON.parse(readFileSync(resolve(root,'model-settings.json'),'utf8')).providerModelUsage).toEqual(modelUsage);expect(calls).toHaveLength(1);
});
test('a different observed assistant is still rejected and its usage evidence survives the failed run',async()=>{
 const modelUsage={[DEVELOPER_MODEL]:{inputTokens:100,outputTokens:10},'claude-sonnet-other':{inputTokens:50,outputTokens:5}};
 const {agents,store,calls}=setup({modelUsage,assistantModel:'claude-sonnet-other'});
 await expect(agents.run('developer','Synthetic actual fallback rejection',schema)).rejects.toThrow('No fallback accepted');
 const work=store.state.workLog![0],root=resolve(store.dataRoot,'sessions',work.id);expect(work).toMatchObject({status:'failed',observedModel:null,inputTokens:150,outputTokens:15});
 expect(JSON.parse(readFileSync(resolve(root,'provider-completion.json'),'utf8')).result.modelUsage).toEqual(modelUsage);expect(calls).toHaveLength(1);
});
test('provider failure retains reported aggregate usage and does not replay work',async()=>{
 const {agents,store,calls}=setup({is_error:true,result:'Synthetic provider failure',modelUsage:{[DEVELOPER_MODEL]:{inputTokens:12,outputTokens:3}}});
 await expect(agents.run('developer','Synthetic failed usage',schema)).rejects.toThrow('worker failed');
 const work=store.state.workLog![0];expect(work).toMatchObject({status:'failed',inputTokens:12,outputTokens:3});
 expect(JSON.parse(readFileSync(resolve(store.dataRoot,'sessions',work.id,'provider-completion.json'),'utf8')).result.is_error).toBe(true);expect(calls).toHaveLength(1);
});
test('partial aggregate helper counters remain unknown rather than falling back to an undercounted primary total',async()=>{
 const {agents,store}=setup({modelUsage:{[DEVELOPER_MODEL]:{inputTokens:100,outputTokens:10},'claude-haiku-5-5':{}}});
 await agents.run('developer','Synthetic incomplete aggregate accounting',schema);expect(store.state.workLog![0]).toMatchObject({inputTokens:null,outputTokens:null});
});


test('advertised init settings and aggregate keys do not replace actual assistant identity evidence',()=>{
 const stream=new ClaudeStream();stream.consume({type:'system',session_id:'expected',model:DEVELOPER_MODEL});stream.consume({type:'result',subtype:'success',is_error:false,session_id:'expected',modelUsage:{[DEVELOPER_MODEL]:{}},structured_output:{ok:true}});
 expect(()=>stream.finish('expected')).toThrow('No fallback accepted');
});
test('wrong-session completion remains diagnostic and cannot attribute usage to this worker',async()=>{
 const {agents,store}=setup({session_id:'foreign-session',modelUsage:{[DEVELOPER_MODEL]:{inputTokens:12,outputTokens:3}}});
 await expect(agents.run('developer','Synthetic foreign completion',schema)).rejects.toThrow('unexpected session');
 const work=store.state.workLog![0];expect(work).toMatchObject({status:'failed',inputTokens:null,outputTokens:null});
 const proof=JSON.parse(readFileSync(resolve(store.dataRoot,'sessions',work.id,'provider-completion.json'),'utf8'));expect(proof.expectedSession).toBe(work.id);expect(proof.result.session_id).toBe('foreign-session');
});
test('explicit invalid aggregate counters remain unknown rather than hiding behind primary scalar counts',async()=>{
 const {agents,store}=setup({modelUsage:{[DEVELOPER_MODEL]:{inputTokens:-1,outputTokens:'invalid'}}});
 await agents.run('developer','Synthetic invalid usage counters',schema);expect(store.state.workLog![0]).toMatchObject({inputTokens:null,outputTokens:null});
});
