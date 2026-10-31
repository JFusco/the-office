import {z} from 'zod';
import type {Store} from './store';
import type {Engine} from './engine';
import type {MaintenanceRun} from '../src/shared';
import {command} from './process';
import {GITHUB_ISSUE_SKILL} from './github-context';

const Result=z.object({outcome:z.enum(['repair-issue','blocked']),issue:z.number().int().min(0),summary:z.string(),receipts:z.array(z.object({id:z.string(),action:z.string(),target:z.string(),verified:z.boolean(),uncertain:z.boolean(),detail:z.string()}).strict())}).strict();

// A failed nightly publication and its source repair are different work. Route
// the repair through normal ownership intake without claiming/retrying nightly.
export class BrainFollowup {
 constructor(private store:Store,private engine:Engine,private execute:typeof command=command){}
 queue(){
  if(this.store.project.id!=='brain'||this.store.state.paused||this.store.state.coordination?.pickup?.enabled===false)return;
  const run=this.store.state.maintenance?.runs.at(-1);
  if(!run||run.status!=='reconciled'||run.blockerFollowup||!run.steps.some(s=>s.stage==='brain-maintenance'&&s.result.blocker==='catalog-refresh-incomplete'))return;
  run.blockerFollowup={status:'queued',detail:'Morgan will route the catalog source blocker to a scoped repair. The refresh remains incomplete.'};
  this.store.emit('maintenance-blocker-queued',run.blockerFollowup.detail,'pm');
 }
 pending(){if(this.store.project.id!=='brain'||this.store.state.coordination?.pickup?.enabled===false)return;return this.store.state.maintenance?.runs.find(r=>r.status==='reconciled'&&r.blockerFollowup?.status==='queued');}
 async pump(run:MaintenanceRun){
  const followup=run.blockerFollowup,pickup=this.store.state.coordination?.pickup||{enabled:true,status:'Ready'};
  if(this.store.state.paused||!pickup.enabled||run.status!=='reconciled'||followup?.status!=='queued')return;
  // Persist before the worker may create anything. Restart/failure never
  // redispatches this writer; original receipts remain available for read-back.
  followup.status='working';this.store.save();
  try{
   const result=await this.engine.agents.run('pm',`Brain catalog blocker follow-up. Joe authorized hands-off team follow-through, including scoped repair intake. Read the reconciled maintenance evidence under ${this.store.dataRoot} for run ${run.id}, the current refresh issue/comments, current AGENTS, source registrations, linked repair PRs and source failure diagnostics. This is diagnosis and issue routing only; no source edits, source sync, nightly claim/retry, publication, merge, schedule or credential changes. Keep the refresh issue open until its own acceptance succeeds. Preserve failed catalogs, backoff, original run IDs and last-good coverage. A 403 is evidence to preserve, never permission to bypass provider restrictions.
Identify the concrete unresolved source defect. First search for its existing open repair issue in ${this.store.project.repository}, all relevant comments and PRs; do not duplicate an existing Sitecore correction or another source repair. Adopt only a matching actionable source-repair issue. If a separate repair is needed, use ${GITHUB_ISSUE_SKILL} to file ONE scoped issue with observed evidence and acceptance criteria. Use discovered labels and add marker ${JSON.stringify(`Office maintenance blocker ${run.id}`)}. Assign the repair to JFusco, place its existing/new card in the configured automatic pickup lane ${JSON.stringify(pickup.status)} of ${this.store.project.githubProject?.url}, then read back issue, assignment, body and board. This explicitly authorizes those routing writes only. The normal assignment listener will check current ownership and dispatch the team; do not implement or launch workers here. Do not lift a human deferral, register unverified sources, or fabricate a fix for access/billing problems. If the next step needs new access or an unresolved product decision, return blocked with that precise decision and owner. Record every attempted mutation and its read-back receipt; uncertainty stops without retries. Return repair-issue only for one verified, open, assigned repair in that configured pickup lane whose acceptance addresses the observed blocker.
Retained maintenance outcomes (historical evidence): ${JSON.stringify(run.steps.map(s=>({stage:s.stage,outcome:s.result.outcome,summary:s.result.summary,blocker:s.result.blocker,ledger:s.result.ledger})))}`,Result,{stage:'maintenance-blocker',requestId:run.id,timeout:15*60*1000});
   if(result.issue)followup.issue=result.issue;
   run.steps.push({role:'pm',stage:'maintenance-blocker',at:new Date().toISOString(),result:{outcome:result.outcome==='repair-issue'?'passed':'blocked',summary:result.summary,blocker:result.outcome==='blocked'?result.summary:'',ledger:'Original nightly refresh remains incomplete.',receipts:result.receipts,candidates:[]}});this.store.save();
   if(result.outcome!=='repair-issue'||!result.issue||!result.receipts.length||result.receipts.some(r=>r.uncertain||!r.verified))throw Error(result.summary||'Source repair routing needs read-back');
   const issue=JSON.parse(await this.execute('gh',['api',`repos/${this.store.project.repository}/issues/${result.issue}`],{cwd:this.store.project.repo,readOnly:true}));
   const board=await this.engine.github.board(),currentPickup=this.store.state.coordination?.pickup||{enabled:true,status:'Ready'};
   if(!currentPickup.enabled||currentPickup.status!==pickup.status||issue.number!==result.issue||issue.html_url!==`https://github.com/${this.store.project.repository}/issues/${result.issue}`||issue.pull_request||issue.state!=='open'||!issue.assignees?.some((a:any)=>a.login==='JFusco')||!board||board.error||board.items.find(i=>i.repository===this.store.project.repository&&i.number===result.issue)?.status!==pickup.status)throw Error('Repair issue, assignment or pickup lane read-back did not match');
   followup.issue=result.issue;followup.status='completed';followup.detail=`Source blocker routed to GH-${result.issue} for normal ownership intake. Nightly refresh is still incomplete; its gate and failures are preserved.`;
   this.store.emit('maintenance-blocker-routed',followup.detail,'pm');
  }catch(error){followup.status=this.store.state.paused?'interrupted':'blocked';followup.detail=String(error);this.store.emit('maintenance-blocker-followup',followup.detail,'pm');}
  finally{this.store.save();}
 }
}
