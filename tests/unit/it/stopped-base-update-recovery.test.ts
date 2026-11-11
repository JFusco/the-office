import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../delivery/support/fake-github';
import { recoverStoppedBaseUpdates, stoppedBaseUpdateUnresolved } from '../../../server/it/stopped-base-update-recovery';
import { recoverAttempt } from '../../../server/it/recovery-attempt';
import { reconcileRecoveryLedger } from '../../../server/it/recovery-ledger';
import type { ITContext } from '../../../server/it/context';
import type { WorkTime } from '../../../src/shared';
afterEach(cleanupFakes);
function fixture() {
    const f=fakeGitHub(),job=f.candidate({existingPR:true,pr:156,status:'interrupted',stage:'update-base'});
    f.store.state.coordination!.enabled=true;
    (f.store.state.workLog??=[]).push({id:'original',requestId:job.id,ticket:job.key,stage:'github-update-base',status:'interrupted'} as WorkTime);
    const it: ITContext['it']=f.store.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring' as const,reports:[],recoveries:{},services:[]};
    const context:ITContext={store:f.store,state:f.store.state,engine:f.engine,it,actions:[],followUps:[],current:new Set(),now:new Date('2026-11-11T00:00:00Z'),services:[],retainedPartials:[],retainedCloseouts:new Set(),activationBudget:()=>undefined,coordinator:{} as any,health:{checkedAt:'',context:'',services:[]},nextAt:0,offices:{} as any,
        recover:(...args)=>recoverAttempt(context,...args)};
    const id=`stopped-base-update:${job.id}:original`;
    const tick=async()=>{context.current.clear();await recoverStoppedBaseUpdates(context);await reconcileRecoveryLedger(context);context.now=new Date(context.now.getTime()+600000);};
    return {...f,job,it,context,id,tick};
}
test('claims/holds admission uses the original worker ID and deduplicates the same live request without session probes',async()=>{
    const f=fixture();await f.tick();await f.tick();
    expect(f.store.state.coordination!.requests).toHaveLength(1);
    expect(f.store.state.coordination!.requests![0]).toMatchObject({action:'reconcile-base-update',head:'original',lane:'delivery'});
    expect(f.it.recoveries[f.id].attempts).toBe(1);expect(f.state.calls).toEqual([]);
});
test('three original readbacks exhaust one stable family, including previously consumed matching requests',async()=>{
    const f=fixture();
    for(const count of [1,2,3]){await f.tick();expect(f.it.recoveries[f.id].attempts).toBe(count);f.store.state.coordination!.requests!.at(-1)!.status='blocked';}
    await f.tick();expect(f.it.recoveries[f.id]).toMatchObject({attempts:3,status:'needs-human'});
    expect(f.store.state.coordination!.requests).toHaveLength(3);
    f.it.recoveries[f.id].status='resolved';await f.tick();expect(f.it.recoveries[f.id].attempts).toBe(3);
    expect(f.store.state.coordination!.requests).toHaveLength(3);
});
test.each(['paused','disappeared','uncertain-completion'])('%s does not resolve or reset a stopped original family',async kind=>{
    const f=fixture();await f.tick();f.store.state.coordination!.requests![0].status='blocked';
    if(kind==='paused')f.store.state.paused=true;
    if(kind==='disappeared')f.job.stage='lead-pr';
    if(kind==='uncertain-completion')f.job.stoppedBaseUpdate={originalWorkId:'original',phase:'lead',audit:{state:'completed'}} as any;
    await f.tick();expect(f.it.recoveries[f.id].status).not.toBe('resolved');expect(stoppedBaseUpdateUnresolved(f.store,f.id)).toBe(true);
    if(kind!=='uncertain-completion')expect(f.it.recoveries[f.id].attempts).toBe(1);
});
