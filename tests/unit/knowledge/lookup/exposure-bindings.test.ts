import { expect,test } from 'vitest';
import { knowledgeStore,job } from '../knowledge-fixture';
import { assignmentSubject } from '../../../../server/knowledge/lesson-exposure';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { assertRetainedDispatchScope } from '../../../../server/knowledge/sources/dispatch-scope';
import { requestSourceBindings } from '../../../../server/knowledge/lookup/exposure-bindings';

test('exact request identity beats an older job with the same ticket and keeps lookup-only dependencies',()=>{const f=knowledgeStore();try{
    const first=job({id:'first'}),second=job({id:'second'});f.store.state.coordination!.jobs!.push(first,second);
    const registry=new SourceRegistry(f.store.db),source=registry.create({kind:'artifact',title:'Private',homeProjectId:'brain'});
    const exposure={id:'attempt',stage:'review',at:'now',dispatchedAt:'now',digest:'hash',eligible:[],selected:[],omitted:[],subject:{kind:'job' as const,id:second.id}};
    f.store.state.knowledge!.exposures=[exposure];f.store.state.knowledge!.lookups=[{id:exposure.id,records:[{sourceBindings:[{sourceId:source.id}],selected:[]}]} as never];f.store.state.workLog!.push({id:exposure.id,requestId:second.id} as never);
    expect(assignmentSubject(f.store,second.id,second.key)).toEqual({kind:'job',id:second.id});expect(assignmentSubject(f.store,'unknown',second.key)).toBeUndefined();
    expect(requestSourceBindings(f.store.state,second.id)).toEqual([{sourceId:source.id}]);registry.subscribe(source.id,'brain',false);
    expect(()=>assertRetainedDispatchScope(f.store,registry,second.id,second.key)).toThrow('source access changed');expect(()=>assertRetainedDispatchScope(f.store,registry,first.id,first.key)).not.toThrow();
}finally{f.close();}});
