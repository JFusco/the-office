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
import { runPublicReads,linkKey,type LinkRecord } from '../../../../server/knowledge/sources/public-reader';
import { CommandFailure } from '../../../../server/workers/process';
import { existsSync,readdirSync } from 'node:fs';
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
type Fixture=ReturnType<typeof sourceFixture>;
const readPolicy=(f:Fixture)=>({sourceId:f.source.id,sourceDigest:f.source.sourceDigest,homeProjectId:'brain',publicHosts:['www.sqlite.org']});
const pendingLink=(f:Fixture,url:string,failures=0):LinkRecord=>{const link:LinkRecord={url,source:`public:${f.source.id}:2026-11-06`,state:'pending',week:'2026-11-06',depth:0,failures,nextAt:''};f.ledger.put('link',linkKey(link.source,link.url),link);return link;};
const savedLink=(f:Fixture,link:LinkRecord)=>f.ledger.get<LinkRecord>('link',linkKey(link.source,link.url))!;
const readLinks=(f:Fixture,run:KnowledgeRunner,links:LinkRecord[])=>runPublicReads(f.store,readPolicy(f),run,links,`source:${f.source.id}`,f.registry,cleanScan);
test.each(['success','failure','cancellation','cancelled-before-launch','prelaunch'] as const)('an isolated public read keeps its failure count, launch debit and empty working folder: %s',async outcome=>{const f=sourceFixture();try{
    const link=pendingLink(f,f.source.url!,2);let folder='',empty=false;
    const runner=(async(_prompt,_schema,opts)=>{folder=opts.cwd;empty=readdirSync(folder).length===0;
        if(outcome==='prelaunch'){opts.onIntakeNotSpawned?.();throw Error('Agent capacity is occupied');}
        if(outcome==='cancelled-before-launch')throw new CommandFailure('source-reader-unavailable','cancelled',false);
        opts.onIntakeLaunch?.();
        if(outcome==='cancellation')throw new CommandFailure('source-reader-unavailable','cancelled',true);
        if(outcome==='failure')throw new CommandFailure('source-reader-unavailable','other',true);
        return sourceResult(link.url);}) as KnowledgeRunner;
    await readLinks(f,runner,[link]);
    // Assert only after the reader returns, so its catch block cannot swallow a failed expectation.
    const saved=savedLink(f,link);
    expect(folder).toContain('office-source-read-');expect(empty).toBe(true);expect(existsSync(folder)).toBe(false);
    expect(f.budget.used()).toBe(['success','failure','cancellation'].includes(outcome)?1:0);
    expect(saved).toMatchObject({success:{state:'read',failures:0,reason:''},failure:{state:'pending',failures:3,reason:'public-read-unavailable'},cancellation:{state:'pending',failures:2,reason:'public-read-cancelled',nextAt:''},'cancelled-before-launch':{state:'pending',failures:2,reason:'public-read-cancelled',nextAt:''},prelaunch:{state:'pending',failures:2,reason:'public-read-not-launched'}}[outcome]);
    if(outcome==='failure'||outcome==='prelaunch')expect(Date.parse(saved.nextAt!)).toBeGreaterThan(f.store.clock.now().getTime());
}finally{f.close();}});
test('the fifth launched public-read failure needs attention, and every launched failure keeps its debit and retries later',async()=>{const f=sourceFixture();try{
    let link=pendingLink(f,f.source.url!);
    const fail=(async(_prompt,_schema,opts)=>{opts.onIntakeLaunch?.();throw new CommandFailure('source-reader-unavailable','other',true);}) as KnowledgeRunner;
    for(let failures=1;failures<=5;failures++){
        await readLinks(f,fail,[link]);link=savedLink(f,link);
        expect(link).toMatchObject({failures,state:failures<5?'pending':'needs-attention',reason:'public-read-unavailable'});expect(Date.parse(link.nextAt!)).toBeGreaterThan(f.store.clock.now().getTime());
    }
    expect(f.budget.used()).toBe(5);
}finally{f.close();}});
test('a verified root read enqueues at most four one-hop children, and a child read never enqueues a second hop',async()=>{const f=sourceFixture();try{
    const root=pendingLink(f,'https://www.sqlite.org/root.html'),depth2='https://www.sqlite.org/depth-2.html';
    const reader=(url:string,references:string[])=>(async(_prompt,_schema,opts)=>{opts.onIntakeLaunch?.();return {...sourceResult(url),references:references.map(target=>({from:url,url:target}))};}) as KnowledgeRunner;
    await readLinks(f,reader(root.url,Array.from({length:7},(_,i)=>`https://www.sqlite.org/reference-${i}.html`)),[root]);
    const children=f.ledger.all<LinkRecord>('link').filter(l=>l.source===root.source&&l.url!==root.url);
    expect(savedLink(f,root)).toMatchObject({state:'read'});expect(savedLink(f,root).children).toHaveLength(7);expect(children).toHaveLength(7);expect(children.every(l=>l.depth===1)).toBe(true);
    expect(children.filter(l=>l.state==='pending')).toHaveLength(4);expect(children.filter(l=>l.state==='deferred'&&l.reason==='link-budget')).toHaveLength(3);
    const hop=children.find(l=>l.state==='pending')!;
    await readLinks(f,reader(hop.url,[depth2]),[hop]);
    expect(savedLink(f,hop)).toMatchObject({state:'read'});expect(savedLink(f,hop).children).toBeUndefined();expect(f.ledger.get('link',linkKey(root.source,depth2))).toBeUndefined();
}finally{f.close();}});
