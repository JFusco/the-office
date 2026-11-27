import {afterEach,expect,test,vi} from 'vitest';
import {fakeGitHub,cleanupFakes} from '../support/fake-github';
import {claimedDelivery} from '../../../fixtures/delivery-claim';
afterEach(cleanupFakes);
import {ProjectProgress} from '../../../../server/delivery/board/project-progress';
import {initialSnapshot} from '../../../../server/store/store';
import {projectById} from '../../../../server/office/projects';
function setup(){
 const f=fakeGitHub(255),state=f.store.state;state.project=f.store.project;state.github={status:'idle',error:'',observedAt:'',issues:[],prs:[],runs:[],board:{items:[{number:255,repository:'JFusco/cms-field-vocabulary',status:'In progress'}]} as any};
 const store=f.store,job=f.candidate({stage:'review',status:'working'});
 let lane='progress',writes=0,timeout=false,foreign=false;let onRead=(_query:string)=>{};
 const execute=async(_program:string,_args:string[],opts?:any)=>{const {query}=JSON.parse(opts.input);let data:any;
  if(query.startsWith('mutation')){writes++;if(timeout)throw new Error('timeout after send');lane='review';data={};}
  else if(query.includes('fields(first'))data={user:{projectV2:{id:'project',fields:{nodes:[{id:'status',name:'Status',options:[{id:'progress',name:'In progress'},{id:'review',name:'In review'},{id:'backlog',name:'Backlog'}]}],pageInfo:{hasNextPage:false}}}}};
  else if(query.includes('items(first'))data={node:{items:{nodes:[{id:'item',content:{number:255,repository:{nameWithOwner:foreign?'wrong/repo':'JFusco/cms-field-vocabulary'}}}],pageInfo:{hasNextPage:false}}}};
  else data={node:{id:'item',fieldValues:{nodes:[{field:{id:'status'},optionId:lane}],pageInfo:{hasNextPage:false}}}};
  if(!query.startsWith('mutation'))onRead(query);
  return JSON.stringify({data});
 };
 return {store,job,progress:{reviewStarted:(_job:typeof job)=>claimedDelivery(store,job,()=>new ProjectProgress(store,execute).reviewStarted(job),false)},writes:()=>writes,lane:(v:string)=>lane=v,timeout:()=>timeout=true,foreign:()=>foreign=true,onRead:(fn:(query:string)=>void)=>onRead=fn};
}
test('only a claimed review moves its existing exact-repository card, with read-back',async()=>{
 const a=setup();a.job.status='queued';await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('claimed');expect(a.writes()).toBe(0);
 a.job.status='working';await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);expect(a.job.boardUpdates![0].status).toBe('verified');expect(a.store.state.github!.board!.items[0].status).toBe('In review');
 await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);
});
test('an uncertain board write is read back on its original identity and never replayed',async()=>{
 const a=setup();a.timeout();await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('read-back');expect(a.job.boardUpdates![0].status).toBe('uncertain');
 await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('remains uncertain');expect(a.writes()).toBe(1);
 a.lane('review');await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);expect(a.job.boardUpdates!.every((u:any)=>u.status==='verified')).toBe(true);
});
test('a live card that left the verified review lane surfaces a conflict and does not report a second success', async () => {
 const a = setup();
 await a.progress.reviewStarted(a.job);
 const updates = a.job.boardUpdates!.length;
 a.lane('progress');
 await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('Issue card left In review');
 expect(a.writes()).toBe(1);
 expect(a.job.boardUpdates).toHaveLength(updates);
 expect(a.store.state.events.filter(event => event.kind === 'review-board-status')).toHaveLength(1);
});
test('a same-number foreign card or a Backlog hold cannot be moved by review dispatch',async()=>{
 const a=setup();a.foreign();await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('no existing card');expect(a.writes()).toBe(0);
 const b=setup();b.lane('backlog');await expect(b.progress.reviewStarted(b.job)).rejects.toThrow('deferred');expect(b.writes()).toBe(0);
});

test('claim loss during the final board read prevents both the transition intent and write',async()=>{
 const a=setup();a.onRead(query=>{if(query.includes('fieldValues'))for(const claim of a.store.activeClaims())a.store.finishClaim(claim.id,'stopping');});
 await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('scheduler claim');expect(a.writes()).toBe(0);expect(a.job.boardUpdates).toBeUndefined();
});

test('the review card move is one harness Effect bound to the stage, head and lane, dispatching while it is sent and never resent',async()=>{
 const a=setup(),seen:string[]=[];
 a.onRead(()=>{});
 const before=a.writes();
 a.onRead(query=>{if(query.includes('fieldValues'))seen.push(...(a.store.db.prepare("SELECT id,status FROM effects").all() as {id:string;status:string}[]).map(row=>`${row.id}=${row.status}`));});
 await a.progress.reviewStarted(a.job);
 expect(a.writes()).toBe(before+1);
 const id=`harness:${a.job.id}:review:${a.job.head}:in-review:lane:item`;
 // The read-back after the write sees the intent the write was sent under.
 expect(seen).toContain(`${id}=dispatching`);
 expect(a.store.getEffect(id)).toMatchObject({status:'verified',operation:'github-project-status',payload:{project:'project',item:'item',field:'status',option:'review',head:a.job.head}});
 // A lost response leaves the Effect for read-back; it is reconciled by reading, never sent again.
 const b=setup();b.timeout();
 await expect(b.progress.reviewStarted(b.job)).rejects.toThrow('read-back');
 const lost=`harness:${b.job.id}:review:${b.job.head}:in-review:lane:item`;
 expect(b.store.getEffect(lost)?.status).toBe('uncertain');
 b.lane('review');await b.progress.reviewStarted(b.job);
 expect(b.writes()).toBe(1);
 expect(b.store.getEffect(lost)?.status).toBe('verified');
});
