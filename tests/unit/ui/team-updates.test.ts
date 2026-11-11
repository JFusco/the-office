import {liveTiming} from '../../../src/timing/live-timing';
import {expect,test} from 'vitest';
import {ticketUpdates,deliveryChanges} from '../../../src/work/TeamUpdates';
import {deliveryRepairProjection} from '../../../src/work/delivery-repair-projection';
import {scheduledWork} from '../../../server/scheduling/scheduled-work';
import {initialSnapshot} from '../../../server/store/store';
import {coordination} from '../../../server/scheduling/coordination';
const snapshot=(jobs:any[])=>({project:{id:'brain'},tickets:[{key:'GH-263',summary:'SQLite guidance'}],agents:[],workLog:[],coordination:{listener:{reviews:[]},jobs}} as any);
const job={id:'j',key:'GH-263',status:'working',stage:'closeout',pr:269,detail:'Queued for review',updatedAt:'2026-10-28T18:35:00Z',steps:[]};
const repairCycle={owner:'developer' as const,findingAttempts:{F1:1},attempts:1,pendingFindingIds:['F1'],sourceStage:'lead-pr',sourceHead:'a'.repeat(40),phase:'review' as const};
test('completed source repair yields merge approval to the human and returns to ordinary scheduling priority',()=>{
 const candidate={...job,admission:{kind:'manual',projectId:'brain',jobId:job.id,key:job.key,reference:'isolated-original:'+job.id,at:job.updatedAt},status:'watching',stage:'lead-pr',mergeApprovalRequired:true,repairReason:'source',repairCycle:{...repairCycle,phase:'verify',pendingFindingIds:[]}};
 const row=ticketUpdates(snapshot([candidate]))[0];
 expect(row.next).toBe('You: approve this exact reviewed head.'); expect(row.next).not.toContain('Alex');
 expect(deliveryRepairProjection(candidate as any)).toBeUndefined();
 const store={project:{id:'brain',provider:'github'},state:{...initialSnapshot(),coordination:{...coordination(),jobs:[candidate]}},activeClaims:()=>[],clock:{now:()=>new Date(job.updatedAt)}};
 const scheduled=scheduledWork({store,engine:{},conversations:{}} as any,new Map([['brain',store]]) as any);
 expect(scheduled.find(item=>item.work.kind==='delivery'&&item.work.id===candidate.id)?.rank).toBe(3);
});
test('blocked repair review reports the stopped delivery while diagnosis retains its actual next owner',()=>{
 const candidate={...job,status:'blocked',stage:'review',repairCycle};
 expect(ticketUpdates(snapshot([candidate]))[0].next).toBe('Stopped; this delivery is not complete.');
 const diagnosed={...candidate,repairCycle:{...repairCycle,phase:'diagnosis'}};
 expect(ticketUpdates(snapshot([diagnosed]))[0].next).toContain('Morgan owns the diagnosed restriction');
});
test.each(['ci','parent','readiness'])('active repair projection preserves the %s dependency next action',dependency=>{
 const candidate={...job,status:'queued',stage:'review',repairCycle,...(dependency==='ci'?{ciFollowupKey:'GH-264'}:dependency==='parent'?{dependsOnPR:270}:{status:'watching',mergeApprovalRequired:true})};
 const next=ticketUpdates(snapshot([candidate]))[0].next;
 expect(next).toContain(dependency==='ci'?'The team owns GH-264':dependency==='parent'?'Waiting for parent PR #270':'You: approve this exact reviewed head.');
 expect(next).not.toContain('Delivery owner: Alex');
});
test.each(['draft','lead-pr','merge','closeout'])('repair ownership projection ends before %s',stage=>{
 expect(deliveryRepairProjection({...job,stage,repairCycle} as any)).toBeUndefined();
});
test('active closeout stays above newer queued work and names its actual next step',()=>{
 const s=snapshot([job,{...job,id:'q',key:'GH-264',status:'queued',stage:'lead-pr',updatedAt:'2026-10-28T19:00:00Z'}]);
 s.events=[{ticket:'GH-263',kind:'github-delivery-stage',message:'GH-263 · closeout',at:'2026-10-28T19:01:00Z'}];
 const first=ticketUpdates(s)[0];expect(first.at).toBe('2026-10-28T19:01:00Z');expect(first.key).toBe('GH-263');expect(first.phase).toBe('Closing out merged work');expect(first.summary).not.toContain('Queued');expect(first.next).toContain('board closeout');
});
test('status notifications ignore tool chatter but announce handoffs, merge observation and completion',()=>{
 const before=snapshot([job]);const progress=snapshot([{...job,detail:'Inspecting files',updatedAt:'later'}]);expect(deliveryChanges(before,progress)).toEqual([]);
 expect(deliveryChanges(before,snapshot([{...job,status:'completed'}]))[0]).toContain('Delivery complete');
 expect(deliveryChanges(snapshot([{...job,stage:'merge'}]),snapshot([{...job,status:'watching',stage:'merge',mergeCommit:'abc'}]))[0]).toContain('PR merged; watching Actions');
 const switched=snapshot([{...job,status:'completed'}]);switched.project.id='cec';expect(deliveryChanges(before,switched)).toEqual([]);
});

