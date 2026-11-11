import { writeFileSync } from 'node:fs';
import { captureLearning } from '../../server/knowledge/learning-events';
import { configureDigestDelivery } from '../../server/knowledge/digests/settings';
import { queueWeeklyDigest } from '../../server/knowledge/weekly-digest';
import { deliveryMetrics } from '../../server/knowledge/delivery-metrics';
import { prepareExposure,dispatchExposure } from '../../server/knowledge/lesson-exposure';
import { selectLessons } from '../../server/knowledge/lesson-selection';
import { boundEvidence } from '../../server/knowledge/task-briefing';
import { officeSearch } from '../../server/knowledge/retrieval';
import { lookupJournal } from '../../server/knowledge/lookup/receipts';
import { fanoutSourceLearning } from '../../server/knowledge/sources/learning-events';
import { runRetrospective,type KnowledgeRunner } from '../../server/knowledge/run-retrospective';
import { mkdtempSync,rmSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractDocument } from '../../server/knowledge/artifacts/extraction';
import { digest } from '../../server/knowledge/slack-intake/config';
import { evidenceIdentity } from '../../server/knowledge/sources/evidence-record';
import { DatabaseSync } from 'node:sqlite';
import { SourceRegistry } from '../../server/knowledge/sources/registry';
import { sourceCommand } from '../../server/knowledge/sources/commands';
import { knowledgeRoute } from '../../server/knowledge/routes';
import { IntakeLedger } from '../../server/knowledge/slack-intake/ledger';
import type { Store } from '../../server/store/store';

