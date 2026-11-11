import { expect, test } from 'vitest';
import { intakeFixture, cleanScan } from './fixture';
import { queueReconsideration, readyReferences } from '../../../../server/knowledge/slack-intake/reconsider';
import { terminalDeferred, intakeProgress } from '../../../../server/knowledge/slack-intake/progress';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { linkKey } from '../../../../server/knowledge/slack-intake/read-links';
import type { SourceUnit, ReadTask } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';

const unit = (extra: Partial<SourceUnit> = {}): SourceUnit => ({ id:'C123:100.000001', channel:'C123', resource:'100.000001', kind:'channel', version:'v1', text:'A participant asks an unanswered question', url:'https://fixture.slack.com/archives/C123/p100000001', references:[], state:'deferred', reason:'needs context', observedAt:'2026-11-06T23:00:00Z', attempt:'fixture', ...extra });
test('reference-less deferrals get one bounded reassessment and only then an explicit unavailable coverage gap', () => {
    const f = intakeFixture();
    try {
        f.ledger.put('task', f.task.id, {...f.task,status:'complete'}); const u=unit(); f.ledger.put('unit',`${u.id}:${u.version}`,u);
        expect(terminalDeferred(f.ledger,[u],[]).size).toBe(0);
        f.ledger.put('meta','reconsidered',f.ledger.revision()); // Previous logic already marked this revision visited.
        queueReconsideration(f.ledger,f.policy,'2026-11-06','now');
        const tasks=f.ledger.all<ReadTask>('task'), assessment=tasks.find(t=>t.processing?.length)!;
        expect(assessment).toMatchObject({status:'pending',processing:[`${u.id}:${u.version}`],sourceDigest:f.policy.sourceDigest});
        expect(intakeProgress(tasks,[u],[],new Set())).toMatchObject({needsAttention:false,pendingReads:1,unresolvedSources:1});
        f.ledger.put('task',assessment.id,{...assessment,status:'complete'});
        const terminal=terminalDeferred(f.ledger,[u],f.ledger.all('task'));
        expect(intakeProgress(f.ledger.all('task'),[u],[],terminal)).toMatchObject({unresolvedSources:0,gaps:1});
        queueReconsideration(f.ledger,f.policy,'2026-11-06','later'); expect(f.ledger.all('task')).toHaveLength(2);
        expect(f.ledger.get<SourceUnit>('unit',`${u.id}:${u.version}`)).toEqual(u);
    } finally { f.close(); }
});
test('new admitted thread context reopens the evidence identity without clearing settled units', () => {
    const f=intakeFixture();
    try {
        const u=unit(); f.ledger.put('unit',`${u.id}:${u.version}`,u); queueReconsideration(f.ledger,f.policy,'2026-11-06','now');
        const task=f.ledger.all<ReadTask>('task').find(t=>t.processing?.length)!; f.ledger.put('task',task.id,{...task,status:'complete'});
        const thread=unit({kind:'thread',version:'v2',text:'A substantive answer',state:'admitted'}); f.ledger.put('unit',`${thread.id}:${thread.version}`,thread);
        f.ledger.put('admission',`${thread.id}:${thread.version}`,{state:'admitted'});
        expect(readyReferences(f.ledger,u)).toEqual([{id:thread.id,version:'v2',url:thread.url,text:thread.text}]);
        expect(terminalDeferred(f.ledger,[u,thread],f.ledger.all('task')).size).toBe(0);
        queueReconsideration(f.ledger,f.policy,'2026-11-06','later'); expect(f.ledger.all<ReadTask>('task').filter(t=>t.processing?.length)).toHaveLength(2);
        expect(f.ledger.get<SourceUnit>('unit',`${thread.id}:${thread.version}`)).toEqual(thread);
    } finally { f.close(); }
});
test('a referenced deferral reassesses once more only when an admitted thread version of the same message appears', () => {
    const f=intakeFixture();
    try {
        const url='https://www.sqlite.org/lang.html', u=unit({references:[{kind:'link',id:url}]}), key=`${u.id}:${u.version}`; f.ledger.put('unit',key,u);
        f.ledger.put('link',linkKey(key,url),{url,source:key,state:'read',week:'2026-11-06',depth:0,result:'Public page summary'});
        const assessments=()=>f.ledger.all<ReadTask>('task').filter(t=>t.processing?.length);
        queueReconsideration(f.ledger,f.policy,'2026-11-06','now'); expect(assessments()).toHaveLength(1);
        f.ledger.put('task',assessments()[0].id,{...assessments()[0],status:'complete'});
        queueReconsideration(f.ledger,f.policy,'2026-11-06','unchanged'); expect(assessments()).toHaveLength(1);
        const thread=unit({kind:'thread',version:'v2',text:'A substantive answer',state:'admitted'}); f.ledger.put('unit',`${thread.id}:${thread.version}`,thread);
        f.ledger.put('admission',`${thread.id}:${thread.version}`,{state:'admitted'});
        expect(readyReferences(f.ledger,u)).toEqual([{url,result:'Public page summary'},{id:thread.id,version:'v2',url:thread.url,text:thread.text}]);
        queueReconsideration(f.ledger,f.policy,'2026-11-06','later'); expect(assessments()).toHaveLength(2);
        f.ledger.put('meta','reconsidered',''); // Force a rescan: only the evidence identity prevents a repeat.
        queueReconsideration(f.ledger,f.policy,'2026-11-06','again'); expect(assessments()).toHaveLength(2);
        expect(f.ledger.get<SourceUnit>('unit',`${thread.id}:${thread.version}`)).toEqual(thread);
    } finally { f.close(); }
});
test.each([true,false])('a scan-withheld reassessment never becomes a terminal gap (classification blocked: %s)', async blocked => {
    const f=intakeFixture();
    try {
        f.ledger.put('task',f.task.id,{...f.task,status:'complete'}); const u=unit(), key=`${u.id}:${u.version}`; f.ledger.put('unit',key,u);
        queueReconsideration(f.ledger,f.policy,'2026-11-06','now');
        const assessment=f.ledger.all<ReadTask>('task').find(t=>t.processing?.length)!;
        expect(terminalDeferred(f.ledger,[u],f.ledger.all('task')).size).toBe(0);
        const scan=async(text:string)=>({...await cleanScan(text),...(blocked&&text.includes('SYNTHETIC_WITHHELD')?{clean:false,findings:[{rule:'fixture',line:1,endLine:1}]}:{})});
        const run=(async(_p,_s,options)=>{options?.onIntakeLaunch?.();return {units:[{id:u.id,outcome:'deferred',reason:'SYNTHETIC_WITHHELD still needs context'}]};}) as KnowledgeRunner;
        await runIntakeTask(f.store,run,assessment.id,f.registry,f.source.id,scan);
        const tasks=f.ledger.all<ReadTask>('task'), units=f.ledger.all<SourceUnit>('unit');
        expect(tasks.find(t=>t.id===assessment.id)).toMatchObject({status:'complete'});
        expect(units).toEqual([expect.objectContaining({id:u.id,version:'v1',state:'deferred'})]);
        expect(f.ledger.all('classification-admission')).toEqual([expect.objectContaining({taskId:assessment.id,state:blocked?'blocked':'admitted'})]);
        const terminal=terminalDeferred(f.ledger,units,tasks);
        expect(intakeProgress(tasks,units,[],terminal)).toMatchObject(blocked?{unresolvedSources:1,needsAttention:true,gaps:0}:{unresolvedSources:0,needsAttention:false,gaps:1});
    } finally { f.close(); }
});
test('related context requires same channel, explicit resource identity and admission', () => {
    const f=intakeFixture();
    try {
        const u=unit({text:'Canvas FABC123 changed'});
        for (const extra of [{id:'canvas:FABC123',resource:'FABC123',kind:'canvas' as const},{id:u.id,version:'other',channel:'C999'},{id:u.id,version:'blocked'}]) {
            const related=unit({...extra,state:'no-reusable-lesson',text:'EXCLUDED'}); f.ledger.put('unit',`${related.id}:${related.version}`,related);
        }
        expect(JSON.stringify(readyReferences(f.ledger,u))).not.toContain('EXCLUDED');
        f.ledger.put('admission','canvas:FABC123:v1',{state:'admitted'});
        expect(readyReferences(f.ledger,u)).toEqual([{id:'canvas:FABC123',version:'v1',url:u.url,text:'EXCLUDED'}]);
        expect(JSON.stringify(readyReferences(f.ledger,unit({text:'FABC1234 is a different identifier'})))).not.toContain('EXCLUDED');
    } finally { f.close(); }
});
