import { expect, test } from 'vitest';
import { classifyFeatureFailure, FeatureError } from '../../../../server/features/progression/failure';
import { CommandFailure } from '../../../../server/workers/process';
const state={uncertainEffect:false,liveProcesses:false,paused:false,replaySafe:true};
test('state and typed failures govern recovery, never message heuristics',()=>{
 expect(classifyFeatureFailure(new Error('permission transient-read'),state)).toEqual({kind:'retry',diagnostic:true});
 expect(classifyFeatureFailure(new CommandFailure('x','permission',false),state)).toEqual({kind:'question'});
 expect(classifyFeatureFailure(new CommandFailure('x','transient-read',true),state)).toEqual({kind:'retry',diagnostic:false});
 expect(classifyFeatureFailure(new FeatureError('invalid-content','x'),state)).toEqual({kind:'rework'});
 expect(classifyFeatureFailure(new Error('x'),{...state,replaySafe:false})).toEqual({kind:'question'});
 expect(classifyFeatureFailure(new Error('x'),{...state,uncertainEffect:true,paused:true})).toEqual({kind:'reconcile'});
 expect(classifyFeatureFailure(new Error('x'),{...state,liveProcesses:true})).toEqual({kind:'wait',wait:'processes'});
});
