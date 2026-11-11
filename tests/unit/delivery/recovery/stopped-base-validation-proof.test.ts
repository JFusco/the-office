import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { rootArtifact } from '../../../../server/store/readback-evidence';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { stoppedBaseStageProof, assertStoppedBaseValidation, assertStoppedBaseMergeReady } from '../../../../server/delivery/recovery/stopped-base-validation';
import type { StageResult, WorkTime, WorkApproach } from '../../../../src/shared';
const facts=vi.hoisted(()=>({results:{} as Record<string,StageResult>,nativeRoot:'',nativePaths:{} as Record<string,string>}));
vi.mock('../../../../server/delivery/recovery/implementation/continuation-evidence',()=>({
    continuationWorkerProof:(_store:unknown,_job:unknown,worker:WorkTime)=>({result:facts.results[worker.id]}),
    continuationNativeReview:(_store:unknown,worker:WorkTime)=>({root:facts.nativeRoot,file:rootArtifact(facts.nativeRoot,facts.nativePaths[worker.id])}),
}));
afterEach(cleanupFakes);
function fixture(){
    const f=fakeGitHub(),job=f.candidate({stage:'validate',status:'working'}),root=resolve(f.store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true});
    const checks=resolve(root,'qa-checks.log');writeFileSync(checks,'Actual synthetic QA checks');
    const claim=f.store.claimWork({projectId:f.store.project.id,kind:'delivery',id:job.id},'fixture','validate','delivery')!;
    const work={id:'qa',requestId:job.id,stage:'github-validate',role:'qa',claimId:claim.id,status:'completed'} as WorkTime;(f.store.state.workLog??=[]).push(work);
    const result={outcome:'passed',commit:job.head,branch:job.branch,worktree:job.worktree,evidence:[{id:'checks',kind:'checks',commit:job.head,path:checks}],findings:[{id:'F1',status:'verified'}],receipts:[],approach:null} as unknown as StageResult;
    const commands=['node --version','env -u NPM_CONFIG_WORKSPACE_DIR pnpm run test:packed','npm pack --dry-run --ignore-scripts'];
    const records=commands.flatMap((cmd,i)=>[{type:'response_item',payload:{type:'function_call',name:'exec_command',call_id:String(i),arguments:JSON.stringify({cmd,workdir:job.worktree})}},{type:'response_item',payload:{type:'function_call_output',call_id:String(i),output:JSON.stringify({exit_code:0,output:i?'Checks passed':'v24.14.0'})}}]);
    facts.nativeRoot=root;facts.nativePaths={qa:resolve(root,'native.jsonl')};writeFileSync(facts.nativePaths.qa,records.map(r=>JSON.stringify(r)).join('\n'));facts.results={qa:result};
    job.stoppedBaseUpdate={phase:'review',preservedCandidate:{repairCycle:{pendingFindingIds:['F1']}}} as any;
    return {...f,job,work,claim,result,checks,run:()=>withAssignment(claim,'delivery',()=>stoppedBaseStageProof(f.store,job,result,new Set()))};
}
test('the independent QA acceptance binds actual native commands and owned output hashes for later merge checks',()=>{
    const f=fixture();expect(f.run()?.workerId).toBe('qa');
    expect(()=>assertStoppedBaseValidation(f.store,f.job,f.result,'qa')).not.toThrow();
    writeFileSync(f.checks,'Different evidence');expect(()=>assertStoppedBaseValidation(f.store,f.job,f.result,'qa')).toThrow('artifact changed');
});
test.each(['developer','missing-finding','stale-head'])('a %s result cannot become accepted QA',kind=>{
    const f=fixture();if(kind==='developer')f.work.role='developer';if(kind==='missing-finding')f.result.findings=[];if(kind==='stale-head')f.result.commit='c'.repeat(40);
    expect(f.run).toThrow();expect(f.job.stoppedBaseUpdate!.acceptance).toBeUndefined();
});

function reviewed(mode: WorkApproach['review'], returned: WorkApproach['review'] | null = null) {
    const f=fixture(); f.run(); f.store.finishClaim(f.claim.id,'completed');
    f.job.stage='review'; f.job.approach={plan:'none',review:mode,validation:'independent-checks',checks:['test:packed'],reason:'Retained independent gates'};
    const claim=f.store.claimWork({projectId:f.store.project.id,kind:'delivery',id:f.job.id},'fixture','review','delivery')!;
    const source={id:'source',requestId:f.job.id,stage:'github-review',role:'lead',claimId:claim.id,status:'completed'} as WorkTime;
    f.store.state.workLog!.push(source);
    const path=resolve(facts.nativeRoot,'source-review.log');writeFileSync(path,'Synthetic independent source assessment');
    const result={...structuredClone(f.result),summary:'Source review passed',evidence:[{...f.result.evidence[0],id:'source',kind:'review',path}],
        approach:returned ? {...f.job.approach,review:returned} : null} as StageResult;
    facts.results.source=structuredClone(result);facts.nativePaths.source=resolve(facts.nativeRoot,'source-native.jsonl');
    writeFileSync(facts.nativePaths.source,JSON.stringify({terminal:result}));
    const proof=withAssignment(claim,'delivery',()=>stoppedBaseStageProof(f.store,f.job,result,new Set([f.work.id])))!;
    f.job.steps=[{stage:'review',...proof,result:{...result,approach:result.approach??f.job.approach}},
        {stage:'validate',workerId:f.work.id,result:f.result}];
    return {...f,sourceResult:result,merge:()=>assertStoppedBaseMergeReady(f.store,f.job,f.job.head)};
}

test('a full source review returning null keeps its native response and passes merge gates with independent QA',()=>{
    const f=reviewed('full');
    expect(f.job.stoppedBaseUpdate!.acceptance!.review!.reviewMode).toBe('full');
    expect(facts.results.source.approach).toBeNull();expect(f.sourceResult.approach).toBeNull();
    expect(f.merge).not.toThrow();
});

test.each([null,'focused'] as const)('a focused review returning %s cannot later acquire full status',returned=>{
    const f=reviewed('focused',returned);f.job.approach!.review='full';
    expect(f.job.stoppedBaseUpdate!.acceptance!.review!.reviewMode).toBe('focused');
    expect(f.merge).toThrow('Saved source review changed');
});

test.each(['result','native-file'])('altering the bound source %s still blocks merge',kind=>{
    const f=reviewed('full');
    if(kind==='result')facts.results.source.summary='Changed native response';
    else writeFileSync(facts.nativePaths.source,'Changed native bytes');
    expect(f.merge).toThrow();
});
