import { projectById } from '../../../server/office/projects';
import { afterEach,expect,test } from 'vitest';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { coordination } from '../../../server/scheduling/coordination';
import { configureNotices,queueMergeNotice,MergeNotifications,retryRecipientLookup } from '../../../server/conversations/notifications';
import { SlackMessages } from '../../../server/conversations/slack';
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

test('a configured channel gets one merge post that tags people, skips the lookup and sends as a channel',async()=>{
 const {store,engine,notices}=setup();
 const {configureChannelNotices}=await import('../../../server/conversations/channel-notice');
 expect(()=>configureChannelNotices(store,{enabled:true,channelId:'not-a-channel',channelName:'x',workspaceId:'T123',mentionIds:[]})).toThrow();
 configureChannelNotices(store,{enabled:true,channelId:'C0DELIVER',channelName:'delivery',workspaceId:'T123',mentionIds:['U111','U222','U111']});
 queueMergeNotice(store,{...request,mergedAt:'2020-01-01T00:00:00Z'});expect(store.state.coordination!.notices!.entries).toHaveLength(0); // no backfill
 queueMergeNotice(store,request);queueMergeNotice(store,request);
 const entries=store.state.coordination!.notices!.entries;expect(entries).toHaveLength(1); // DM notices still off; one channel post
 expect(entries[0]).toMatchObject({channel:true,resolved:{targetId:'C0DELIVER',workspaceId:'T123'}});
 expect(entries[0].text.split('\n')[0]).toBe('<@U111> <@U222>');
 let lookups=0,sent:any;engine.agents.run=async()=>{lookups++;return {} as any;};
 const ts=(Date.now()/1000).toFixed(6),receipt={channelId:'C0DELIVER',messageTs:ts,permalink:`https://fixture.slack.com/archives/C0DELIVER/p${ts.replace('.','')}`,detail:'Synthetic only'};
 engine.agents.sendSlack=async delivery=>{sent=delivery;return receipt;};engine.agents.verifySlack=async()=>({...receipt,found:true,targetId:'C0DELIVER',workspaceId:'T123',text:entries[0].text.replace('<@U111>','<@U111|Joe>')});
 await notices.pump();
 expect(lookups).toBe(0);expect(sent).toMatchObject({targetType:'channel',targetId:'C0DELIVER'});expect(entries[0].status).toBe('sent');
});

test('changing the channel settings cancels unsent posts and a stale post cannot send',async()=>{
 const {store,engine,notices}=setup();
 const {configureChannelNotices}=await import('../../../server/conversations/channel-notice');
 const settings={enabled:true,channelId:'C0DELIVER',channelName:'delivery',workspaceId:'T123',mentionIds:['U111']};
 configureChannelNotices(store,settings);queueMergeNotice(store,request);
 const notice=store.state.coordination!.notices!.entries[0];
 configureChannelNotices(store,{...settings,mentionIds:['U333']});expect(notice.status).toBe('cancelled');
 notice.status='queued';let sends=0;engine.agents.sendSlack=async()=>{sends++;return {} as any;};
 await notices.pump();expect(notice.status).toBe('cancelled');expect(sends).toBe(0);
 configureChannelNotices(store,{...settings,mentionIds:['U333']});expect(store.state.coordination!.notices!.policy.channel!.enabled).toBe(true); // unchanged settings keep their version
});

test('invalid channel settings explain themselves instead of returning raw validation output',async()=>{
 const {store}=setup();
 const {configureChannelNotices}=await import('../../../server/conversations/channel-notice');
 expect(()=>configureChannelNotices(store,{enabled:true,channelId:'C0DELIVER',channelName:'delivery',workspaceId:'T123',mentionIds:['@joe']})).toThrow('Invalid merge channel: Slack member IDs start with U or W');
 configureChannelNotices(store,{enabled:true,channelId:'C0DELIVER',channelName:'delivery',workspaceId:'T123',mentionIds:['W0GRID']}); // Enterprise Grid member IDs
 expect(store.state.coordination!.notices!.policy.channel!.mentionIds).toEqual(['W0GRID']);
});

test('channel posts never block a person DM retry, and channel edits never cancel a DM mid-lookup',async()=>{
 const {store,engine,notices}=setup();
 const {configureChannelNotices}=await import('../../../server/conversations/channel-notice');
 const channel={enabled:true,channelId:'C0DELIVER',channelName:'delivery',workspaceId:'T123',mentionIds:['U111']};
 configureNotices(store,{enabled:true,recipients:'assignee',workspace:'Fixture',mappings:'assignee = Person Fixture'});configureChannelNotices(store,channel);
 queueMergeNotice(store,request);
 const [post,dm]=store.state.coordination!.notices!.entries;expect(post.channel).toBe(true);expect(dm.channel).toBeUndefined();
 post.status='blocked';dm.status='blocked';store.state.workLog=[{id:'w',requestId:dm.id,stage:'slack-recipient',status:'interrupted'} as any];
 retryRecipientLookup(store,dm.key);expect(dm.status).toBe('queued');
 post.status='sent';
 engine.agents.run=async()=>{configureChannelNotices(store,{...channel,mentionIds:['U999']});return {found:true,targetId:'U123',targetName:'Person Fixture',workspaceId:'T123',evidence:['Synthetic profile'],blocker:''} as any;};
 const ts=(Date.now()/1000).toFixed(6),receipt={channelId:'D123',messageTs:ts,permalink:`https://fixture.slack.com/archives/D123/p${ts.replace('.','')}`,detail:'Synthetic only'};
 engine.agents.sendSlack=async()=>receipt;engine.agents.verifySlack=async()=>({...receipt,found:true,targetId:'U123',workspaceId:'T123',text:dm.text});
 await notices.pump(dm.id);expect(dm.status).toBe('sent');
});
