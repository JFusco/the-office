import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { resolve } from 'node:path';
import { helperTelemetry } from '../../../server/features/helper-telemetry';
import { fixture } from './test-store';
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
