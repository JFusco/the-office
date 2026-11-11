import { reconcileDigestAuthorship,unitAuthorship } from '../../../../server/knowledge/digests/authorship';
import { expect,test } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { configureDigestDelivery } from '../../../../server/knowledge/digests/settings';
import { queueOutboundDigests,digestNoticeRequest } from '../../../../server/knowledge/digests/outbound';
import { queueWeeklyDigest } from '../../../../server/knowledge/weekly-digest';
import { deliveryMetrics } from '../../../../server/knowledge/delivery-metrics';
import { evidenceIdentity } from '../../../../server/knowledge/sources/evidence-record';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import { outboundBody } from '../../../../server/knowledge/digests/outbound-body';
import { sendDigestNotice } from '../../../../server/knowledge/digests/send-notice';
import { SlackMessages } from '../../../../server/conversations/slack';
import type { Agents } from '../../../../server/workers/agents';
import type { SlackDelivery } from '../../../../src/shared';
import { reconcileAuthoredEvidence } from '../../../../server/knowledge/digests/reconcile-authorship';
import { independentDigestEvidence } from '../../../../server/knowledge/digests/independent-evidence';
import { digestKnowledge } from '../../../../server/knowledge/digests/private-body';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
const settings={enabled:true,workspace:'https://fixture.slack.com',workspaceId:'T123',channelId:'C123',channelName:'team-learning'};
function fixture(){const f=intakeFixture(),context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''})}};
    const text='PRIVATE FROZEN DIGEST TEXT',id=evidenceIdentity(f.source.id,'doc','v1');f.ledger.put('admission','doc:v1',{state:'admitted',at:f.store.clock.now().toISOString()});f.ledger.put('evidence',id,{id,sourceId:f.source.id,unitId:'doc',version:'v1',text,contentSha256:digest(text),readerVersion:'fixture',url:'',limitations:[],observedAt:f.store.clock.now().toISOString()});
    const now=f.store.clock.now();f.store.state.knowledge!.rollups=[{id:'rollup',weekEnding:'2026-11-06',at:now.toISOString(),metrics:deliveryMetrics(f.store,new Date(now.getTime()-7*86400000),now),summary:'Accepted review',officeProposalIds:[]}];
    queueWeeklyDigest(context,'brain');return {...f,context,text};}
