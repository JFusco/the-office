import {afterEach,expect,test} from 'vitest';
import {Store} from '../../../server/store/store';
import {Engine} from '../../../server/scheduling/engine';
import {coordination} from '../../../server/scheduling/coordination';
import {configureNotices,queueMergeNotice,MergeNotifications} from '../../../server/conversations/notifications';
import {syncOutbox,openActions} from '../../../server/conversations/outbox';
import {CommandFailure} from '../../../server/workers/process';
const stores:Store[]=[];afterEach(()=>stores.splice(0).forEach(s=>s.close()));
const request={key:'GH-999',prUrl:'https://example.invalid/pr/1',mergeCommit:'a'.repeat(40),mergedAt:'2099-01-01T00:00:00Z',summary:'Synthetic merge.',assignees:[{id:'assignee',email:'person@example.invalid'}],reporter:{id:'assignee',email:'person@example.invalid'}};
function setup(){
 const store=new Store(':memory:');stores.push(store);store.state.coordination=coordination();const engine=new Engine(store);
 configureNotices(store,{enabled:true,recipients:'both',workspace:'Fixture',mappings:'assignee = Person Fixture'});queueMergeNotice(store,request);
 engine.agents.run=async()=>({found:true,targetId:'U123',targetName:'Person Fixture',workspaceId:'T123',evidence:['Synthetic profile'],blocker:''} as any);
 let sends=0,reads=0;engine.agents.sendSlack=async()=>{sends++;throw new CommandFailure('Worker exited with surviving subprocesses; effects require reconciliation','uncertain-effect',true);};
 return {store,engine,notices:new MergeNotifications(store,engine),counts:()=>({sends,reads}),read:(found:boolean)=>{engine.agents.verifySlack=async()=>{reads++;const ts=(Date.now()/1000).toFixed(6);return {found,channelId:'D123',messageTs:ts,permalink:`https://fixture.slack.com/archives/D123/p${ts.replace('.','')}`,targetId:'U123',workspaceId:'T123',text:found?store.state.coordination!.notices!.entries[0].text:'',detail:'Synthetic only'};};}};
}
const open=(store:Store)=>{syncOutbox(store.state);return openActions(store.state).map(i=>i.id.split(':')[0]);};
test('an uncertain send that reads back confirmed is settled without a resend or outbox item',async()=>{
 const {store,notices,counts,read}=setup();read(true);await notices.pump();await notices.pump();
 expect(counts()).toEqual({sends:1,reads:1});expect(store.state.slackDeliveries![0]).toMatchObject({status:'confirmed',error:'',channelId:'D123'});
 expect(store.state.coordination!.notices!.entries[0].status).toBe('sent');expect(open(store)).not.toContain('merge-notice');expect(open(store)).not.toContain('message');
});
test('an uncertain send that cannot be read back stays uncertain with its original error and is never resent',async()=>{
 const {store,notices,counts,read}=setup();read(false);await notices.pump();await notices.pump();
 expect(counts()).toEqual({sends:1,reads:1});expect(store.state.slackDeliveries![0]).toMatchObject({status:'uncertain'});expect(store.state.slackDeliveries![0].error).toContain('surviving subprocesses');
 expect(store.state.coordination!.notices!.entries[0].status).toBe('uncertain');expect(open(store)).toEqual(expect.arrayContaining(['merge-notice','message']));
});
test('a paused or cancelled send starts no read-back worker; a failed read-back keeps the send error first',async()=>{
 const paused=setup();paused.read(true);paused.engine.agents.sendSlack=async()=>{throw new CommandFailure('Worker paused; reconcile any external effects before resuming','cancelled',true);};await paused.notices.pump();
 expect(paused.counts().reads).toBe(0);expect(paused.store.state.slackDeliveries![0].status).toBe('uncertain');
 const failed=setup();failed.engine.agents.verifySlack=async()=>{throw new Error('Slack read tool unavailable');};await failed.notices.pump();
 expect(failed.store.state.slackDeliveries![0]).toMatchObject({status:'uncertain'});expect(failed.store.state.slackDeliveries![0].error).toMatch(/surviving subprocesses.*Automatic read-back: Error: Slack read tool unavailable/);
});
test('a read-back that fails after a successful send is not read back a second time',async()=>{
 const {store,engine,notices}=setup();let reads=0;const ts=(Date.now()/1000).toFixed(6);
 engine.agents.sendSlack=async()=>({channelId:'D123',messageTs:ts,permalink:`https://fixture.slack.com/archives/D123/p${ts.replace('.','')}`,detail:'Synthetic only'});
 engine.agents.verifySlack=async()=>{reads++;return {found:false,channelId:'',messageTs:'',permalink:'',targetId:'',workspaceId:'',text:'',detail:'Synthetic only'};};
 await notices.pump();await notices.pump();expect(reads).toBe(1);expect(store.state.slackDeliveries![0].status).toBe('uncertain');
});
