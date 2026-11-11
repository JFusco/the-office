import { expect,test } from 'vitest';
import { sourceFixture } from './source-fixture';
import { knowledgeSessionVisibility } from '../../../../server/knowledge/sources/session-visibility';
test('source denial withholds worker context without changing ownership, and sharing a stream does not share task history',()=>{const f=sourceFixture();try{
    f.store.state.knowledge!.exposures=[{id:'attempt',stage:'review',at:'now',dispatchedAt:'now',digest:'hash',eligible:[],selected:[],omitted:[],sourceBindings:[{sourceId:f.source.id}]}];f.store.state.workLog!.push({id:'attempt',requestId:'request',sessionId:'native',role:'lead'} as never);
    const view={sessions:[{id:'native',title:'PRIVATE WORKER TITLE',context:{conversation:{text:'PRIVATE CONTENT'}},rolloutPath:'/private/provider-log',status:'active'}],ownership:{status:'owned',matches:[{id:'native',title:'PRIVATE WORKER TITLE',status:'active'}]}} as any;
    expect(knowledgeSessionVisibility(f.registry,'brain',[f.store],view).sessions[0].context).toBeDefined();
    f.registry.subscribe(f.source.id,'cec',true);const shared=knowledgeSessionVisibility(f.registry,'cec',[f.store],view);expect(shared.ownership.status).toBe('owned');expect(shared.ownership.matches[0].id).toBe('native');expect(JSON.stringify(shared)).not.toContain('PRIVATE');
    f.registry.subscribe(f.source.id,'brain',false);const denied=knowledgeSessionVisibility(f.registry,'brain',[f.store],view);expect(denied.sessions[0].context).toBeUndefined();expect(denied.sessions[0].rolloutPath).toBeUndefined();expect(denied.ownership.status).toBe('owned');expect(view.sessions[0].context).toBeDefined();
}finally{f.close();}});