test('off queues nothing; enabled delivery freezes private bytes and changing scope cancels before dispatch',async()=>{const f=fixture();try{
    expect(queueOutboundDigests(f.context,'brain')).toBe(0);expect(f.store.state.coordination!.notices?.entries||[]).toEqual([]);
    configureDigestDelivery(f.store,settings);expect(queueOutboundDigests(f.context,'brain')).toBe(1);expect(queueOutboundDigests(f.context,'brain')).toBe(0);
    const notice=f.store.state.coordination!.notices!.entries[0];expect(notice.kind).toBe('knowledge-digest');expect(JSON.stringify(notice)).not.toContain(f.text);expect(outboundBody(f.store,notice.id)).toContain(f.text);
    f.registry.subscribe(f.source.id,'brain',false);expect(digestNoticeRequest(f.context,'brain',notice)).toBeUndefined();let commands=0;
    await sendDigestNotice(f.store,{run:async()=>{commands++;}} as unknown as Agents,notice,f.context);expect(notice.status).toBe('cancelled');expect(commands).toBe(0);expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
}finally{f.close();}});
test('one uncertain send reconciles through existing Slack read-back after disable without retaining body copies or replay',async()=>{const f=fixture();try{
    configureDigestDelivery(f.store,settings);queueOutboundDigests(f.context,'brain');const notice=f.store.state.coordination!.notices!.entries[0];let sends=0,readbacks=0,confirmed=false;
    const receipt={channelId:'C123',messageTs:(Date.now()/1000).toFixed(6),permalink:''};receipt.permalink=`https://fixture.slack.com/archives/C123/p${receipt.messageTs.replace('.','')}`;
    const agents={knowledgeContext:f.context,run:async()=>({found:true,channelId:'C123',channelName:'team-learning',workspaceId:'T123',evidence:['Synthetic current native channel proof'],blocker:''}),sendSlack:async(delivery:SlackDelivery)=>{sends++;expect(delivery.text).toContain(f.text);return {...receipt,detail:'Synthetic provider receipt'};},verifySlack:async(delivery:SlackDelivery)=>{readbacks++;expect(delivery.text).toContain(f.text);return {found:confirmed,...receipt,targetId:'C123',workspaceId:'T123',text:delivery.text,detail:'Synthetic native read-back'};}} as unknown as Agents;
    await sendDigestNotice(f.store,agents,notice,f.context);expect(sends).toBe(1);expect(notice.status).toBe('uncertain');expect(f.store.getEffect(`slack:${notice.id}`)!.status).toBe('uncertain');
    expect(JSON.stringify(f.store.state.coordination!.notices)).not.toContain(f.text);expect(JSON.stringify(f.store.state.slackDeliveries)).not.toContain(f.text);expect(JSON.stringify(f.store.getEffect(`slack:${notice.id}`))).not.toContain(f.text);
    configureDigestDelivery(f.store,{...settings,enabled:false});f.registry.subscribe(f.source.id,'brain',false);confirmed=true;
    await new SlackMessages(f.store,agents).verify(f.store.state.slackDeliveries![0]);expect(notice.status).toBe('sent');expect(f.store.getEffect(`slack:${notice.id}`)!.status).toBe('verified');
    await sendDigestNotice(f.store,agents,notice,f.context);expect(sends).toBe(1);expect(readbacks).toBe(2);expect(f.store.state.slackDeliveries![0].text).toBe('');expect(reconcileDigestAuthorship(f.context)).toBe(true);expect(reconcileDigestAuthorship(f.context)).toBe(false);expect(unitAuthorship(f.registry,settings.workspace,{url:receipt.permalink,channel:'C123',ts:receipt.messageTs,references:[]})).toMatchObject({kind:'office-digest',noticeId:notice.id});expect(unitAuthorship(f.registry,'https://other.slack.com',{url:receipt.permalink,channel:'C123',ts:receipt.messageTs,references:[]})).toBeUndefined();
}finally{f.close();}});
test('a destination change cancels the old notice and restart only requeues proven pre-send lookups',()=>{const f=fixture();try{
    configureDigestDelivery(f.store,settings);queueOutboundDigests(f.context,'brain');const notice=f.store.state.coordination!.notices!.entries[0];notice.status='working';f.store.recover();expect(notice.status).toBe('queued');
    configureDigestDelivery(f.store,{...settings,channelId:'C456'});expect(notice.status).toBe('cancelled');expect(queueOutboundDigests(f.context,'brain')).toBe(0);
}finally{f.close();}});
test('confirmed digests and identified reposts cannot become next-week findings or survive late recognition before send',async()=>{const f=fixture();try{
 configureDigestDelivery(f.store,settings);queueOutboundDigests(f.context,'brain');const notice=f.store.state.coordination!.notices!.entries[0],sentText=outboundBody(f.store,notice.id)!;
 const messageTs=(Date.now()/1000).toFixed(6),repostTs=(Number(messageTs)+1).toFixed(6),receipt={channelId:'C123',messageTs,permalink:`https://fixture.slack.com/archives/C123/p${messageTs.replace('.','')}`};
 const agents={knowledgeContext:f.context,run:async()=>({found:true,channelId:'C123',channelName:'team-learning',workspaceId:'T123',evidence:['Synthetic current native channel proof'],blocker:''}),sendSlack:async()=>({...receipt,detail:'Synthetic provider receipt'}),verifySlack:async(delivery:SlackDelivery)=>({found:true,...receipt,targetId:'C123',workspaceId:'T123',text:delivery.text,detail:'Synthetic native read-back'})} as unknown as Agents;
 await sendDigestNotice(f.store,agents,notice,f.context);expect(f.store.getEffect(`slack:${notice.id}`)?.status).toBe('verified');
 const references=[] as import('../../../../src/contracts/knowledge-retrieval').KnowledgeReference[];
 for(const repost of [false,true]){
  const unit:SourceUnit={id:`C123:${repost?repostTs:messageTs}`,channel:'C123',ts:repost?repostTs:messageTs,kind:'channel',resource:'',url:repost?'https://fixture.slack.com/archives/C123/p101000001':receipt.permalink,text:sentText,version:'v1',observedAt:f.store.clock.now().toISOString(),state:'admitted',references:repost?[{kind:'internal',id:receipt.permalink}]:[],reason:'',attempt:''};
  const id=evidenceIdentity(f.source.id,unit.id,unit.version);f.ledger.put('unit',`${unit.id}:v1`,unit);f.ledger.put('admission',`${unit.id}:v1`,{state:'admitted'});f.ledger.put('evidence',id,{id,sourceId:f.source.id,unitId:unit.id,version:unit.version,text:unit.text,contentSha256:digest(unit.text),observedAt:unit.observedAt,readerVersion:'fixture',url:unit.url,limitations:[]});references.push({id,kind:'source',sourceId:f.source.id,unitId:unit.id,version:'v1',contentSha256:digest(unit.text)});
 }
 // Freeze a review while the newly collected text is not yet reconciled as our own.
 f.advance(7*86400000);const now=f.store.clock.now();f.store.state.knowledge!.rollups!.push({id:'rollup-two',weekEnding:'2026-11-13',at:now.toISOString(),metrics:deliveryMetrics(f.store,new Date(now.getTime()-7*86400000),now),summary:'Next window',officeProposalIds:[]});
 const early=queueWeeklyDigest(f.context,'brain')!;expect(early.evidence.map(r=>r.id)).toEqual(expect.arrayContaining(references.map(r=>r.id)));queueOutboundDigests(f.context,'brain');const earlyNotice=f.store.state.coordination!.notices!.entries.at(-1)!;
 reconcileAuthoredEvidence(f.context);expect(independentDigestEvidence(f.context,'brain',references)).toBe(false);expect(digestKnowledge(f.context,'brain',early.id)).toBeUndefined();expect(digestNoticeRequest(f.context,'brain',earlyNotice)).toBeUndefined();
 for(const reference of references)expect(f.ledger.get('evidence',reference.id)).toMatchObject({independent:false});
 f.advance(7*86400000);const later=f.store.clock.now();f.store.state.knowledge!.rollups!.push({id:'rollup-three',weekEnding:'2026-11-20',at:later.toISOString(),metrics:deliveryMetrics(f.store,now,later),summary:'Later window',officeProposalIds:[]});
 const next=queueWeeklyDigest(f.context,'brain')!;expect(next.evidence).toEqual([]);expect(next.text).not.toContain(f.text);expect(next.text).toContain('No new permitted source findings');expect(queueOutboundDigests(f.context,'brain')).toBe(1);expect(outboundBody(f.store,f.store.state.coordination!.notices!.entries.at(-1)!.id)).not.toContain(f.text);
}finally{f.close();}});
