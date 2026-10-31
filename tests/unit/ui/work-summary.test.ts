import {expect,test} from 'vitest';
import {mailboxWork,shortSummary,actionSummary,readinessWait} from '../../../src/work-summary';
import {initialSnapshot} from '../../../server/store/store';
import {syncOutbox} from '../../../server/conversations/outbox';
import {coordination} from '../../../server/scheduling/coordination';
test('mailbox counts latest queued reviews, not previously reviewed or unassigned tracked tickets',()=>{
 const s=initialSnapshot();s.coordination=coordination();s.coordination.listener.reviews=[{key:'GH-1',status:'queued'},{key:'GH-1',status:'owned'},{key:'GH-2',status:'queued'},{key:'GH-3',status:'working'}] as any;
 expect(mailboxWork(s)).toMatchObject({queued:1,working:1,reviewed:1});
});
test('summary keeps evidence out of the face and identifies follow-up versus approval',()=>{
 expect(shortSummary('Existing PR routed to Sam.\nHEAD '+ 'a'.repeat(40))).toBe('Existing PR routed to Sam.');expect(shortSummary('Long '.repeat(100)).length).toBeLessThanOrEqual(240);expect(actionSummary('ticket-job:1')).toContain('No merge approval');
});
test('an existing PR replaces duplicate ownership requests with the delivery state',()=>{
 const s=initialSnapshot();s.coordination=coordination();s.coordination.listener.reviews=[{id:'1',key:'GH-1',status:'blocked',detail:'Missing session inventory'}] as any;
 syncOutbox(s);expect(s.outbox.filter(x=>x.status==='open')).toHaveLength(1);
 s.coordination.jobs=[{id:'j',key:'GH-1',pr:20,status:'watching'}] as any;syncOutbox(s);expect(s.outbox.filter(x=>x.status==='open')).toHaveLength(0);
});
test('a stopped permission review remains visible in the outbox while observation continues',()=>{
 const s=initialSnapshot();s.coordination=coordination();const j:any={id:'j',key:'GH-274',pr:275,prUrl:'https://github.com/JFusco/brain/pull/275',stage:'lead-pr',status:'watching',steps:[{stage:'lead-pr',result:{outcome:'blocked',summary:'Review ended',blocker:'GitHub protection read returned HTTP 403',findings:[{id:'provider-protection-permission',summary:'Permission denied',status:'open'}]}}]};s.coordination.jobs=[j];
 syncOutbox(s);expect(s.outbox.find(o=>o.status==='open')).toMatchObject({id:'ticket-job:j',title:'GH-274 needs team follow-up',role:'pm',ticket:'GH-274',url:j.prUrl});expect(s.outbox[0].detail).toContain('Morgan and Ellis');expect(readinessWait(j)).toMatchObject({blocked:true,phase:'Blocked · GitHub policy inspection'});
 j.steps.push({stage:'lead-pr',result:{outcome:'passed',findings:[],summary:'Readiness verified'}});syncOutbox(s);expect(s.outbox.filter(o=>o.status==='open')).toHaveLength(0);
});
test('pending checks do not create a human follow-up while GitHub is still running them',()=>{
 const s=initialSnapshot();s.coordination=coordination();s.coordination.jobs=[{id:'j',key:'GH-274',pr:275,stage:'lead-pr',status:'watching',steps:[{stage:'lead-pr',result:{outcome:'blocked',blocker:'Required checks are pending',summary:'Checks running',findings:[{id:'checks-pending',summary:'Required checks pending',actual:'Still running',status:'open'}]}}]}] as any;
 syncOutbox(s);expect(s.outbox.filter(o=>o.status==='open')).toHaveLength(0);expect(readinessWait(s.coordination.jobs![0]).blocked).toBe(false);
});

test('Backlog approval questions leave the active outbox while their conversation and real delivery blockers remain',()=>{
 const s=initialSnapshot();s.project={id:'brain',name:'Brain',provider:'github'} as any;s.coordination=coordination();s.coordination.listener.assigned=[{key:'GH-70',status:'open',pickupStatus:'Backlog'}] as any;
 s.messages=[{id:'question',from:'pm',ticket:'GH-70',question:'Which step are you approving?',receipts:[],actionId:'assignment:old',error:''}] as any;
 syncOutbox(s);expect(s.outbox.filter(a=>a.status==='open')).toHaveLength(0);expect(s.messages[0].question).toBe('Which step are you approving?');
 s.coordination.jobs=[{id:'live-work',key:'GH-70',status:'blocked',detail:'Uncertain writer result'}] as any;
 syncOutbox(s);expect(s.outbox.some(a=>a.id==='ticket-job:live-work'&&a.status==='open')).toBe(true);expect(s.outbox.some(a=>a.id==='question:question'&&a.status==='open')).toBe(true);
});
