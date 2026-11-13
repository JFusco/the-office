import type { OfficeEntry } from '../../scheduling/scheduled-work';
import { type ScheduledWork } from '../../scheduling/scheduler';
import { assessmentEnabled, assessmentEpisodes, assessmentEpisode, type AssessmentEpisode } from './disposition-store';
import { assessPlanning } from './planning-assessment';
import { captureRequest } from './capture-store';
import { automaticTicketIntakeWait } from './intake-eligibility';
export function assessmentWait(entry:OfficeEntry,episode:AssessmentEpisode,now:Date):string|undefined {
 if(entry.store.state.paused||entry.store.state.draining)return entry.store.state.draining?'Office is draining':'Project is paused';
 const intakeWait=automaticTicketIntakeWait(entry.store,episode.key);if(intakeWait)return intakeWait;
 const capture=captureRequest(entry.store,'assessment:'+episode.id);
 if(!episode.evidence||capture&&['queued','working'].includes(capture.status))return 'Waiting for current ticket evidence capture';
 if(episode.nextAt&&Date.parse(episode.nextAt)>now.getTime())return 'Waiting for assessment retry backoff';
}
export function scheduledAssessments(entry:OfficeEntry,now=entry.store.clock.now()):ScheduledWork[] {
 const {store,engine,coordinator}=entry;if(!assessmentEnabled(store))return [];
 return assessmentEpisodes(store).filter(e=>!e.closedAt).map(episode=>{
  const wait=assessmentWait(entry,episode,now),running=store.activeClaims().some(c=>c.work.kind==='assessment'&&c.work.id==='assessment:'+episode.id);
  return {store,work:{projectId:store.project.id,kind:'assessment',id:'assessment:'+episode.id},stage:'planning-assessment',rank:3,enqueuedAt:episode.enqueuedAt,
   eligibility:{state:running?'running':wait?'waiting':'runnable',reason:wait||episode.reason,owner:'Morgan',nextCheckAt:episode.nextAt??null},
   identity:()=>{const e=assessmentEpisode(store,episode.id);return JSON.stringify([e?.generation,e?.attempts,e?.closedAt,e?.evidence?.evidenceDigest,e?.policyDigest]);},
   claimEligible:()=>{const e=assessmentEpisode(store,episode.id);return !!e&&assessmentEnabled(store)&&!e.closedAt&&e.generation===episode.generation&&!assessmentWait(entry,e,store.clock.now());},
   execute:()=>assessPlanning(store,engine.agents,episode.id,async()=>{await coordinator?.sessionBridge?.refresh();const visibility=coordinator?.sessionBridge?.forProject(store,episode.key,'assessment:'+episode.id);return {status:visibility?.ownership.status==='clear'?'clear':visibility?.ownership.status==='owned'?'owned':'unknown',reason:visibility?.ownership.detail||'Current external ownership evidence is unavailable'};})
  } satisfies ScheduledWork;
 });
}
