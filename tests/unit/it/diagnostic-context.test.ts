import {expect,test} from 'vitest';
import {diagnosticContext} from '../../../server/it/diagnostic-context';
import {diagnosticFixture} from './diagnostic-fixture';
test('worker context separates retired history and consumed retry budgets from current faults',()=>{
 const f=diagnosticFixture();try{
  f.store.clock={...f.store.clock,now:()=>new Date('2026-11-05T14:01:00Z')};const old=structuredClone(f.store.state.it);
  const context=diagnosticContext(f.store);expect(context.current).toMatchObject({projectId:'brain',fresh:true,status:'monitoring',followUps:[]});expect(context.history).toEqual(old!.reports);expect(context.retryBudgets).toEqual([{id:f.id,attempts:3,requestId:'recovery'}]);expect(f.store.state.it).toEqual(old);
 }finally{f.close();}
});
test('stale IT and expired provider evidence are explicitly unknown in prompts',()=>{
 const f=diagnosticFixture();try{
  f.store.clock={...f.store.clock,now:()=>new Date('2026-11-05T14:04:00Z')};f.job.status='blocked';f.store.state.it!.services=[{id:'github',name:'GitHub',checkedAt:'2026-11-05T14:00:00Z',expiresAt:'2026-11-05T14:02:30Z',status:'connected',detail:'Earlier account check'}];
  const context=diagnosticContext(f.store);expect(context.current).toMatchObject({fresh:false,status:'unknown',followUps:[]});expect(context.current.services[0]).toMatchObject({status:'unknown',checkedAt:'2026-11-05T14:00:00Z'});expect(context.history[0].followUps).toHaveLength(1);
 }finally{f.close();}
});
