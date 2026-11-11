import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { runStoppedBaseReview, reconcileStoppedBaseHandoff } from '../../../../server/delivery/recovery/stopped-base-review';
import * as disposition from '../../../../server/delivery/recovery/stopped-base-disposition';
import * as checkout from '../../../../server/delivery/recovery/stopped-base-checkout';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { artifact, digest } from '../../../../server/store/readback-evidence';
import { workerProfile } from '../../../../server/workers/worker-profiles';
import * as continuation from '../../../../server/delivery/recovery/implementation/continuation-evidence';
import * as processTools from '../../../../server/workers/process';
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

test('handoff capture retains the actual owned execution-completion digest without redispatch', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working' }), at = f.store.clock.now().toISOString();
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'fixture', 'lead-pr', 'delivery')!;
    const worker = { id: 'handoff', requestId: job.id, ticket: job.key, claimId: claim.id, sessionId: 'native-handoff', lane: 'delivery',
        role: 'lead', provider: 'codex', stage: 'stopped-base-update-handoff', status: 'completed', executionStatus: 'completed',
        processId: 2147483646, startedAt: at, endedAt: at } as WorkTime;
    f.store.state.workLog = [worker];
    job.stoppedBaseUpdate = { phase: 'lead', preservedCandidate: { head: job.head, worktree: job.worktree },
        handoffStarted: { claimId: claim.id, head: context.head, providerVersion: context.version, at } } as any;
    const result = { outcome: 'passed', prerequisites: [], approach: null, summary: 'Synthetic read-only handoff', commit: context.head,
        evidence: [{ id: 'review', kind: 'review', summary: 'Synthetic full diff review', path: resolve(f.artifactRoot(job), 'review.md'),
            commit: context.head, environment: 'fixture', url: '', observedAt: at }], findings: [], receipts: [], previewUrl: '',
        worktree: job.worktree, branch: 'bot/repair', prId: job.pr, qaRunDir: '', paidRuns: 0, blocker: '' };
    const dir = resolve(f.store.dataRoot, 'sessions', worker.id); mkdirSync(dir, { recursive: true });
    const profile = workerProfile(worker.stage, true), saved = { session: worker.sessionId, result };
    const records = { 'result.json': saved, 'execution-completion.json': { workerId: worker.id, session: worker.sessionId,
        provider: worker.provider, resultSha256: digest(saved) },
        'provider.json': { project: f.store.project.id, repository: f.store.project.repository, role: worker.role, provider: worker.provider, readOnly: true },
        'assignment.json': { id: worker.id, claimId: claim.id, work: claim.work, stage: worker.stage, role: worker.role, lane: 'delivery',
            profile: profile.name, scope: { repository: f.store.project.repository, worktree: job.worktree, artifacts: dir } },
        'assignment-identity.json': { attemptId: worker.id, requestId: job.id, projectId: f.store.project.id,
            repository: f.store.project.repository, role: worker.role, threadId: worker.sessionId }, 'capabilities.json': profile };
    for (const [name, value] of Object.entries(records)) writeFileSync(resolve(dir, name), JSON.stringify(value));
    const nativeRoot = resolve(f.store.dataRoot, 'synthetic-native'), day = at.slice(0, 10).replaceAll('-', '/');
    mkdirSync(resolve(nativeRoot, day), { recursive: true });
    const nativePath = resolve(nativeRoot, day, `rollout-${worker.sessionId}.jsonl`);
    writeFileSync(nativePath, [{ type: 'session_meta', payload: { id: worker.sessionId, cwd: job.worktree } },
        { type: 'event_msg', payload: { type: 'task_complete', last_agent_message: JSON.stringify(result) } }].map(record => JSON.stringify(record)).join('\n'));
    const nativeReview = continuation.continuationNativeReview;
    vi.spyOn(continuation, 'continuationNativeReview').mockImplementation((store, work, response) => nativeReview(store, work, response, nativeRoot));
    vi.spyOn(processTools, 'processGroupAlive').mockReturnValue(false);
    const clone = vi.spyOn(checkout, 'stoppedBaseCheckout').mockResolvedValue(undefined), run = vi.fn(); f.engine.agents.run = run;
    expect(await runStoppedBaseReview(f.delivery, job)).toBe(true);
    expect(job.stoppedBaseUpdate!.handoff).toMatchObject({ workerId: worker.id,
        executionCompletionSha256: artifact(f.store, resolve(dir, 'execution-completion.json')).sha256,
        resultSha256: artifact(f.store, resolve(dir, 'result.json')).sha256, nativePath });
    expect(run).not.toHaveBeenCalled(); expect(clone).toHaveBeenCalledTimes(1); expect(f.state.calls).toEqual([]);
});
