import {expect,test} from 'vitest';
import {recoveryQuestion,recoveryPreconditions} from '../../../../server/features/questions/recovery-question';
import {commandFeature} from '../../../../server/features/commands';
import {fixture} from '../test-store';
test('recovery questions deduplicate and product answers cannot execute them',()=>{
 const f=fixture();try{
 recoveryQuestion(f.feature,new Date(),'Uncertain write',true); recoveryQuestion(f.feature,new Date(),'Same failure',true);
 expect(f.feature.rounds).toHaveLength(1); const round=f.feature.rounds[0];
 expect(round.options!.map(o=>o.action)).toEqual(['retry','pause']);
 expect(round.options![0].preconditionsDigest).toBe(recoveryPreconditions(f.feature));
 expect(()=>commandFeature(f.store,f.feature.id,{action:'answer',requestId:'bad-answer',expectedRevision:1,roundId:round.id,answers:{recovery:'retry'}})).toThrow('Harness rounds');
 expect(f.store.state.features![0].rounds[0].answers).toEqual({});
 }finally{f.close();}
});
