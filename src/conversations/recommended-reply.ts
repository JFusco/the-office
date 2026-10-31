import {deferredPickup} from '../work/pickup-state';
import type {OfficeSnapshot,Role} from '../shared';
export function recommendedReply(snapshot:OfficeSnapshot,ticket:string,actionId:string,role:Role){
 if(role==='it')return `Check ${ticket||snapshot.project?.name||'the Office'}’s current connections and recovery reports. Explain what is verified, what can recover automatically, and the exact next owner and steps for anything still blocked.`;
 const name=ticket||snapshot.project?.name||'this project';
 if(ticket&&deferredPickup(snapshot,ticket))return `Keep ${ticket} deferred in Backlog. Read back the earlier conversation and resolve stale follow-up only when its original effects are verified. Do not start development or ask for approval to pick it up.`;
 if(actionId.startsWith('merge-approval:'))return `Explain ${name}’s reviewed PR, exact-head checks and any remaining risks before I decide whether to approve its merge.`;
 if(actionId.startsWith('question:'))return `Please explain the exact decision needed for ${name}, your recommendation, and what changes after my answer. Keep any existing hold in place.`;
 if(actionId.startsWith('message:')||actionId.startsWith('maintenance:'))return `Read back the original saved session and current provider records for ${name}. Reconcile every attempted effect without repeating writes. Tell the team what is verified, what remains unfinished, and the next owner and action.`;
 const job=snapshot.coordination?.jobs?.find(j=>j.key===ticket&&!['cancelled','completed'].includes(j.status));
 if(job?.dependsOnPR)return `Check the current state of parent PR #${job.dependsOnPR} for ${ticket}. Explain the remaining prerequisite and next owner; preserve the dependency until verified complete.`;
 if(job&&['blocked','interrupted'].includes(job.status))return `Read back ${ticket}'s ${job.stage} failure and its saved session. Use the supported recovery path only after prior effects are certain. Report the exact next action and owner; if I must act, give me the specific steps. Do not replay an uncertain write.`;
 if(ticket)return role==='pm'?`Check ${ticket}'s current issue, linked PR, exact-head checks and dependencies. Summarize verified progress, any blocker, and who does what next.`:`Review ${ticket}'s latest evidence for your role. Explain what is complete, what remains blocked, and your recommended next step.`;
 return '';
}
