import type {Store} from '../../store/store';
import type {Engine} from '../../scheduling/engine';
import type {MaintenanceRun} from '../../../src/shared';
import {command} from '../../workers/process';
import {maintenanceStopOf} from '../publication/maintenance-stop';
import {admitFollowup,routeFollowup} from './brain-followup-run';

// A failed nightly publication and its source repair are different work. Route
// the repair through normal ownership intake without claiming/retrying nightly.
// Under #612 the model only diagnoses; the harness files or adopts, assigns and places the repair through Effects.
export class BrainFollowup {
 constructor(private store:Store,private engine:Engine,private execute:typeof command=command){}
 queue(){
  if(this.store.project.id!=='brain'||this.store.state.paused||this.store.state.coordination?.pickup?.enabled===false)return;
  const run=this.store.state.maintenance?.runs.at(-1);
  if(!run||run.status!=='reconciled'||run.blockerFollowup||!run.steps.some(s=>s.stage==='brain-maintenance'&&s.result.blocker==='catalog-refresh-incomplete'))return;
  run.blockerFollowup={status:'queued',publicationVersion:1,detail:'Morgan will route the catalog source blocker to a scoped repair. The refresh remains incomplete.'};
  this.store.emit('maintenance-blocker-queued',run.blockerFollowup.detail,'pm');
 }
 /** The queued follow-up the scheduler selected, or the first queued one. */
 pending(selectedId?:string){if(this.store.project.id!=='brain'||this.store.state.coordination?.pickup?.enabled===false)return;return this.store.state.maintenance?.runs.find(r=>r.status==='reconciled'&&r.blockerFollowup?.status==='queued'&&(!selectedId||r.id===selectedId));}
 async pump(run:MaintenanceRun){
  const followup=run.blockerFollowup,pickup=this.store.state.coordination?.pickup||{enabled:true,status:'Ready'};
  if(this.store.state.paused||!pickup.enabled||run.status!=='reconciled'||followup?.status!=='queued')return;
  if(!admitFollowup(this.store,run))return;
  // Persist before the worker may create anything. Restart/failure never
  // redispatches the diagnosis; every routing write is read back under its original intent first.
  followup.status='working';delete followup.stop;this.store.save();
  try{await routeFollowup(this.store,this.engine,this.execute,run,pickup);}
  catch(error){followup.status=this.store.state.paused?'interrupted':'blocked';followup.detail=String(error);const stop=maintenanceStopOf(error,new Date().toISOString());if(stop)followup.stop=stop;this.store.emit('maintenance-blocker-followup',followup.detail,'pm');}
  finally{this.store.save();}
 }
}
