import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {artifact} from './readback-evidence';
import type {Store} from './store';
import type {GitHubDelivery} from './github-delivery';
import {workKey,type TicketJob} from '../src/shared';
import type {PreparationReceiptBinding} from './preparation-receipts';

const timestamp=z.string().refine(value=>Number.isFinite(Date.parse(value)));
const updateSchema=z.object({stage:z.literal('review'),head:z.string().regex(/^[a-f0-9]{40}$/),project:z.string().min(1),item:z.string().min(1),field:z.string().min(1),option:z.string().min(1),target:z.literal('In review'),at:timestamp,status:z.literal('verified'),detail:z.string()}).strict();
const eventSchema=z.object({id:z.number().int().positive(),at:timestamp,kind:z.literal('review-board-status'),role:z.literal('lead'),ticket:z.string(),message:z.string()}).strict();
const claimSchema=z.object({id:z.string().min(1),work:z.object({projectId:z.string(),kind:z.literal('delivery'),id:z.string()}).strict(),owner:z.string().min(1),stage:z.literal('review'),lane:z.literal('delivery'),status:z.literal('completed'),claimedAt:timestamp,endedAt:timestamp}).strict();
export type PreparationBoardOrigin={kind:'office-harness-review-board';projectId:string;repository:string;jobId:string;ticket:string;head:string;update:z.infer<typeof updateSchema>;event:z.infer<typeof eventSchema>;claim:z.infer<typeof claimSchema>;qaProofPath:string;qaProofSha256:string};

/** The historical harness receipt is an observation, not a fabricated native call or effects-ledger entry. */
export function bindPreparationBoardOrigins(store:Store,job:TicketJob,bindings:PreparationReceiptBinding[],qaProofPath?:string):PreparationReceiptBinding[]{
 return bindings.map(binding=>{
  if(binding.id!=='rcpt-review-board'||binding.kind!=='board-item'||binding.checkpoint.action!=='project item-edit Status -> In review')return binding;
  if(!qaProofPath||!binding.historical.some(h=>h.stage==='validate'))throw new Error('Accepted QA harness board provenance required');
  const file=artifact(store,qaProofPath),proof=JSON.parse(readFileSync(file.path,'utf8'));
  const updates=(job.boardUpdates||[]).filter(u=>u.stage==='review').sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const update=updateSchema.parse(updates[0]);
  if(updates[1]?.at===update.at||update.head!==job.head||binding.identity!==`${store.project.githubProject?.url}#item-${update.item}`)throw new Error('Historical harness board identity is ambiguous');
  const observations=[proof.providerObservations?.before,proof.providerObservations?.after];
  for(const observation of observations){
   if(observation?.source!=='Office read-only GitHub adapter'||observation.projectId!==store.project.id||observation.repository!==store.project.repository||observation.ticket!==job.key||
    observation.board?.url!==store.project.githubProject?.url||observation.board.item?.id!==update.item||observation.board.item.repository!==store.project.repository||observation.board.item.number!==Number(job.key.slice(3))||observation.board.item.status!==update.target||
    observation.ownership?.complete!==true||observation.ownership.fresh!==true||observation.ownership.status!=='clear'||!Number.isFinite(Date.parse(observation.observedAt))||Date.parse(observation.observedAt)<Date.parse(update.at))throw new Error('Accepted QA harness board observation is incomplete');
  }
  if(Date.parse(observations[1].observedAt)<Date.parse(observations[0].observedAt))throw new Error('Historical harness QA observations are out of order');
  if(!Array.isArray(observations[0].savedBoardReceipts)||!observations[0].savedBoardReceipts.some((value:unknown)=>isDeepStrictEqual(value,update)))throw new Error('Accepted QA does not bind the historical harness board update');
  const original=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-prepare-pr').at(-1);
  if(!original||observations.some(o=>Date.parse(o.observedAt)>=Date.parse(original.startedAt)))throw new Error('Historical harness board verification must precede preparation');
  const rows=store.db.prepare("SELECT id,body FROM events WHERE json_extract(body,'$.kind')='review-board-status' AND json_extract(body,'$.ticket')=? AND json_extract(body,'$.at')>=? AND json_extract(body,'$.at')<? ORDER BY id LIMIT 3").all(job.key,update.at,updates[1]?.at||observations[0].observedAt)as {id:number;body:string}[];
  if(rows.length!==1)throw new Error('One originating harness board event required');
  const event=eventSchema.parse(JSON.parse(rows[0].body));
  if(event.id!==rows[0].id||event.ticket!==job.key||event.message!==`${job.key}: In review verified; Sam has claimed the candidate for review.`||Date.parse(event.at)>=Date.parse(observations[0].observedAt))throw new Error('Harness board event identity disagrees');
  const claims=(store.db.prepare("SELECT id,work_key,status,body FROM work_claims WHERE json_extract(body,'$.work.id')=? AND json_extract(body,'$.stage')='review'").all(job.id)as {id:string;work_key:string;status:string;body:string}[]).flatMap(row=>{const parsed=claimSchema.safeParse(JSON.parse(row.body));return parsed.success&&row.id===parsed.data.id&&row.status==='completed'&&row.work_key===workKey(parsed.data.work)?[parsed.data]:[];});
  const owners=claims.filter(claim=>claim.work.projectId===store.project.id&&claim.work.id===job.id&&Date.parse(claim.claimedAt)<=Date.parse(update.at)&&Date.parse(claim.endedAt)>=Date.parse(event.at));
  if(owners.length!==1)throw new Error('One historical scheduler board owner required');
  const harnessOrigin:PreparationBoardOrigin={kind:'office-harness-review-board',projectId:store.project.id,repository:store.project.repository,jobId:job.id,ticket:job.key,head:job.head,update,event,claim:owners[0],qaProofPath:file.path,qaProofSha256:file.sha256};
  return {...binding,harnessOrigin};
 });
}

/** Independent live exact field/option reads corroborate historical provenance; never write or infer a mutation. */
export async function readPreparationBoardOrigins(delivery:GitHubDelivery,job:TicketJob,bindings:PreparationReceiptBinding[]){
 const reads:unknown[]=[];
 for(const binding of bindings){
  const origin=binding.harnessOrigin;if(!origin)continue;
  const {update}=origin;
  const query='query($item:ID!){node(id:$item){... on ProjectV2Item{id project{id} content{... on Issue{number repository{nameWithOwner}}} fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{optionId field{... on ProjectV2SingleSelectField{id}}}} pageInfo{hasNextPage}}}}}';
  const response=JSON.parse(await delivery.execute('gh',['api','graphql','--input','-'],{input:JSON.stringify({query,variables:{item:update.item}}),cwd:delivery.store.project.repo,readOnly:true,timeout:60000}));
  const item=response.data?.node,values=item?.fieldValues?.nodes;
  if(response.errors?.length||item?.id!==update.item||item.project?.id!==update.project||item.content?.number!==Number(job.key.slice(3))||item.content.repository?.nameWithOwner!==delivery.store.project.repository||
   item.fieldValues?.pageInfo?.hasNextPage!==false||!Array.isArray(values)||values.length>100)throw new Error('Exact harness board provider readback required');
  const matches=values.filter((value:any)=>value?.field?.id===update.field);
  if(matches.length!==1||matches[0].optionId!==update.option)throw new Error('Historical harness board field or option changed');
  reads.push({bindingId:binding.id,project:update.project,item:update.item,field:update.field,option:update.option,repository:delivery.store.project.repository,ticket:job.key,head:job.head});
 }
 return reads;
}
