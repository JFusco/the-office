import { afterEach, expect, test } from 'vitest';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../delivery/support/fake-github';
import { recoverStoppedBaseUpdates, stoppedBaseUpdateUnresolved } from '../../../server/it/stopped-base-update-recovery';
import { recoverAttempt } from '../../../server/it/recovery-attempt';
import { reconcileRecoveryLedger } from '../../../server/it/recovery-ledger';
import { saveStoppedBaseArtifact } from '../../../server/delivery/recovery/stopped-base-disposition';
import { artifact, digest } from '../../../server/store/readback-evidence';
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

test.each(['archived', 'deleted'])('an %s native handoff rollout does not reopen the bound IT family', change => {
    const f = fixture(), { store, job } = f, at = store.clock.now().toISOString(), root = f.artifactRoot(job);
    const preserved = { head: job.head, branch: job.branch, worktree: job.worktree };
    const audit = { id: 'audit-reader', requestId: job.id, claimId: 'audit-claim', sessionId: 'audit-session', role: 'lead', provider: 'codex',
        stage: 'stopped-base-update-audit', status: 'blocked', executionStatus: 'completed', endedAt: at } as WorkTime;
    const handoff = { ...audit, id: 'handoff-reader', claimId: 'handoff-claim', sessionId: 'handoff-session', stage: 'stopped-base-update-handoff', status: 'completed' } as WorkTime;
    store.state.workLog!.push(audit, handoff);
    const input = { originalWorkId: 'original', nativeSha256: 'a'.repeat(64), nativeRecordCount: 3, originalArtifacts: [],
        rows: [{ id: 'read', kind: 'input', sha256: 'b'.repeat(64), redacted: false, redactionBlocksSemantics: false, historicalVerified: false, view: 'synthetic read' }] };
    const auditResult = { outcome: 'passed', originalWorkId: 'original', nativeSha256: input.nativeSha256, noRepositorySourceOrPublicationMutation: true,
        summary: 'Synthetic positive effects audit', rows: [{ id: 'read', sha256: input.rows[0].sha256, verified: true, semanticsComplete: true,
            redactionSafe: true, classification: 'read-only', continuationUnaffected: true, evidence: ['Synthetic evidence'], uncertainty: '' }] };
    const handoffResult = { outcome: 'passed', prerequisites: [], approach: null, summary: 'Synthetic read-only handoff', commit: job.head,
        worktree: preserved.worktree, branch: job.branch, prId: job.pr, evidence: [{ id: 'review', kind: 'review', summary: 'Synthetic full diff review',
            path: resolve(root, 'review.md'), commit: job.head, environment: 'fixture', url: '', observedAt: at }],
        findings: [], receipts: [], previewUrl: '', qaRunDir: '', paidRuns: 0, blocker: '' };
    for (const [work, result] of [[audit, auditResult], [handoff, handoffResult]] as const) {
        const dir = resolve(store.dataRoot, 'sessions', work.id), saved = { session: work.sessionId, result }; mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'result.json'), JSON.stringify(saved));
        writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: work.id, session: work.sessionId, provider: work.provider, resultSha256: digest(saved) }));
    }
    const auditFile = artifact(store, resolve(store.dataRoot, 'sessions', audit.id, 'result.json'));
    const handoffFile = artifact(store, resolve(store.dataRoot, 'sessions', handoff.id, 'result.json'));
    const inputFile = saveStoppedBaseArtifact(store, job, 'input.json', input);
    const disposition = saveStoppedBaseArtifact(store, job, 'disposition.json', { jobId: job.id, originalWorkId: 'original', contextSha256: 'context',
        inputSha256: digest(input), auditWorkerId: audit.id, resultSha256: auditFile.sha256, candidateSha256: digest(preserved) });
    const nativePath = resolve(root, 'handoff-native.jsonl'); writeFileSync(nativePath, 'Synthetic handoff rollout');
    const checkout = { id: 'prospective', head: job.head, branch: job.branch, worktree: job.worktree };
    const binding = saveStoppedBaseArtifact(store, job, 'candidate-binding.json', { originalWorkId: 'original', handoffWorkerId: handoff.id,
        handoffResultSha256: handoffFile.sha256, checkoutSha256: digest(checkout) });
    job.stoppedBaseUpdate = { originalWorkId: 'original', originalSessionId: 'original-session', originalClaimId: 'original-claim', nativePath: '/retained-original',
        nativeSha256: input.nativeSha256, contextSha256: 'context', providerVersion: 'provider', phase: 'review', preservedCandidate: preserved,
        input: { path: inputFile.path, sha256: inputFile.sha256, inputSha256: digest(input) }, disposition: { path: disposition.path, sha256: disposition.sha256, at },
        audit: { key: 'reservation', state: 'completed', requestId: 'audit-request', claimId: audit.claimId!, workerId: audit.id, reservedAt: at,
            completion: { sessionId: audit.sessionId, resultPath: auditFile.path, resultSha256: auditFile.sha256,
                executionCompletionSha256: artifact(store, resolve(store.dataRoot, 'sessions', audit.id, 'execution-completion.json')).sha256,
                nativePath: '/archived-audit', nativeSha256: 'c'.repeat(64), completedAt: at } },
        handoffStarted: { claimId: handoff.claimId!, head: job.head, providerVersion: 'provider', at },
        handoff: { head: job.head, providerVersion: 'provider', workerId: handoff.id, resultPath: handoffFile.path, resultSha256: handoffFile.sha256,
            executionCompletionSha256: artifact(store, resolve(store.dataRoot, 'sessions', handoff.id, 'execution-completion.json')).sha256,
            nativePath, nativeSha256: artifact(store, nativePath).sha256 }, checkout, candidateBinding: { path: binding.path, sha256: binding.sha256 } };
    const id = `stopped-base-handoff:${job.id}:${handoff.id}`;
    expect(stoppedBaseUpdateUnresolved(store, id)).toBe(false);
    if (change === 'archived') renameSync(nativePath, nativePath + '.retained'); else rmSync(nativePath);
    expect(stoppedBaseUpdateUnresolved(store, id)).toBe(false); expect(f.state.calls).toEqual([]);
});
