import {expect,test,vi} from 'vitest';
import {assessPlanning,cancelObsoleteAssessment} from '../../../../server/features/handoff/planning-assessment';
import {openAssessment,saveAssessment,assessmentEpisode,closeAssessment} from '../../../../server/features/handoff/disposition-store';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {scheduledCaptures} from '../../../../server/features/handoff/scheduled-captures';
import {requestCapture} from '../../../../server/features/handoff/capture-store';
import {handoffFixture} from './fixture';
const result=(disposition:'ordinary'|'planning')=>({disposition,rationale:'Assessed requirements',requirements:['a'],acceptanceCriteria:['b'],settledDecisions:[],openQuestions:[],imageObservations:[]});
const clear=async()=>({status:'clear' as const,reason:''});
function captured(description='Requirements'){const evidence=blankEvidence('brain','GH-1','github','JFusco/brain#1');evidence.summary='Feature';evidence.description=description;evidence.coverage={issue:{state:'complete'},comments:{state:'complete'},children:{state:'complete'}};return evidence;}
function claimed(f:ReturnType<typeof handoffFixture>){
 f.store.state.coordination!.listener.assigned=[{key:'GH-1',status:'OPEN',pickupStatus:'Ready'} as any];
 const e=openAssessment(f.store,'GH-1','v1',true);e.evidence=storeEvidence(f.store,captured());saveAssessment(f.store,e);
 f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'scheduler','planning-assessment');return e;
}
async function completeCapture(f:ReturnType<typeof handoffFixture>,id:string,description?:string){
 const item=scheduledCaptures({store:f.store} as any,async()=>{const evidence=captured(description);return {evidence,reference:storeEvidence(f.store,evidence)};}).find(w=>w.work.id==='evidence-capture:assessment:'+id)!;
 await item.execute();
}
test.each(['ordinary','planning'] as const)('a %s result returned during a pending capture is retained and finalized on unchanged evidence without relaunching Morgan',async disposition=>{
 const f=handoffFixture();try{
 const e=claimed(f);let finish!:(value:any)=>void;
 const workers={active:new Map(),run:vi.fn(()=>new Promise(resolve=>{finish=resolve}))};
 const pending=assessPlanning(f.store,workers as any,e.id,clear);expect(workers.run).toHaveBeenCalledTimes(1);
 requestCapture(f.store,'assessment:'+e.id,'GH-1','periodic','v1');
 finish(result(disposition));await pending;
 const held=assessmentEpisode(f.store,e.id)!;expect(held.closedAt).toBeUndefined();expect(held.result?.disposition).toBe(disposition);expect(held.recoveredAttemptId).toBe(held.attemptId);
 expect(f.store.state.features!.filter(x=>x.sourceTicket==='GH-1')).toHaveLength(0);
 await completeCapture(f,e.id);
 if(disposition==='planning'){expect(assessmentEpisode(f.store,e.id)!.closedAt).toBeUndefined();await assessPlanning(f.store,workers as any,e.id,clear);}
 expect(assessmentEpisode(f.store,e.id)!.outcome).toBe(disposition==='ordinary'?'ordinary-by-model':'planning-enrolled');
 expect(f.store.state.features!.filter(x=>x.sourceTicket==='GH-1')).toHaveLength(disposition==='planning'?1:0);
 expect(workers.run).toHaveBeenCalledTimes(1);
 }finally{f.close();}
});
test('a changed capture invalidates the retained result and a fresh Morgan run decides',async()=>{
 const f=handoffFixture();try{
 const e=claimed(f);let finish!:(value:any)=>void;
 const workers={active:new Map(),run:vi.fn(async()=>result('ordinary'))};
 workers.run.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
 const pending=assessPlanning(f.store,workers as any,e.id,clear);expect(workers.run).toHaveBeenCalledTimes(1);
 requestCapture(f.store,'assessment:'+e.id,'GH-1','periodic','v1');
 finish(result('ordinary'));await pending;await completeCapture(f,e.id,'Changed requirements');
 const changed=assessmentEpisode(f.store,e.id)!;expect(changed.generation).toBe(e.generation+1);expect(changed.result).toBeUndefined();expect(changed.closedAt).toBeUndefined();
 await assessPlanning(f.store,workers as any,e.id,clear);
 expect(workers.run).toHaveBeenCalledTimes(2);expect(assessmentEpisode(f.store,e.id)!.outcome).toBe('ordinary-by-model');
 }finally{f.close();}
});
test('a late result after a generation change is ignored',async()=>{
 const f=handoffFixture();try{
 const e=claimed(f);let finish!:(value:any)=>void;const workers={active:new Map(),run:vi.fn(()=>new Promise(resolve=>{finish=resolve}))};
 const pending=assessPlanning(f.store,workers as any,e.id,clear);
 const current=assessmentEpisode(f.store,e.id)!;current.generation++;saveAssessment(f.store,current);
 finish(result('planning'));await pending;
 expect(assessmentEpisode(f.store,e.id)!.result).toBeUndefined();expect(f.store.state.features!.filter(x=>x.sourceTicket==='GH-1')).toHaveLength(0);
 }finally{f.close();}
});
test('explicit Start remains terminal and ignores late planning output',async()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true);e.evidence=storeEvidence(f.store,blankEvidence('brain','GH-1','github','repo#1'));saveAssessment(f.store,e);
 const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'scheduler','planning-assessment')!;
 let finish!:(value:any)=>void;const controller=new AbortController();const workers={active:new Map(),run:vi.fn(()=>{workers.active.set('pm',controller);return new Promise(resolve=>{finish=resolve})})};
 const pending=assessPlanning(f.store,workers as any,e.id,async()=>({status:'clear',reason:''}));expect(workers.run).toHaveBeenCalledTimes(1);
 f.advance(600000);const current=assessmentEpisode(f.store,e.id)!;closeAssessment(f.store,current,'ordinary-by-start');cancelObsoleteAssessment(f.store,current);
 expect(controller.signal.aborted).toBe(true);expect(f.store.activeClaims()[0].id).toBe(claim.id);
 finish({disposition:'planning',rationale:'Plan it',requirements:['a'],acceptanceCriteria:['b'],settledDecisions:[],openQuestions:[],imageObservations:[]});await pending;
 expect(assessmentEpisode(f.store,e.id)!.outcome).toBe('ordinary-by-start');expect(f.store.state.features!.filter(f=>f.sourceTicket==='GH-1')).toHaveLength(0);
 }finally{f.close();}
});
