import type {GitHubDelivery} from '../../pipeline/github-delivery';
import type {TicketJob} from '../../../../src/shared';
import {readValidationProviderContext} from '../validation/validation-provider-context';
import {digest} from '../../../store/readback-evidence';

/** Current provider facts for metadata reconciliation only; no acceptance or mutations. */
export async function readPreparationProviderContext(delivery:GitHubDelivery,job:TicketJob){
 const {store}=delivery,repository=store.project.repository;
 const current=await readValidationProviderContext(delivery,job.key),pr=await delivery.api(`pulls/${job.pr}`);
 if(pr.number!==job.pr||pr.html_url!==job.prUrl||job.prUrl!==`https://github.com/${repository}/pull/${job.pr}`||pr.state!=='open'||pr.merged_at||pr.draft!==false||
  pr.head?.sha!==job.head||pr.head.ref!==job.branch||pr.head.repo?.full_name!==repository||pr.base?.repo?.full_name!==repository||pr.base.ref!==store.project.target||
  typeof pr.title!=='string'||typeof pr.body!=='string'||typeof pr.updated_at!=='string'||!pr.updated_at)throw new Error('Exact ready open main-targeted PR required');
 const links=JSON.parse(await delivery.execute('gh',['pr','view',String(job.pr),'--repo',repository,'--json','closingIssuesReferences'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
 if(!Array.isArray(links.closingIssuesReferences)||!links.closingIssuesReferences.some((i:any)=>i.url===current.issue.html_url))throw new Error('Native linked issue required');
 const pages=JSON.parse(await delivery.execute('gh',['api',`repos/${repository}/pulls?state=open&base=${encodeURIComponent(job.branch)}&per_page=100`,'--paginate','--slurp'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
 if(!Array.isArray(pages)||!pages.length||pages.some(p=>!Array.isArray(p))||pages.flat().length)throw new Error('Dependent PR bases require separate reconciliation');
 async function all(path:string){
  const records:any[]=[],seen=new Set<number>();
  for(let page=1;page<=20;page++){
   const entries=await delivery.api(`${path}?per_page=100&page=${page}`);
   if(!Array.isArray(entries)||entries.length>100)throw new Error('Complete preparation provider records required');
   for(const row of entries){if(!row||typeof row!=='object'||path.endsWith('/comments')&&(!Number.isSafeInteger(row.id)||row.id<1||seen.has(row.id)))throw new Error('Unique preparation provider identities required');if(row.id)seen.add(row.id);records.push(row);}
   if(Buffer.byteLength(JSON.stringify(records))>1024*1024)throw new Error('Preparation provider records exceed bounded packet');
   if(entries.length<100)return records;
  }
  throw new Error('Preparation provider pagination exceeds bounded packet');
 }
 const comments=await all(`issues/${job.pr}/comments`);
 for(const c of comments)if(c.issue_url!==`https://api.github.com/repos/${repository}/issues/${job.pr}`||c.html_url!==`${job.prUrl}#issuecomment-${c.id}`||typeof c.body!=='string'||!c.user?.login||!c.created_at||!c.updated_at)throw new Error('PR comment identity or scope unavailable');
 const timeline=(await all(`issues/${job.pr}/timeline`)).map(e=>({id:e.id,event:e.event,created_at:e.created_at,actor:e.actor?.login,body:e.body,sha:e.sha,commit_id:e.commit_id,source:e.source&&{type:e.source.type,issue:e.source.issue&&{number:e.source.issue.number,html_url:e.source.issue.html_url}}}));
 const reviews=await all(`pulls/${job.pr}/reviews`),inlineComments=await all(`pulls/${job.pr}/comments`);
 for(const r of reviews)if(typeof r.body!=='string'||typeof r.state!=='string'||typeof r.user?.login!=='string'||typeof r.commit_id!=='string')throw new Error('PR review scope unavailable');
 for(const c of inlineComments)if(c.pull_request_url!==`https://api.github.com/repos/${repository}/pulls/${job.pr}`||typeof c.body!=='string'||typeof c.user?.login!=='string'||typeof c.created_at!=='string'||typeof c.updated_at!=='string')throw new Error('PR inline comment scope unavailable');
 const readyEvents=timeline.filter(e=>e.event==='ready_for_review').map(e=>({id:e.id,event:e.event,created_at:e.created_at,actor:e.actor}));
 if(!readyEvents.length||readyEvents.some(e=>!Number.isSafeInteger(e.id)||e.id<1||typeof e.actor!=='string'||!e.actor||!Number.isFinite(Date.parse(e.created_at))))throw new Error('Ready event provenance unavailable');
 const checks=await delivery.api(`commits/${job.head}/check-runs?per_page=100`),statuses=await delivery.api(`commits/${job.head}/status`);
 if(!Array.isArray(checks.check_runs)||!Number.isInteger(checks.total_count)||checks.total_count>100||checks.total_count!==checks.check_runs.length||checks.check_runs.some((c:any)=>c.head_sha!==job.head)||
  statuses.sha!==job.head||!Array.isArray(statuses.statuses)||!Number.isInteger(statuses.total_count)||statuses.total_count>100||statuses.total_count!==statuses.statuses.length)throw new Error('Current head check observation incomplete');
 const context={...current,pr:{number:pr.number,html_url:pr.html_url,title:pr.title,body:pr.body,state:pr.state,draft:pr.draft,head:pr.head.sha,branch:pr.head.ref,base:pr.base.ref,baseSha:pr.base.sha,merged_at:pr.merged_at},
  prComments:comments.map(c=>({id:c.id,body:c.body,user:c.user.login,created_at:c.created_at,updated_at:c.updated_at})),readyEvents,timeline,reviews:reviews.map(r=>({id:r.id,user:r.user.login,body:r.body,state:r.state,commit_id:r.commit_id,submitted_at:r.submitted_at})),inlineComments:inlineComments.map(c=>({id:c.id,user:c.user.login,body:c.body,created_at:c.created_at,updated_at:c.updated_at,pull_request_review_id:c.pull_request_review_id,path:c.path,line:c.line})),dependentPRs:[],checks,statuses};
 if(Buffer.byteLength(JSON.stringify(context))>1024*1024)throw new Error('Preparation context exceeds bounded packet');
 return context;
}
/** Checks may legitimately finish while Sam reads; normal live Lead review still owns readiness. */
export function preparationProviderVersion(context:Awaited<ReturnType<typeof readPreparationProviderContext>>){
 const {observedAt,checks,statuses,...scope}=context;return digest(scope);
}
