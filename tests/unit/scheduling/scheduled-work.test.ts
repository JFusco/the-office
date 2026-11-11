import { registerDeliveryFixture } from '../../fixtures/delivery-claim';
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { scheduledWork, type OfficeEntry } from '../../../server/scheduling/scheduled-work';
import { selectWork } from '../../../server/scheduling/scheduler';
import { projectReadiness } from '../../../server/office/readiness';
import { Offices } from '../../../server/scheduling/offices';
import type { ExecutionLane, Role, WorkRef } from '../../../src/shared';
import {GH91,SourceAmendmentCommand} from '../../../server/delivery/recovery/source-amendment/source-amendment';
import {RELEASE_SOURCE_IDS} from '../../../server/delivery/recovery/source-amendment/source-amendment-scope';
import {artifact,digest} from '../../../server/store/readback-evidence';
import * as closeoutEvidence from '../../../server/delivery/recovery/closeout/closeout-recovery-evidence';

const roots:string[]=[], stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();stores.splice(0).forEach(store=>store.close());roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true}));});
function fixture(projectId='brain'){
    const root=mkdtempSync(resolve(tmpdir(),'office-projection-'));roots.push(root);
    const clock={now:()=>new Date('2026-10-29T22:00:00Z'),monotonic:()=>0};
    const store=new Store(':memory:',projectById(projectId),root,clock);stores.push(store);store.state.coordination=coordination();
    const entry={store,engine:{},conversations:{},coordinator:{}} as OfficeEntry, all=new Map([[store.project.id,store]]);
    const project=(lane='delivery')=>scheduledWork(entry,all,clock.now(),lane);
    const summaries=()=>Offices.prototype.summaries.call({entries:new Map([['brain',entry]]),projection:()=>project()} as any);
    return {store,entry,project,summaries};
}
function claim(store:Store,work:WorkRef,stage:string,lane:ExecutionLane='delivery',role?:Role){
    const claim=store.claimWork(work,'scheduler-fixture',stage,lane)!;expect(claim).not.toBeNull();
    if(role)store.state.workLog=[{id:'native-worker',claimId:claim.id,role,status:'running',stage,requestId:'underlying-run-not-synthetic-id'} as any];
    return claim;
}
test('a synthetic maintenance read-back is running under its claim, including during drain, and is not dispatchable again',()=>{
    const {store,entry,project,summaries}=fixture();
    store.state.maintenance={runs:[{id:'original',status:'blocked',stage:'follow-up',requestedAt:store.clock.now().toISOString(),readbackRetry:{attempts:1,nextAt:'',history:[],exhausted:false}} as any],lastDaily:'',lastWeekly:'',ledger:''};
    const work:WorkRef={projectId:'brain',kind:'reconciliation',id:'recovery:original'};
    expect(selectWork(project(),0)?.work).toEqual(work);
    const owned=claim(store,work,'maintenance-readback','delivery','pm');
    const inspect=()=>{const items=project(),item=items.find(item=>item.work.id===work.id)!;expect(item.eligibility).toMatchObject({state:'running',owner:'Morgan'});expect(selectWork(items,0)).toBeUndefined();expect(projectReadiness(entry,items).running).toBe(1);expect(summaries()[0]).toMatchObject({working:1,queued:0});};
    inspect();store.state.draining=true;inspect();store.finishClaim(owned.id,'completed');store.state.workLog![0].status='completed';
    expect(project().filter(item=>item.eligibility.state==='running')).toHaveLength(0);expect(summaries()[0].working).toBe(0);
});
test('a posting time entry stays visible through its operations claim after leaving the pending selector',()=>{
    const {store,project}=fixture(),time=store.state.coordination!.time={enabled:true,githubField:true,activatedAt:store.clock.now().toISOString(),entries:[] as any[],baselines:{}};
    time.enabled=true;time.githubField=true;time.entries=[{id:'day',key:'GH-1',date:'2026-10-29',status:'pending',seconds:60} as any];
    const pending=project('operations').find(item=>item.stage==='time-publication')!;expect(pending).toBeDefined();claim(store,pending.work,pending.stage,'operations');time.entries[0].status='posting';
    const before=JSON.stringify(store.state),items=project('operations');expect(items).toHaveLength(1);expect(items[0]).toMatchObject({work:pending.work,stage:'time-publication',eligibility:{state:'running',owner:'Office'}});expect(selectWork(items,0)).toBeUndefined();expect(JSON.stringify(store.state)).toBe(before);expect(project().some(item=>item.work.id===pending.work.id)).toBe(false);
});
test('an existing request is projected once and keeps stopping ownership until confirmed release',()=>{
    const {store,project}=fixture(),request:any={id:'adoption',action:'adopt-candidate',lane:'delivery',key:'GH-91',requestedAt:store.clock.now().toISOString(),status:'working',head:'',detail:''};store.state.coordination!.requests=[request];
    const owned=claim(store,{projectId:'brain',kind:'reconciliation',id:request.id},request.action,'delivery','lead');store.state.paused=true;store.finishClaim(owned.id,'stopping');store.state.workLog![0].status='stopping';
    const items=project().filter(item=>item.work.id===request.id);expect(items).toHaveLength(1);expect(items[0].eligibility).toMatchObject({state:'running',owner:'Sam',reason:'Waiting for confirmed process termination'});expect(selectWork(items,0)).toBeUndefined();
});
test.each([['cto','cto'],['it','it'],['operations','pm'],['knowledge','knowledge']] as [ExecutionLane,Role][])('%s claims do not inflate delivery counts or queued work', (lane,role)=>{
    const {store,project,summaries}=fixture();store.state.agents.find(agent=>agent.id===role)!.activity='working';
    store.state.knowledge!.rollups=[{id:'rollup:2026-10-23'} as any]; // this week's roll-up is already done
    claim(store,{projectId:'brain',kind:'conversation',id:'separate-lane'},`conversation:${role}`,lane,role);
    expect(project().filter(item=>item.eligibility.state==='running')).toHaveLength(0);expect(summaries()[0]).toMatchObject({working:0,queued:0});
    expect(project(lane).filter(item=>item.eligibility.state==='running')).toHaveLength(1);expect(selectWork(project(lane),0)).toBeUndefined();
});
test.each(['failed', 'interrupted'])('verified conversation read-back makes %s IT attempts terminal while retaining failure history', status => {
    const {store,project}=fixture(),original:any={id:'original',from:'human',to:'pm',status:'failed',createdAt:'2026-10-28T21:00:00Z',actionId:'',receipts:[],error:'Original failure',ticket:''};
    const reply:any={id:'reply',from:'pm',to:'pm',status:'answered',createdAt:'2026-10-29T21:00:00Z',actionId:'message:original',receipts:[{action:'conversation-readback',target:'original',verified:true,uncertain:false}]};
    const attempt:any={...original,id:'it-attempt',from:'it',status,actionId:'message:original',error:'Prior failed read-back'};
    const unrelated:any={...attempt,id:'unrelated',actionId:'message:missing-original'};
    store.state.messages=[original,attempt,unrelated,reply];const before=JSON.stringify([original,attempt,unrelated]);
    for (const id of [original.id,attempt.id]) expect(project().find(item=>item.work.id===id)?.eligibility.state).toBe('terminal');
    expect(project().find(item=>item.work.id===unrelated.id)?.eligibility.state).toBe('blocked');
    expect(JSON.stringify([original,attempt,unrelated])).toBe(before);
    reply.receipts[0].uncertain=true;
    for (const id of [original.id,attempt.id]) expect(project().find(item=>item.work.id===id)?.eligibility.state).toBe('blocked');
    expect(JSON.stringify([original,attempt,unrelated])).toBe(before);
});
test('only an exact successful durable reconciliation supersedes its failed attempts', () => {
    const {store,project}=fixture(),failed:any={id:'failed',action:'reconcile-native-refresh',key:'GH-254',head:'native-run',lane:'delivery',requestedAt:'2026-10-29T20:00:00Z',status:'blocked',detail:'Prior failed attempt'};
    const success:any={...failed,id:'success',status:'completed',requestedAt:'2026-10-29T21:00:00Z'};
    store.state.coordination!.requests=[failed,success];
    expect(project().find(item=>item.work.id===failed.id)?.eligibility.state).toBe('terminal');expect(failed.status).toBe('blocked');
    success.head='different-native-run';expect(project().find(item=>item.work.id===failed.id)?.eligibility.state).toBe('blocked');
    success.head=failed.head;success.action='adopt-candidate';expect(project().find(item=>item.work.id===failed.id)?.eligibility.state).toBe('blocked');
});

