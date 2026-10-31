import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { saveGoal } from '../../../server/leadership/goals';
import { Conversations } from '../../../server/conversations/conversations';
import { Engine } from '../../../server/scheduling/engine';
const paths:string[]=[];const stores:Store[]=[];afterEach(()=>{for(const s of stores.splice(0))s.close();for(const p of paths.splice(0))rmSync(p,{recursive:true,force:true});});
const newGoal=()=>({id:crypto.randomUUID(),expectedUpdatedAt:'',project:'CEC',title:'Synthetic goal fixture',detail:'Unit test only',priority:2 as const,status:'idea' as const});
const reply={handoffProject:'',pickupChange:null,reply:'Synthetic report',notifyRoles:[],goalChanges:[],slackRequests:[],notes:[],question:'',receipts:[]};
test('goals survive restart, duplicate creates are idempotent, and stale edits cannot overwrite priorities',()=>{
  const dir=mkdtempSync(resolve(tmpdir(),'office-goals-'));paths.push(dir);const path=resolve(dir,'state.sqlite'),a=new Store(path),data=newGoal();
  const goal=saveGoal(a,data);expect(saveGoal(a,data).id).toBe(goal.id);expect(a.state.goals).toHaveLength(1);const oldTime=goal.updatedAt;
  saveGoal(a,{...data,expectedUpdatedAt:oldTime,priority:1});expect(goal.priority).toBe(1);expect(()=>saveGoal(a,{...data,expectedUpdatedAt:oldTime,priority:4})).toThrow('changed');a.close();
  const b=new Store(path);stores.push(b);expect(b.state.goals![0].priority).toBe(1);expect(b.state.agents.some(a=>a.id==='cto')).toBe(true);
});
test('delivery report invokes an independent CTO session and persists the actual handoff',async()=>{
  const store=new Store(':memory:');stores.push(store);const engine=new Engine(store),chat=new Conversations(store,engine,'/private/tmp');chat.archive=()=>{};const calls:string[]=[];
  const goal=saveGoal(store,newGoal());
  engine.agents.followup=async role=>{calls.push(role);return{...reply,notifyRoles:['cto'],goalReport:{projectId:'cec',goalIds:[goal.id],summary:'Goal-specific evidence needs follow-up.'}};};engine.ctoAgents.followup=async role=>{calls.push(role);return{...reply,reply:'CTO acknowledged the observed blockers.'};};
  chat.enqueue({id:crypto.randomUUID(),role:'pm',body:'Report current delivery blockers to the CTO Office'});await chat.pump();await chat.pumpCTO();expect(calls).toEqual(['pm','cto']);expect(store.state.leadershipReports).toHaveLength(1);expect(store.state.messages.at(-1)?.from).toBe('cto');expect(store.state.lastHandoff?.to).toBe('cto');
});
test('CTO goal changes are durable, preserve unrelated goals, and reject stale model edits',async()=>{
  const store=new Store(':memory:');stores.push(store);const engine=new Engine(store),chat=new Conversations(store,engine,'/private/tmp');chat.archive=()=>{};const data=newGoal(),goal=saveGoal(store,data),oldTime=goal.updatedAt;
  const change={...data,id:goal.id,expectedUpdatedAt:goal.updatedAt,priority:1 as const};chat.saveGoals([change],'cto','synthetic-request');expect(goal.priority).toBe(1);expect(()=>chat.saveGoals([{...change,expectedUpdatedAt:oldTime}],'cto','stale')).toThrow('changed');expect(()=>chat.saveGoals([{...data,id:'',priority:3}],'qa','qa')).toThrow('PM or CTO');
  let notified='';engine.ctoAgents.followup=async()=>({...reply,handoffProject:'cec',notifyRoles:['pm']});engine.agents.followup=async role=>{notified=role;return reply;};chat.enqueue({id:crypto.randomUUID(),role:'cto',body:'Tell Morgan our highest priority'});await chat.pump();await chat.pump();expect(notified).toBe('pm');expect(store.state.goals).toHaveLength(1);
});
test('Avery answers while delivery is occupied, saves a list in the named project, and queues Morgan separately',async()=>{
 const {projectById,officeCapacity}=await import('../../../server/office/projects');
 const shared=officeCapacity(),cto=officeCapacity(),brainStore=new Store(':memory:',projectById('brain')),cecStore=new Store(':memory:',projectById('cec'));stores.push(brainStore,cecStore);
 const brain=new Engine(brainStore,shared,cto),cec=new Engine(cecStore,shared,cto),a=new Conversations(brainStore,brain,'/private/tmp'),b=new Conversations(cecStore,cec,'/private/tmp');a.archive=b.archive=()=>{};
 const route=(name:string)=>name==='cec'||name==='CEC'?b:name==='brain'||name==='Brain'?a:(()=>{throw new Error('Unknown project');})();a.projectOffice=b.projectOffice=route;
 brain.busy=true;shared.active.set('developer',new AbortController());let calls=0;
 brain.ctoAgents.followup=async()=>{calls++;return {...reply,reply:'CEC goals prepared; Morgan direction queued.',notifyRoles:['pm'],handoffProject:'cec',goalChanges:[{id:'',expectedUpdatedAt:'',project:'CEC',title:'Designer content gap scan',detail:'Track orphaned and new content requirements.',priority:2,status:'planned'},{id:'',expectedUpdatedAt:'',project:'CEC',title:'Explicit designer notifications',detail:'Track a designer-triggered message to Conductor.',priority:3,status:'idea'}]} as any;};
 const message=a.enqueue({id:crypto.randomUUID(),role:'cto',body:'Add these two CEC goals and tell Morgan.'});await a.pumpCTO();
 expect(calls).toBe(1);expect(message.status).toBe('answered');expect(brain.busy).toBe(true);expect(shared.active.has('developer')).toBe(true);expect(brainStore.state.goals).toHaveLength(0);expect(cecStore.state.goals).toHaveLength(2);expect(cecStore.state.messages[0]).toMatchObject({from:'cto',to:'pm',status:'queued'});expect(brainStore.state.messages.at(-1)?.body).toContain('Goals & Ideas: CEC');
 await b.pump();expect(cecStore.state.messages[0].status).toBe('queued');shared.active.clear();brain.busy=false;cec.agents.followup=async()=>reply;await b.pump();expect(cecStore.state.messages[0].status).toBe('answered');
});
