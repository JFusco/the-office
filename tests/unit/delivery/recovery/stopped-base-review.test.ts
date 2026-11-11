import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { runStoppedBaseReview, reconcileStoppedBaseHandoff } from '../../../../server/delivery/recovery/stopped-base-review';
import * as disposition from '../../../../server/delivery/recovery/stopped-base-disposition';
import * as checkout from '../../../../server/delivery/recovery/stopped-base-checkout';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';
import { withAssignment } from '../../../../server/workers/assignment-context';
const context=vi.hoisted(()=>({head:'b'.repeat(40),version:'provider'}));
vi.mock('../../../../server/delivery/recovery/stopped-base-review-context',()=>({stoppedBaseReviewContext:async()=>({provider:{pr:{head:context.head,branch:'bot/repair'},version:context.version}})}));
afterEach(()=>{vi.restoreAllMocks();cleanupFakes();});
test('an ambiguous handoff dispatch is durable and cannot launch a second reader',async()=>{
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr',status:'working'});
    job.stoppedBaseUpdate={phase:'lead',preservedCandidate:{head:job.head,worktree:job.worktree,repairCycle:{pendingFindingIds:['F1']}}} as any;
    const claim=f.store.claimWork({projectId:f.store.project.id,kind:'delivery',id:job.id},'fixture','lead-pr','delivery')!;
    const run=vi.fn(async()=>{expect(job.stoppedBaseUpdate!.handoffStarted!.head).toBe(context.head);throw new Error('Lost native return');});
    f.engine.agents.run=run as any;
    await expect(withAssignment(claim,'delivery',()=>runStoppedBaseReview(f.delivery,job))).rejects.toThrow('Lost native return');
    await expect(withAssignment(claim,'delivery',()=>runStoppedBaseReview(f.delivery,job))).rejects.toThrow('single started handoff');
    expect(run).toHaveBeenCalledTimes(1);expect(job.head).not.toBe(context.head);expect(job.stage).toBe('lead-pr');
});
test('unrelated ordinary deliveries retain their existing stage path',async()=>{
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr'});expect(await runStoppedBaseReview(f.delivery,job)).toBe(false);
});

test.each(['','ordinary-review'])('a later ordinary readback for %s falls through without another reader or clone',async head=>{
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr',status:'blocked'});
    job.stoppedBaseUpdate={phase:'review',handoffStarted:{claimId:'handoff-claim'}} as any;
    f.store.state.workLog=[{id:'handoff',requestId:job.id,stage:'stopped-base-update-handoff',claimId:'handoff-claim'} as WorkTime];
    const run=vi.fn(),clone=vi.spyOn(checkout,'stoppedBaseCheckout');f.engine.agents.run=run;
    expect(await reconcileStoppedBaseHandoff(f.delivery,{action:'reconcile-review',key:job.key,head} as HarnessRequest)).toBe(false);
    expect(run).not.toHaveBeenCalled();expect(clone).not.toHaveBeenCalled();
});

test('the exact completed handoff resolves before the ordinary phase fallback',async()=>{
    const f=fakeGitHub(),job=f.candidate({stage:'review'});
    job.stoppedBaseUpdate={phase:'review',handoffStarted:{claimId:'handoff-claim'},handoff:{workerId:'handoff'}} as any;
    f.store.state.workLog=[{id:'handoff',requestId:job.id,stage:'stopped-base-update-handoff',claimId:'handoff-claim'} as WorkTime];
    vi.spyOn(disposition,'stoppedBaseHandoffResolved').mockImplementation((_store,request)=>request.head==='handoff');
    const run=vi.fn(),clone=vi.spyOn(checkout,'stoppedBaseCheckout');f.engine.agents.run=run;
    expect(await reconcileStoppedBaseHandoff(f.delivery,{action:'reconcile-review',key:job.key,head:'handoff'} as HarnessRequest)).toBe(true);
    expect(run).not.toHaveBeenCalled();expect(clone).not.toHaveBeenCalled();
});

test('an unfinished handoff with a conflicting original claim stays blocked without redispatch',async()=>{
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr',status:'blocked'});
    job.stoppedBaseUpdate={phase:'lead',handoffStarted:{claimId:'handoff-claim'}} as any;
    f.store.state.workLog=[{id:'handoff',requestId:job.id,stage:'stopped-base-update-handoff',claimId:'foreign-claim'} as WorkTime];
    const run=vi.fn();f.engine.agents.run=run;
    await expect(reconcileStoppedBaseHandoff(f.delivery,{action:'reconcile-review',key:job.key,head:'handoff'} as HarnessRequest)).rejects.toThrow('Exact original');
    expect(run).not.toHaveBeenCalled();
});
