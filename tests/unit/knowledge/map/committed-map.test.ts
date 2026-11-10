import { expect,it } from 'vitest';
import { knowledgeStore, learningLesson } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { committedKnowledgeMap } from '../../../../server/knowledge/map/committed-map';
import { evidenceIdentity } from '../../../../server/knowledge/sources/evidence-record';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import type { BrainReader } from '../../../../server/knowledge/brain/reader';

it('keeps published IDs stable, pins usage to its exact revision and excludes private work from the global map',async()=>{
    const f=knowledgeStore();try{
        const store=f.store,registry=new SourceRegistry(store.db),source=registry.create({kind:'artifact',title:'PRIVATE CHANNEL',homeProjectId:'brain'}),ledger=new IntakeLedger(store,source);
        const id=evidenceIdentity(source.id,'doc','v1');ledger.put('admission','doc:v1',{state:'admitted'});ledger.put('evidence',id,{id,sourceId:source.id,unitId:'doc',version:'v1',text:'PRIVATE EVIDENCE',url:'',contentSha256:digest('PRIVATE EVIDENCE'),readerVersion:'fixture',limitations:[]});
        store.state.knowledge!.lessons.push(learningLesson('private',{statement:'PRIVATE GUIDANCE'}));store.state.knowledge!.officeLessons=[learningLesson('approved',{scope:'office',statement:'Approved Office guidance'})];
        let snapshot='a'.repeat(40);const path='knowledge/tooling/guide.md',hash=digest('Published guide');
        const brain:BrainReader={snapshot:async()=>snapshot,search:async()=>[],read:async()=>({text:'Published guide',contentSha256:hash}),graph:async revision=>({version:1,snapshot:revision,nodes:[{id:'knowledge/tooling/INDEX.md',title:'Tooling',kind:'index'},{id:path,path,title:'Published guide',kind:'curated-note',domains:['tooling'],sha256:hash}],edges:[{source:'knowledge/tooling/INDEX.md',target:path,relation:'domain membership'}],truncated:false,nextCursor:null})};
        const context={registry,stores:new Map([['brain',store]]),brain};
        store.state.knowledge!.exposures=[{id:'attempt',stage:'implement',at:'now',dispatchedAt:'now',subject:{kind:'job',id:'work'},digest:'hash',eligible:[],selected:[],omitted:[],evidence:[{reference:{id:`brain:${snapshot}:${path}`,snapshot,path,kind:'brain',contentSha256:hash},excerptSha256:hash}]}];
        const current=await committedKnowledgeMap(context,'brain');expect(current.nodes.find(n=>n.title==='Published guide')).toMatchObject({technicalKind:'curated-note',domains:['tooling']});expect(current.edges.some(e=>e.kind==='supplied'&&e.target===`technical:${path}`)).toBe(true);expect(current.edges.some(e=>e.kind==='publication'&&e.relation==='domain membership')).toBe(true);
        snapshot='b'.repeat(40);const newer=await committedKnowledgeMap(context,'brain');expect(newer.nodes.find(n=>n.title==='Published guide')!.id).toBe(current.nodes.find(n=>n.title==='Published guide')!.id);expect(newer.edges.some(e=>e.kind==='supplied'&&e.target===`technical:${path}`)).toBe(false);
        const global=await committedKnowledgeMap(context,'brain',true);expect(JSON.stringify(global)).not.toContain('PRIVATE');expect(global.nodes.some(n=>n.title==='Approved Office guidance')).toBe(true);expect(global.nodes.some(n=>n.kind==='assignment')).toBe(false);expect(global.truncated).toBe(false);
        brain.graph=async revision=>{registry.subscribe(source.id,'brain',false);return {version:1,snapshot:revision,nodes:[],edges:[],truncated:false,nextCursor:null};};
        const revoked=await committedKnowledgeMap(context,'brain');expect(JSON.stringify(revoked)).not.toContain('PRIVATE CHANNEL');expect(revoked.nodes.some(n=>n.kind==='evidence')).toBe(false);
    }finally{f.close();}
});
