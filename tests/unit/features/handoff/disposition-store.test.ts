import {expect,test} from 'vitest';
import {openAssessment,assessmentEpisode,closeAssessment,saveAssessment} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
test('queue age and evidence generations do not close an assessment',()=>{
 const f=handoffFixture();try{
 const episode=openAssessment(f.store,'GH-1','v1',true);f.advance(24*60*60_000);
 const current=assessmentEpisode(f.store,episode.id)!;current.generation++;saveAssessment(f.store,current);
 expect(assessmentEpisode(f.store,episode.id)!.closedAt).toBeUndefined();
 closeAssessment(f.store,current,'ordinary-by-start');closeAssessment(f.store,current,'planning-enrolled');
 expect(assessmentEpisode(f.store,episode.id)!.outcome).toBe('ordinary-by-start');
 }finally{f.close();}
});
test('Start wins and transaction rollback does not leak a terminal episode',()=>{
 const f=handoffFixture();try{const e=openAssessment(f.store,'GH-1','v1',true);
 expect(()=>f.store.transaction(()=>{closeAssessment(f.store,e,'ordinary-by-start');throw Error('rollback')})).toThrow();
 expect(assessmentEpisode(f.store,e.id)!.closedAt).toBeUndefined();
 f.store.transaction(()=>closeAssessment(f.store,assessmentEpisode(f.store,e.id)!,'ordinary-by-start'));
 f.advance(600000);expect(assessmentEpisode(f.store,e.id)!.outcome).toBe('ordinary-by-start');
 }finally{f.close();}
});
