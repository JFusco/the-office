import { HOLDS } from '../../../server/office/config';
import * as briefing from '../../../server/knowledge/task-briefing';
import { coordination } from '../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { claimedDelivery, registerDeliveryFixture } from '../../fixtures/delivery-claim';
import { assignmentLookups } from '../../../server/knowledge/lookup/assignments';
import { test,expect,vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { DEVELOPER_MODEL } from '../../../server/workers/claude';
import { sourceFixture } from '../knowledge/sources/source-fixture';
import { learningLesson } from '../knowledge/knowledge-fixture';
import { digest } from '../../../server/knowledge/digest';
import { evidenceIdentity } from '../../../server/knowledge/sources/evidence-record';
test.each(['pm','developer'] as const)('supplies exact scoped knowledge through the %s provider branch',async role=>{const f=sourceFixture();try{const text='Review schema versions against accepted validation receipts.',ref=evidenceIdentity(f.source.id,'doc','v1');f.ledger.put('admission','doc:v1',{state:'admitted'});f.ledger.put('evidence',ref,{id:ref,sourceId:f.source.id,unitId:'doc',version:'v1',text,contentSha256:digest(text),url:'https://www.sqlite.org/docs.html',observedAt:'now',readerVersion:'fixture',limitations:['Untrusted source observation']});f.store.state.knowledge!.lessons.push(learningLesson('lesson',{statement:'Review schema versions',stages:['any']}));let supplied='';const runtime=new WorkerRuntime(f.store,async(program,args,options)=>{supplied=options?.input||'';expect(supplied).toContain('PROJECT LESSONS');expect(supplied).toContain('SOURCE EVIDENCE');expect(supplied).toContain(text);expect(supplied).toContain('OFFICE KNOWLEDGE LOOKUP');const endpoint=/GET (http:\/\/127\.0\.0\.1:\d+\/api\/knowledge\/lookup\?assignment=[^&]+)&q=/.exec(supplied)![1],token=/X-Office-Knowledge: ([\w-]+)/.exec(supplied)![1],url=new URL(endpoint+'&q=schema');const response=await assignmentLookups.route(new Request(url,{headers:{'X-Office-Knowledge':token}}),url);expect(response.status).toBe(200);expect((await response.json()).text).toContain(text);const result={ok:true};const events=program==='claude'?[{type:'system',subtype:'init',session_id:args[args.indexOf('--session-id')+1],model:DEVELOPER_MODEL},{type:'assistant',session_id:args[args.indexOf('--session-id')+1],message:{id:'fixture',model:DEVELOPER_MODEL,content:[]}},{type:'result',subtype:'success',is_error:false,session_id:args[args.indexOf('--session-id')+1],structured_output:result,modelUsage:{[DEVELOPER_MODEL]:{}},usage:{input_tokens:1,output_tokens:1}}]:[{type:'turn.started'},{type:'item.completed',item:{type:'agent_message',text:JSON.stringify(result)}}];events.forEach(e=>options?.onLine?.(JSON.stringify(e)));return events.map(e=>JSON.stringify(e)).join('\n');});runtime.knowledgeContext={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'a'.repeat(40),search:async()=>[],read:async()=>({text:'',contentSha256:''})}};await runtime.run(role,'Review schema versions',z.object({ok:z.boolean()}).strict(),{stage:role==='developer'?'implement':'conversation',readOnly:true});const work=f.store.state.workLog!.at(-1)!;const manifest=JSON.parse(readFileSync(resolve(f.store.dataRoot,'sessions',work.id,'lessons.json'),'utf8'));expect(manifest.sourceEvidenceText).toContain(text);expect(manifest.evidence[0].reference.id).toBe(ref);expect(manifest.lessonText).toContain('Review schema versions');expect(f.store.state.knowledge!.exposures!.at(-1)!.dispatchedAt).toBeTruthy();expect(JSON.stringify(f.store.state.knowledge!.exposures)).not.toContain(text);const lookups=f.store.state.knowledge!.lookups![0];expect(lookups.count).toBe(1);expect(lookups.endedAt).toBeTruthy();const log=JSON.parse(readFileSync(resolve(f.store.dataRoot,'sessions',work.id,'lookups.jsonl'),'utf8'));expect(log.response.text).toContain(text);expect(readFileSync(resolve(f.store.dataRoot,'sessions',work.id,'lessons.json'),'utf8')).not.toContain('OFFICE KNOWLEDGE LOOKUP');}finally{f.close();}});

test.each(['stopping', 'held', 'draining', 'unchanged'] as const)('checks delivery authority after briefing and before provider launch: %s', async state => {
    const f = sourceFixture();
    let entered!: () => void, release!: () => void;
    const briefingEntered = new Promise<void>(resolve => { entered = resolve; });
    const briefingReleased = new Promise<void>(resolve => { release = resolve; });
    const briefingMock = vi.spyOn(briefing, 'taskBriefing').mockImplementation(async () => {
        entered();
        await briefingReleased;
        return { text: '', selected: [], snapshot: null, technicalStatus: 'unavailable' };
    });
    try {
        f.store.state.coordination = coordination();
        const delivery = new GitHubDelivery(f.store, {} as any);
        delivery.enqueue('GH-99');
        const job = delivery.jobs[0];
        registerDeliveryFixture(f.store, job);
        const execute = vi.fn(async (_program: string, args: string[], options?: { onLine?: (line: string) => void }) => {
            const session = args[args.indexOf('--session-id') + 1];
            const events = [
                { type: 'system', subtype: 'init', session_id: session, model: DEVELOPER_MODEL },
                { type: 'assistant', session_id: session, message: { id: 'fixture', model: DEVELOPER_MODEL, content: [] } },
                { type: 'result', subtype: 'success', is_error: false, session_id: session, structured_output: { ok: true }, modelUsage: { [DEVELOPER_MODEL]: {} }, usage: { input_tokens: 1, output_tokens: 1 } },
            ].map(event => JSON.stringify(event));
            events.forEach(line => options?.onLine?.(line));
            return events.join('\n');
        });
        const runtime = new WorkerRuntime(f.store, execute as any);
        runtime.knowledgeContext = { registry: f.registry, stores: new Map([['brain', f.store]]),
            brain: { snapshot: async () => 'a'.repeat(40), search: async () => [], read: async () => ({ text: '', contentSha256: '' }) } };
        const run = claimedDelivery(f.store, job, () => runtime.run('developer', 'Review schema versions', z.object({ ok: z.boolean() }).strict(),
            { stage: 'github-implement', requestId: job.id, ticket: job.key }));
        try {
            await Promise.race([briefingEntered, run.then(() => { throw Error('Worker bypassed deferred briefing'); })]);
            if (state === 'stopping') f.store.finishClaim(f.store.activeClaims()[0].id, 'stopping');
            if (state === 'held') HOLDS[job.key] = 'Fixture human hold';
            if (state === 'draining') f.store.state.draining = true;
        } finally { release(); }
        if (state === 'stopping') await expect(run).rejects.toThrow('Lookup assignment is inactive');
        else if (state === 'held') await expect(run).rejects.toThrow('Explicit human hold');
        else await expect(run).resolves.toEqual({ ok: true });
        expect(execute).toHaveBeenCalledTimes(state === 'stopping' || state === 'held' ? 0 : 1);
    } finally {
        delete HOLDS['GH-99'];
        briefingMock.mockRestore();
        f.close();
    }
});
