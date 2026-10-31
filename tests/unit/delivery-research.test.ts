import { expect, test } from 'vitest';
import { deliveryResearchContext } from '../../server/github-context';
import type { Store } from '../../server/store';
import type { TeamMessage } from '../../src/shared';
function fixture() {
 const messages:TeamMessage[] = Array.from({length:5},(_,index)=>({id:`message-${index}`,requestId:'request',ticket:'GH-67',status:'answered',error:'',from:'lead',to:'lead',sessionId:`native-${index}`,body:'Evidence '.repeat(2000),createdAt:'2026-10-30T05:00:00Z',actionId:'',recheck:false,recipients:[],receipts:[]}));
 const workLog = messages.map((message,index)=>({id:`work-${index}`,sessionId:message.sessionId,role:'lead',ticket:'GH-67',stage:'conversation',status:'completed',endedAt:'2026-10-30T05:00:00Z'}));
 messages.push({...messages[0],id:'request',from:'human',sessionId:'',body:'Research GH-67'});
 return {project:{id:'brain'},dataRoot:'/private/brain',state:{messages,workLog}} as unknown as Store;
}
test('delivery receives bounded latest completed research with exact owning-store provider-result locators',()=>{
 const store=fixture(),result=deliveryResearchContext(store,'GH-67');
 expect(result.map(row=>row.messageId)).toEqual(['message-2','message-3','message-4']);
 expect(result.every(row=>row.body.length===8000)).toBe(true);expect(result[0].providerResult).toBe('/private/brain/sessions/work-2/result.json');
});
test.each(['ticket','status','error','role','project','worker','session','duplicate','request-failed','request-active','request-error','request-missing','uncertain-receipt','unverified-receipt','empty-session'] as const)('excludes %s research from the delivery handoff',kind=>{
 const store=fixture();store.state.messages=[store.state.messages[0],store.state.messages.at(-1)!];store.state.workLog=store.state.workLog!.slice(0,1);
 const [message,request]=store.state.messages,work=store.state.workLog![0];
 if(kind==='ticket')message.ticket='GH-70';if(kind==='status')message.status='failed';if(kind==='error')message.error='Failure';
 if(kind==='role')message.from='cto';if(kind==='project')message.contextProject='other';if(kind==='worker')work.status='running';
 if(kind==='session')work.sessionId='another';if(kind==='duplicate')store.state.workLog!.push({...work});
 if(kind==='request-failed')request.status='failed';if(kind==='request-active')request.status='working';if(kind==='request-error')request.error='Failure';
 if(kind==='request-missing')store.state.messages=[message];if(kind==='empty-session')message.sessionId=work.sessionId='';
 if(kind==='uncertain-receipt'||kind==='unverified-receipt')message.receipts=[{id:'receipt',action:'read',target:'research',verified:kind!=='unverified-receipt',uncertain:kind==='uncertain-receipt',detail:''}];
 expect(deliveryResearchContext(store,'GH-67')).toEqual([]);
});
