import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../delivery/support/fake-github';
import { enqueueRequest, executeRequest } from '../../../server/scheduling/requests';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
const route=vi.hoisted(()=>({board:false,stopped:false,refuse:false,seen:[] as string[]}));
vi.mock('../../../server/delivery/recovery/board-preflight',async original=>({...await original<typeof import('../../../server/delivery/recovery/board-preflight')>(),reconcileBoardPreflight:async()=>{route.seen.push('board');return route.board;}}));
vi.mock('../../../server/delivery/recovery/stopped-base-update',async original=>({...await original<typeof import('../../../server/delivery/recovery/stopped-base-update')>(),reconcileStoppedBaseUpdate:async()=>{route.seen.push('stopped');if(route.refuse)throw new Error('Morgan: original evidence unavailable');return route.stopped;}}));
afterEach(()=>{vi.restoreAllMocks();cleanupFakes();});
test.each(['board','stopped','legacy','refused'])('base-update %s route preserves mutual exclusion and recognized refusal',async target=>{
    const f=fakeGitHub(),job=f.candidate({existingPR:true,pr:156,status:'interrupted',stage:'update-base'});
    route.board=target==='board';route.stopped=target==='stopped';route.refuse=target==='refused';route.seen=[];
    vi.spyOn(GitHubDelivery.prototype,'reconcileBaseUpdate').mockImplementation(async()=>{route.seen.push('legacy');});
    const request=enqueueRequest(f.store,'reconcile-base-update',job.key,'original-worker');
    await executeRequest(f.store,f.engine,{} as any,request);
    expect(route.seen).toEqual(target==='board'?['board']:target==='legacy'?['board','stopped','legacy']:['board','stopped']);
    expect(request.status).toBe(target==='refused'?'blocked':'completed');expect(f.state.calls).toEqual([]);
});
test.each(['','ordinary-review'])('ordinary review recovery for %s delegates after the stopped handoff',async head=>{
    const f=fakeGitHub(),job=f.candidate({existingPR:true,stage:'lead-pr',status:'blocked'});
    job.stoppedBaseUpdate={phase:'review',handoffStarted:{claimId:'handoff-claim'}} as any;
    const review=vi.spyOn(GitHubDelivery.prototype,'reconcileReview').mockResolvedValue();
    const run=vi.fn();f.engine.agents.run=run;
    const request=enqueueRequest(f.store,'reconcile-review',job.key,head);
    await executeRequest(f.store,f.engine,{} as any,request);
    expect(review).toHaveBeenCalledExactlyOnceWith(job.key,head);
    expect(request.status).toBe('completed');expect(run).not.toHaveBeenCalled();expect(f.state.calls).toEqual([]);
});