/** Synthetic registry and ledgers only: no project directory, scheduler, worker or provider. */
export function brainFixture(published = false) {
    const dataRoot=mkdtempSync(join(tmpdir(),'brain-browser-'));
    const databases: DatabaseSync[] = [], database = () => { const db = new DatabaseSync(':memory:'); databases.push(db); return db; };
    const clock = { now: () => new Date('2026-11-09T17:00:00Z'), monotonic: () => 0 }, registry = new SourceRegistry(database(), clock);
    const stores = new Map(['cec', 'brain', 'cms-field-vocabulary'].map(id => [id, { db: database(), dataRoot:join(dataRoot,id), project: { id,name:id==='cec'?'CEC':id==='brain'?'Brain':'CMS Field Vocabulary' }, state: { tickets:[],messages:[],projectNotes:[],knowledge: { enabled:true,consumed:[],pending:[],retrospectives:[],lessons: [], officeLessons: [], exposures: [] } }, clock, save:()=>{},transaction:<T>(fn:()=>T)=>fn(),emit:()=>{},activeClaims:()=>[] } as unknown as Store]));
    for(const store of stores.values()) mkdirSync(store.dataRoot,{recursive:true});
    registry.setMeta('cutover', { state: 'ready' });
    const tools = { channel: 'slack.slack_read_channel', thread: 'slack.slack_read_thread', search: 'slack.slack_search_public_and_private', file: 'slack.slack_read_file', canvas: 'slack.slack_read_canvas', lookup: 'slack.slack_search_channels' };
    for (const [id, name, home] of [['CCEC1', 'cec-team', 'cec'], ['CCEC2', 'cec-delivery', 'cec'], ['CTECH1', 'technical-learning', 'brain']] as const) {
        const source = registry.create({ kind: 'slack', title: `#${name}`, homeProjectId: home, cadence: home === 'brain' ? 'weekly' : 'daily',
            authority: { workspace: 'https://synthetic-office.slack.com', appId: 'synthetic', tools, channels: [{ id, name }], publicHosts: ['www.sqlite.org'] } });
        const ledger = new IntakeLedger(stores.get(home)!, source);
        ledger.put('unit', `${id}:1:v1`, { id: `${id}:1`, version: 'v1', observedAt: '2026-11-09T16:55:00Z' });
        ledger.put('admission', `${id}:1:v1`, { state: 'admitted' });
        const text = 'Confirm the schema version before changing the migration mapping. Keep the accepted validation receipt with the project evidence.';
        const evidenceId = evidenceIdentity(source.id, `${id}:1`, 'v1');
        ledger.put('evidence', evidenceId, { id: evidenceId, sourceId: source.id, unitId: `${id}:1`, version: 'v1', text, contentSha256: digest(text), url: 'https://synthetic-office.slack.com/archives/' + id + '/p1', observedAt: '2026-11-09T16:55:00Z', readerVersion: 'synthetic-fixture-v1', limitations: ['Synthetic browser fixture; no live collection'] });
        if (id === 'CCEC1') stores.get(home)!.state.knowledge!.lessons.push({ id: 'fixture-lesson', scope: 'project', tier: 'guidance', revision: 1, kind: 'pitfall', statement: 'Confirm schema versions before mapping changes', detail: 'Retain the accepted validation receipt alongside the mapping evidence.', stages: ['implement'], paths: [], status: 'active', evidence: [{ kind: 'source', ref: evidenceId, url: '', detail: 'Synthetic source citation', source: { sourceId: source.id, unitId: `${id}:1`, version: 'v1' } }], sourceRetrospectiveId: 'fixture-retrospective', recurrences: [], createdAt: '2026-11-09T16:58:00Z', updatedAt: '2026-11-09T16:58:00Z' });
        if (home === 'brain') registry.subscribe(source.id, 'cec', true);
    }
    const revision='a'.repeat(40),notePath='knowledge/tooling/validation-guide.md';
    const noteText = ['---', 'title: Published validation guide', 'domain: tooling', 'reviewed_at: "2026-11-09"', 'status: current', 'versions: ["3.1"]', 'provenance: "' + 'Retained synthetic fixture evidence. '.repeat(14) + '"', '---', '# Published validation guide', '', 'Keep accepted validation receipts alongside project evidence. Verify the committed schema version before applying a mapping change.', '', '## What to do', '', '1. Check the installed version.', '2. Keep **accepted receipts** with the change.', '', '- [x] Schema version recorded', '- [ ] Provider acceptance verified', '', '```ts', 'const receipt = { accepted: true };', '```', '', '[Reference](https://example.test/validation)', '', 'Synthetic published-note fixture; no live Brain publication.'].join('\n');
    const brain={snapshot:async()=>{if(!published)throw Error('Synthetic technical service unavailable');return revision;},search:async()=>published?[{id:notePath,path:notePath,title:'Published validation guide',contentSha256:digest(noteText),limitations:['Synthetic committed-note fixture']}]:[],read:async(requested:string,path:string)=>{if(!published||requested!==revision||path!==notePath)throw Error('Unavailable');return {text:noteText,contentSha256:digest(noteText)};},graph:async(requested:string)=>{if(!published||requested!==revision)throw Error('Unavailable');return {version:1 as const,snapshot:revision,nodes:[{id:'knowledge/tooling/INDEX.md',title:'Technical knowledge',kind:'index',domains:['tooling']},{id:notePath,path:notePath,title:'Published validation guide',kind:'curated-note',domain:'tooling',sha256:digest(noteText),summary:'Verify schema versions and retain accepted receipts.'}],edges:[{source:'knowledge/tooling/INDEX.md',target:notePath,relation:'domain membership'}],truncated:false,nextCursor:null};}};
    const scan=async(text:string)=>({version:1 as const,inputSha256:digest(text),scannerVersion:'synthetic',policyVersion:'synthetic',clean:true,findings:[]});
    const context={registry,stores,brain,scan};
    // Exact receipt functions with synthetic content; no scheduled worker or live provider is claimed.
    const assignmentStore=stores.get('cec')!,assignmentId='4f000000-0000-4000-8000-000000000001',assignmentDir=join(assignmentStore.dataRoot,'sessions',assignmentId);mkdirSync(assignmentDir,{recursive:true,mode:0o700});
    const supplied=boundEvidence({office:officeSearch(context,'cec','schema',5,'source'),technical:published?[{title:'Published validation guide',reference:{kind:'brain',id:`brain:${revision}:${notePath}`,path:notePath,snapshot:revision,contentSha256:digest(noteText)},scope:'technical',excerpt:noteText,citation:notePath,limitations:['Historical synthetic excerpt ends inside metadata']}]:[],snapshot:published?revision:null,technicalStatus:published?'available':'unavailable',truncated:false});
    prepareExposure(assignmentStore,assignmentDir,assignmentId,'implement',selectLessons(assignmentStore,{stage:'implement'},registry),{kind:'job',id:'fixture-work'},supplied);dispatchExposure(assignmentStore,assignmentId);
    const journal=lookupJournal(assignmentStore,assignmentDir,assignmentId,'implement');journal.append('schema validation receipts',{assignment:assignmentId,index:1,at:clock.now().toISOString(),outcome:'served',...supplied,textSha256:digest(supplied.text)});journal.finish();
    const accepted={outcome:'passed',summary:'Synthetic accepted migration validation',evidence:[{id:supplied.selected[0].reference.id,kind:'checks',summary:'Synthetic accepted outcome cites the observed schema evidence',path:'synthetic/validation.txt',commit:'a'.repeat(40),environment:'synthetic',url:'',observedAt:clock.now().toISOString()}]};
    writeFileSync(join(assignmentDir,'result.json'),JSON.stringify({result:accepted}),{mode:0o600});assignmentStore.state.workLog=[{id:assignmentId,requestId:'fixture-work',stage:'implement',status:'completed',executionStatus:'completed'} as import('../../src/shared').WorkTime];captureLearning(assignmentStore,{kind:'job',id:'fixture-work'},'GH-1','implement','synthetic',accepted,accepted.summary,'work',true);
    assignmentStore.state.knowledge!.rollups=[{id:'rollup:2026-11-06',weekEnding:'2026-11-06',at:clock.now().toISOString(),metrics:deliveryMetrics(assignmentStore,new Date('2026-11-02T17:00:00Z'),clock.now()),summary:'Synthetic accepted weekly review',ineffectiveLessonIds:[],officeProposalIds:[]}];queueWeeklyDigest(context,'cec');

    return { close: () => { databases.forEach(db => db.close());rmSync(dataRoot,{recursive:true,force:true}); }, read: async(url: URL, project: string, request = new Request(url)) => {
        const response=await knowledgeRoute(request,url,registry,stores,project,brain,{extract:extractDocument,scan});
        // Simulate the existing Harper boundary with a deterministic model result, never a live provider.
        if(request.method==='POST'&&url.pathname.endsWith('/artifacts')&&response?.ok) {
            fanoutSourceLearning(context);const store=stores.get(project)!;
            for(const pending of store.state.knowledge!.pending.filter(p=>p.source?.kind==='source'&&p.source.id===url.pathname.split('/')[4])) {
                const refs=pending.opportunities!.flatMap(o=>o.evidence.map(e=>e.ref));
                await runRetrospective(store,(async()=>({summary:'Synthetic accepted source curation',lessons:[{statement:'Keep validation receipts with project evidence',detail:'Retain the accepted receipt before changing project mappings.',kind:'process',stages:['implement'],paths:[],evidenceIds:refs.slice(0,5),repositoryInstruction:false}],recurrences:[]})) as KnowledgeRunner,pending.id,context);
            }
        }
        return response;
    },configureDigest:(project:string,value:unknown)=>configureDigestDelivery(stores.get(project)!,value),command: (project: string, value: unknown) => sourceCommand(registry, [...stores.keys()], project, value) };
}
