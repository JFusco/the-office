import type { command } from '../../workers/process';
export const EVIDENCE_LIMITS = {commandMs:60_000,captureMs:120_000,pages:10,pageSize:100,attachments:20,attachmentBytes:10_000_000,aggregateBytes:25*1024*1024,structuredBytes:2*1024*1024,extractedBytes:1024*1024} as const;
export type CoverageState='complete'|'truncated'|'unreadable'|'permission-denied';
export interface EvidenceSection { state:CoverageState; detail?:string; continuation?:string }
export interface EvidenceAttachment { id:string; name:string; mime:string; size?:number; url?:string; sha256?:string; artifact?:string; extracted?:string; interpretation?:'text'|'unread-image'|'unsupported'; coverage:EvidenceSection }
export interface ProviderEvidence {
 projectId:string;key:string;provider:'github'|'azure';identity:string;summary:string;description:unknown;labels:string[];type:string;
 comments:{id:string;body:unknown;author?:string}[];children:{key:string;summary:string;description:unknown;type?:string;status?:string;parent?:string}[];
 links:unknown[];remoteLinks:unknown[];attachments:EvidenceAttachment[];coverage:Record<string,EvidenceSection>;
}
export interface EvidenceReadContext { execute:typeof command; signal:AbortSignal; directory:string; download:(url:string,path:string,signal:AbortSignal,maxBytes:number)=>Promise<void> }
export function blankEvidence(projectId:string,key:string,provider:ProviderEvidence['provider'],identity:string):ProviderEvidence {
 return {projectId,key,provider,identity,summary:'',description:null,labels:[],type:'',comments:[],children:[],links:[],remoteLinks:[],attachments:[],coverage:{}};
}
export function failedCoverage(error:unknown):EvidenceSection {
 const category=(error as {category?:string})?.category;
 return {state:category==='permission'||category==='authentication'?'permission-denied':'unreadable',detail:String(error).slice(0,1000)};
}