test('verified merged cleanup is selected before continuations; unknown cleanup and ordinary reconciliation retain their rank',()=>{
    const a=fixture('cms-field-vocabulary'),c=a.store.state.coordination!;
    c.requests=[{id:'cleanup',action:'cleanup-merged-candidate',key:'GH-20',head:'original',lane:'delivery',requestedAt:'2026-10-29T21:00:00Z',status:'queued',detail:''},{id:'ordinary-recovery',action:'reconcile-implementation',key:'GH-21',head:'other',lane:'delivery',requestedAt:'2026-10-29T19:00:00Z',status:'queued',detail:''}];
    c.jobs=[{id:'continuing-source',key:'GH-22',stage:'update-base',status:'queued',repairReason:'conflicts',requestedAt:'2026-10-29T20:00:00Z',steps:[]}as any];
    registerDeliveryFixture(a.store,c.jobs![0]);
    const verified=vi.spyOn(closeoutEvidence,'verifiedCloseoutCleanupRequest').mockReturnValue(true);
    expect(a.project().find(item=>item.work.id==='ordinary-recovery')?.rank).toBe(2);
    expect(selectWork(a.project(),0)?.work.id).toBe('cleanup');
    verified.mockReturnValue(false);expect(selectWork(a.project(),0)?.work.id).toBe('continuing-source');expect(a.project().find(item=>item.work.id==='cleanup')?.rank).toBe(2);
    verified.mockReturnValue(true);a.store.state.draining=true;expect(selectWork(a.project(),0)).toBeUndefined();expect(c.requests[0].status).toBe('queued');
});

