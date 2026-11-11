import { afterEach, expect, test, vi } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { rootArtifact, artifact, digest } from '../../../../server/store/readback-evidence';
import { stoppedBaseReviewContext } from '../../../../server/delivery/recovery/stopped-base-review-context';
const facts=vi.hoisted(()=>({scope:'scope',provider:'provider',clear:true}));
vi.mock('../../../../server/delivery/recovery/stopped-base-disposition',()=>({stoppedBaseUpdateResolved:()=>facts.clear}));
vi.mock('../../../../server/delivery/recovery/implementation/continuation-evidence',()=>({continuationWorktree:()=>({identity:'retained-candidate'})}));
vi.mock('../../../../server/delivery/harness/guards',()=>({assertDeliveryMayMutate:()=>{}}));
vi.mock('../../../../server/delivery/repairs/delivery-repairs',async original=>({...await original<typeof import('../../../../server/delivery/repairs/delivery-repairs')>(),verifyRepairCandidate:async()=>{}}));
vi.mock('../../../../server/github/github-context',async original=>({...await original<typeof import('../../../../server/github/github-context')>(),deliveryInputSha256:()=>facts.scope}));
vi.mock('../../../../server/delivery/recovery/stopped-base-provider',()=>({readStoppedBaseProviderContext:async()=>({version:facts.provider,pr:{head:'b'.repeat(40)}})}));
afterEach(cleanupFakes);
function fixture(){
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr',status:'working'}),root=resolve(f.store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true});
    const nativePath=resolve(root,'original-native.jsonl');writeFileSync(nativePath,'retained original bytes');
    const native=artifact(f.store,nativePath),input={context:{originalCandidate:{identity:'retained-candidate'},nativeFile: rootArtifact(resolve(root,'..'),nativePath),scopeSha256:'scope',provider:{pr:{head:'b'.repeat(40)}}},originalArtifacts:[],rows:[]};
    const path=resolve(root,'input.json');writeFileSync(path,JSON.stringify(input));
    job.stoppedBaseUpdate={phase:'lead',originalWorkId:'original',nativePath,nativeSha256:native.sha256,input:{...artifact(f.store,path),inputSha256:digest(input)},providerVersion:'provider',preservedCandidate:{head:job.head,branch:job.branch,worktree:job.worktree}} as any;
    facts.scope='scope';facts.provider='provider';facts.clear=true;
    return {...f,job,nativePath,run:()=>stoppedBaseReviewContext(f.delivery,job)};
}
test('the positive disposition still requires unchanged real original bytes and provider context',async()=>{
    const f=fixture();expect((await f.run()).provider.version).toBe('provider');expect(f.state.calls).toEqual([]);
});
test.each(['native','scope','provider','disposition','effects'])('material %s drift blocks before handoff or cloning',async kind=>{
    const f=fixture();
    if(kind==='native')writeFileSync(f.nativePath,'changed');
    if(kind==='scope')facts.scope='changed';
    if(kind==='provider')facts.provider='changed';
    if(kind==='disposition')facts.clear=false;
    if(kind==='effects')f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('new-effect',`cms-field-vocabulary:delivery:${f.job.id}`,'verified',JSON.stringify({id:'new-effect'}));
    await expect(f.run()).rejects.toThrow();expect(f.state.calls).toEqual([]);
});

test('the handoff native hash remains required on every before-checkout freshness assertion', async () => {
    const f = fixture(), root = f.artifactRoot(f.job), nativePath = resolve(root, 'handoff-native.jsonl'), resultPath = resolve(root, 'handoff-result.json');
    writeFileSync(nativePath, 'Captured handoff native bytes'); writeFileSync(resultPath, '{}');
    f.job.stoppedBaseUpdate!.handoff = { head: 'b'.repeat(40), providerVersion: 'provider', workerId: 'handoff', resultPath,
        resultSha256: artifact(f.store, resultPath).sha256, executionCompletionSha256: 'a'.repeat(64),
        nativePath, nativeSha256: artifact(f.store, nativePath).sha256 };
    const current = await f.run();
    writeFileSync(nativePath, 'Changed handoff native bytes');
    expect(current.assertCurrent).toThrow('Stopped-base handoff artifacts changed');
    await expect(f.run()).rejects.toThrow('Stopped-base handoff artifacts changed');
    expect(f.state.calls).toEqual([]);
});
