import { validateGitHubIssue } from '../../github/github-operations';
import type { OfficeProject } from '../../../src/shared';
import { EVIDENCE_LIMITS, blankEvidence, failedCoverage, type EvidenceReadContext } from './evidence-contract';
const assetHosts=new Set(['github.com','user-images.githubusercontent.com','private-user-images.githubusercontent.com','github-production-user-asset-6210df.s3.amazonaws.com']);
export function providerAsset(url:string):boolean {try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&assetHosts.has(u.hostname)&&(u.hostname!=='github.com'||/^\/user-attachments\/(assets|files)\//.test(u.pathname));}catch{return false;}}
export async function githubEvidence(project:OfficeProject,key:string,context:EvidenceReadContext) {
 if(!/^GH-[1-9]\d*$/.test(key)||!/^[-\w.]+\/[-\w.]+$/.test(project.repository))throw new Error('Invalid project-qualified GitHub issue');
 const number=key.slice(3),base=`repos/${project.repository}/issues/${number}`;
 const evidence=blankEvidence(project.id,key,'github',`${project.repository}#${number}`);
 const call=async(path:string)=>JSON.parse(await context.execute('gh',['api',path],{cwd:project.repo,readOnly:true,timeout:EVIDENCE_LIMITS.commandMs,signal:context.signal}));
 try{const raw=validateGitHubIssue(await call(base),project.repository,Number(number));if(typeof raw.title!=='string')throw new Error('GitHub issue identity is incomplete');
  evidence.summary=raw.title;evidence.description=raw.body||'';evidence.type=raw.type?.name||'GitHub issue';evidence.labels=(raw.labels||[]).map((l:any)=>typeof l==='string'?l:l.name).filter((l:unknown)=>typeof l==='string');evidence.coverage.issue={state:'complete'};
 }catch(error){evidence.coverage.issue=failedCoverage(error);return evidence;}
 for(const section of ['comments','children'] as const){
  const endpoint=section==='comments'?'comments':'sub_issues',seen=new Set<string>();
  try{for(let page=1;page<=EVIDENCE_LIMITS.pages;page++){
   const rows=await call(`${base}/${endpoint}?per_page=100&page=${page}`);if(!Array.isArray(rows))throw new Error('GitHub page is not an array');
   if(rows.some((row:any)=>{const id=String(row.id??row.number);if(seen.has(id))return true;seen.add(id);return false;})){evidence.coverage[section]={state:'truncated',detail:'Repeated provider page identities'};break;}
   if(section==='comments') for(const row of rows){if(!row.id||typeof row.body!=='string')throw new Error('Incomplete GitHub comment');evidence.comments.push({id:String(row.id),body:row.body,author:row.user?.login});}
   else for(const row of rows){const match=typeof row.html_url==='string'&&row.html_url.match(/^https:\/\/github\.com\/([-\w.]+\/[-\w.]+)\/issues\/(\d+)$/);if(!match||!Number.isSafeInteger(row.number)||Number(match[2])!==row.number||typeof row.title!=='string')throw new Error('Incomplete project-qualified GitHub sub-issue');validateGitHubIssue(row,match[1],row.number);evidence.children.push({key:match[1]===project.repository?'GH-'+row.number:match[1]+'#'+row.number,summary:row.title,description:row.body||'',type:row.type?.name,status:row.state,parent:key});}
   evidence.coverage[section]=rows.length<100?{state:'complete'}:{state:'truncated',continuation:String(page+1),detail:'Provider page limit reached'};if(rows.length<100)break;
  }}catch(error){evidence.coverage[section]=failedCoverage(error);}
 }
 const urls=new Set<string>();for(const body of [evidence.description,...evidence.comments.map(c=>c.body)])if(typeof body==='string')for(const match of body.matchAll(/https:\/\/[^\s<>"')\]]+/g))if(providerAsset(match[0]))urls.add(match[0]);
 evidence.attachments=[...urls].map((url,index)=>({id:'github-asset:'+new URL(url).pathname,name:new URL(url).pathname.split('/').at(-1)||String(index),mime:'application/octet-stream',url,coverage:{state:'unreadable',detail:'Attachment body has not been captured'}}));
 evidence.coverage.attachments={state:'complete'};return evidence;
}
