import { afterEach,expect,it,vi } from 'vitest';
import { intakeFixture,cleanScan } from './fixture';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { runSlackLinks,linkKey,type LinkRecord } from '../../../../server/knowledge/slack-intake/read-links';
import { IntakeBudget } from '../../../../server/knowledge/sources/launch-budget';
import { recoverStoppedLaunches } from '../../../../server/knowledge/sources/recover-launches';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
afterEach(()=>vi.restoreAllMocks());
it.each(['scanner','paused'])('releases a processing reservation when %s prevents worker launch',async failure=>{
 const f=intakeFixture();try{
    const unit:SourceUnit={id:'C123:1',version:'v1',channel:'C123',resource:'',kind:'channel',text:'Synthetic evidence',url:'',references:[],state:'deferred',reason:'',requests:[],observedAt:f.store.clock.now().toISOString(),attempt:'prior'};
    const key=`${unit.id}:${unit.version}`;f.ledger.put('unit',key,unit);f.task.processing=[key];f.ledger.put('task',f.task.id,f.task);
    const run=vi.fn();const scan=async(text:string)=>{if(failure==='scanner')throw Error('scanner unavailable');const source=f.registry.get(f.source.id)!;f.registry.update(source.id,source.revision,s=>{s.state='paused';});return cleanScan(text);};
    await runIntakeTask(f.store,run as KnowledgeRunner,f.task.id,f.registry,f.source.id,scan);
    expect(run).not.toHaveBeenCalled();expect(f.budget.used()).toBe(0);expect(f.budget.used('2026-11-07')).toBe(0);
    expect(f.budget.reserve(crypto.randomUUID(),f.source.id)).toBe(true);
 }finally{f.close();}
});
it('releases an isolated public-reader reservation when capacity fails without invoking any callback',async()=>{
 const f=intakeFixture();try{
    const link:LinkRecord={url:'https://www.sqlite.org/docs.html',source:'parent:v1',state:'pending',week:'2026-11-06',depth:0};f.ledger.put('link',linkKey(link.source,link.url),link);
    const run=vi.fn(async()=>{throw Error('Agent capacity is occupied');});
    await runSlackLinks(f.store,f.policy,run,[link],`source:${f.source.id}`,f.registry,cleanScan);
    expect(run).toHaveBeenCalledOnce();expect(f.budget.used()).toBe(0);expect(f.budget.used('2026-11-07')).toBe(0);expect(f.budget.reserve(crypto.randomUUID(),f.source.id)).toBe(true);
 }finally{f.close();}
});
it.each([false,true])('does not refund a physical launch when subsequent work fails (accounting failure: %s)',async failAccounting=>{
 const f=intakeFixture();try{
    if(failAccounting)vi.spyOn(IntakeBudget.prototype,'launched').mockImplementation(()=>{throw Error('accounting unavailable');});
    const run=(async(_prompt,_schema,options)=>{options?.onIntakeLaunch?.();throw Error('provider failed');}) as KnowledgeRunner;
    await runIntakeTask(f.store,run,f.task.id,f.registry,f.source.id,cleanScan);
    expect(f.budget.used()).toBe(1);expect(f.budget.used('2026-11-07')).toBe(failAccounting?1:0);
    recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false);expect(f.budget.used()).toBe(1);expect(f.budget.used('2026-11-07')).toBe(0);
 }finally{f.close();}
});
