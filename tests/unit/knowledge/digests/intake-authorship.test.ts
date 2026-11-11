import { digest } from '../../../../server/knowledge/slack-intake/config';
import { expect,test } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { annotateAuthoredUnits } from '../../../../server/knowledge/digests/intake-authorship';
import { reconcileAuthoredEvidence } from '../../../../server/knowledge/digests/reconcile-authorship';
import { unitAuthorship } from '../../../../server/knowledge/digests/authorship';
import { evidenceIdentity,type EvidenceRecord } from '../../../../server/knowledge/sources/evidence-record';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import { learningLesson } from '../knowledge-fixture';
import { fanoutSourceLearning } from '../../../../server/knowledge/sources/learning-events';

test('late authorship confirmation annotates exact versions and known reposts without changing settled unit identities',()=>{const f=intakeFixture();try{
    const url='https://fixture.slack.com/archives/C123/p100000001',unit={id:'C123:100.000001',channel:'C123',ts:'100.000001',version:'original-version',url,references:[],state:'admitted',text:'Original private bytes'} as unknown as SourceUnit,key=`${unit.id}:${unit.version}`,id=evidenceIdentity(f.source.id,unit.id,unit.version);
    f.ledger.put('unit',key,unit);f.ledger.put('admission',key,{state:'admitted'});f.ledger.put('evidence',id,{id,sourceId:f.source.id,unitId:unit.id,version:unit.version,text:unit.text,contentSha256:'original-hash',limitations:[]});
    f.store.state.knowledge!.lessons.push(learningLesson('prior',{evidence:[{kind:'source',ref:id,url:'',detail:'',source:{sourceId:f.source.id,unitId:unit.id,version:unit.version}}]}));
    f.registry.setMeta('authored-knowledge-digests',[{noticeId:'original-digest',origin:'https://fixture.slack.com',channelId:'C123',messageTs:'100.000001',permalink:url,textSha256:'original-send-hash',comparisonSha256:digest(unit.text)}]);
    const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''})}};
    reconcileAuthoredEvidence(context);const saved=f.ledger.get<SourceUnit>('unit',key)!;expect(saved).toMatchObject({version:unit.version,state:'admitted',text:unit.text,authorship:{kind:'office-digest'}});
    expect(f.ledger.get<EvidenceRecord>('evidence',id)).toMatchObject({independent:false,contentSha256:'original-hash',text:unit.text});expect(f.store.state.knowledge!.lessons[0]).toMatchObject({needsReview:true,sourceReviewReason:'office-authored'});expect(fanoutSourceLearning(context)).toBe(0);expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
    const revision=f.ledger.revision();reconcileAuthoredEvidence(context);expect(f.ledger.revision()).toBe(revision);
    const repost={...unit,id:'C123:101.000001',ts:'101.000001',url:'https://fixture.slack.com/archives/C123/p101000001',references:[{kind:'internal' as const,id:url}]};expect(unitAuthorship(f.registry,'https://fixture.slack.com',repost)).toMatchObject({kind:'identified-repost'});expect(unitAuthorship(f.registry,'https://fixture.slack.com',{...repost,text:'Independent discussion linking the digest'})).toBeUndefined();
    annotateAuthoredUnits(f.ledger,f.registry,'https://fixture.slack.com',[repost]);expect(repost.authorship?.kind).toBe('identified-repost');
}finally{f.close();}});
