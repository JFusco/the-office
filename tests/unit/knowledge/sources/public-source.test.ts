import type { SecretScanner } from '../../../../server/knowledge/sources/admission';
import { expect,test } from 'vitest';
import { sourceFixture,cleanScan } from './source-fixture';
import { knowledgeStore } from '../knowledge-fixture';
import { scheduledSources } from '../../../../server/knowledge/sources/schedule';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { SourceLedger } from '../../../../server/knowledge/sources/ledger';
import { IntakeBudget } from '../../../../server/knowledge/sources/launch-budget';
import type { EvidenceRecord } from '../../../../server/knowledge/sources/evidence-record';
import { publicUrl } from '../../../../server/knowledge/sources/public-url';
const sourceResult=(url:string)=>({findings:[],sources:[{topicId:'public',applicability:'unknown',contradictions:'',url,retrievedAt:'2026-11-06T23:00:00Z',version:'reported',primary:true,readEvidence:'native-read:injected-fixture',claim:'Verify the schema version before applying mappings.'}],unavailable:[],references:[]});
test('a public source uses one shared collection across subscribers and refreshes without duplicating identical claims',async()=>{const f=sourceFixture(),other=knowledgeStore('cec');try{
    other.store.state.knowledge!.enabled=true;const source=f.registry.create({kind:'link',title:'Public guide',homeProjectId:'brain',url:'https://www.sqlite.org/lang.html',cadence:'daily'});f.registry.subscribe(source.id,'cec',true);
    let runs=0;const runner=(async(prompt,_schema,opts)=>{runs++;expect(prompt).toContain(source.url);expect(prompt).not.toContain('Fixture');expect(prompt).not.toContain('PROJECT CONTEXT');expect(opts.stage).toBe('knowledge-source-read');opts.onIntakeLaunch?.();return sourceResult(source.url!);}) as KnowledgeRunner;
    const due=()=>scheduledSources(f.store,runner,f.store.clock.now(),f.registry,cleanScan).find(w=>w.work.id===`source:${source.id}`);
    expect(due()!.eligibility.state).toBe('runnable');await due()!.execute();expect(runs).toBe(1);expect(due()).toBeUndefined();
    expect(scheduledSources(other.store,runner,other.store.clock.now(),f.registry,cleanScan)).toEqual([]);
    const ledger=new SourceLedger(f.store,source),evidence=ledger.all<EvidenceRecord>('evidence');expect(evidence).toHaveLength(1);expect(evidence[0].readerVersion).toBe('public-claims-v1');expect(evidence[0].limitations.join(' ')).toContain('original page bytes');expect(ledger.all('proposal')).toEqual([]);expect(new IntakeBudget(f.registry).used()).toBe(1);
    f.advance(1000);f.registry.update(source.id,f.registry.get(source.id)!.revision,s=>{s.refreshRequestedAt=f.store.clock.now().toISOString();});await due()!.execute();expect(runs).toBe(2);expect(due()).toBeUndefined();expect(ledger.all('evidence')).toHaveLength(1);expect(new IntakeBudget(f.registry).used()).toBe(2);
}finally{other.close();f.close();}});
test('global allowance and pause gate public collection, and failed admission cannot expose unscanned claims',async()=>{const f=sourceFixture();try{
    const source=f.registry.create({kind:'link',title:'Public guide',homeProjectId:'brain',url:'https://www.sqlite.org/lang.html'});let runs=0;
    const runner=(async(_prompt,_schema,opts)=>{runs++;opts.onIntakeLaunch?.();return sourceResult(source.url!);}) as KnowledgeRunner;
    const blockedScan=async(text:string)=>({...await cleanScan(text),clean:!text.startsWith('['),findings:text.startsWith('[')?[{rule:'fixture',line:1,endLine:1}]:[]});
    const due=(scan:SecretScanner=cleanScan)=>scheduledSources(f.store,runner,f.store.clock.now(),f.registry,scan).find(w=>w.work.id===`source:${source.id}`);
    await due(blockedScan)!.execute();const ledger=new SourceLedger(f.store,source);expect(ledger.all('evidence')).toEqual([]);expect(runs).toBe(1);expect(due()).toBeUndefined();
    f.advance(1000);f.registry.update(source.id,f.registry.get(source.id)!.revision,s=>{s.refreshRequestedAt=f.store.clock.now().toISOString();});await due()!.execute();expect(runs).toBe(2);expect(ledger.all('evidence')).toHaveLength(1);
    f.advance(1000);f.registry.update(source.id,f.registry.get(source.id)!.revision,s=>{s.refreshRequestedAt=f.store.clock.now().toISOString();});const budget=new IntakeBudget(f.registry);for(let i=2;i<8;i++){expect(budget.reserve(`fixture-${i}`,source.id)).toBe(true);budget.launched(`fixture-${i}`);}
    expect(due()!.eligibility.state).toBe('waiting');expect(due()!.eligibility.reason).toContain('allowance');expect(runs).toBe(2);
    const current=f.registry.get(source.id)!;f.registry.update(source.id,current.revision,s=>{s.state='paused';});expect(due()!.eligibility.state).toBe('blocked');await due()!.execute();expect(runs).toBe(2);
}finally{f.close();}});
test('a blocked public claim is terminal while a clean followed page is admitted without replay',async()=>{const f=sourceFixture();try{
 const source=f.registry.create({kind:'link',title:'Public guide',homeProjectId:'brain',url:'https://www.sqlite.org/root.html'}),child='https://www.sqlite.org/child.html';let runs=0;
 const runner=(async(prompt,_schema,options)=>{runs++;options.onIntakeLaunch?.();const url=prompt.includes(JSON.stringify(child))?child:source.url!;const result=sourceResult(url);if(url===source.url){result.sources[0].claim='SYNTHETIC_WITHHELD_CLAIM';(result.references as unknown[])=[{from:url,url:child}];}return result;}) as KnowledgeRunner;
 const scan=async(text:string)=>({...await cleanScan(text),...(text.startsWith('[')&&text.includes('SYNTHETIC_WITHHELD_CLAIM')?{clean:false,findings:[{rule:'fixture',line:1,endLine:1}]}:{})});
 const due=()=>scheduledSources(f.store,runner,f.store.clock.now(),f.registry,scan).find(work=>work.work.id===`source:${source.id}`);
 await due()!.execute();await due()!.execute();expect(due()).toBeUndefined();expect(runs).toBe(2);
 const ledger=new SourceLedger(f.store,source);expect(ledger.all('evidence')).toHaveLength(1);expect(ledger.all<EvidenceRecord>('evidence')[0].url).toBe(child);
 expect(ledger.all<{state:string;text:string}>('unit').find(unit=>unit.text.includes('SYNTHETIC_WITHHELD_CLAIM'))?.state).toBe('inaccessible');expect(ledger.all('admission')).toEqual(expect.arrayContaining([expect.objectContaining({state:'blocked'})]));
 expect(ledger.all<{state:string;reason?:string}>('link')).toEqual(expect.arrayContaining([expect.objectContaining({state:'deferred',reason:'secret-scan-blocked'})]));expect(ledger.get('public-collection','latest')).toBeTruthy();
}finally{f.close();}});
test('the shared public URL policy rejects internal, credentialed and ambiguous links at registration',()=>{const f=sourceFixture();try{
    for(const url of ['https://localhost/page','https://127.0.0.1/page','https://private.internal/page','https://user:pass@example.com/page','https://example.com/page?token=x']){expect(()=>f.registry.create({kind:'link',title:'Invalid',homeProjectId:'brain',url})).toThrow();expect(publicUrl(url,[new URL(url).hostname])).toBeUndefined();}
    expect(publicUrl('https://www.sqlite.org/lang.html',['www.sqlite.org'])).toBe('https://www.sqlite.org/lang.html');
}finally{f.close();}});
