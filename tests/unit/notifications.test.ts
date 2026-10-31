import { projectById } from '../../server/projects';
import { afterEach,expect,test } from 'vitest';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { coordination } from '../../server/coordination';
import { configureNotices,queueMergeNotice,MergeNotifications,retryRecipientLookup } from '../../server/notifications';
import { SlackMessages } from '../../server/slack';
const stores:Store[]=[];afterEach(()=>stores.splice(0).forEach(s=>s.close()));
function setup(){const store=new Store(':memory:');stores.push(store);store.state.coordination=coordination();const engine=new Engine(store);return {store,engine,notices:new MergeNotifications(store,engine)};}
const request={key:'CEC-999',prUrl:'https://example.invalid/pr/1',mergeCommit:'a'.repeat(40),mergedAt:'2099-01-01T00:00:00Z',summary:'Build observation separate.',assignees:[{id:'assignee',email:'person@example.invalid'}],reporter:{id:'assignee',email:'person@example.invalid'}};
test('per-project notices default off, exclude history and deduplicate assignee/reporter',()=>{
 const {store}=setup();queueMergeNotice(store,request);expect(store.state.coordination!.notices!.entries).toHaveLength(0);
 configureNotices(store,{enabled:true,recipients:'both',workspace:'Fixture',mappings:''});queueMergeNotice(store,{...request,mergedAt:'2020-01-01T00:00:00Z'});expect(store.state.coordination!.notices!.entries).toHaveLength(0);
 queueMergeNotice(store,request);queueMergeNotice(store,request);expect(store.state.coordination!.notices!.entries).toHaveLength(1);
});
test('automatic notices reuse durable Slack send + independent readback, never duplicate',async()=>{
 const {store,engine,notices}=setup();configureNotices(store,{enabled:true,recipients:'both',workspace:'Fixture',mappings:'assignee = Person Fixture'});queueMergeNotice(store,request);let sends=0;
 engine.agents.run=async(_r,task,_s,opts)=>{expect(opts?.readOnly).toBe(true);expect(task).toContain('Joe explicitly mapped');return {found:true,targetId:'U123',targetName:'Person Fixture',workspaceId:'T123',evidence:['Synthetic profile'],blocker:''} as any;};
 const ts=(Date.now()/1000).toFixed(6),receipt={channelId:'D123',messageTs:ts,permalink:`https://fixture.slack.com/archives/D123/p${ts.replace('.','')}`,detail:'Synthetic only'};
 engine.agents.sendSlack=async()=>{sends++;expect(store.state.slackDeliveries![0].status).toBe('sending');return receipt;};engine.agents.verifySlack=async()=>({...receipt,found:true,targetId:'U123',workspaceId:'T123',text:store.state.coordination!.notices!.entries[0].text});
 await notices.pump();await notices.pump();expect(sends).toBe(1);expect(store.state.coordination!.notices!.entries[0].status).toBe('sent');expect(store.state.slackDeliveries![0].status).toBe('confirmed');
});
test('disabled, ambiguous and interrupted notices never send automatically',async()=>{
 const {store,engine,notices}=setup();configureNotices(store,{enabled:true,recipients:'both',workspace:'Fixture',mappings:''});queueMergeNotice(store,request);engine.agents.run=async()=>({found:false,targetId:'',targetName:'',workspaceId:'',evidence:[],blocker:'Need explicit person mapping'} as any);await notices.pump();expect(store.state.coordination!.notices!.entries[0].status).toBe('blocked');expect(store.state.slackDeliveries).toHaveLength(0);
 const n=store.state.coordination!.notices!.entries[0];n.status='working';store.recover();expect(n.status).toBe('uncertain');await notices.pump();expect(store.state.slackDeliveries).toHaveLength(0);
 await expect(new SlackMessages(store,engine.agents).sendNotification(n.id,{targetType:'person',targetId:'U123',targetName:'Unknown',workspaceId:'T123',text:n.text})).rejects.toThrow('authorization');
 n.status='queued';configureNotices(store,{enabled:false,recipients:'both',workspace:'Fixture',mappings:''});await notices.pump();expect(n.status).toBe('cancelled');
});

test('only a proven interrupted recipient read without a send attempt can be retried',()=>{
 const {store}=setup();configureNotices(store,{enabled:true,recipients:'both',workspace:'Fixture',mappings:''});queueMergeNotice(store,request);
 const n=store.state.coordination!.notices!.entries[0];n.status='blocked';n.detail='Error: Worker paused';
 expect(()=>retryRecipientLookup(store,n.key)).toThrow('evidence');
 (store.state.workLog??=[]).push({requestId:n.id,stage:'slack-recipient',status:'interrupted'} as any);
 retryRecipientLookup(store,n.key);expect(n.status).toBe('queued');
 n.status='blocked';n.detail='Error: Worker paused';store.state.slackDeliveries!.push({requestId:n.id} as any);
 expect(()=>retryRecipientLookup(store,n.key)).toThrow('no Slack delivery');
});

test('GitHub assignee email is read from the exact provider profile before Slack matching',async()=>{
 const store=new Store(':memory:',projectById('brain'));stores.push(store);store.state.coordination=coordination();const engine=new Engine(store);engine.slackIdentityContext=()=>[{targetId:'U123',workspaceId:'T123',permalink:'https://fixture.slack.com/archives/D123/p1',confirmedAt:'2026-10-28T00:00Z'}];
 configureNotices(store,{enabled:true,recipients:'assignee',workspace:'Fixture',mappings:''});queueMergeNotice(store,{...request,assignees:[{id:'JFusco'}]});
 engine.agents.run=async(_r,task)=>{expect(task).toContain('joe@example.invalid');expect(task).toContain('Historical independently confirmed Office DM bindings');expect(task).toContain('U123');return {found:false,targetId:'',targetName:'',workspaceId:'',evidence:[],blocker:'Synthetic no Slack member'} as any;};
 const execute=async(_b:string,args:string[])=>{expect(args).toEqual(['api','users/JFusco']);return JSON.stringify({login:'JFusco',email:'joe@example.invalid'});};
 await new MergeNotifications(store,engine,execute as any).pump();expect(store.state.coordination!.notices!.entries[0].email).toBe('joe@example.invalid');expect(store.state.slackDeliveries).toHaveLength(0);
});