test('a finished review with conflicts is waiting for repair, never presented as active review',()=>{
 const s=snapshot([{...job,status:'watching',stage:'lead-pr',pr:272,detail:'PR observation unavailable: read timed out',steps:[{stage:'lead-pr',result:{summary:'Review finished',blocker:'PR #272 has conflicts and remains draft.',findings:[{id:'merge-conflicts',status:'open'},{id:'draft-blocks-merge',status:'open'}]}}]}]);
 const r=ticketUpdates(s)[0];expect(r.status).toBe('waiting');expect(r.phase).toBe('Blocked · PR conflicts');expect(r.summary).toContain('conflicts');expect(r.next).toContain('Alex');expect(r.next).toContain('selected checks');expect(r.phase).not.toContain('Checking');
});
test('a denied policy read names the stopped review, blocker and next team owner',()=>{
 const s=snapshot([{...job,status:'watching',stage:'lead-pr',steps:[{stage:'lead-pr',result:{outcome:'blocked',summary:'Sam finished reviewing',blocker:'GitHub protection inspection returned HTTP 403',findings:[{id:'provider-protection-permission',summary:'Permission denied',status:'open'}]}}]}]);
 expect(ticketUpdates(s)[0]).toMatchObject({status:'blocked',phase:'Blocked · GitHub policy inspection'});expect(ticketUpdates(s)[0].next).toContain('Morgan and Ellis');expect(ticketUpdates(s)[0].summary).toContain('403');
});

test('blocked delivery names its actual running reconciliation worker and shared-clock seconds',()=>{
 const s=snapshot([{...job,status:'blocked',stage:'review',repairCycle,detail:'Saved candidate awaits reconciliation'}]);
 s.serverTime='2026-10-30T14:00:00Z';s.azure={builds:[]};s.agents=[{id:'lead',activity:'working',ticket:job.key,task:`${job.key} · Working on your request · Inspecting project files`}];
 s.workLog=[{id:'audit',role:'lead',ticket:job.key,requestId:'actual-audit',stage:'implementation-readback',status:'running',lastHeartbeatAt:s.serverTime,elapsedMs:58000}];
 const initial=ticketUpdates(liveTiming(s,100,100,true,true))[0];
 expect(initial.status).toBe('blocked');expect(initial.workerActive).toBe(true);expect(initial.phase).toContain('Sam reconciles');expect(initial.summary).toContain('Sam: Reconciling saved implementation');expect(initial.summary).toContain('58s elapsed');expect(initial.next).toContain('reconciliation result');expect(initial.next).not.toContain('Stopped');
 expect(ticketUpdates(liveTiming(s,100,2100,true,true))[0].summary).toContain('1m 0s elapsed');
 expect(ticketUpdates(liveTiming(s,100,3100,true,true))[0].summary).toContain('1m 1s elapsed');
 s.agents[0].activity='disconnected';
 const stale=ticketUpdates(liveTiming(s,100,36100,false,true))[0];expect(stale.workerActive).toBe(false);expect(stale.summary).toContain('58s elapsed · last confirmed');
 s.workLog[0].status='completed';s.agents[0].activity='idle';
 const finished=ticketUpdates(liveTiming(s,100,45000,true,true))[0];expect(finished.summary).not.toContain('elapsed');expect(finished.workerActive).toBe(false);expect(finished.next).toContain('Stopped');expect(s.workLog[0].elapsedMs).toBe(58000);
});

