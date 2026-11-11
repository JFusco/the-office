import {expect,test} from 'vitest';
import {fixture} from '../test-store';
import {harnessQuestion,recoveryPreconditions} from '../../../../server/features/questions/harness-question';
import {stageBudget} from '../../../../server/features/progression/attempt-budget';
test('one code-owned round per recovery event uses stable preconditions without mutable display detail',()=>{
 const f=fixture();try{
 const budget=stageBudget(f.feature,'discovery');harnessQuestion(f.feature,new Date(),'Needs input');const before=recoveryPreconditions(f.feature);
 budget.wait='questions';budget.detail='changed explanation';harnessQuestion(f.feature,new Date(),'again');expect(f.feature.rounds).toHaveLength(1);expect(recoveryPreconditions(f.feature)).toBe(before);
 budget.generation++;expect(recoveryPreconditions(f.feature)).not.toBe(before);
 }finally{f.close();}
});
