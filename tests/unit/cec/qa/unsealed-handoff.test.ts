import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { ticket, decision } from '../parking/fixtures';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { continueUnsealedQA } from '../../../../server/cec/qa/continue-unsealed-qa';
import { requestDelivery } from '../../../../server/cec/pilot-delivery';
import { qaPlanEvidenceGap } from '../../../../server/cec/qa/run-directory';
import { prepareCECQA } from '../../../../server/qa/prepare-assignment';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
const clear = async () => ({complete:true,fresh:true,ownership:{status:'clear'}});
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(),'unsealed-qa-'));
    let now = Date.parse('2026-11-15T12:00:00Z');
    const store = new Store(':memory:',projectById('cec'),root,{now:()=>new Date(now),monotonic:()=>now});
    const t = ticket('QA'); Object.assign(t,{stage:'retest',attempt:5,activity:'blocked',worktree:'/synthetic/candidate',repairAttempts:{F1:2}});
    t.approach = {plan:'reviewed',review:'focused',validation:'browser',reason:'Feature acceptance',checks:['Feedback preserves authored prose']};
    const run = resolve(root,'runs',t.runId),qa=resolve(run,'.qa/runs/qa-retest-5'); mkdirSync(qa,{recursive:true});
    const result = decision('',{summary:'Setup unavailable',blocker:'Needs owned signed-in browser',commit:t.commit,worktree:t.worktree,branch:t.branch,qaRunDir:qa,paidRuns:0});
    t.results.retest=result;store.state.tickets=[t];
    const original = store.claimWork({projectId:'cec',kind:'delivery',id:`ticket:${t.key}`},'old','retest')!;store.finishClaim(original.id,'completed');
    const work:any={id:'12345678-1234-4234-9234-123456789abc',ticket:t.key,role:'qa',stage:'retest',status:'blocked',executionStatus:'completed',claimId:original.id,
        processId:23456,sessionId:'old-session',provider:'codex',endedAt:new Date(now).toISOString()};store.state.workLog=[work];now+=60000;
    const dir=resolve(root,'sessions',work.id);mkdirSync(dir,{recursive:true});
    const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v));
    write(resolve(qa,'run.json'),{kind:'qa-run',run_id:'qa-retest-5'});write(resolve(qa,'intake.json'),{kind:'intake',run_id:'qa-retest-5'});
    write(resolve(qa,'report.json'),{kind:'qa-run-report',run_id:'qa-retest-5',status:'pending'});
    write(resolve(dir,'result.json'),{session:work.sessionId,provider:work.provider,result:structuredClone(result)});
    write(resolve(dir,'execution-completion.json'),{workerId:work.id,provider:work.provider,session:work.sessionId,resultSha256:createHash('sha256').update(readFileSync(resolve(dir,'result.json'))).digest('hex')});
    write(resolve(dir,'assignment.json'),{id:work.id,claimId:work.claimId,lane:'delivery',work:original.work,stage:'retest',role:'qa',profile:'qa-native',scope:{repository:store.project.repository,worktree:t.worktree,artifacts:dir}});
    write(resolve(dir,'capabilities.json'),{name:'qa-native',cutover:'native',readOnly:false});
    const input={workerId:work.id,commit:t.commit,acknowledgeIncompleteHistory:true as const,setupNote:'Root offers its isolated preview/browser; reverify ownership and Joe before feature actions.'};
    const request=requestDelivery.call({store} as any,t.key,'resume-ticket',undefined,{qaHandoff:input});
    request.status='working';const claim=store.claimWork({projectId:'cec',kind:'delivery',id:request.id},'scheduler','resume-ticket')!;
    const execute=vi.fn(async (_p:string,a:string[])=>a[0]==='rev-parse'?t.commit:'');
    const consume=(ownership=clear,alive=()=>false)=>withAssignment(claim,'delivery',()=>continueUnsealedQA(store,request,root,ownership,execute as any,alive));
    return{root,store,t,run,qa,dir,result,work,input,request,claim,write,execute,consume,close(){store.close();rmSync(root,{recursive:true,force:true});}};
}
test('explicit handoff retains incomplete evidence and counters, consumes once and dispatches Office QA without the old SDK',async()=>{
    const f=fixture();try{
        const old=readFileSync(resolve(f.qa,'report.json')),original=structuredClone(f.result);
        expect((requestDelivery.call({store:f.store} as any,f.t.key,'resume-ticket',undefined,{qaHandoff:f.input})).id).toBe(f.request.id);
        await f.consume();expect(f.t.attempt).toBe(5);expect(f.t.repairAttempts).toEqual({F1:2});expect(f.t.results.retest).toEqual(original);
        expect(f.t.officeQAHandoffs![0].originalResult).toEqual(original);expect(f.request.officeQAHandoff!.consumedAt).toBeTruthy();
        expect(readFileSync(resolve(f.qa,'report.json'))).toEqual(old);expect(f.execute.mock.calls.every(c=>c[0]==='git')).toBe(true);
        const next=prepareCECQA(f.store,f.t,'retest',f.run);expect(next.officeQA).toBe(true);expect(next.directory).not.toBe(f.qa);
        expect(qaPlanEvidenceGap(f.t,'retest',original,f.run)).toContain('Fresh independent');
        const prompt=cecPrompt(f.store,f.t,'retest','qa',f.run,next.directory);
        expect(prompt).toContain('ONE independent QA agent');expect(prompt).toContain(f.input.setupNote);
        expect(prompt).not.toContain('Use $qa-team');expect(prompt).not.toContain('ONE CORRECTED CEC-154 PLAN');
        await expect(f.consume()).rejects.toThrow();expect(f.t.officeQAHandoffs).toHaveLength(1);
        f.request.status='blocked';expect(requestDelivery.call({store:f.store} as any,f.t.key,'resume-ticket',undefined,{qaHandoff:f.input}).status).toBe('blocked');
    }finally{f.close();}
});
test.each(['sealed-plan','dangling-plan','symlinked-call-directory','pending-call','live-group','unknown-usage','uncertain-receipt','changed-native-result','forged-completion','wrong-assignment','wrong-worker',
    'active-worker','worker-failed','changed-head','dirty-source','old-request','competing-request','unknown-ownership','artifact-race','paused','no-scheduler'])('refuses %s without changing history',async reason=>{
    const f=fixture();try{
        if(reason==='sealed-plan')f.write(resolve(f.qa,'plan.json'),{});
        if(reason==='dangling-plan')symlinkSync(resolve(f.qa,'missing-plan'),resolve(f.qa,'plan.json'));
        if(reason==='symlinked-call-directory')symlinkSync(resolve(f.qa,'missing-calls'),resolve(f.qa,'calls'));
        if(reason==='pending-call'){mkdirSync(resolve(f.qa,'orchestration'));f.write(resolve(f.qa,'orchestration/state.json'),{open:true});}
        if(reason==='unknown-usage')f.result.paidRuns=null;
        if(reason==='uncertain-receipt')f.result.receipts.push({id:'unknown',action:'write',target:'',verified:false,uncertain:true,detail:''});
        if(reason==='changed-native-result')f.write(resolve(f.dir,'result.json'),{});
        if(reason==='forged-completion')f.write(resolve(f.dir,'execution-completion.json'),{});
        if(reason==='wrong-assignment')f.write(resolve(f.dir,'assignment.json'),{});
        if(reason==='wrong-worker')f.request.officeQAHandoff!.workerId='22345678-1234-4234-9234-123456789abc';
        if(reason==='active-worker')f.work.status='running';
        if(reason==='worker-failed')f.work.failure={category:'uncertain-effect'};
        if(reason==='changed-head')f.execute.mockImplementation(async()=> 'b'.repeat(40));
        if(reason==='dirty-source')f.execute.mockImplementation(async(_p,a)=>a[0]==='rev-parse'?f.t.commit:' M source.ts');
        if(reason==='old-request')f.request.requestedAt=f.work.endedAt;
        if(reason==='competing-request')f.store.state.deliveryQueue!.push({...f.request,id:'competitor'});
        if(reason==='paused')f.store.state.paused=true;
        if(reason==='artifact-race')f.execute.mockImplementation(async(_p,a)=>{f.write(resolve(f.qa,'report.json'),{});return a[0]==='rev-parse'?f.t.commit:'';});
        const before=structuredClone(f.t);
        const action=reason==='no-scheduler'?continueUnsealedQA(f.store,f.request,f.root,clear,f.execute as any,()=>false):
            f.consume(reason==='unknown-ownership'?async()=>({complete:false,fresh:false,ownership:{status:'unknown'}}):clear,()=>reason==='live-group');
        await expect(action).rejects.toThrow();expect(f.t).toEqual(before);expect(f.request.officeQAHandoff!.consumedAt).toBeUndefined();
    }finally{f.close();}
});
test('an ordinary resume keeps the legacy protocol and an explicit handoff cannot replace a competing decision',()=>{
    const f=fixture();try{
        expect(f.t.qaProtocol).toBeUndefined();
        expect(()=>requestDelivery.call({store:f.store} as any,f.t.key,'resume-ticket',undefined,{qaHandoff:{...f.input,setupNote:'changed'}})).toThrow('another decision');
        expect(()=>requestDelivery.call({store:f.store} as any,f.t.key,'start-pilot',undefined,{qaHandoff:f.input})).toThrow('explicit resume');
        expect(()=>requestDelivery.call({store:f.store} as any,f.t.key,'resume-ticket',undefined,{qaHandoff:{...f.input,acknowledgeIncompleteHistory:false}})).toThrow();
    }finally{f.close();}
});
