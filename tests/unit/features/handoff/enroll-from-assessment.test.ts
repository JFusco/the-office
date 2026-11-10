import {expect,test} from 'vitest';
import {openAssessment,saveAssessment,assessmentEpisode,closeAssessment} from '../../../../server/features/handoff/disposition-store';
import {enrollFromAssessment} from '../../../../server/features/handoff/enroll-from-assessment';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {handoffFixture} from './fixture';
function planning(f:ReturnType<typeof handoffFixture>){
 const episode=openAssessment(f.store,'GH-1','v1',true),evidence=blankEvidence('brain','GH-1','github','repo#1');
 episode.evidence=storeEvidence(f.store,evidence);episode.result={disposition:'planning',rationale:'Clarify requirements',requirements:['Preserve data'],acceptanceCriteria:['No lost edits'],settledDecisions:[],openQuestions:[],imageObservations:[]};saveAssessment(f.store,episode);return episode;
}
test('enrollment commits once while its own namespaced assessment claim remains active',()=>{
 const f=handoffFixture();try{
 const e=planning(f);const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'scheduler','planning-assessment')!;
 const feature=enrollFromAssessment(f.store,e.id,e.generation,{status:'clear',reason:''},'Feature')!;
 expect(feature.progression).toBe('automatic');expect(feature.conversation[0].role).toBe('pm');expect(feature.handoff?.episodeId).toBe(e.id);expect(f.store.activeClaims()[0].id).toBe(claim.id);
 enrollFromAssessment(f.store,e.id,e.generation,{status:'clear',reason:''},'Duplicate');expect(f.store.state.features!.filter(f=>f.sourceTicket==='GH-1')).toHaveLength(1);expect(assessmentEpisode(f.store,e.id)!.outcome).toBe('planning-enrolled');
 }finally{f.close();}
});
test('Start, deadline, stale generations and unknown ownership cannot create a feature',()=>{
 for(const reason of ['start','deadline','generation','unknown']){
 const f=handoffFixture();try{const e=planning(f);
 if(reason==='start')closeAssessment(f.store,e,'ordinary-by-start');if(reason==='deadline')f.advance(600000);
 const feature=enrollFromAssessment(f.store,e.id,reason==='generation'?e.generation+1:e.generation,{status:reason==='unknown'?'unknown':'clear',reason:'Unknown ownership'},'Feature');
 expect(feature).toBeUndefined();expect(f.store.state.features!.filter(f=>f.sourceTicket==='GH-1')).toHaveLength(0);
 }finally{f.close();}
 }
});
