import {expect,test} from 'vitest';
import {authorizeFeature} from '../../../../server/features/release/authorize';
import {approvedDelivery} from '../../../../server/features/delivery-binding';
import {digest} from '../../../../server/features/documents';
import {SourceChanged} from '../../../../server/features/planning-baseline';
import {authorizationFixture} from './authorization-fixture';
test('fresh post-await brief, review, question and pause checks reject stale authorization',async()=>{
 for(const mutate of [(f:any)=>{f.feature.confirmedBrief='changed'},(f:any)=>{f.feature.review.revision++},(f:any)=>{f.store.state.paused=true},(f:any)=>{f.feature.rounds.push({id:'harness',revision:1,author:'harness',questions:[],answers:{},createdAt:''})}]) {
 const f=authorizationFixture();try{
 await expect(authorizeFeature(f.store,f.feature.id,f.input,{kind:'human',actor:'Joe'},()=>{},async()=>{mutate(f)},undefined,f.inspect,f.compare)).rejects.toThrow();
 expect(f.store.state.features![0].approvals).toHaveLength(0);
 }finally{f.close();}
 }
});
test('legacy approval hashes use the exact stored shape and are never rewritten on read',async()=>{
 const f=authorizationFixture();try{
 await authorizeFeature(f.store,f.feature.id,f.input,{kind:'human',actor:'Joe'},()=>{},async()=>{},undefined,f.inspect,f.compare);
 const approval=f.feature.approvals[0];delete approval.authority;
 const {digest:old,...record}=approval;approval.digest=digest(record);
 const before=JSON.stringify(approval);expect(approvedDelivery(f.store,{featureId:f.feature.id,itemId:'one',approvalId:approval.id,approvalDigest:approval.digest}).approval.approver).toBe('Joe');
 expect(JSON.stringify(approval)).toBe(before);
 }finally{f.close();}
});
test('repository drift spends exactly one lifetime replan',async()=>{
 const f=authorizationFixture();try{
 f.feature.progression='automatic';
 await expect(authorizeFeature(f.store,f.feature.id,f.input,{kind:'human',actor:'Joe'},()=>{},async()=>{},undefined,f.inspect,async()=>{throw new SourceChanged('changed')})).rejects.toThrow();
 expect(f.feature.lifetimeReplans).toBe(1);expect(f.feature.revision).toBe(2);expect(f.feature.releases!.filter(r=>r.outcome==='replan')).toHaveLength(1);
 }finally{f.close();}
});
test('nonterminal canonical review state is retained for exact recovery routing',async()=>{
 const f=authorizationFixture();try{
 const evidence={...(await f.inspect()),status:'needs_user',findings:[{id:'FIND-1',disposition:'PENDING_USER'}]};
 await expect(authorizeFeature(f.store,f.feature.id,f.input,{kind:'human',actor:'Joe'},()=>{},async()=>{},undefined,async()=>evidence,f.compare)).rejects.toMatchObject({code:'review-state',evidence});expect(f.feature.approvals).toEqual([]);
 }finally{f.close();}
});
