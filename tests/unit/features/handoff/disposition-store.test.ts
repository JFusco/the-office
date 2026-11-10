import {expect,test} from 'vitest';
import {openAssessment,assessmentEpisode,closeAssessment,progressAssessmentDeadlines,saveAssessment} from '../../../../server/features/handoff/disposition-store';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {handoffFixture} from './fixture';
test('deadline is fixed, terminal, independent of worker capacity and exactly ten minutes',()=>{
 const f=handoffFixture();try{
 const episode=openAssessment(f.store,'GH-1','v1',true);f.advance(599999);
 expect(progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>true,()=>({}))).toEqual([]);
 f.advance(1);const closed=progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>true,()=>({}));
 expect(closed[0]).toMatchObject({outcome:'ordinary-by-deadline',reason:'assessment not started: delivery lane occupied'});
 const current=assessmentEpisode(f.store,episode.id)!;current.generation++;saveAssessment(f.store,current);closeAssessment(f.store,current,'planning-enrolled');
 expect(assessmentEpisode(f.store,episode.id)!.outcome).toBe('ordinary-by-deadline');expect(progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>{throw Error('must not observe')},()=>({}))).toEqual([]);
 }finally{f.close();}
});
test('disabled activation and absent eligibility have no deadline effects; real waits take precedence',()=>{
 const f=handoffFixture();try{
 const unready=openAssessment(f.store,'GH-1','v1',false),ready=openAssessment(f.store,'GH-2','v1',true);f.advance(600000);delete FEATURE_PLANNING.brain;
 expect(progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>{throw Error()},()=>{throw Error()})).toEqual([]);
 FEATURE_PLANNING.brain={assessment:{enabled:true}};
 const closed=progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>true,()=>({wait:'Waiting for evidence'}));expect(closed[0].reason).toBe('Waiting for evidence');
 expect(assessmentEpisode(f.store,unready.id)!.closedAt).toBeUndefined();expect(assessmentEpisode(f.store,ready.id)!.closedAt).toBeTruthy();
 }finally{f.close();}
});
test('Start wins and transaction rollback does not leak a terminal episode',()=>{
 const f=handoffFixture();try{const e=openAssessment(f.store,'GH-1','v1',true);
 expect(()=>f.store.transaction(()=>{closeAssessment(f.store,e,'ordinary-by-start');throw Error('rollback')})).toThrow();expect(assessmentEpisode(f.store,e.id)!.closedAt).toBeUndefined();
 f.store.transaction(()=>closeAssessment(f.store,assessmentEpisode(f.store,e.id)!,'ordinary-by-start'));
 f.advance(600000);expect(progressAssessmentDeadlines(f.store,f.store.clock.now(),()=>true,()=>({}))).toEqual([]);
 }finally{f.close();}
});
