import type { KnowledgeContext } from '../context';
import { recordLearningOpportunity,learningDigest } from '../learning-events';
import { IntakeLedger } from '../slack-intake/ledger';
import type { EvidenceRecord } from './evidence-record';
import { sourceVisible } from './visibility';
/** Bounded replay into the existing learning boundary. The destination save precedes its delivery receipt. */
export function fanoutSourceLearning(context:KnowledgeContext,limit=50):number {
    let delivered=0;
    for(const source of context.registry.all()) {
        if(source.destination!=='project-evidence'||source.state==='withdrawn')continue;
        const home=context.stores.get(source.homeProjectId);if(!home)continue;const ledger=new IntakeLedger(home,source);
        const records=ledger.all<EvidenceRecord>('evidence').filter(record=>ledger.get<{state:string}>('admission',`${record.unitId}:${record.version}`)?.state==='admitted'),latest=new Map(records.map(r=>[r.unitId,r.version]));
        for(const record of records) {
            for(const grant of context.registry.subscriptions(source.id).filter(g=>g.active)) {
                if(delivered>=limit)return delivered;
                const store=context.stores.get(grant.projectId),id=`source-learning:${learningDigest([source.id,record.unitId,record.version,grant.projectId])}`;
                if(!store?.state.knowledge||!sourceVisible(context.registry,source.id,grant.projectId))continue;
                if(latest.get(record.unitId)===record.version&&!ledger.get('version-review',id)) {
                    for(const lesson of store.state.knowledge.lessons)if(lesson.evidence.some(p=>p.source?.sourceId===source.id&&p.source.unitId===record.unitId&&p.source.version!==record.version)){lesson.needsReview=true;lesson.sourceReviewReason='source-changed';}
                    store.save();ledger.put('version-review',id,{version:record.version,projectId:grant.projectId});
                }
                if(record.independent===false||ledger.get('learning-delivery',id))continue;
                recordLearningOpportunity(store,{id,subject:{kind:'source',id:source.id},key:'Source evidence',stage:'source-admission',digest:record.contentSha256,at:record.observedAt,disposition:'accepted',origin:'work',phaseBoundary:false,summary:'New source evidence available for project-local advisory review',evidence:[{kind:'source',ref:record.id,url:'',detail:'Private source version; excerpt resolved only when Harper builds the packet',source:{sourceId:source.id,unitId:record.unitId,version:record.version}}]});
                store.save();ledger.put('learning-delivery',id,{projectId:grant.projectId,evidenceId:record.id,at:store.clock.now().toISOString()});delivered++;
            }
        }
    }
    return delivered;
}
