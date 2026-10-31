import type {PreparationBoardOrigin} from './preparation-board-provenance';
import type {Store} from '../../../store/store';
import type {StageResult,TicketJob} from '../../../../src/shared';
import {digest} from '../../../store/readback-evidence';
import type {readPreparationProviderContext} from './preparation-provider-context';

type Receipt=StageResult['receipts'][number];
type Kind='board-item'|'issue-comment'|'local-candidate'|'published-ref';
export type PreparationReceiptBinding={id:string;kind:Kind;checkpoint:Receipt;historical:{stage:string;receipt:Receipt}[];identity:string;commentId?:number;harnessOrigin?:PreparationBoardOrigin};
const identity=(r:Receipt)=>digest({id:r.id,action:r.action,target:r.target,verified:r.verified,uncertain:r.uncertain});

/** Compatibility is a typed same-job reference, never a rewrite of the checkpoint or proof of non-execution. */
export function preparationReceiptBindings(store:Store,job:TicketJob,result:StageResult):PreparationReceiptBinding[]|undefined{
 const repository=store.project.repository,project=store.project.githubProject,number=Number(job.key.slice(3));
 const history=job.steps.flatMap(s=>s.result.receipts.map(receipt=>({stage:s.stage,receipt}))).filter(({receipt:r})=>r.verified&&!r.uncertain);
 const ready=[`gh pr ready`,`gh pr ready ${job.pr}`,`gh pr ready --repo ${repository}`,`gh pr ready ${job.pr} --repo ${repository}`];
 const seen=new Set<string>(),bindings:PreparationReceiptBinding[]=[];let effects=0;
 const classify=(r:Receipt):{kind:Kind;identity:string;commentId?:number}|undefined=>{
  if(project&&['project item-edit Status -> In progress','project item-edit Status -> In review'].includes(r.action)){
   const updates=job.boardUpdates?.filter(u=>u.status==='verified'&&u.item&&u.project);
   const items=[...new Set(updates?.map(u=>u.item)||[])];
   if(items.length!==1)return;
   const stem=`${project.owner} project ${project.number}`,item=items[0];
   if([`${stem} issue ${number}`,`${stem} item ${item}`,`${stem} item ${item} (issue ${number})`].includes(r.target))return {kind:'board-item',identity:`${project.url}#item-${item}`};
  }
  if(r.action==='gh issue comment'){
   const target=`${repository}#${number}`;
   if(r.target===target)return {kind:'issue-comment',identity:target};
   if(r.target.startsWith(target+' comment ')){
    const text=r.target.slice((target+' comment ').length),id=Number(text);
    if(/^[1-9]\d*$/.test(text)&&Number.isSafeInteger(id))return {kind:'issue-comment',identity:target,commentId:id};
   }
  }
  if(['git worktree add + commit','git worktree add + commit (local only)'].includes(r.action)&&[job.worktree,job.branch].includes(r.target))return {kind:'local-candidate',identity:`${job.worktree}#${job.branch}@${job.head}`};
  if(r.action===`git push -u origin ${job.branch}`&&[repository,`${repository} refs/heads/${job.branch}`].includes(r.target))return {kind:'published-ref',identity:`${repository}:refs/heads/${job.branch}@${job.head}`};
 };
 for(const r of result.receipts){
  if(!r.id||seen.has(r.id)||!r.verified||r.uncertain)return;seen.add(r.id);
  const previous=history.filter(h=>h.receipt.id===r.id);
  if(r.target===job.prUrl&&ready.includes(r.action)){if(previous.length)return;effects++;continue;}
  if(previous.some(h=>identity(h.receipt)===identity(r)))continue;
  const current=classify(r);
  if(!current||!previous.length||previous.some(h=>{const old=classify(h.receipt);return !old||old.kind!==current.kind||old.identity!==current.identity||old.commentId!==undefined&&old.commentId!==current.commentId;}))return;
  // A refined issue comment must identify one exact provider record; an unqualified alias adds no identity.
  if(current.kind==='issue-comment'&&current.commentId===undefined)return;
  bindings.push({id:r.id,...current,checkpoint:r,historical:previous});
 }
 return effects===1?bindings:undefined;
}

/** Current provider identities corroborate aliases; Sam must still audit their original native effects and non-replay. */
export function assertPreparationReceiptProviders(bindings:PreparationReceiptBinding[],context:Awaited<ReturnType<typeof readPreparationProviderContext>>,job:TicketJob,startedAt:string){
 for(const binding of bindings){
  if(binding.kind==='board-item'&&(!binding.identity.endsWith(`#item-${context.board.item.id}`)||context.board.item.repository!==context.repository||context.board.item.number!==context.issue.number))throw new Error('Historical board receipt identity is not current');
  if(binding.kind==='issue-comment'){
   const matches=context.comments.filter(c=>c.id===binding.commentId),author=matches[0]?.user as {login?:unknown}|null;
   if(matches.length!==1||matches[0].html_url!==`${context.issue.html_url}#issuecomment-${binding.commentId}`||author?.login!=='JFusco'||!Number.isFinite(Date.parse(matches[0].created_at as string))||Date.parse(matches[0].created_at as string)>=Date.parse(startedAt))throw new Error('Historical issue comment identity is not current');
  }
  if(binding.kind==='published-ref'&&(context.pr.head!==job.head||context.pr.branch!==job.branch))throw new Error('Historical published ref identity is not current');
 }
}
