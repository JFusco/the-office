import type { EffectIntent } from '../../../src/shared';
import type { ProviderEvidence } from '../handoff/evidence-contract';
import { evidenceHash } from '../handoff/evidence-digest';
export interface RequirementPostimage { target:string; content?:{summary:string;description:unknown;labels:string[]}; comment?:{id:string;bodyDigest:string} }
/** Author identity and expected preconditions never establish an Office-authored change. */
export function requirementDrift(before:ProviderEvidence,after:ProviderEvidence,effects:ReadonlyArray<EffectIntent>,startedKeys:ReadonlySet<string>=new Set(),providerTarget=before.provider==='github'?before.identity.split('#')[0]:''):{kind:'unchanged'|'changed'|'unavailable';reason:string} {
 if(before.projectId!==after.projectId||before.key!==after.key||before.identity!==after.identity)return {kind:'unavailable',reason:'Provider evidence identity changed'};
 if(Object.entries(before.coverage).some(([section,c])=>c.state==='complete'&&after.coverage[section]?.state!=='complete'))return {kind:'unavailable',reason:'Provider evidence coverage was lost'};
 if(before.attachments.some(old=>old.coverage.state==='complete'&&after.attachments.some(next=>next.id===old.id&&next.coverage.state!=='complete')))return {kind:'unavailable',reason:'Attachment evidence coverage was lost'};
 const content=(e:ProviderEvidence)=>({summary:e.summary,description:e.description,labels:[...e.labels].sort()});
 let priorContent=content(before);const nextContent=content(after),comments=new Map(before.comments.map(c=>[c.id,c]));
 for(const effect of effects){
  if(effect.status!=='verified'||!effect.verifiedAt||effect.work.projectId!==after.projectId||!providerTarget||effect.target!==providerTarget||!['feature-create','feature-update','feature-comment'].includes(effect.operation))continue;
  const receipt=effect.receipt as {key?:string;requirementPostimage?:RequirementPostimage}|undefined,post=receipt?.requirementPostimage;
  const payload=effect.payload as {key?:string;operation?:{kind?:string}}|undefined;
  if((payload?.key||receipt?.key)!==after.key||effect.operation!=='feature-'+payload?.operation?.kind)continue;
  if(!post||post.target!==after.identity)continue;
  if(post.content&&evidenceHash(post.content)===evidenceHash(nextContent))priorContent=nextContent;
  if(post.comment){const comment=after.comments.find(c=>c.id===post.comment!.id);if(comment&&evidenceHash(comment.body)===post.comment.bodyDigest)comments.set(comment.id,comment);}
 }
 const view=(e:ProviderEvidence,contents:unknown,commentValues:unknown[])=>({content:startedKeys.has(e.key)?null:contents,comments:startedKeys.has(e.key)?[]:commentValues,children:e.children.filter(c=>!startedKeys.has(c.key)).slice().sort((a,b)=>a.key.localeCompare(b.key)),attachments:startedKeys.has(e.key)?[]:e.attachments.map(a=>({id:a.id,sha256:a.sha256,coverage:a.coverage.state,interpretation:a.interpretation})).sort((a,b)=>a.id.localeCompare(b.id)),links:e.links,remoteLinks:e.remoteLinks});
 const old=view(before,priorContent,[...comments.values()].sort((a,b)=>a.id.localeCompare(b.id))),next=view(after,nextContent,[...after.comments].sort((a,b)=>a.id.localeCompare(b.id)));
 return evidenceHash(old)===evidenceHash(next)?{kind:'unchanged',reason:'Requirement evidence is unchanged or exactly explained by verified Office effects'}:{kind:'changed',reason:'Provider requirements changed outside verified Office post-write evidence'};
}
