import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { digest } from '../../../../server/store/readback-evidence';
import { ctoReplacementResolution } from '../../../../server/it/investigations/cto-replacement-resolution';
import { implementationReplacementResolution } from '../../../../server/it/investigations/implementation-replacement-resolution';
import { investigationResolution } from '../../../../server/it/investigations/ledger';
const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
function base(){
    const root=mkdtempSync(resolve(tmpdir(),'bound-replacement-')),store=new Store(':memory:',projectById('cec'),root);
    const write=(p:string,v:unknown)=>{mkdirSync(resolve(p,'..'),{recursive:true});writeFileSync(p,JSON.stringify(v));};
    const native=(worker:any,result:any,work:any)=>{
        const dir=resolve(root,'sessions',worker.id);write(resolve(dir,'result.json'),{session:worker.sessionId,provider:worker.provider,result});
        write(resolve(dir,'execution-completion.json'),{workerId:worker.id,provider:worker.provider,session:worker.sessionId,resultSha256:hash(resolve(dir,'result.json'))});
        write(resolve(dir,'assignment.json'),{id:worker.id,claimId:worker.claimId,work,role:worker.role,stage:worker.stage,scope:{worktree:result.worktree}});
    };
    return{root,store,write,native,close(){store.close();rmSync(root,{recursive:true,force:true});}};
}
function cto(){
    const f=base(),source:any={id:'original',requestId:'original',from:'human',to:'cto',body:'Synthetic goal update',status:'failed',error:'Original pre-turn rejection',receipts:[]};
    const old:any={id:'old-cto',requestId:source.id,role:'cto',stage:'conversation',status:'failed'};
    const dir=resolve(f.root,'sessions',old.id),artifacts=['assignment.json','capabilities.json','error.json'].map(name=>{const path=resolve(dir,name);f.write(path,{original:true,name});return{path,sha256:hash(path)};});
    const request:any={...source,id:'cto-input-recovery:original',requestId:'cto-input-recovery:original',status:'answered',inputRecovery:{originalMessageId:source.id,workerId:old.id,originalSha256:digest(source),artifacts}};
    const worker:any={id:'new-cto',requestId:request.id,role:'cto',stage:'conversation',status:'completed',executionStatus:'completed',endedAt:'2026-11-15T12:00:00Z',provider:'codex',sessionId:'new-session',claimId:'new-claim'};
    const reply:any={...request,id:'reply',from:'cto',sessionId:worker.sessionId,body:'Synthetic completed reply',error:'',receipts:[]};
    f.native(worker,{reply:reply.body},{projectId:'cec',kind:'conversation',id:request.id});
    f.store.state.messages=[source,request,reply];f.store.state.workLog=[old,worker];
    const entry:any={id:'case',source:{kind:'worker',id:old.id,requestId:source.id,ticket:'',failureKind:'other',workerIds:[old.id]},status:'blocked',attempts:1};
    return{...f,source,old,request,reply,worker,entry};
}
test('the real inherited-reply shape closes the exact CTO warning as superseded, preserving the failed original',()=>{
    const f=cto();try{const original=structuredClone(f.source),old=structuredClone(f.old);
        expect(ctoReplacementResolution(f.store,f.entry)).toEqual({kind:'superseded',sourceId:f.worker.id,receipt:`sessions/${f.worker.id}/execution-completion.json`});
        expect(investigationResolution(f.store,f.entry)?.kind).toBe('superseded');expect(f.source).toEqual(original);expect(f.old).toEqual(old);expect(f.entry.attempts).toBe(1);
    }finally{f.close();}
});
test.each(['changed-original','wrong-worker','duplicate-request','unanswered','unknown-native-output','wrong-assignment','wrong-session','uncertain-receipt','changed-old-artifact'])('does not settle a CTO warning from %s',reason=>{
    const f=cto();try{
        if(reason==='changed-original')f.source.body+=' changed';if(reason==='wrong-worker')f.request.inputRecovery.workerId='other';
        if(reason==='duplicate-request')f.store.state.messages.push({...f.request,id:'duplicate',requestId:'duplicate'});
        if(reason==='unanswered')f.request.status='working';if(reason==='unknown-native-output')rmSync(resolve(f.root,'sessions',f.worker.id,'execution-completion.json'));
        if(reason==='wrong-assignment')f.write(resolve(f.root,'sessions',f.worker.id,'assignment.json'),{});if(reason==='wrong-session')f.reply.sessionId='other';
        if(reason==='uncertain-receipt')f.reply.receipts.push({verified:false,uncertain:true});
        if(reason==='changed-old-artifact')f.write(f.request.inputRecovery.artifacts[0].path,{});
        expect(ctoReplacementResolution(f.store,f.entry)).toBeUndefined();expect(f.source.status).toBe('failed');
    }finally{f.close();}
});
function implementation(){
    const f=base(),requestId='12345678-1234-4234-9234-123456789abc',originalId='old-writer',key='CEC-900',runId='cec-900-original-run';
    const original:any={id:originalId,requestId:'',ticket:key,stage:'implement',role:'developer',status:'failed',failure:{category:'uncertain-effect'}};
    const result:any={outcome:'passed',commit:'b'.repeat(40),worktree:'/synthetic/approved-copy',branch:'codex/approved-copy',receipts:[]};
    const worker:any={id:'new-writer',originalId,requestId,ticket:key,stage:'implement',role:'developer',status:'completed',executionStatus:'completed',provider:'codex',sessionId:'new-source',claimId:'copy-claim',endedAt:'2026-11-15T12:00:00Z'};
    const artifacts=['assignment.json','provider.json','error.json','process-lifecycle.json','capabilities.json'].map(name=>{
        const path=resolve(f.root,'sessions',originalId,name);f.write(path,{original:true,name});return{path,sha256:hash(path)};
    });
    const proof={original:{workerId:originalId,runId,originalDigest:'d'.repeat(64),patchSha256:'e'.repeat(64)},originalWorker:structuredClone(original),artifacts,worktree:result.worktree,branch:result.branch};
    const proofPath=resolve(f.root,'runs',runId,'implementation-continuations',requestId,'source-intent.json');f.write(proofPath,proof);
    const binding:any={requestId,originalWorkerId:originalId,originalDigest:proof.original.originalDigest,patchSha256:proof.original.patchSha256,proofPath,proofSha256:hash(proofPath),copyEffectId:'copy-effect'};
    const ticket:any={key,runId,implementationContinuation:binding,results:{implement:structuredClone(result)}};f.store.state.tickets=[ticket];
    const request:any={id:requestId,key,action:'continue-saved-implementation',status:'completed',implementationContinuation:{consumedAt:'2026-11-15T11:00:00Z',acknowledgeUncertainHistory:true,proof:proof.original}};f.store.state.deliveryQueue=[request];
    const effect:any={id:binding.copyEffectId,status:'verified',operation:'cec-copy-preserved-implementation',target:key,work:{projectId:'cec',kind:'delivery',id:`ticket:${key}`},authorization:requestId,attemptId:requestId,expectedState:{worktree:proof.worktree,branch:proof.branch}};f.store.putEffect(effect);
    f.store.state.workLog=[original,worker];f.native(worker,result,{projectId:'cec',kind:'delivery',id:`ticket:${key}`});
    const entry:any={id:'case',source:{kind:'worker',id:originalId,requestId:'',ticket:key,failureKind:'uncertain-effect',workerIds:[originalId]},status:'queued',attempts:0};
    return{...f,original,worker,result,proof,binding,ticket,request,effect,entry};
}
test('an approved copy and accepted native replacement supersede only that original writer warning',()=>{
    const f=implementation();try{const old=structuredClone(f.original);
        expect(implementationReplacementResolution(f.store,f.entry)).toMatchObject({kind:'superseded',sourceId:f.worker.id});
        expect(investigationResolution(f.store,f.entry)?.kind).toBe('superseded');
        expect(f.original).toEqual(old);expect(f.entry.attempts).toBe(0);expect(f.ticket.results.implement.commit).toBe(f.result.commit);
    }finally{f.close();}
});
test.each(['unapproved','different-run','different-origin','uncertain-copy','different-copy-scope','failed-replacement','unaccepted-head','changed-proof','wrong-assignment','missing-completion','running','changed-original','changed-original-artifact'])('retains writer uncertainty for %s',reason=>{
    const f=implementation();try{
        if(reason==='unapproved')delete f.request.implementationContinuation.consumedAt;
        if(reason==='different-run')f.request.implementationContinuation.proof.runId='another';if(reason==='different-origin')f.binding.originalWorkerId='another';
        if(reason==='uncertain-copy')f.effect.status='uncertain';if(reason==='different-copy-scope')f.effect.expectedState.worktree='/other';f.store.putEffect(f.effect);
        if(reason==='failed-replacement'){f.result.outcome='blocked';f.native(f.worker,f.result,{projectId:'cec',kind:'delivery',id:'ticket:CEC-900'});}
        if(reason==='unaccepted-head')f.ticket.results.implement.commit='a'.repeat(40);
        if(reason==='changed-proof')f.write(f.binding.proofPath,{});if(reason==='wrong-assignment')f.write(resolve(f.root,'sessions',f.worker.id,'assignment.json'),{});
        if(reason==='missing-completion')rmSync(resolve(f.root,'sessions',f.worker.id,'execution-completion.json'));if(reason==='running')f.worker.status='running';
        if(reason==='changed-original')f.original.failure.category='other';if(reason==='changed-original-artifact')f.write(f.proof.artifacts[0].path,{});
        expect(implementationReplacementResolution(f.store,f.entry)).toBeUndefined();expect(f.original.status).toBe('failed');
    }finally{f.close();}
});
