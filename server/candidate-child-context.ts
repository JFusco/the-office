import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {artifact,digest} from './readback-evidence';
import {acceptedNativeGate} from './preparation-gates';
import {deliveryInputSha256} from './github-context';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import type {GitHubDelivery} from './github-delivery';
import type {Store} from './store';
import type {TicketJob} from '../src/shared';

/** Existing held-profile follow-ups, not a title search or authority to create new work. */
const related=[{ticket:'GH-113',profile:'cms12-string-wording'},{ticket:'GH-114',profile:'cms13-content-elements'},{ticket:'GH-115',profile:'saas-content-types-claims'}]as const;
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
function advisoryPM(store:Store,ticket:string){
 const answers=store.state.messages.filter(m=>m.from==='pm'&&m.ticket===ticket&&m.status==='answered'&&!m.error&&!!m.sessionId&&m.receipts.every(r=>r.verified&&!r.uncertain));
 for(const answer of answers.slice(-3).reverse()){
  const request=store.state.messages.find(m=>m.id===answer.requestId);
  if(!request||request.from!=='human'||request.to!=='pm'||request.ticket!==ticket||request.status!=='answered'||request.error)continue;
  const workers=(store.state.workLog||[]).filter(w=>w.sessionId===answer.sessionId&&w.requestId===request.id&&w.role==='pm'&&w.ticket===ticket&&w.stage==='conversation'&&w.status==='completed'&&!!w.endedAt);
  if(workers.length!==1||!/^[a-zA-Z0-9-]+$/.test(workers[0].id))continue;
  const worker=workers[0],root=resolve(store.dataRoot,'sessions',worker.id);
  try{
  const files=['provider.json','result.json','assignment-identity.json'].map(name=>artifact(store,resolve(root,name))),[provider,saved,identity]=files.map(f=>JSON.parse(readFileSync(f.path,'utf8')));
  requireThat(provider.project===store.project.id&&provider.repository===store.project.repository&&provider.role==='pm'&&provider.readOnly===true&&provider.provider===worker.provider&&saved.session===worker.sessionId&&Array.isArray(saved.result?.receipts)&&saved.result.receipts.every((r:unknown)=>answer.receipts.some(a=>isDeepStrictEqual(a,r)))&&identity.attemptId===worker.id&&identity.requestId===request.id&&identity.projectId===store.project.id&&identity.repository===store.project.repository&&identity.role==='pm'&&identity.threadId===worker.sessionId,'Related PM advisory identity changed');
  return [{authority:'advisory only; not provider success or source acceptance',available:true,messageId:answer.id,requestId:request.id,workerId:worker.id,sessionId:worker.sessionId,artifacts:files.map(f=>({path:f.path,sha256:f.sha256}))}];
  }catch{return [{authority:'advisory only; not provider success or source acceptance',available:false,messageId:answer.id,requestId:request.id,workerId:worker.id,sessionId:worker.sessionId,artifacts:[]}];}
 }
 return [];
}

