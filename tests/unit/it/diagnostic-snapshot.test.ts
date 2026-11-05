import {expect,test,vi} from 'vitest';
import {diagnosticSnapshot} from '../../../server/it/diagnostic-snapshot';
import {ITSpecialist} from '../../../server/it/it-specialist';
import {diagnosticFixture} from './diagnostic-fixture';
test('live diagnostics remove a verified retired source immediately, keeping report and probe timestamps intact',()=>{
 const f=diagnosticFixture();try{const original=structuredClone(f.store.state.it);const current=diagnosticSnapshot(f.store)!;expect(current).toMatchObject({projectId:'brain',status:'monitoring',followUps:[],checkedAt:original!.checkedAt});expect(current.reports).toEqual(original!.reports);expect(f.store.state.it).toEqual(original);f.job.status='blocked';expect(diagnosticSnapshot(f.store)!.followUps).toHaveLength(1);}finally{f.close();}
});
test('normal IT tick durably resolves the retired ledger without replaying its exhausted request',async()=>{
 const f=diagnosticFixture();try{
  f.store.state.paused=true;const old=structuredClone(f.store.state.it!.reports[0]);const command=vi.fn();
  const offices={entries:new Map([['brain',{store:f.store,engine:{agents:{active:new Map()},observe:command},coordinator:{poll:command}}]])};
  const it=new ITSpecialist(offices as any,{report:async()=>({services:[],checkedAt:'',context:''})} as any);
  await it.tick(new Date('2026-11-05T14:01:00Z'),true);
  expect(f.store.state.it!.recoveries[f.id]).toMatchObject({status:'resolved',nextAt:'',attempts:3});expect(f.store.state.it!.reports[0]).toEqual(old);expect(f.store.state.it!.reports.at(-1)!.followUps).toEqual([]);expect(command).not.toHaveBeenCalled();expect(f.store.state.coordination!.requests||[]).toEqual([]);
  const resolved=structuredClone(f.store.state.it!.recoveries[f.id]);
  f.job.status='blocked';
  await it.tick(new Date('2026-11-05T14:02:00Z'),true);
  expect(f.store.state.it!.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:f.id,owner:'IT'}));expect(f.store.state.it!.status).toBe('retrying');expect(f.store.state.it!.recoveries[f.id]).toEqual(resolved);expect(f.store.state.it!.recoveries[f.id]).toMatchObject({attempts:3,requestId:'recovery'});expect(f.store.state.it!.reports[0]).toEqual(old);expect(command).not.toHaveBeenCalled();expect(f.store.state.coordination!.requests||[]).toEqual([]);
 }finally{f.close();}
});
test('a source reactivated after a clearing tick returns to the snapshot without changing saved diagnostics',async()=>{
 const f=diagnosticFixture();try{
  f.store.state.paused=true;const command=vi.fn();
  const offices={entries:new Map([['brain',{store:f.store,engine:{agents:{active:new Map()},observe:command},coordinator:{poll:command}}]])};
  const it=new ITSpecialist(offices as any,{report:async()=>({services:[],checkedAt:'',context:''})} as any);
  await it.tick(new Date('2026-11-05T14:01:00Z'),true);
  expect(f.store.state.it!.reports.at(-1)!.followUps).toEqual([]);
  f.job.status='blocked';const before=structuredClone(f.store.state.it);
  const current=diagnosticSnapshot(f.store)!;
  expect(current.followUps).toEqual([{id:f.id,owner:'IT',detail:before!.recoveries[f.id].detail}]);expect(current.status).not.toBe('monitoring');expect(f.store.state.it).toEqual(before);expect(command).not.toHaveBeenCalled();expect(f.store.state.coordination!.requests||[]).toEqual([]);
 }finally{f.close();}
});
test('resolved probe follow-ups leave current diagnostics while historical findings remain',()=>{
 const f=diagnosticFixture();try{const it=f.store.state.it!;it.reports[0].followUps=[{id:'probe:azure',owner:'IT',detail:'Earlier timeout'}];it.recoveries['probe:azure']={status:'resolved',attempts:1,nextAt:'',detail:'Verified'};expect(diagnosticSnapshot(f.store)!.followUps).toEqual([]);expect(it.reports[0].followUps).toHaveLength(1);}finally{f.close();}
});
test('a resolved ledger flag cannot conceal a reactivated native source',()=>{
 const f=diagnosticFixture();try{f.store.state.it!.recoveries[f.id].status='resolved';f.job.status='blocked';expect(diagnosticSnapshot(f.store)!.followUps).toHaveLength(1);}finally{f.close();}
});
test('a concurrent snapshot replacement cannot stamp detached diagnostics as fresh',async()=>{
 const f=diagnosticFixture();try{
  const checked=f.store.state.it!.checkedAt;
  const sessions={forProject:()=>({complete:false,fresh:false}),refresh:async()=>{f.store.state=structuredClone(f.store.state);}};
  const offices={entries:new Map([['brain',{store:f.store,engine:{agents:{active:new Map()}},coordinator:{}}]]),sessions};
  const it=new ITSpecialist(offices as any,{report:async()=>({services:[],checkedAt:'',context:''})} as any);
  await it.tick(new Date('2026-11-05T14:01:00Z'),true);
  expect(f.store.state.it!.checkedAt).toBe(checked);expect(it.nextAt).toBe(0);
 }finally{f.close();}
});
