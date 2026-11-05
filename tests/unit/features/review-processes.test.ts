import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { observeHelperGroups } from '../../../server/features/review-processes';
import { fixture } from './test-store';
test('a completed leader receipt cannot hide surviving provider children; stopped receipts are retired',()=>{
 const f=fixture();try{
  const call=resolve(f.root,'review','calls','001-research');mkdirSync(call,{recursive:true});
  writeFileSync(resolve(call,'started.json'),JSON.stringify({pid:54321,process_group:54321}));
  writeFileSync(resolve(call,'process.json'),JSON.stringify({exit_code:0}));
  f.feature.review={run:resolve(f.root,'review'),processes:[]} as any;
  expect(observeHelperGroups(f.store,f.feature,()=>true)).toEqual([54321]);
  expect(observeHelperGroups(f.store,f.feature,()=>false)).toEqual([]);
  expect(observeHelperGroups(f.store,f.feature,()=>true)).toEqual([]);
 }finally{f.close();}
});
