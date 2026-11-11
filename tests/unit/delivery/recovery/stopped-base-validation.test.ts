import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { assertStoppedBaseApproach, stoppedBaseNextStage, assertStoppedBaseMergeReady } from '../../../../server/delivery/recovery/stopped-base-validation';
import { harnessValidationEligible } from '../../../../server/delivery/harness/validate-stage';
afterEach(cleanupFakes);
function fixture() {
    const f=fakeGitHub(), job=f.candidate({stage:'review',approach:{plan:'none',review:'focused',validation:'independent-checks',checks:['checks'],reason:'original recovery'}});
    job.stoppedBaseUpdate={phase:'review',preservedCandidate:{approach:{review:'full',validation:'browser'},repairCycle:{pendingFindingIds:['F1']}}} as any;
    return {...f,job};
}
test.each(['review','qa','stronger-review','stronger-qa'])('the %s gate cannot be dropped by a route change', change=>{
    const {job}=fixture(), next={...job.approach!,review:'full' as const,validation:'browser' as const};
    if(change==='review')next.review='none' as any;
    if(change==='qa')next.validation='developer-checks' as any;
    if(change==='stronger-review')next.review='focused' as any;
    if(change==='stronger-qa')next.validation='independent-checks' as any;
    expect(()=>assertStoppedBaseApproach(job,next)).toThrow('independent');
});
test('recovered source and QA require actual workers; the command-only harness shortcut stays unavailable',()=>{
    const f=fixture();f.job.stoppedBaseUpdate!.preservedCandidate!.approach=f.job.approach;
    f.job.steps=[{stage:'review',result:{outcome:'passed',commit:f.job.head} as any},{stage:'validate',result:{outcome:'passed',commit:f.job.head} as any}];
    expect(stoppedBaseNextStage(f.job)).toBe('review');
    expect(harnessValidationEligible(f.job)).toBe(false);
    expect(()=>assertStoppedBaseMergeReady(f.store,f.job,f.job.head)).toThrow('independent source');
});
test.each(['handoff','repair-cycle'])('an unchanged %s head with worker-bound review and QA proceeds without a redundant push',source=>{
    const {job}=fixture();job.stoppedBaseUpdate!.preservedCandidate!.approach=job.approach;
    if(source==='handoff')job.stoppedBaseUpdate!.handoff={head:job.head} as any;
    else job.repairCycle={publishedHead:job.head} as any;
    job.steps=[{stage:'review',workerId:'source',result:{outcome:'passed',commit:job.head} as any},{stage:'validate',workerId:'qa',result:{outcome:'passed',commit:job.head} as any}];
    expect(stoppedBaseNextStage(job)).toBe('prepare-pr');job.head='b'.repeat(40);expect(stoppedBaseNextStage(job)).toBe('review');
});
test('a newly reviewed and checked head still needs ordinary publication',()=>{
    const {job}=fixture();job.stoppedBaseUpdate!.preservedCandidate!.approach=job.approach;
    job.stoppedBaseUpdate!.handoff={head:'b'.repeat(40)} as any;
    job.steps=[{stage:'review',workerId:'source',result:{outcome:'passed',commit:job.head} as any},{stage:'validate',workerId:'qa',result:{outcome:'passed',commit:job.head} as any}];
    expect(stoppedBaseNextStage(job)).toBe('draft');
});
