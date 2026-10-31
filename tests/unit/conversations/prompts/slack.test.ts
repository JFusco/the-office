import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { Conversations } from '../../../../server/conversations/conversations';
import { SlackMessages, comparableSlackText } from '../../../../server/conversations/slack';
import { slackMessageUrl } from '../../../../src/shared';
const stores:Store[]=[];afterEach(()=>{for(const s of stores.splice(0))s.close();});
const request={targetType:'person' as const,targetId:'UJOE123',targetName:'Joe Fixture',workspaceId:'TTEST123',text:'Hello <@UJOE123> — fixture only'};
const reply={handoffProject:'',pickupChange:null,reply:'Prepared a synthetic message.',notifyRoles:[],question:'',goalChanges:[],slackRequests:[request],notes:[],receipts:[]};
function setup(){const store=new Store(':memory:');stores.push(store);const engine=new Engine(store),chat=new Conversations(store,engine,'/private/tmp');chat.archive=()=>{};const message=chat.enqueue({id:crypto.randomUUID(),body:'Send me a Slack test and tag me',role:'pm'});engine.agents.followup=async()=>reply;let sends=0,reads=0;
  engine.agents.sendSlack=async()=>{sends++;expect(store.state.slackDeliveries?.[0].status).toBe('sending');return receipt();};
  engine.agents.verifySlack=async()=>{reads++;return{...receipt(),found:true,targetId:request.targetId,workspaceId:request.workspaceId,text:request.text};};
  const ts=(Date.now()/1000).toFixed(6);function receipt(){return{channelId:'DTEST123',messageTs:ts,permalink:`https://fixture.slack.com/archives/DTEST123/p${ts.replace('.','')}`,detail:'Synthetic provider fixture'};}
  return{store,engine,chat,message,counts:()=>({sends,reads}),receipt};
}
test('Slack send is recorded before the effect, independently read back, and never duplicated by pump or duplicate request',async()=>{
  const s=setup();s.store.state.paused=true;await s.chat.pump();expect(s.counts().sends).toBe(0);s.store.state.paused=false;await s.chat.pump();await s.chat.pump();
  expect(s.counts()).toEqual({sends:1,reads:1});expect(s.message.status).toBe('answered');expect(s.store.state.slackDeliveries?.[0].status).toBe('confirmed');
  expect(s.store.state.messages.some(m=>m.receipts.some(r=>r.action==='slack-send'&&r.verified))).toBe(true);
  s.message.status='working';await expect(new SlackMessages(s.store,s.engine.agents).send(s.message.id,request)).rejects.toThrow('already has');expect(s.counts().sends).toBe(1);
});
test('drafts, ambiguous recipients and ordinary chat never enter the send path',async()=>{
  for(const body of ['Draft a Slack update for Joe','Which Alex should we message?','Can we send Slack messages?']){const s=setup();s.message.body=body;s.engine.agents.followup=async()=>({...reply,slackRequests:[],question:body.includes('Alex')?'Which Alex?':''});await s.chat.pump();expect(s.counts().sends).toBe(0);expect(s.store.state.slackDeliveries).toHaveLength(0);}
});
test('timeout after submit stays uncertain in the outbox and is never automatically resent',async()=>{
  const s=setup();let sends=0;s.engine.agents.sendSlack=async()=>{sends++;throw new Error('Timeout after provider submit');};await s.chat.pump();await s.chat.pump();expect(sends).toBe(1);expect(s.message.status).toBe('failed');expect(s.store.state.slackDeliveries?.[0].status).toBe('uncertain');expect(s.store.state.outbox.some(a=>a.id===`message:${s.message.id}`&&a.status==='open')).toBe(true);
  // Read-back via the existing outbox is read only, even if the reply says to resend.
  s.chat.enqueue({id:crypto.randomUUID(),role:'pm',body:'Check the original delivery; do not resend',actionId:`message:${s.message.id}`});await s.chat.pump();expect(sends).toBe(1);expect(s.store.state.slackDeliveries?.[0].status).toBe('confirmed');expect(s.store.state.outbox.find(a=>a.id===`message:${s.message.id}`)?.status).toBe('resolved');
});
test('wrong message, wrong destination, stale message and fake link cannot confirm delivery',async()=>{
  for(const mismatch of [{text:'Different content'},{targetId:'UOTHER'},{workspaceId:'TOTHER'},{permalink:'https://evil.example/archives/DTEST123/p123'},{messageTs:'1000000000.000000',permalink:'https://fixture.slack.com/archives/DTEST123/p1000000000000000'}]){const s=setup();s.engine.agents.verifySlack=async()=>({...s.receipt(),found:true,targetId:request.targetId,workspaceId:request.workspaceId,text:request.text,...mismatch});await s.chat.pump();expect(s.message.status).toBe('failed');expect(s.store.state.slackDeliveries?.[0].status).toBe('uncertain');}
});
test('restart preserves uncertain sends; non-PM cannot send and invalid target types fail before effects',async()=>{
  const s=setup();s.engine.agents.verifySlack=async()=>{throw new Error('Read unavailable');};await s.chat.pump();const d=s.store.state.slackDeliveries![0];d.status='sending';s.store.recover();expect(String(d.status)).toBe('uncertain');await s.chat.pump();expect(s.counts().sends).toBe(1);
  const other=setup();other.message.to='qa';await other.chat.pump();expect(other.counts().sends).toBe(0);expect(other.message.status).toBe('failed');
  const bad=setup();bad.message.status='working';await expect(new SlackMessages(bad.store,bad.engine.agents).send(bad.message.id,{...request,targetId:'CTEST123'})).rejects.toThrow('type');expect(bad.counts().sends).toBe(0);
});
test('Slack links validate exact host, channel and timestamp without credentials or query strings',()=>{
  expect(slackMessageUrl('https://verndale.slack.com/archives/D123/p1234567890000001','D123','1234567890.000001')).toBe(true);
  for(const url of ['https://verndale.slack.com.evil.test/archives/D123/p1234567890000001','javascript:alert(1)','https://foo@verndale.slack.com/archives/D123/p1234567890000001','https://verndale.slack.com/archives/D123/p1234567890000001?token=abc'])expect(slackMessageUrl(url,'D123','1234567890.000001')).toBe(false);
});
test('read-back accepts native mention expansion and known attribution, preserving other changes',async()=>{
  const s=setup();s.engine.agents.verifySlack=async()=>({...s.receipt(),found:true,targetId:request.targetId,workspaceId:request.workspaceId,text:request.text.replace('<@UJOE123>','<@UJOE123|Joe Fixture>')+'\n*Sent using* <@U0A3Q4JJX17|ChatGPT>'});await s.chat.pump();expect(s.message.status).toBe('answered');
  expect(comparableSlackText('Hello\nUnexpected footer')).toBe('Hello\nUnexpected footer');
  expect(comparableSlackText('See <https://example.org/ticket> &amp; <#CTEST123|test>')).toBe('See https://example.org/ticket & <#CTEST123>');
  expect(comparableSlackText('<https://example.org|Ticket>')).toBe('[Ticket](https://example.org)');
  expect(comparableSlackText('<https://different.example.org|Ticket>')).not.toBe('[Ticket](https://example.org)');
});
