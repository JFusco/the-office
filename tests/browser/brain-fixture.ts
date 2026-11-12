import { writeFileSync } from 'node:fs';
import { captureLearning } from '../../server/knowledge/learning-events';
import { deliveryMetrics } from '../../server/knowledge/delivery-metrics';
import { prepareExposure,dispatchExposure } from '../../server/knowledge/lesson-exposure';
import { selectLessons } from '../../server/knowledge/lesson-selection';
import { boundEvidence } from '../../server/knowledge/task-briefing';
import { officeSearch } from '../../server/knowledge/retrieval';
import { lookupJournal } from '../../server/knowledge/lookup/receipts';
import { mkdtempSync,rmSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { digest } from '../../server/knowledge/digest';
import { knowledgeCitation } from '../../server/knowledge/outcomes/citation';
import { DatabaseSync } from 'node:sqlite';
import { knowledgeRoute } from '../../server/knowledge/routes';
import type { Store } from '../../server/store/store';

/** Synthetic stores and ledgers only: no project directory, scheduler, worker or provider. */
export function brainFixture(published = false) {
    const dataRoot=mkdtempSync(join(tmpdir(),'brain-browser-'));
    const databases: DatabaseSync[] = [], database = () => { const db = new DatabaseSync(':memory:'); databases.push(db); return db; };
    const clock = { now: () => new Date('2026-11-09T17:00:00Z'), monotonic: () => 0 };
    const stores = new Map(['cec', 'brain', 'cms-field-vocabulary'].map(id => [id, { db: database(), dataRoot:join(dataRoot,id), project: { id,name:id==='cec'?'CEC':id==='brain'?'Brain':'CMS Field Vocabulary' }, state: { tickets:[],messages:[],projectNotes:[],knowledge: { enabled:true,consumed:[],pending:[],retrospectives:[],lessons: [], officeLessons: [], exposures: [] } }, clock, save:()=>{},transaction:<T>(fn:()=>T)=>fn(),emit:()=>{},activeClaims:()=>[] } as unknown as Store]));
    for(const store of stores.values()) mkdirSync(store.dataRoot,{recursive:true});
    stores.get('cec')!.state.knowledge!.lessons.push({ id: 'fixture-lesson', scope: 'project', tier: 'guidance', revision: 1, kind: 'pitfall', when: 'Fixture situation', check: 'Fixture check', statement: 'Confirm schema versions before mapping changes', detail: 'Retain the accepted validation receipt alongside the mapping evidence.', stages: ['implement'], paths: [], status: 'active', evidence: [{ kind: 'pr', ref: 'pr:7', url: '', detail: 'Synthetic accepted pull request' }], sourceRetrospectiveId: 'fixture-retrospective', createdAt: '2026-11-09T16:58:00Z', updatedAt: '2026-11-09T16:58:00Z' });
    const revision='a'.repeat(40),notePath='knowledge/tooling/validation-guide.md';
    const noteText = ['---', 'title: Published validation guide', 'domain: tooling', 'reviewed_at: "2026-11-09"', 'status: current', 'versions: ["3.1"]', 'provenance: "' + 'Retained synthetic fixture evidence. '.repeat(14) + '"', '---', '# Published validation guide', '', 'Keep accepted validation receipts alongside project evidence. Verify the committed schema version before applying a mapping change.', '', '## What to do', '', '1. Check the installed version.', '2. Keep **accepted receipts** with the change.', '', '- [x] Schema version recorded', '- [ ] Provider acceptance verified', '', '```ts', 'const receipt = { accepted: true };', '```', '', '[Reference](https://example.test/validation)', '', 'Synthetic published-note fixture; no live Brain publication.'].join('\n');
    const brain={snapshot:async()=>{if(!published)throw Error('Synthetic technical service unavailable');return revision;},search:async()=>published?[{id:notePath,path:notePath,title:'Published validation guide',contentSha256:digest(noteText),limitations:['Synthetic committed-note fixture']}]:[],read:async(requested:string,path:string)=>{if(!published||requested!==revision||path!==notePath)throw Error('Unavailable');return {text:noteText,contentSha256:digest(noteText)};},graph:async(requested:string)=>{if(!published||requested!==revision)throw Error('Unavailable');return {version:1 as const,snapshot:revision,nodes:[{id:'knowledge/tooling/INDEX.md',title:'Technical knowledge',kind:'index',domains:['tooling']},{id:notePath,path:notePath,title:'Published validation guide',kind:'curated-note',domain:'tooling',sha256:digest(noteText),summary:'Verify schema versions and retain accepted receipts.'}],edges:[{source:'knowledge/tooling/INDEX.md',target:notePath,relation:'domain membership'}],truncated:false,nextCursor:null};}};
    const context={stores,brain};
    // Exact receipt functions with synthetic content; no scheduled worker or live provider is claimed.
    const assignmentStore=stores.get('cec')!,assignmentId='4f000000-0000-4000-8000-000000000001',assignmentDir=join(assignmentStore.dataRoot,'sessions',assignmentId);mkdirSync(assignmentDir,{recursive:true,mode:0o700});
    const supplied=boundEvidence({office:officeSearch(context,'cec','schema',5),technical:published?[{title:'Published validation guide',reference:{kind:'brain',id:`brain:${revision}:${notePath}`,path:notePath,snapshot:revision,contentSha256:digest(noteText)},scope:'technical',excerpt:noteText,citation:notePath,limitations:['Historical synthetic excerpt ends inside metadata']}]:[],snapshot:published?revision:null,technicalStatus:published?'available':'unavailable',truncated:false});
    prepareExposure(assignmentStore,assignmentDir,assignmentId,'implement',selectLessons(assignmentStore,{stage:'implement'}),{kind:'job',id:'fixture-work'},supplied);dispatchExposure(assignmentStore,assignmentId);
    const journal=lookupJournal(assignmentStore,assignmentDir,assignmentId,'implement');journal.append('schema validation receipts',{assignment:assignmentId,index:1,at:clock.now().toISOString(),outcome:'served',...supplied,textSha256:digest(supplied.text)});journal.finish();
    const accepted={outcome:'passed',summary:'Synthetic accepted migration validation',evidence:[{id:knowledgeCitation(supplied.selected[0].reference),kind:'checks',summary:'Synthetic accepted outcome cites the supplied schema lesson',path:'synthetic/validation.txt',commit:'a'.repeat(40),environment:'synthetic',url:'',observedAt:clock.now().toISOString()}]};
    writeFileSync(join(assignmentDir,'result.json'),JSON.stringify({result:accepted}),{mode:0o600});assignmentStore.state.workLog=[{id:assignmentId,requestId:'fixture-work',stage:'implement',status:'completed',executionStatus:'completed'} as import('../../src/shared').WorkTime];captureLearning(assignmentStore,{kind:'job',id:'fixture-work'},'GH-1','implement','synthetic',accepted,accepted.summary,'work',true);
    assignmentStore.state.knowledge!.rollups=[{id:'rollup:2026-11-06',weekEnding:'2026-11-06',at:clock.now().toISOString(),metrics:deliveryMetrics(assignmentStore,new Date('2026-11-02T17:00:00Z'),clock.now()),summary:'Synthetic accepted weekly review',officeProposalIds:[]}];

    return { close: () => { databases.forEach(db => db.close());rmSync(dataRoot,{recursive:true,force:true}); }, read: async(url: URL, project: string, request = new Request(url)) => {
        const response=await knowledgeRoute(request,url,stores,project,brain);
        return response;
    } };
}
