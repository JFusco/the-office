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
test('correctable reviewed manifest defects return bounded diagnostics to Alex and keep the same stage budget',()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';f.feature.phase='approval';f.feature.review={run:'saved',processes:[]} as any;
 // Importing the typed producer below keeps this fixture independent of provider commands.
 recoverFailure(f.store,f.feature,new FeatureError('invalid-content','Preserve the source item'),'manifest-one');
 expect(f.feature.phase).toBe('plan');expect(f.feature.review).toBeUndefined();expect(f.feature.reviewHistory[0].run).toBe('saved');expect(f.feature.recovery!.attempts).toBe(2);expect(f.feature.conversation.at(-1)!.text).toContain('Preserve the source item');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
import {FeatureError} from '../../../../server/features/progression/failure';
