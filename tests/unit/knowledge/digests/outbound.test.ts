import { expect,test } from 'vitest';
import { sourceFixture } from '../sources/source-fixture';
import { configureDigestDelivery } from '../../../../server/knowledge/digests/settings';
import { queueOutboundDigests,digestNoticeRequest } from '../../../../server/knowledge/digests/outbound';
import { queueWeeklyDigest } from '../../../../server/knowledge/weekly-digest';
import { deliveryMetrics } from '../../../../server/knowledge/delivery-metrics';
import { evidenceIdentity } from '../../../../server/knowledge/sources/evidence-record';
import { digest } from '../../../../server/knowledge/digest';
import { outboundBody } from '../../../../server/knowledge/digests/outbound-body';
import { sendDigestNotice } from '../../../../server/knowledge/digests/send-notice';
import { SlackMessages } from '../../../../server/conversations/slack';
import type { Agents } from '../../../../server/workers/agents';
import type { SlackDelivery } from '../../../../src/shared';
const settings={enabled:true,workspace:'https://fixture.slack.com',workspaceId:'T123',channelId:'C123',channelName:'team-learning'};
function fixture(){const f=sourceFixture(),context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''})}};
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
    await sendDigestNotice(f.store,agents,notice,f.context);expect(sends).toBe(1);expect(readbacks).toBe(2);expect(f.store.state.slackDeliveries![0].text).toBe('');
}finally{f.close();}});
test('a destination change cancels the old notice and restart only requeues proven pre-send lookups',()=>{const f=fixture();try{
    configureDigestDelivery(f.store,settings);queueOutboundDigests(f.context,'brain');const notice=f.store.state.coordination!.notices!.entries[0];notice.status='working';f.store.recover();expect(notice.status).toBe('queued');
    configureDigestDelivery(f.store,{...settings,channelId:'C456'});expect(notice.status).toBe('cancelled');expect(queueOutboundDigests(f.context,'brain')).toBe(0);
}finally{f.close();}});
