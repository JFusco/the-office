import {expect,test} from 'vitest';
import {ReviewStateError} from '../../../server/features/review-state-error';
import {FeatureError} from '../../../server/features/progression/failure';
test('review recovery retains actual canonical state for routing instead of losing it in a generic retry',()=>{
 const evidence={run:'original',status:'needs_user'} as any;const error=new ReviewStateError(evidence);expect(error).toBeInstanceOf(FeatureError);expect(error.code).toBe('review-state');expect(error.evidence).toBe(evidence);
});
