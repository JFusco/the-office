import type { OfficeProject } from '../../../src/shared';
import { CEC } from '../../office/config';
import { unpack } from '../../cec/jira-operations';
import { EVIDENCE_LIMITS, blankEvidence, failedCoverage, type EvidenceReadContext, type EvidenceSection } from './evidence-contract';
export async function jiraEvidence(project:OfficeProject,key:string,context:EvidenceReadContext) {
 if(project.provider!=='azure'||!/^CEC-[1-9]\d*$/.test(key))throw new Error('Invalid project-qualified Jira issue');
 const evidence=blankEvidence(project.id,key,'azure',CEC.site+'/browse/'+key);
 const call=async(args:string[])=>unpack(await context.execute('twg',['jira','workitem',...args,'--site',CEC.site,'-o','json','--output-summary','none'],{readOnly:true,timeout:EVIDENCE_LIMITS.commandMs,signal:context.signal}));
 try {
  const data = await call(['get', key, '--full']);
  let raw = data.workItem || data.issue || data;
  if (Array.isArray(raw)) {
   if (raw.length !== 1) throw new Error('Jira single-issue read did not return exactly one record');
   [raw] = raw;
  }
  if (raw?.key !== key) throw new Error('Jira issue identity mismatch');
  const fields = raw.fields || raw;
  if(typeof fields.summary!=='string')throw new Error('Jira summary is missing');
  evidence.summary=fields.summary;evidence.description=fields.description??null;evidence.labels=fields.labels||[];evidence.type=fields.issuetype?.name||fields.issueType?.name||raw.issueType?.name||'';
  evidence.links=fields.issuelinks||fields.issueLinks||[];evidence.remoteLinks=raw.remoteLinks||fields.remoteLinks||[];evidence.coverage.issue={state:'complete'};evidence.coverage.remoteLinks=Array.isArray(raw.remoteLinks||fields.remoteLinks)?{state:'complete'}:{state:'unreadable',detail:'Full issue response did not include remote-link metadata; linked services were not crawled'};
 }catch(error){evidence.coverage.issue=failedCoverage(error);return evidence;}
 const pages=async(section:string,args:string[],consume:(row:any)=>void)=>{
  let after='';const seen=new Set<string>();
  try{for(let count=0;count<EVIDENCE_LIMITS.pages;count++){
   const data=await call([...args,...(after?['--after',after]:[])]),page=data[section]||data;
   const nodes=Array.isArray(page)?page:page.nodes||page.edges?.map((edge:any)=>edge.node)||page.issues;
   if(!Array.isArray(nodes))throw new Error('Missing Jira '+section+' page');
   for(const node of nodes)consume(node);
   const info=page.pageInfo||data.pageInfo;const hasNext=info?.hasNextPage??data.hasNextPage;
   const total=page.total??data.total;
   if(hasNext===false || hasNext===undefined&&(typeof total==='number'?total<=nodes.length: nodes.length<100))return {state:'complete'} satisfies EvidenceSection;
   const next=info?.endCursor||data.endCursor;
   if(typeof next!=='string'||!next||seen.has(next))return {state:'truncated',detail:'Missing or repeated Jira pagination cursor'} satisfies EvidenceSection;
   seen.add(next);after=next;
  }return {state:'truncated',continuation:after,detail:'Jira page limit reached'} satisfies EvidenceSection;
  }catch(error){return failedCoverage(error);}
 };
 evidence.coverage.comments=await pages('comments',['comment','query','--issue-id',key,'--first','100'],row=>{
  if(!row.id||row.body===undefined)throw new Error('Incomplete Jira comment');evidence.comments.push({id:String(row.id),body:row.body,author:row.author?.accountId});
 });
 evidence.coverage.children=await pages('issues',['query','--jql','parent = '+key,'--fields','summary,description,status,issuetype,parent,updated','--first','100'],row=>{
  const f=row.fields||row;if(!/^CEC-[1-9]\d*$/.test(row.key)||typeof f.summary!=='string'||f.parent?.key&&f.parent.key!==key)throw new Error('Invalid direct child evidence');
  evidence.children.push({key:row.key,summary:f.summary,description:f.description??null,status:f.status?.name,type:f.issuetype?.name,parent:key});
 });
 evidence.coverage.attachments=await pages('attachments',['attachment','query','--issue-id',key],row=>{
  if(!/^\d+$/.test(String(row.id)))throw new Error('Invalid Jira attachment identity');
  evidence.attachments.push({id:String(row.id),name:row.filename||row.name||String(row.id),mime:row.mimeType||'application/octet-stream',...(Number.isFinite(row.size)?{size:row.size}:{}),coverage:{state:'unreadable',detail:'Attachment body has not been captured'}});
 });
 return evidence;
}
