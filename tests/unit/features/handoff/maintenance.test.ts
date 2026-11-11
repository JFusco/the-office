import {expect,test,vi} from 'vitest';
import {maintainAssessmentWork} from '../../../../server/features/handoff/maintenance';
import {openAssessment,saveAssessment,assessmentEpisode} from '../../../../server/features/handoff/disposition-store';
import {assessPlanning} from '../../../../server/features/handoff/planning-assessment';
import {closeIntakeEpisode} from '../../../../server/features/handoff/intake-disposition';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {handoffFixture} from './fixture';
test.each(['start','generation','current'] as const)('maintenance aborts only an obsolete running Morgan attempt and never releases its claim (%s)',async reason=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true);e.evidence=storeEvidence(f.store,blankEvidence('brain','GH-1','github','repo#1'));saveAssessment(f.store,e);
 const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'scheduler','planning-assessment')!;
 let finish!:(value:any)=>void;const controller=new AbortController();const workers={active:new Map(),run:vi.fn(()=>{workers.active.set('pm',controller);return new Promise(resolve=>{finish=resolve})})};
 const pending=assessPlanning(f.store,workers as any,e.id,async()=>({status:'clear',reason:''}));
 if(reason==='start')f.store.transaction(()=>closeIntakeEpisode(f.store,'GH-1',true));
 if(reason==='generation'){const current=assessmentEpisode(f.store,e.id)!;current.generation++;saveAssessment(f.store,current);}
 maintainAssessmentWork({store:f.store} as any);
 expect(controller.signal.aborted).toBe(reason!=='current');expect(f.store.activeClaims().some(c=>c.id===claim.id)).toBe(true);
 finish({disposition:'planning',rationale:'Late',requirements:[],acceptanceCriteria:[],settledDecisions:[],openQuestions:[],imageObservations:[]});await pending;
 expect(f.store.activeClaims().some(c=>c.id===claim.id)).toBe(true);expect(f.store.state.features!.filter(x=>x.sourceTicket==='GH-1')).toHaveLength(0);
 if(reason==='start')expect(assessmentEpisode(f.store,e.id)?.outcome).toBe('ordinary-by-start');
 }finally{f.close();}
});
test('restart recovery preserves live claims and spends one recovery observation per retired attempt',()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true);Object.assign(e,{attemptId:'attempt',attempts:1,startedAt:f.store.clock.now().toISOString()});saveAssessment(f.store,e);
 const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'worker','planning-assessment')!,entry={store:f.store} as any;
 maintainAssessmentWork(entry);expect(assessmentEpisode(f.store,e.id)?.nextAt).toBeUndefined();
 f.store.finishClaim(claim.id,'interrupted');maintainAssessmentWork(entry);const due=assessmentEpisode(f.store,e.id)?.nextAt;expect(due).toBe('2026-11-10T12:00:30.000Z');
 f.advance(10000);maintainAssessmentWork(entry);expect(assessmentEpisode(f.store,e.id)?.nextAt).toBe(due);
 }finally{f.close();}
});
test('a pump with nothing to recover or requeue never rewrites the project state',()=>{
 const f=handoffFixture();try{
 const save=vi.spyOn(f.store,'save');maintainAssessmentWork({store:f.store} as any);maintainAssessmentWork({store:f.store} as any);
 expect(save).not.toHaveBeenCalled();
 }finally{f.close();}
});
