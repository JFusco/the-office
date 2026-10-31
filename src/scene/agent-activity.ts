import type { Agent,OfficeSnapshot } from '../shared';
import {durationLabel} from '../timing/timing';
export const githubStageLabels:Record<string,string>={
 'ci-recovery':'Diagnosing failed merge checks',
 'implementation-readback':'Reconciling saved implementation',
 'preparation-readback':'Reconciling saved PR preparation',
 'validation-readback':'Reconciling saved verification',
 'github-implement':'Building the issue fix','github-update-base':'Updating the candidate base',
 'github-review':'Reviewing the issue fix','github-validate':'Verifying the issue fix',
 'github-draft':'Linking a draft PR','github-prepare-pr':'Preparing PR dependencies',
 'github-lead-pr':'Checking PR readiness for merge','github-closeout':'Closing out merged work',
};
export function displayAgentTask(agent:Agent,snapshot:OfficeSnapshot){
 if(agent.activity!=='working'&&agent.activity!=='disconnected')return agent.task;
 const work=snapshot.workLog?.filter(w=>w.role===agent.id&&w.status==='running').at(-1);
 const existingPR=work?.stage==='github-draft'&&snapshot.coordination?.jobs?.some(j=>j.id===work.requestId&&j.pr);
 const repair=snapshot.coordination?.jobs?.find(j=>j.id===work?.requestId)?.repairCycle;
 const phase=repair?.phase==='repair'&&work?.stage==='github-update-base'?'Repairing the issue fix':repair?.phase==='diagnosis'&&work?.stage==='github-review'?'Assessing a revised repair approach':existingPR?'Updating the existing PR':work&&githubStageLabels[work.stage];
 const task=withoutElapsed(agent.task);
 const elapsed=Number.isFinite(work?.elapsedMs)?` · ${durationLabel(work!.elapsedMs)} elapsed${work?.timerStatus==='last-confirmed'?' · last confirmed':''}`:'';
 if(!phase||task.includes(phase))return task+elapsed;
 const detail=task.split(' · ').slice(1).filter(part=>part!==githubStageLabels[work!.stage]).join(' · ');
 return `${work?.ticket||agent.ticket||snapshot.project?.name} · ${phase}${detail?` · ${detail}`:''}${elapsed}`;
}
/** Accept previously formatted task text without accumulating clock suffixes. */
export function withoutElapsed(task:string){return task.replace(/ · (?:\d+h )?(?:\d+m )?\d+s elapsed(?: · last confirmed)?$/,'');}
