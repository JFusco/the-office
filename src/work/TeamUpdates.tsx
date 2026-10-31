import {useLiveTiming} from '../timing/useLiveTiming';
import {ROLE_NAMES} from '../shared';
import {deliveryRepairProjection} from './delivery-repair-projection';
import type {OfficeSnapshot,TicketJob} from '../shared';
import {shortSummary,readinessWait,maintenanceIssue} from './work-summary';
import {displayAgentTask} from '../scene/agent-activity';
import {Tag,cx,interactive} from '../ui';
const phases:Record<TicketJob['stage'],string>={'ci-recovery':'Recovering failed merge checks','scope-repair':'Alex repairs the saved candidate', 'update-base':'Updating candidate base',implement:'Building the fix',review:'Independent review',validate:'Verifying the fix',draft:'Publishing the PR','lead-pr':'Checking PR readiness','prepare-pr':'Preparing PR dependencies',merge:'Merging verified PR',closeout:'Closing out merged work'};
const following:Record<TicketJob['stage'],string>={'ci-recovery':'Morgan assigns the scoped repair delivery.','scope-repair':'Independent review and verification of the repaired head.', 'update-base':'Run required checks, then update the same PR. No repeated source review for conflict repair.',implement:'Team-selected checks, then publication.',review:'Verify the reviewed fix.',validate:'Prepare the draft PR.',draft:'Check live PR readiness.','lead-pr':'Merge when the required checks and project rules allow.','prepare-pr':'Check current PR requirements.',merge:'Watch Actions on the merge commit.',closeout:'Verify issue and board closeout, then pick up the next ticket.'};
export function ticketUpdates(snapshot:OfficeSnapshot){
 const rows=new Map<string,{key:string;title:string;status:string;phase:string;summary:string;next:string;at:string;workerActive?:boolean}>();
 for(const r of snapshot.coordination?.listener.reviews||[])rows.set(r.key,{key:r.key,title:r.summary,status:r.retry?.nextAt?'retrying':r.status,phase:r.status==='working'?'Morgan’s intake':'Intake',summary:shortSummary(r.detail,160),next:r.retry?.nextAt?`Morgan will retry this read at ${new Date(r.retry.nextAt).toLocaleTimeString()} (attempt ${r.retry.attempts+1}/3). No approval needed.`:r.status==='queued'?'Morgan checks this after the current delivery.':r.status==='working'?'Check ownership and choose the next delivery step.':['blocked','interrupted'].includes(r.status)?'Stopped; read back the original session before continuing.':'Intake finished; see delivery or the project pickup rule.',at:r.endedAt||r.startedAt||r.queuedAt});
 for(const r of rows.values())if(r.status==='working'){
  const agent=snapshot.agents.find(a=>a.activity==='working'&&a.ticket===r.key);
  const work=snapshot.workLog?.filter(w=>w.ticket===r.key&&w.status==='running').at(-1);
  r.summary=agent?shortSummary(agent.task.split(' · ').slice(1).join(' · ')||agent.task,160):'Morgan is checking ownership and the next delivery step.';
  r.at=agent?.lastSeen||work?.lastHeartbeatAt||r.at;
 }
 for(const j of (snapshot.coordination?.jobs||[]).filter(j=>j.status!=='cancelled')){
  const work=snapshot.workLog?.filter(w=>w.ticket===j.key&&w.status==='running').at(-1);
  const agent=work&&snapshot.agents.find(a=>a.id===work.role&&['working','disconnected'].includes(a.activity)&&a.ticket===j.key);
  const active=j.status==='working';
  const workerActive=agent?.activity==='working'&&work?.timerStatus!=='last-confirmed';
  const reconciling=!!agent&&['blocked','interrupted'].includes(j.status);
  const workerName=agent?ROLE_NAMES[agent.id]:'';
  const repair=deliveryRepairProjection(j);
  const wait=j.status==='watching'&&!j.mergeCommit?readinessWait(j):undefined;
  rows.set(j.key,{key:j.key,title:snapshot.tickets.find(t=>t.key===j.key)?.summary||snapshot.github?.issues.find(t=>t.key===j.key)?.title||rows.get(j.key)?.title||'Issue delivery',workerActive,status:j.ciFollowupKey?'waiting':wait?wait.blocked?'blocked':'waiting':j.retry?.nextAt?'retrying':j.dependsOnPR?'waiting':j.status,phase:reconciling?`Delivery blocked · ${workerName} ${workerActive?'reconciles saved work':'last confirmed'}`:j.ciFollowupKey?`Waiting for CI repair ${j.ciFollowupKey}`:wait?wait.phase:j.status==='completed'?'Delivery complete':j.status==='watching'&&j.mergeCommit?'Watching merge Actions':repair?.phase||phases[j.stage],summary:agent?`${workerName}: ${shortSummary(displayAgentTask(agent,snapshot).split(' · ').slice(1).join(' · '),160)}`:j.ciFollowupKey?shortSummary(j.detail,240):wait?wait.summary:agent?shortSummary(displayAgentTask(agent,snapshot).split(' · ').slice(1).join(' · '),160):active?j.status==='watching'?'Waiting for GitHub verification; this ticket is still with the team.':`${phases[j.stage]}${j.pr?` · PR #${j.pr}`:''}.`:shortSummary(j.detail,160),next:reconciling?`Delivery awaits ${workerName}’s reconciliation result; Morgan coordinates the next stage.`:j.ciFollowupKey?`The team owns ${j.ciFollowupKey}; original failed runs remain recorded.`:wait?wait.next:j.retry?.nextAt?`Safe read retry at ${new Date(j.retry.nextAt).toLocaleTimeString()} (attempt ${j.retry.attempts+1}/3). No approval needed.`:j.dependsOnPR?`Waiting for parent PR #${j.dependsOnPR}.`:j.status==='completed'?'Closed out; the next eligible ticket can start.':['blocked','interrupted'].includes(j.status)&&j.repairCycle?.phase!=='diagnosis'?'Stopped; this delivery is not complete.':repair?`Delivery owner: ${repair.owner}. ${repair.next||following[j.stage]}`:following[j.stage],at:work?.lastHeartbeatAt||snapshot.events?.filter(e=>e.ticket===j.key&&e.kind==='github-delivery-stage'&&e.message===`${j.key} · ${j.stage}`).map(e=>e.at).sort().at(-1)||j.updatedAt||j.requestedAt});
 }
 const maintenance=snapshot.maintenance?.runs.at(-1);
 if(maintenance&&['working','blocked','interrupted','queued'].includes(maintenance.status)){
  const key=maintenanceIssue(maintenance,snapshot.project?.repository||'');
  if(key&&!rows.has(key))rows.set(key,{key,title:snapshot.github?.issues.find(i=>i.key===key)?.title||'Project maintenance',status:maintenance.readbackRetry&&!maintenance.readbackRetry.exhausted?'queued':maintenance.status,phase:maintenance.readbackRetry&&!maintenance.readbackRetry.exhausted?'Recovery queued for Morgan':['blocked','interrupted'].includes(maintenance.status)?'Maintenance stopped':'Project maintenance',summary:shortSummary(maintenance.steps.at(-1)?.result.summary||maintenance.error||'Maintenance is queued.',240),next:['blocked','interrupted'].includes(maintenance.status)?'Next needed: Morgan reconciles the failed sources and catalog changes. Preserve the native retry gate; no automatic publication.':'Morgan coordinates maintenance through the project’s native gate.',at:maintenance.endedAt||maintenance.startedAt||maintenance.requestedAt});
 }
 const rank=(s:string)=>['working','watching','retrying'].includes(s)?0:['blocked','interrupted','waiting'].includes(s)?1:s==='queued'?2:3;
 return [...rows.values()].sort((a,b)=>Number(!!b.workerActive)-Number(!!a.workerActive)||rank(a.status)-rank(b.status)||(b.at||'').localeCompare(a.at||''));
}
export function deliveryChanges(before:OfficeSnapshot,after:OfficeSnapshot){
 if(before.project?.id!==after.project?.id)return [];
 const prior=new Map((before.coordination?.jobs||[]).map(j=>[j.id,j]));
 return (after.coordination?.jobs||[]).flatMap(j=>{
  const old=prior.get(j.id);if(!old||old.status===j.status&&old.stage===j.stage)return [];
  if(j.status==='cancelled')return [];
  const message=j.status==='completed'?'Delivery complete; issue and board closeout verified.':j.status==='blocked'||j.status==='interrupted'?`Stopped: ${shortSummary(j.detail,140)}`:j.status==='watching'?j.mergeCommit?'PR merged; watching Actions before closeout.':`${readinessWait(j).phase}: ${readinessWait(j).summary}`:j.status==='working'?`${phases[j.stage]}. ${following[j.stage]}`:j.status==='queued'&&old.stage!==j.stage?`${phases[j.stage]} queued next.`:'';
  return message?[`${j.key}${j.pr?` · PR #${j.pr}`:''}: ${message}`]:[];
 });
}
export function TeamUpdates({snapshot,onOpen}:{snapshot:OfficeSnapshot;onOpen:(key:string)=>void}){
 const observed=snapshot.project?.provider==='github'?snapshot.github?.observedAt:snapshot.azure.observedAt;
 const stale=!observed||Date.parse(snapshot.serverTime)-Date.parse(observed)>150000;
 const timed=useLiveTiming(snapshot);
 const all=ticketUpdates(timed),active=all.filter(r=>r.workerActive||['working','watching'].includes(r.status));
 const rows=[...active,...all.filter(r=>!active.includes(r)).slice(0,Math.max(0,2-active.length))];
 return rows.length?<section className="pointer-events-auto absolute bottom-6 left-9 z-7 max-h-updates-height w-updates overflow-auto rounded-10 border border-updates-line bg-updates p-4 max-dock:bottom-5 max-dock:left-4 max-dock:max-h-updates-height-compact max-dock:w-updates-compact" aria-labelledby="team-updates-title"><h2 id="team-updates-title" className="mb-2 text-13 font-heading">Team updates <small className="text-11 font-regular text-muted">Current work and the next step</small></h2><p className="mb-2 text-10 text-freshness">{observed?`Project progress checked ${new Date(observed).toLocaleTimeString()}`:'Project progress not yet verified'}{stale?' · Saved view; refresh needed':' · Current read-back'}</p>{rows.map(r=><button type="button" className={cx('-mx-2 block w-[calc(100%+16px)] rounded-5 border-t border-line px-2 py-2.5 text-left hover:bg-icon-hover',interactive)} key={r.key} onClick={()=>onOpen(r.key)}><strong className="block text-12 leading-normal">{r.key} · {r.title}</strong><Tag tone={r.status} className="mt-1">{r.phase} · {r.status}</Tag><p className="my-1.5 text-11 leading-normal">{r.summary}</p><small className="text-11 leading-normal">{r.next}</small><small className="mt-2 block text-11 leading-normal text-muted">Last update {r.at?new Date(r.at).toLocaleTimeString(): 'unavailable'}</small></button>)}</section>:null;
}