/** Bounded current delivery facts for one existing parent; no model, write, acceptance or new relation. */
export async function readCandidateChildContext(delivery:GitHubDelivery,parent:TicketJob,candidateHead:string){
 const {store}=delivery;
 if(parent.key!=='GH-100')return null;
 requireThat(store.project.id==='cms-field-vocabulary'&&store.project.provider==='github'&&store.project.repository==='JFusco/cms-field-vocabulary'&&candidateHead==='25868923c5d69a7c98d807f537a3c757f6822431','Related child context requires the original project-qualified parent candidate');
 const scope=await readValidationProviderContext(delivery,parent.key),children=[];
 for(const relation of related){
  const matches=delivery.jobs.filter(j=>j.key===relation.ticket&&j.status!=='cancelled');
  requireThat(matches.length===1,'One original related child delivery required');
  const child=matches[0],number=Number(child.key.slice(3)),repository=store.project.repository;
  requireThat(child.id!==parent.id&&/^[a-f0-9]{40}$/.test(child.head)&&Number.isSafeInteger(child.pr)&&child.pr>0&&child.prUrl===`https://github.com/${repository}/pull/${child.pr}`,'Related child project or candidate identity changed');
  const issue=await delivery.api(`issues/${number}`),pr=await delivery.api(`pulls/${child.pr}`);
  requireThat(issue.number===number&&!issue.pull_request&&issue.html_url===`https://github.com/${repository}/issues/${number}`&&['open','closed'].includes(issue.state)&&typeof issue.title==='string'&&typeof issue.updated_at==='string'&&Number.isFinite(Date.parse(issue.updated_at))&&pr.number===child.pr&&pr.html_url===child.prUrl&&['open','closed'].includes(pr.state)&&pr.head?.sha===child.head&&pr.head.ref===child.branch&&pr.head.repo?.full_name===repository&&pr.base?.repo?.full_name===repository&&pr.base.ref===store.project.target&&/^[a-f0-9]{40}$/.test(pr.base.sha||'')&&typeof pr.draft==='boolean'&&typeof pr.updated_at==='string'&&Number.isFinite(Date.parse(pr.updated_at)),'Related child PR/issue identity changed');
  const links=JSON.parse(await delivery.execute('gh',['pr','view',String(child.pr),'--repo',repository,'--json','closingIssuesReferences'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
  requireThat(Array.isArray(links.closingIssuesReferences)&&links.closingIssuesReferences.some((i:any)=>i.url===issue.html_url),'Related child native issue link required');
  const review=child.steps.filter(s=>s.stage==='review').at(-1)?.result,qa=child.steps.filter(s=>s.stage==='validate').at(-1)?.result;
  requireThat(review&&qa&&review.commit===qa.commit&&/^[a-f0-9]{40}$/.test(review.commit),'Related source review and QA anchor missing');
  // Preserve the exact accepted source anchor separately from a later conflict-integration PR head.
  // The existing native gate validates its real saved Sam/Riley artifacts; this grants no current-head acceptance.
  const gates=acceptedNativeGate(store,{...child,head:review.commit});
  const files=[...new Map(gates.files.map(f=>[f.path,{path:f.path,sha256:f.sha256}])).values()];
  let actions:unknown[]=[],mergeCommit:string|null=null;
  if(pr.merged_at){
   requireThat(pr.state==='closed'&&/^[a-f0-9]{40}$/.test(pr.merge_commit_sha||'')&&(!child.mergeCommit||child.mergeCommit===pr.merge_commit_sha),'Related merge identity changed');
   mergeCommit=pr.merge_commit_sha;
   const runs=await delivery.api(`actions/runs?head_sha=${mergeCommit}&event=push&per_page=100`);
   requireThat(Array.isArray(runs.workflow_runs)&&Number.isInteger(runs.total_count)&&runs.total_count<=100&&runs.total_count===runs.workflow_runs.length,'Complete related merge Actions observation required');
   actions=runs.workflow_runs.map((r:any)=>{requireThat(Number.isSafeInteger(r.id)&&r.head_sha===mergeCommit&&r.head_branch===store.project.target&&r.event==='push'&&r.repository?.full_name===repository&&r.html_url===`https://github.com/${repository}/actions/runs/${r.id}`,'Related merge Actions identity changed');return {id:r.id,name:r.name,status:r.status,conclusion:r.conclusion,head:r.head_sha,event:r.event,branch:r.head_branch,url:r.html_url};}).sort((a:any,b:any)=>a.id-b.id);
  }
  children.push({projectId:store.project.id,repository,profile:relation.profile,work:{projectId:store.project.id,kind:'delivery',id:child.id},ticket:child.key,jobVersion:digest(child),delivery:{stage:child.stage,status:child.status,detail:child.detail||''},issue:{number,url:issue.html_url,title:issue.title,state:issue.state,updatedAt:issue.updated_at},pr:{number:child.pr,url:child.prUrl,head:pr.head.sha,branch:pr.head.ref,base:pr.base.ref,baseSha:pr.base.sha,state:pr.state,draft:pr.draft,mergeable:pr.mergeable,updatedAt:pr.updated_at,mergedAt:pr.merged_at||null,mergeCommit},source:{head:review.commit,currentPRHead:review.commit===pr.head.sha,reviewWorker:gates.reviewWorker,qaWorker:gates.qaWorker,qaProof:gates.proofPath,artifacts:files},actions});
 }
 const context={authority:'Current delivery references only; open child PRs are incomplete and no source-lock or broader claim acceptance is granted',projectId:store.project.id,repository:store.project.repository,parent:{jobId:parent.id,ticket:parent.key,candidateHead,scopeVersion:validationProviderVersion(scope),humanInputVersion:deliveryInputSha256(store,parent.key)},children,advisoryPM:advisoryPM(store,parent.key)};
 requireThat(Buffer.byteLength(JSON.stringify(context))<=64*1024,'Related child context exceeds bounded packet');
 return context;
}

/** Final synchronous fence after provider reads and ownership refresh; never rewrites saved evidence. */
export function assertCandidateChildContextCurrent(store:Store,parent:TicketJob,context:NonNullable<Awaited<ReturnType<typeof readCandidateChildContext>>>){
 requireThat(store.project.id===context.projectId&&store.project.repository===context.repository&&parent.id===context.parent.jobId&&parent.key===context.parent.ticket&&deliveryInputSha256(store,parent.key)===context.parent.humanInputVersion,'Related parent local input identity changed');
 for(const child of context.children){
  const rows=(store.state.coordination?.jobs||[]).filter(j=>j.key===child.ticket&&j.status!=='cancelled');
  requireThat(rows.length===1&&rows[0].id===child.work.id&&digest(rows[0])===child.jobVersion,'Related child local input identity changed');
  for(const saved of child.source.artifacts)requireThat(artifact(store,saved.path).sha256===saved.sha256,'Related source proof changed');
 }
 for(const pm of context.advisoryPM)for(const saved of pm.artifacts)requireThat(artifact(store,saved.path).sha256===saved.sha256,'Related advisory proof changed');
}
