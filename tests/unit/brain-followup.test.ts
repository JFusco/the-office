import {afterEach,expect,test} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {Store} from '../../server/store';
import {Engine} from '../../server/engine';
import {BrainFollowup} from '../../server/brain-followup';
import {projectById} from '../../server/projects';
import {coordination,Coordinator} from '../../server/coordination';
import type {MaintenanceRun} from '../../src/shared';
const stores:Store[]=[],roots:string[]=[];
afterEach(()=>{stores.splice(0).forEach(s=>s.close());roots.splice(0).forEach(r=>rmSync(r,{recursive:true,force:true}));});
function setup(){
 const root=mkdtempSync(resolve(tmpdir(),'brain-followup-'));roots.push(root);const store=new Store(':memory:',projectById('brain'),root);stores.push(store);const engine=new Engine(store);
 const run:MaintenanceRun={id:'original',requestedAt:'',startedAt:'',endedAt:'',status:'reconciled',weekly:false,stage:'brain-maintenance',error:'',steps:[{role:'pm',stage:'brain-maintenance',at:'',result:{outcome:'blocked',summary:'Content Hub catalog lost sitemap coverage',ledger:'Keep refresh #273 open',blocker:'catalog-refresh-incomplete',receipts:[],candidates:[]}}]};
 store.state.maintenance={runs:[run],lastDaily:'',lastWeekly:'',ledger:''};store.state.coordination=coordination();store.state.coordination.enabled=true;
 let reads=0;const followup=new BrainFollowup(store,engine,async()=>{reads++;return JSON.stringify({number:274,html_url:'https://github.com/JFusco/brain/issues/274',state:'open',assignees:[{login:'JFusco'}]});});
 engine.github.board=async()=>({error:'',items:[{repository:'JFusco/brain',number:274,status:'Ready'}]}) as any;
 return {store,engine,run,followup,reads:()=>reads};
}
test('only a reconciled catalog failure queues one durable repair handoff without a nightly retry',()=>{
 const a=setup();a.run.status='blocked';a.followup.queue();expect(a.run.blockerFollowup).toBeUndefined();
 a.run.status='reconciled';a.store.state.coordination!.pickup={enabled:false,status:'Ready'};a.followup.queue();expect(a.run.blockerFollowup).toBeUndefined();a.store.state.coordination!.pickup.enabled=true;a.store.state.paused=true;a.followup.queue();expect(a.run.blockerFollowup).toBeUndefined();a.store.state.paused=false;
 a.followup.queue();const saved=a.run.blockerFollowup;a.followup.queue();expect(a.run.blockerFollowup).toBe(saved);expect(new Coordinator(a.store,a.engine).hasQueued()).toBe(true);expect(a.store.state.maintenance!.lastDaily).toBe('');
});
test('verified repair routes to normal intake while failed refresh and receipts remain preserved',async()=>{
 const a=setup();a.followup.queue();let workers=0;
 a.engine.agents.run=async(_role,task,_schema,options)=>{workers++;expect(task).toContain('no source edits');expect(options?.stage).toBe('maintenance-blocker');expect(a.run.blockerFollowup!.status).toBe('working');return {outcome:'repair-issue',issue:274,summary:'Verified repair issue',receipts:[{id:'issue',action:'Create issue',target:'https://github.com/JFusco/brain/issues/274',verified:true,uncertain:false,detail:'Saved and read back'}]} as any;};
 await a.followup.pump(a.run);expect(a.run.blockerFollowup).toMatchObject({status:'completed',issue:274});expect(a.run.status).toBe('reconciled');expect(a.run.steps[0].result.outcome).toBe('blocked');expect(a.run.steps.at(-1)?.result.receipts).toHaveLength(1);expect(a.store.state.maintenance!.lastDaily).toBe('');
 a.followup.queue();await a.followup.pump(a.run);expect(workers).toBe(1);expect(a.reads()).toBe(1);expect(a.store.state.coordination!.jobs).toBeUndefined();
});
test('uncertain routing and interrupted writers never automatically replay',async()=>{
 const a=setup();a.followup.queue();let workers=0;a.engine.agents.run=async()=>{workers++;return {outcome:'repair-issue',issue:274,summary:'Write uncertain',receipts:[{verified:false,uncertain:true}]} as any;};
 await a.followup.pump(a.run);expect(a.run.blockerFollowup!.status).toBe('blocked');a.followup.queue();await a.followup.pump(a.run);expect(workers).toBe(1);expect(a.reads()).toBe(0);
 a.run.blockerFollowup!.status='working';a.store.recover();expect(a.run.blockerFollowup!.status).toBe('interrupted');a.followup.queue();await a.followup.pump(a.run);expect(workers).toBe(1);
});
test('a claimed repair outside Ready fails independent board verification',async()=>{
 const a=setup();a.followup.queue();a.engine.agents.run=async()=>({outcome:'repair-issue',issue:274,summary:'Claimed',receipts:[{verified:true,uncertain:false}]}) as any;a.engine.github.board=async()=>({error:'',items:[{repository:'JFusco/brain',number:274,status:'Backlog'}]}) as any;
 await a.followup.pump(a.run);expect(a.run.blockerFollowup!.status).toBe('blocked');expect(a.run.blockerFollowup!.detail).toContain('read-back');
});
