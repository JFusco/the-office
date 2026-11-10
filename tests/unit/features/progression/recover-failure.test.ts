import {expect,test} from 'vitest';
import {recoverFailure} from '../../../../server/features/progression/recover-failure';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {CommandFailure} from '../../../../server/workers/process';
import {fixture} from '../test-store';
test('automatic retry exhaustion asks once and inactive policy waits without replay',()=>{
 const f=fixture();try{
 f.feature.progression='automatic';
 expect(recoverFailure(f.store,f.feature,new Error('read'),'one')).toBe(true); expect(f.feature.recovery!.wait).toBe('policy');
 FEATURE_PLANNING.brain={progression:'automatic'};
 const error=new CommandFailure('read unavailable','transient-read',true);
 for(const id of ['one','two','three','four']) recoverFailure(f.store,f.feature,error,id);
 expect(f.feature.recovery!.attempts).toBe(3);expect(f.feature.rounds).toHaveLength(1);expect(f.feature.status).toBe('waiting');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
