import {expect,test,vi} from 'vitest';
import {assessPlanning,cancelObsoleteAssessment} from '../../../../server/features/handoff/planning-assessment';
import {openAssessment,saveAssessment,assessmentEpisode,progressAssessmentDeadlines} from '../../../../server/features/handoff/disposition-store';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {handoffFixture} from './fixture';
test('deadline commits independently, cancels only its matching reader, and ignores late planning output',async()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true);e.evidence=storeEvidence(f.store,blankEvidence('brain','GH-1','github','repo#1'));saveAssessment(f.store,e);
 const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'scheduler','planning-assessment')!;
 let finish!:(value:any)=>void;const controller=new AbortController();const workers={active:new Map(),run:vi.fn(()=>{workers.active.set('pm',controller);return new Promise(resolve=>{finish=resolve})})};
 const pending=assessPlanning(f.store,workers as any,e.id,async()=>({status:'clear',reason:''}));expect(workers.run).toHaveBeenCalledTimes(1);
 f.advance(600000);const closed=progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>true,()=>({}));closed.forEach(e=>cancelObsoleteAssessment(f.store,e));
 expect(controller.signal.aborted).toBe(true);expect(f.store.activeClaims()[0].id).toBe(claim.id);
 finish({disposition:'planning',rationale:'Plan it',requirements:['a'],acceptanceCriteria:['b'],settledDecisions:[],openQuestions:[],imageObservations:[]});await pending;
 expect(assessmentEpisode(f.store,e.id)!.outcome).toBe('ordinary-by-deadline');expect(f.store.state.features!.filter(f=>f.sourceTicket==='GH-1')).toHaveLength(0);
 }finally{f.close();}
});
