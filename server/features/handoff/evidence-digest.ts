import { createHash } from 'node:crypto';
import type { ProviderEvidence } from './evidence-contract';
function canonical(value:unknown):unknown {
 if(Array.isArray(value)) return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,canonical(value)]));
 return value;
}
export const evidenceHash=(value:unknown)=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
function stableUrl(value: string) {
 try {const url=new URL(value);for(const key of [...url.searchParams.keys()])if(/^(?:x-amz-|x-goog-|expires$|signature$|token$|se$|sig$|sp$|sv$|sr$|st$)/i.test(key))url.searchParams.delete(key);url.searchParams.sort();return url.toString();} catch {return value;}
}
function semantic(value: unknown): unknown {
 if(typeof value==='string')return value.replace(/https:\/\/[^\s<>"')\]]+/g,stableUrl);
 if(Array.isArray(value))return value.map(semantic);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,semantic(v)]));
 return value;
}
/** Requirement identity ignores collection metadata and unstable download URLs. */
export function evidenceDigest(evidence:ProviderEvidence) {
 return evidenceHash(semantic({...evidence,
  comments:[...evidence.comments].sort((a,b)=>a.id.localeCompare(b.id)),children:[...evidence.children].sort((a,b)=>a.key.localeCompare(b.key)),labels:[...evidence.labels].sort(),
  links:[...evidence.links].map(canonical).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),remoteLinks:evidence.remoteLinks.map(canonical).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),
  attachments:evidence.attachments.map(({artifact,url,coverage,...a})=>({...a,coverage:{state:coverage.state},...(url?{url:stableUrl(url)}:{})})).sort((a,b)=>a.id.localeCompare(b.id)),
  coverage:Object.fromEntries(Object.entries(evidence.coverage).map(([key,value])=>[key,{state:value.state}]))}));
}
