import { z } from 'zod';
import type { Store } from '../store/store';
import { featureById, mutation } from './commands';
const Link = z.object({action:z.literal('link'),requestId:z.string().min(1),expectedRevision:z.number().int().positive(),projectId:z.string().min(1),featureId:z.string().min(1)}).strict();
export function linkFeature(store: Store, id: string, raw: unknown, stores: ReadonlyMap<string, Store>) {
 const input=Link.parse(raw), feature=featureById(store,id), owner=stores.get(input.projectId);
 if(!owner)throw new Error('Linked project is unavailable');
 const related=featureById(owner,input.featureId);
 if(related.id===feature.id&&owner.project.id===store.project.id)throw new Error('A feature cannot link to itself');
 mutation(store,feature,input.requestId,input.expectedRevision,input,()=>{
  if(!feature.links?.some(l=>l.projectId===related.projectId&&l.id===related.id))(feature.links??=[]).push({projectId:related.projectId,id:related.id,title:related.title});
 });
 return JSON.parse(feature.requests[input.requestId].response!);
}