test('a completed maintenance run keeps its outcome on Team updates and outranks older finished deliveries',()=>{
 const s=snapshot([{...job,status:'completed',updatedAt:'2026-11-05T00:56:43Z'}]);s.project.repository='JFusco/brain';
 const step=(summary:string)=>({role:'pm',stage:'brain-maintenance',at:'',result:{outcome:'passed',summary,ledger:'',blocker:'',candidates:[],receipts:[{id:'i',action:'create issue',target:'https://github.com/JFusco/brain/issues/337',verified:true,uncertain:false,detail:''}]}});
 const run={id:'r',requestedAt:'2026-11-06T22:00:00Z',startedAt:'2026-11-06T22:00:15Z',endedAt:'2026-11-06T22:40:02Z',status:'completed',weekly:false,stage:'brain-completed',error:'',steps:[step('Merged PRs #338 and #340; accepted 12 captures.')]};
 s.maintenance={runs:[run]};
 const rows=ticketUpdates(s);
 expect(rows[0]).toMatchObject({key:'GH-337',title:'Nightly maintenance',phase:'Maintenance complete',status:'completed',at:run.endedAt});
 expect(rows[0].summary).toContain('accepted 12 captures');
 s.maintenance={runs:[{...run,stage:'skipped: completed'}]};
 expect(ticketUpdates(s).some(r=>r.key==='GH-337')).toBe(false);
 s.maintenance={runs:[{...run,status:'blocked',stage:'brain-maintenance',steps:[step('Hosted checks failed.')]}]};
 expect(ticketUpdates(s)[0]).toMatchObject({key:'GH-337',phase:'Maintenance stopped',status:'blocked'});
});
test('a later checkpoint read-back step keeps the Brain outcome row; CMS completions stay hidden',()=>{
 const s=snapshot([]);s.project.repository='JFusco/brain';
 const receipt=(target:string)=>({id:'i',action:'a',target,verified:true,uncertain:false,detail:''});
 const step=(stage:string,summary:string,target:string)=>({role:'pm',stage,at:'',result:{outcome:'passed',summary,ledger:'',blocker:'',candidates:[],receipts:[receipt(target)]}});
 const run={id:'r',requestedAt:'',startedAt:'',endedAt:'2026-11-06T22:40:02Z',status:'completed',weekly:false,stage:'brain-completed',error:'',steps:[step('brain-maintenance','Accepted 12 captures.','https://github.com/JFusco/brain/issues/337'),step('checkpoint-completion-readback','Checkpoint reconciled.','r')]};
 s.maintenance={runs:[run]};
 expect(ticketUpdates(s)[0]).toMatchObject({key:'GH-337',summary:'Accepted 12 captures.'});
 s.maintenance={runs:[{...run,stage:'complete',steps:[step('draft-pr','CMS done.','https://github.com/JFusco/brain/issues/5')]}]};
 expect(ticketUpdates(s)).toHaveLength(0);
});
test('a completed run sits beside, never replaces, a row for the same issue',()=>{
 const receipt={id:'i',action:'a',target:'https://github.com/JFusco/brain/issues/263',verified:true,uncertain:false,detail:''};
 const run={id:'r',requestedAt:'',startedAt:'',endedAt:'2026-11-06T22:40:02Z',status:'completed',weekly:false,stage:'brain-completed',error:'',steps:[{role:'pm',stage:'brain-maintenance',at:'',result:{outcome:'passed',summary:'Accepted 12 captures.',ledger:'',blocker:'',candidates:[],receipts:[receipt]}}]};
 const finished=snapshot([{...job,status:'completed',updatedAt:'2026-11-06T22:30:00Z'}]);finished.project.repository='JFusco/brain';finished.maintenance={runs:[run]};
 expect(ticketUpdates(finished).filter(r=>r.key==='GH-263').map(r=>r.phase)).toEqual(['Maintenance complete','Delivery complete']);
 const live=snapshot([job]);live.project.repository='JFusco/brain';live.maintenance={runs:[run]};
 expect(ticketUpdates(live).filter(r=>r.key==='GH-263').map(r=>r.phase)).toEqual(['Closing out merged work','Maintenance complete']);
});
