import { expect,test } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { knowledgeOfficeState } from '../../../../server/knowledge/office-state-view';
import { apiRoute } from '../../../../server/office/http/api-routes';

test('events inherit lookup dependencies and ordinary SSE hides revoked copies while retaining audit bytes',async()=>{const f=intakeFixture();try{
    f.store.state.knowledge!.exposures=[{id:'attempt',stage:'conversation',at:'now',dispatchedAt:'now',digest:'hash',eligible:[],selected:[],omitted:[]}];
    f.store.state.knowledge!.lookups=[{id:'attempt',records:[{selected:[],sourceBindings:[{sourceId:f.source.id}]}]} as never];f.store.state.workLog!.push({id:'attempt',requestId:'human-request',role:'pm',ticket:''} as never);
    const event=f.store.emit('model-result','SYNTHETIC PRIVATE EVENT','pm');expect(event.sourceBindings).toEqual([{sourceId:f.source.id}]);expect(knowledgeOfficeState(f.registry,'brain',f.store.state).events).toContainEqual(event);
    f.registry.subscribe(f.source.id,'brain',false);expect(knowledgeOfficeState(f.registry,'brain',f.store.state).events).toEqual([]);expect(f.store.replay(0)).toContainEqual(event);
    const context={store:f.store,project:'brain',offices:{questionEvents:()=>({subscribe:()=>()=>{}}),sources:f.registry,stores:()=>new Map([['brain',f.store]]),preferences:{subscribe:()=>()=>{}}},snapshot:()=>knowledgeOfficeState(f.registry,'brain',f.store.state)} as any,url=new URL('http://localhost/api/events');
    const response=await apiRoute(new Request(url),url,context),reader=response!.body!.getReader(),chunk=await reader.read();expect(new TextDecoder().decode(chunk.value)).not.toContain('SYNTHETIC PRIVATE EVENT');await reader.cancel();expect(f.store.listeners.size).toBe(0);
}finally{f.close();}});
