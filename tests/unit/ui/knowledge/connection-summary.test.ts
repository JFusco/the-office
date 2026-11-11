import {test,expect} from 'vitest';
import {connectionSummary} from '../../../../src/knowledge/map/connection-summary';
test('keeps saved edge identities, deduplicates neighbors and reports unloaded endpoints without inventing nodes',()=>{
    const map={nodes:[{id:'a',kind:'lesson' as const,title:'A',detail:''},{id:'b',kind:'evidence' as const,title:'B',detail:''}],edges:[{source:'a',target:'b',kind:'citation' as const},{source:'b',target:'a',kind:'verified' as const},{source:'a',target:'missing',kind:'provenance' as const}],truncated:true};
    expect(connectionSummary(map,'a')).toEqual({edges:map.edges,neighbors:[map.nodes[1]],missing:['missing']});expect(connectionSummary(map,'isolated')).toEqual({edges:[],neighbors:[],missing:[]});
});
