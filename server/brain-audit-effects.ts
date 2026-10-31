import {resolve} from 'node:path';
import type {StageResult} from '../src/shared';
type Effect={id:string;kind:string;target:string;verified:boolean;uncertain:boolean;evidence:string};
type Known={id:string;target:string;action?:string};
/** Lossless typed projections only; the raw receipt and independent audit remain unchanged. */
export function bindBrainAuditEffects(candidate:Pick<StageResult,'branch'|'commit'|'worktree'>,known:Known[],effects:Effect[]){
 const commitTargets=new Set([candidate.commit,`${candidate.branch}@${candidate.commit}`]);
 if(!effects.length||new Set(effects.map(e=>e.id)).size!==effects.length||effects.some(e=>!e.verified||e.uncertain||!e.evidence.trim())||
  !effects.some(e=>e.kind==='source-commit'&&commitTargets.has(e.target))||!effects.some(e=>e.kind==='worktree'&&e.target===candidate.worktree))throw new Error('Positive complete Brain native effects audit required');
 return known.map(receipt=>{
  if(receipt.id==='worktree-local-config'&&receipt.action==='copy ignored brain.config.local.json (0600) and chmod .state 0700 in worktree'&&receipt.target===candidate.worktree){
   const config=effects.find(e=>e.id===receipt.id&&e.kind==='private-config-copy'&&e.target===resolve(candidate.worktree,'brain.config.local.json'));
   const permissions=effects.find(e=>e.id==='worktree-private-permissions'&&e.kind==='private-diagnostic'&&e.target===resolve(candidate.worktree,'.state'));
   if(config&&permissions)return {receipt,effectIds:[config.id,permissions.id],kind:'ignored-config-and-private-permissions' as const};
   throw new Error('Positive complete Brain native effects audit required');
  }
  const exact=effects.find(e=>e.id===receipt.id&&e.target===receipt.target);
  if(exact)return {receipt,effectIds:[exact.id],kind:'exact' as const};
  const commit=effects.find(e=>e.id===receipt.id&&e.kind==='source-commit'&&commitTargets.has(e.target));
  if(commit&&commitTargets.has(receipt.target)&&['git commit','git commit (pre-commit privacy guard enabled)'].includes(receipt.action||''))return {receipt,effectIds:[commit.id],kind:'same-source-commit' as const};
  throw new Error('Positive complete Brain native effects audit required');
 });
}
