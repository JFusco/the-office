import {expect,test} from 'vitest';
import {fixture} from '../test-store';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
import {canReleaseOrdinary,offerOrdinaryRelease} from '../../../../server/features/questions/release-ordinary';
import {commandFeature} from '../../../../server/features/commands';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const clear={status:'clear' as const,reason:''};
test('unreadable helper ownership receipts prevent ordinary release even without a worker row',()=>{
 const f=fixture();try{
 f.feature.sourceTicket='GH-1';f.feature.review={run:f.root,processes:[]} as any;
 mkdirSync(resolve(f.root,'calls','001'),{recursive:true});writeFileSync(resolve(f.root,'calls','001','started.json'),'invalid');
 expect(canReleaseOrdinary(f.store,f.feature,clear)).toBe(false);
 }finally{f.close();}
});
test('pending delivery requests and adopted PRs prevent ordinary release',()=>{
 const f=fixture();try{
 f.feature.sourceTicket='GH-1';
 const requests=f.store.state.coordination!.requests=[{id:'request',action:'resume',key:'GH-1',head:'',requestedAt:'now',status:'blocked' as const,detail:'',lane:'delivery' as const}];
 expect(canReleaseOrdinary(f.store,f.feature,clear)).toBe(false);
 requests.length=0;f.store.state.coordination!.adoptions=[{id:'adopted',pr:3,url:'',title:'',issue:1,status:'adopted',detail:'',at:'now'}];
 expect(canReleaseOrdinary(f.store,f.feature,clear)).toBe(false);
 f.store.state.coordination!.adoptions[0].status='withdrawn';expect(canReleaseOrdinary(f.store,f.feature,clear)).toBe(true);
 }finally{f.close();}
});
test('ordinary release is absent for unknown ownership or publication and detaches only a verified safe source',()=>{
 const f=fixture();try{
 f.feature.sourceTicket='GH-1';recoveryQuestion(f.feature,new Date(),'Unavailable capability');
 offerOrdinaryRelease(f.store,f.feature,{status:'unknown',reason:'stale'});expect(f.feature.rounds[0].options?.some(o=>o.action==='release-to-ordinary')).toBe(false);
 f.feature.publication.push({id:'p',key:'',url:'',approvalId:'a',verified:false,queued:false,effects:[],fence:true});expect(canReleaseOrdinary(f.store,f.feature,clear)).toBe(false);f.feature.publication=[];
 offerOrdinaryRelease(f.store,f.feature,clear);const round=f.feature.rounds[0];expect(round.options?.some(o=>o.action==='release-to-ordinary')).toBe(true);
 commandFeature(f.store,f.feature.id,{action:'harness-action',operation:'apply',optionId:'release-to-ordinary',requestId:'release',expectedRevision:1,roundId:round.id},clear);
 expect(f.feature).toMatchObject({sourceTicket:'',releasedSourceTicket:'GH-1',phase:'complete',paused:true});expect(round.resolvedAt).toBeTruthy();
 }finally{f.close();}
});