function scopeHistory(kind:'readback'|'resume'='readback'){
    const a=fixture('cms-field-vocabulary'),{store}=a,head='b'.repeat(40),fromHead='a'.repeat(40),job:any={id:GH91.jobId,key:'GH-91',stage:'scope-repair',status:'blocked',head,steps:[],requestedAt:'2026-10-29T19:00:00Z'};
    const failed:any={id:'failed-scope',action:'reconcile-scope-repair',key:job.key,head:'original-scope',lane:'delivery',requestedAt:'2026-10-29T20:00:00Z',status:'blocked',detail:'Retained original failure'};
    const success:any={...failed,id:'accepted-scope',requestedAt:'2026-10-29T21:00:00Z',status:'completed'};
    const original:any={id:failed.head,requestId:job.id,sessionId:'original-session',role:'developer',status:'blocked',endedAt:'2026-10-29T19:59:00Z'},reader:any={id:'actual-reader',requestId:job.id,sessionId:'reader-session',role:'lead',status:'completed',endedAt:'2026-10-29T21:01:00Z'};
    const authorization=SourceAmendmentCommand.parse({...GH91,sourceIds:[...RELEASE_SOURCE_IDS],approvedBy:'human',proposalSha256:'c'.repeat(64)});
    const proof:any={intentId:success.id,originalWorkId:original.id,originalSessionId:original.sessionId,fromHead,head,authorizationSha256:digest(authorization),reader,
        assessment:{outcome:'passed',originalWorkId:original.id,nativeSessionId:original.sessionId,commit:head,completeNativeExecution:true,noExternalEffects:true,noHumanHold:true,scansVerified:true,repairWithinExistingScope:true}};
    const path=resolve(store.dataRoot,'ticket-work',job.id,'scope-proof.json');mkdirSync(resolve(path,'..'),{recursive:true});
    const record:any={intentId:success.id,originalWorkId:original.id,head,fromHead,proofPath:path,proofSha256:'',outsideSourceIds:[]};
    if(kind==='resume'){Object.assign(proof,{version:1,projectId:store.project.id,repository:store.project.repository,jobId:job.id,key:job.key,checkpointSha256:'d'.repeat(64)});record.checkpointSha256=proof.checkpointSha256;job.scopeRepairResumes=[record];}
    else{job.sourceAmendment={adoptedAt:'2026-10-29T19:00:00Z',authorization};job.scopeRepairReadback=record;}
    const save=()=>{writeFileSync(path,JSON.stringify(proof));record.proofSha256=artifact(store,path).sha256;};save();
    store.state.coordination!.jobs=[job];store.state.coordination!.requests=[failed,success];store.state.workLog=[original,reader];
    return {...a,job,failed,success,original,reader,proof,record,path,save};
}
test.each(['readback','resume']as const)('exact admitted %s resolves prior failed scope requests without hiding the current blocked ticket',kind=>{
    const a=scopeHistory(kind),before=JSON.stringify([a.failed,a.job]);
    const items=a.project();expect(items.find(item=>item.work.id===a.failed.id)?.eligibility.state).toBe('terminal');expect(items.find(item=>item.work.id===a.job.id)?.eligibility.state).toBe('blocked');
    expect(JSON.stringify([a.failed,a.job])).toBe(before);
    a.job.head='e'.repeat(40);expect(a.project().find(item=>item.work.id===a.failed.id)?.eligibility.state).toBe('terminal');
});
test.each(['hash','original','job','project','success','action','time','assessment','session','reader','authorization','duplicate']as const)('scope history remains blocked for %s ambiguity or missing proof',reason=>{
    const a=scopeHistory(reason==='project'?'resume':'readback');
    if(reason==='hash')writeFileSync(a.path,'{}');
    if(reason==='original')a.failed.head='foreign-original';
    if(reason==='job')a.original.requestId='foreign-job';
    if(reason==='project'){a.proof.projectId='foreign-project';a.save();}
    if(reason==='success')a.success.status='blocked';
    if(reason==='action')a.success.action='reconcile-implementation';
    if(reason==='time')a.success.requestedAt='2026-10-29T19:00:00Z';
    if(reason==='assessment'){a.proof.assessment.noExternalEffects=false;a.save();}
    if(reason==='session'){a.proof.assessment.nativeSessionId='foreign-session';a.save();}
    if(reason==='reader')a.reader.status='failed';
    if(reason==='authorization'){a.job.sourceAmendment.authorization.proposalSha256='f'.repeat(64);}
    if(reason==='duplicate')a.store.state.coordination!.jobs!.push({...a.job,id:'other-job'});
    const before=JSON.stringify(a.failed);expect(a.project().find(item=>item.work.id===a.failed.id)?.eligibility.state).toBe('blocked');expect(JSON.stringify(a.failed)).toBe(before);
});
test('a refused checkpoint retry remains blocked until that exact checkpoint has a verified native receipt', () => {
    const {store,project}=fixture(),c=store.state.coordination!;
    c.requests=[{id:'old-retry',action:'retry-checkpoint',key:'checkpoint',head:'',lane:'delivery',requestedAt:'',status:'blocked',detail:'Date already completed'}];
    c.checkpoints=[{id:'checkpoint',runId:'original',status:'completed',requestedAt:''} as any];
    store.state.maintenance={runs:[{id:'original',status:'reconciled',requestedAt:'',steps:[]} as any],lastDaily:'',lastWeekly:'',ledger:''};
    expect(project().find(item=>item.work.id==='old-retry')?.eligibility.state).toBe('blocked');
    store.state.maintenance.runs[0].steps.push({stage:'checkpoint-native-readback',result:{outcome:'passed',receipts:[{action:'native-checkpoint-readback',verified:true,uncertain:false}]}} as any);
    expect(project().find(item=>item.work.id==='old-retry')?.eligibility.state).toBe('terminal');expect(c.requests[0].status).toBe('blocked');
});
test('an owned Backlog idea is waiting, while an explicit work request retains its actual blocker', () => {
    const {store,project}=fixture(),c=store.state.coordination!;
    c.listener.assigned=[{key:'GH-67',pickupStatus:'Backlog'} as any];c.listener.reviews=[{id:'held-idea',key:'GH-67',status:'owned',queuedAt:''} as any];
    expect(project().find(item=>item.work.id==='held-idea')?.eligibility.state).toBe('waiting');
    c.listener.reviews[0].workRequested='manual';expect(project().find(item=>item.work.id==='held-idea')?.eligibility.state).toBe('blocked');
});

