import {isLessonDecision} from './lesson-digest';
import {deferredPickup} from '../work/pickup-state';
import type {OfficeSnapshot,Role} from '../shared';
/** The item's own blocker, as one quotable line: its first line, without a leading "Error:", cut at a word. */
function blocker(detail:string|undefined){
 const line=(detail||'').split('\n')[0].replace(/^Error:\s*/,'').replace(/\s+/g,' ').trim();
 if(line.length<=220)return line;
 const cut=line.slice(0,220);return `${cut.slice(0,Math.max(cut.lastIndexOf(' '),120))}…`;
}
/**
 * The reply offered for an outbox item or a conversation. It names what the item is actually stopped on, in the
 * item's own words, and asks for the one thing that settles it. Empty when a reply cannot help.
 */
export function recommendedReply(snapshot:OfficeSnapshot,ticket:string,actionId:string,role:Role){
 if(isLessonDecision(actionId))return '';
 // The Office retries the removal on every poll; nothing a reply asks for changes that.
 if(actionId.startsWith('candidate-cleanup:'))return '';
 if(role==='knowledge')return `What has the team learned on ${snapshot.project?.name||'this project'} recently, and is anything still recurring?`;
 const name=ticket||snapshot.project?.name||'this project';
 const item=actionId?snapshot.outbox?.find(action=>action.id===actionId):undefined,why=blocker(item?.detail),said=why?` It says: “${why}”`:'';
 if(role==='it')return why?`${item!.title}.${said} Check the connection or recovery this refers to and tell me what is verified, what recovers by itself, and the exact step and owner for anything still blocked.`:`Check ${ticket||snapshot.project?.name||'the Office'}’s current connections and recovery reports. Explain what is verified, what can recover automatically, and the exact next owner and steps for anything still blocked.`;
 if(ticket&&deferredPickup(snapshot,ticket))return `Keep ${ticket} deferred in Backlog. Read back the earlier conversation and resolve stale follow-up only when its original effects are verified. Do not start development or ask for approval to pick it up.`;
 if(actionId.startsWith('merge-approval:'))return `Explain ${name}’s reviewed PR, exact-head checks and any remaining risks before I decide whether to approve its merge.`;
 if(actionId.startsWith('question:')){
  const question=blocker(snapshot.messages?.find(message=>message.id===actionId.slice(9))?.question);
  return question?`About your question on ${name} (“${question}”): what do you recommend, what are the other options, and what changes after my answer? Keep any existing hold in place.`:`Please explain the exact decision needed for ${name}, your recommendation, and what changes after my answer. Keep any existing hold in place.`;
 }
 if(actionId.startsWith('maintenance:')){
  const run=snapshot.maintenance?.runs.find(candidate=>candidate.id===actionId.slice(12));
  if(run?.readbackRetry?.exhausted)return '';
  const stopped=blocker(run?.error);
  return `Read back the ${snapshot.project?.name||'project'} maintenance run${run?.requestedAt?` from ${run.requestedAt.slice(0,10)}`:''}${stopped?`, which stopped with “${stopped}”`:''}. Check what it actually did against the provider’s own records without repeating any write, then tell me what is verified, what is still unfinished and who does it.`;
 }
 if(actionId.startsWith('message:')){
  const delivery=snapshot.slackDeliveries?.find(candidate=>candidate.requestId===actionId.slice(8)&&candidate.status==='uncertain');
  if(delivery)return `Read back the Slack message to ${delivery.targetName}${ticket?` about ${ticket}`:''} and confirm it from Slack’s own record${delivery.permalink?` (${delivery.permalink})`:''}. Do not send anything. If it still does not match, tell me exactly what differs.`;
  return `Read back the interrupted conversation${ticket?` about ${ticket}`:''}${why?`, which stopped with “${why}”`:''}. Check every effect it attempted against the provider’s own records without repeating a write, then tell me what is verified, what is unfinished and who does it.`;
 }
 if(actionId.startsWith('merge-notice:'))return `The ${name} Slack notice was not sent${why?`: “${why}”`:''}. Tell me what is missing to send it and whether you need anything from me. Do not send it twice.`;
 const job=snapshot.coordination?.jobs?.find(j=>j.key===ticket&&!['cancelled','completed'].includes(j.status));
 if(job?.dependsOnPR)return `Check the current state of parent PR #${job.dependsOnPR} for ${ticket}. Explain the remaining prerequisite and next owner; preserve the dependency until verified complete.`;
 if(job&&['blocked','interrupted'].includes(job.status)){
  const stopped=why||blocker(job.detail);
  return `${ticket} is stopped at ${job.stage}${stopped?`: “${stopped}”`:''}. Read back that stage’s saved session and tell me the one action that unblocks it and who takes it; if it is mine, give me the exact steps. Do not replay an uncertain write.`;
 }
 const stuck=ticket?snapshot.tickets?.find(candidate=>candidate.key===ticket&&candidate.activity==='blocked'&&candidate.blocker):undefined;
 if(stuck){
  const stopped=why||blocker(stuck.blocker);
  return `${ticket} is blocked at ${stuck.stage}: “${stopped}”. Tell me what you have verified about this, the one action that unblocks it and who takes it; if it is mine, give me the exact steps.`;
 }
 if(why)return `${item!.title}.${said} Tell me what you have verified, the one action that settles it and who takes it.`;
 if(ticket)return role==='pm'?`Check ${ticket}'s current issue, linked PR, exact-head checks and dependencies. Summarize verified progress, any blocker, and who does what next.`:`Review ${ticket}'s latest evidence for your role. Explain what is complete, what remains blocked, and your recommended next step.`;
 return '';
}
