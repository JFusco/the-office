import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { enqueueHistoryRetirement, historicalRecordDigest, retireIncompleteHistory } from '../../../server/operations/retire-history';
function fixture(){
    const root=mkdtempSync(resolve(tmpdir(),'old-reader-')),store=new Store(':memory:',projectById('cec'),root);
    store.state.coordination=coordination();
    const request:any={id:'original-resume',key:'CEC-900',action:'resume-ticket',status:'blocked',requestedAt:'2026-11-14T12:00:00Z'};store.state.deliveryQueue=[request];
    const claim=store.claimWork({projectId:'cec',kind:'delivery',id:request.id},'operator','resume-ticket')!;store.finishClaim(claim.id,'completed');
    const work:any={id:'old-read',requestId:'',claimId:claim.id,ticket:request.key,role:'pm',stage:'reconcile',provider:'codex',sessionId:'original-native',status:'failed',processId:2147483600,endedAt:'2026-11-14T12:01:00Z',failure:{category:'transient-read',dispatched:true,detail:'Original read output unavailable'}};
    const otherClaim=store.claimWork({projectId:'cec',kind:'delivery',id:'ticket:CEC-901'},'another','qa')!;
    const other:any={id:'unrelated-active',requestId:'',claimId:otherClaim.id,ticket:'CEC-901',role:'qa',stage:'qa',status:'running',processId:2147483599};store.state.workLog=[work,other];
    const entry:any={id:'investigation:cec:worker:old-read:transient-read',status:'queued',attempts:0,createdAt:'before',updatedAt:'before',nextAt:'',lastError:'',source:{kind:'worker',id:work.id,requestId:'',ticket:work.ticket,failureKind:'transient-read',workerIds:[work.id,other.id]}};
    store.state.it={checkedAt:'',nextCheckAt:'',status:'needs-attention',reports:[],recoveries:{},services:[],investigations:[entry]};
    const dir=resolve(root,'sessions',work.id);mkdirSync(dir,{recursive:true});const write=(name:string,v:unknown)=>writeFileSync(resolve(dir,name),JSON.stringify(v));
    write('assignment.json',{id:work.id,claimId:claim.id,work:claim.work,lane:'delivery',role:work.role,stage:work.stage,profile:'reader',scope:{repository:store.project.repository,artifacts:dir}});
    write('capabilities.json',{name:'reader',readOnly:true,cutover:'verified'});write('error.json',{provider:work.provider,session:work.sessionId,error:'Missing original command output'});
    const intent=()=>({acceptIncompleteHistory:true,reason:'Joe accepts this exact inactive read as incomplete history, preserving its failure and missing output.',targets:[{kind:'investigation',id:entry.id,sha256:historicalRecordDigest(entry)}]});
    return{root,store,request,work,other,entry,dir,write,intent,close(){store.close();rmSync(root,{recursive:true,force:true});}};
}
test('explicit acknowledgment retires only the exact old reader, without relabeling success or interfering with a proven unrelated blank-ID worker',()=>{
    const f=fixture();try{const old=structuredClone(f.entry),work=structuredClone(f.work),bytes=readFileSync(resolve(f.dir,'error.json'));
        const request=enqueueHistoryRetirement(f.store,f.intent(),()=>false);request.status='working';retireIncompleteHistory(f.store,request,()=>false);
        const{retirement,...entry}=f.entry;expect(entry).toEqual(old);expect(retirement.kind).toBe('incomplete-history');
        expect(f.entry.status).toBe('queued');expect(f.entry.attempts).toBe(0);expect(f.work).toEqual(work);expect(f.other.status).toBe('running');
        expect(readFileSync(resolve(f.dir,'error.json'))).toEqual(bytes);expect(enqueueHistoryRetirement(f.store,f.intent(),()=>false).id).toBe(request.id);
    }finally{f.close();}
});
test.each(['live-source','active-related','missing-pid','wrong-profile','writable-profile','changed-source','missing-claim','request-working','completed-output','wrong-native-session','unsettled-write','no-consent'])('does not retire %s',reason=>{
    const f=fixture();try{
        if(reason==='active-related')f.store.state.workLog!.push({...f.other,id:'related',originalId:f.work.id});
        if(reason==='missing-pid')delete f.work.processId;if(reason==='wrong-profile')f.write('capabilities.json',{name:'developer',readOnly:true,cutover:'verified'});
        if(reason==='writable-profile')f.write('capabilities.json',{name:'reader',readOnly:false,cutover:'verified'});
        if(reason==='changed-source')f.work.failure.category='uncertain-effect';if(reason==='missing-claim')f.work.claimId='missing';
        if(reason==='request-working')f.request.status='working';if(reason==='completed-output')f.write('result.json',{result:'unknown'});
        if(reason==='wrong-native-session')f.write('error.json',{provider:'codex',session:'different'});
        if(reason==='unsettled-write')f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unknown','cec:delivery:original-resume','uncertain','{}');
        const intent:any=f.intent();if(reason==='no-consent')intent.acceptIncompleteHistory=false;
        expect(()=>enqueueHistoryRetirement(f.store,intent,()=>reason==='live-source')).toThrow();expect(f.entry.retirement).toBeUndefined();
    }finally{f.close();}
});
test('a changed historical record after approval refuses consumption without a partial disposition',()=>{
    const f=fixture();try{const request=enqueueHistoryRetirement(f.store,f.intent(),()=>false);request.status='working';f.entry.attempts++;
        expect(()=>retireIncompleteHistory(f.store,request,()=>false)).toThrow('changed');expect(f.entry.retirement).toBeUndefined();
    }finally{f.close();}
});