test('the knowledge lane carries only Harper retrospectives and the delivery lane never sees them', () => {
    const {store,project}=fixture();
    const done={id:crypto.randomUUID(),key:'GH-3',requestedAt:'2026-10-29T10:00:00Z',status:'completed',stage:'closeout',detail:'',head:'',worktree:'',branch:'',pr:0,prUrl:'',steps:[]} as any;
    store.state.coordination!.jobs=[done];
    store.state.knowledge!.rollups=[{id:'rollup:2026-10-23'} as any];
    store.state.messages.push({id:'human-1',requestId:'human-1',from:'human',to:'pm',ticket:'',actionId:'',body:'hi',status:'queued',createdAt:'2026-10-29T21:00:00Z',sessionId:'',recheck:false,error:'',recipients:[],receipts:[]} as any);
    expect(project('knowledge').map(item=>[item.work.kind,item.stage,item.eligibility.owner])).toEqual([['retrospective','retrospective','Harper']]);
    expect(project().some(item=>item.work.kind==='retrospective')).toBe(false);
    store.state.knowledge!.enabled=false;
    expect(project('knowledge')[0].eligibility.state).toBe('waiting');
    expect(selectWork(project('knowledge'),0)).toBeUndefined();
});

test('Harper chat and the weekly roll-up ride the knowledge lane, and Harper hands Morgan a delivery-lane note', () => {
    const {store,project}=fixture();
    store.state.messages.push({id:'ask-harper',requestId:'ask-harper',from:'human',to:'knowledge',ticket:'',actionId:'',body:'What did we learn?',status:'queued',createdAt:'2026-10-29T21:00:00Z',sessionId:'',recheck:false,error:'',recipients:[],receipts:[]} as any,
        {id:'knowledge-report:ask',requestId:'knowledge-report:ask',from:'knowledge',to:'pm',ticket:'',actionId:'',body:'Note for the team',status:'queued',createdAt:'2026-10-29T21:01:00Z',sessionId:'',recheck:false,error:'',recipients:[],receipts:[]} as any);
    const knowledge=project('knowledge'),delivery=project();
    expect(knowledge.map(item=>[item.work.kind,item.stage])).toEqual([['conversation','conversation:knowledge'],['knowledge-rollup','knowledge-rollup']]);
    expect(delivery.some(item=>item.work.id==='ask-harper')).toBe(false);
    expect(delivery.some(item=>item.work.id==='knowledge-report:ask')).toBe(true);
});
test('the ledger-only scope correction stays runnable while the office drains, unlike other operations',()=>{
    const {store,project}=fixture(),request:any={id:'scope',action:'apply-time-scope',lane:'operations',key:'',requestedAt:store.clock.now().toISOString(),status:'queued',head:'a'.repeat(64),detail:'',timeScope:{policy:'model-work-v1',expectedSha256:'a'.repeat(64)}};
    const other:any={id:'refresh',action:'refresh',lane:'operations',key:'',requestedAt:store.clock.now().toISOString(),status:'queued',head:'',detail:''};
    store.state.coordination!.requests=[request,other];store.state.draining=true;
    const items=project('operations'),scope=items.find(item=>item.work.id==='scope')!,refresh=items.find(item=>item.work.id==='refresh')!;
    expect(scope).toMatchObject({allowPaused:true,eligibility:{state:'runnable'}});expect(refresh.allowPaused).toBeFalsy();expect(refresh.eligibility.state).toBe('blocked');
});
test('a pending time day waits only on an unsettled write for its ticket and never starves read-back',()=>{
    const {store,project}=fixture(),time:any=store.state.coordination!.time={enabled:true,githubField:true,activatedAt:store.clock.now().toISOString(),entries:[],baselines:{},publications:[]};
    time.entries=[{id:'GH-1:2026-10-28',key:'GH-1',date:'2026-10-28',status:'uncertain',seconds:60},{id:'GH-1:2026-10-29',key:'GH-1',date:'2026-10-29',status:'pending',seconds:60}];
    // A day stuck before dispatch is not a settlement risk: the ticket total still publishes.
    expect(project('operations').some(item=>item.stage==='time-publication')).toBe(true);
    // An attempted write awaiting read-back is: the newer total waits and read-back is scheduled instead.
    time.publications=[{id:'attempt',provider:'github',projectId:'brain',key:'GH-1',status:'uncertain',itemId:'i',fieldId:'f',worklogId:'',baseline:0,previousValue:0,intendedValue:0.0167,covered:[],payload:{},createdAt:'2026-01-01T00:00:00Z',detail:''}];
    const items=project('operations');expect(items.some(item=>item.stage==='time-publication')).toBe(false);expect(items.some(item=>item.stage==='time-readback')).toBe(true);
});
test('cost publication and cost read-back are scheduled independently of hours and of each other',()=>{
    const {store,project}=fixture(),time:any=store.state.coordination!.time={enabled:true,githubField:true,activatedAt:store.clock.now().toISOString(),entries:[],baselines:{},publications:[],scopePolicy:'model-work-v1',cost:{githubField:true,entries:[],baselines:{}}};
    time.cost.entries=[{key:'GH-1',revision:1,status:'pending',updatedAt:'2026-01-01T00:00:00Z'},{key:'GH-2',revision:1,status:'posting',updatedAt:'2026-01-01T00:00:00Z'}];
    const stages=project('operations').map(item=>item.stage);expect(stages).toEqual(expect.arrayContaining(['cost-publication','cost-readback']));
    time.cost.githubField=false;expect(project('operations').map(item=>item.stage)).not.toContain('cost-publication');
});
