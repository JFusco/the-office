import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync, utimesSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { helperTelemetry } from '../../../server/features/helper-telemetry';
import { fixture } from './test-store';
import { prepareExposure } from '../../../server/knowledge/lesson-exposure';
import { selectLessons } from '../../../server/knowledge/lesson-selection';

for (const usage of [{ input_tokens: 20 }, { input_tokens: 0, cache_read_input_tokens: 20 }]) test('Claude final native usage counts helper exposure once; wrapper starts and empty errors do not', () => {
 const f=fixture();try{
  const run=resolve(f.root,'review'),attempt=resolve(f.root,'attempt'),call=resolve(run,'calls','001-review');
  mkdirSync(call,{recursive:true});mkdirSync(attempt,{recursive:true});
  writeFileSync(resolve(call,'started.json'),JSON.stringify({pid:54321,process_group:54321}));
  writeFileSync(resolve(call,'agent.json'),JSON.stringify({provider:'claude',model:'configured',effort:'high'}));
  f.feature.review={run,attemptDir:attempt,processes:[]} as never;
  prepareExposure(f.store,attempt,attempt,'plan-review',selectLessons(f.store,{stage:'plan-review'}),{kind:'feature',id:f.feature.id});
  const manifest=readFileSync(resolve(attempt,'lessons.json'),'utf8');
  helperTelemetry(f.store,f.feature,()=>true);
  const exposure=f.store.state.knowledge!.exposures![0];expect(exposure.dispatchedAt).toBeUndefined();
  writeFileSync(resolve(call,'stdout.log'),JSON.stringify({type:'result',session_id:'session',is_error:true,usage:{input_tokens:0}})+'\n');
  helperTelemetry(f.store,f.feature,()=>true);expect(exposure.dispatchedAt).toBeUndefined();
  writeFileSync(resolve(call,'stdout.log'),JSON.stringify({type:'result',session_id:'session',usage,modelUsage:{configured:usage}})+'\n');
  helperTelemetry(f.store,f.feature,()=>true);const dispatchedAt=exposure.dispatchedAt;expect(dispatchedAt).toBeTruthy();
  helperTelemetry(f.store,f.feature,()=>true);
  expect(f.store.state.knowledge!.exposures).toHaveLength(1);expect(exposure.dispatchedAt).toBe(dispatchedAt);
  expect(readFileSync(resolve(attempt,'lessons.json'),'utf8')).toBe(manifest);
 }finally{f.close();}
});
test('provider time and real session are imported once without inventing observed model settings',()=>{
 const f=fixture();try{
  const run=resolve(f.root,'review'),call=resolve(run,'calls','001-research');mkdirSync(call,{recursive:true});
  for(const [name,data] of Object.entries({'started.json':{pid:54321,process_group:54321},'agent.json':{provider:'codex',model:'configured',effort:'high'},'process.json':{exit_code:0,elapsed_seconds:2}}))writeFileSync(resolve(call,name),JSON.stringify(data));
  writeFileSync(resolve(call,'stdout.log'),JSON.stringify({type:'thread.started',thread_id:'actual-session'})+'\n');
  const started = new Date(Date.now()-2000); utimesSync(resolve(call,'started.json'),started,started);
  f.feature.review={run,processes:[]} as any;
  helperTelemetry(f.store,f.feature,()=>false);helperTelemetry(f.store,f.feature,()=>false);
  const work=f.store.state.workLog!.filter(w=>w.requestId===f.feature.id);
  expect(work).toHaveLength(1);expect(work[0]).toMatchObject({role:'analyst',sessionId:'actual-session',elapsedMs:2000,observedModel:null,status:'completed'});
 }finally{f.close();}
});
