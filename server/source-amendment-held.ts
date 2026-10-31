import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {z} from 'zod';
import {isDeepStrictEqual} from 'node:util';
import type {StageResult,TicketJob} from '../src/shared';
import type {GitHubDelivery} from './github-delivery';
import {artifact,digest,rootArtifact} from './readback-evidence';
import {SourceAmendmentCommand,amendmentInstruction} from './source-amendment';

export const OUTSIDE_AMENDMENT_FINDING='f-other-index-drift';
const paths=['sources.lock.json','sources/official-sources.json','sources/evidence-locators.json','catalog/catalog.json'] as const;
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
function rows(value:any,key:string){requireThat(Array.isArray(value),'Complete source rows required');const map=new Map<string,any>();for(const row of value){requireThat(row&&typeof row[key]==='string'&&!map.has(row[key]),'Unique source identity required');map.set(row[key],row);}return map;}
/** No freshness is accepted: prove all non-amended source rows and every profile claim remain byte-equivalent data. */
export function proveOutsideAmendmentUnchanged(files:Record<string,{base:string;candidate:string}>,approved:string[],outside:string[]){
 requireThat(approved.length===3&&new Set(approved).size===3&&outside.length>0&&new Set(outside).size===outside.length&&outside.every(id=>!approved.includes(id)),'Outside finding overlaps amendment or has unknown scope');
 for(const [path,key]of [['sources.lock.json','sourceId'],['sources/official-sources.json','id'],['sources/evidence-locators.json','sourceId']]as const){
  const before=rows(JSON.parse(files[path].base).sources,key),after=rows(JSON.parse(files[path].candidate).sources,key);
  requireThat(outside.every(id=>before.has(id)&&after.has(id)),'Outside scan source identity is not registered');
  for(const id of new Set([...before.keys(),...after.keys()]))if(!approved.includes(id))requireThat(isDeepStrictEqual(before.get(id),after.get(id)),`Outside source changed: ${id}`);
 }
 const before=rows(JSON.parse(files['catalog/catalog.json'].base).profiles,'id'),after=rows(JSON.parse(files['catalog/catalog.json'].candidate).profiles,'id');
 requireThat(isDeepStrictEqual([...before.keys()].sort(),[...after.keys()].sort()),'Profile identity changed');
 const claims=(row:any)=>{const {sourceIds,...rest}=row;requireThat(Array.isArray(sourceIds)&&sourceIds.every((id:unknown)=>typeof id==='string')&&new Set(sourceIds).size===sourceIds.length,'Profile source identities required');return {...rest,sourceIds:sourceIds.filter((id:string)=>!approved.includes(id))};};
 for(const [id,row]of before)requireThat(isDeepStrictEqual(claims(row),claims(after.get(id))),`Outside profile claims or bindings changed: ${id}`);
}
/** OPEN is retained only for this recorded, independently audited, wholly outside finding. No model waiver exists. */
export async function outsideAmendmentFindingIds(delivery:GitHubDelivery,job:TicketJob,head=job.head,result?:StageResult):Promise<Set<string>>{
 const record=job.scopeRepairReadback;if(!record)return new Set();
 const {store}=delivery;amendmentInstruction(store,job);
 const authorization=SourceAmendmentCommand.parse(job.sourceAmendment!.authorization),file=artifact(store,record.proofPath);
 requireThat(file.sha256===record.proofSha256,'Scope repair read-back proof changed');
 const proof=JSON.parse(readFileSync(file.path,'utf8'));
 requireThat(proof.intentId===record.intentId&&proof.originalWorkId===record.originalWorkId&&proof.fromHead===record.fromHead&&proof.head===record.head&&proof.authorizationSha256===digest(authorization)&&
  proof.assessment?.outcome==='passed'&&proof.assessment.completeNativeExecution===true&&proof.assessment.noExternalEffects===true&&proof.assessment.scansVerified===true&&proof.assessment.noHumanHold===true&&
  proof.outsideFinding?.id===OUTSIDE_AMENDMENT_FINDING&&isDeepStrictEqual(proof.outsideFinding.sourceIds,record.outsideSourceIds),'Outside finding proof identity changed');
 requireThat(proof.originalNative?.root===resolve(homedir(),'.claude/projects')&&isDeepStrictEqual(rootArtifact(proof.originalNative.root,proof.originalNative.file.path),proof.originalNative.file),'Original audited native transcript changed');
 requireThat(proof.evidenceDigests?.length&&proof.evidenceDigests.every((f:any)=>isDeepStrictEqual(artifact(store,f.path),f)),'Scope repair retained evidence changed');
 const completed=store.state.coordination?.requests?.filter(r=>r.id===record.intentId&&r.action==='reconcile-scope-repair'&&r.key===job.key&&r.head===record.originalWorkId&&r.status==='completed')||[];
 requireThat(completed.length===1&&/^[a-f0-9]{40}$/.test(head),'Completed exact-original scope repair intent required');
 const options={cwd:job.worktree,readOnly:true,timeout:30000};
 await delivery.execute('git',['merge-base','--is-ancestor',record.head,head],options);
 const base=await delivery.execute('git',['merge-base',head,`origin/${store.project.target}`],options);
 requireThat(/^[a-f0-9]{40}$/.test(base.trim()),'Current candidate base unavailable');
 const files:Record<string,{base:string;candidate:string}>={};
 for(const path of paths)files[path]={base:await delivery.execute('git',['show',`${base.trim()}:${path}`],options),candidate:await delivery.execute('git',['show',`${head}:${path}`],options)};
 proveOutsideAmendmentUnchanged(files,authorization.sourceIds,record.outsideSourceIds);
 if(result){
  const binding=z.object({version:z.literal(1),authorizationId:z.literal(job.sourceAmendment!.id),readbackSha256:z.literal(record.proofSha256),findingId:z.literal(OUTSIDE_AMENDMENT_FINDING),scope:z.literal('wholly-outside-unchanged'),sourceIds:z.array(z.string())}).strict();
  const bindings=result.evidence.filter(e=>e.id==='source-amendment-held-finding'&&e.commit===result.commit&&e.path===record.proofPath).map(e=>{try{return binding.parse(JSON.parse(e.summary));}catch{return undefined;}}).filter(Boolean);
  requireThat(result.findings.filter(f=>f.id===OUTSIDE_AMENDMENT_FINDING&&f.status==='open').length===1&&bindings.length===1&&isDeepStrictEqual(bindings[0]!.sourceIds,record.outsideSourceIds),'Exact current-head outside finding scope binding required');
 }
 return new Set([OUTSIDE_AMENDMENT_FINDING]);
}

/** Repair selection excludes proven outside work, retaining the original native finding/result unchanged. */
export function amendmentRepairView(result:StageResult,held:Set<string>):StageResult {
 if(!held.size)return result;
 return {...result,findings:result.findings.filter(f=>!held.has(f.id)),resolution:result.resolution?{...result.resolution,findingIds:result.resolution.findingIds.filter(id=>!held.has(id))}:result.resolution};
}
