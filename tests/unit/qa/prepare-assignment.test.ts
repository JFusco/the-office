import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { Agents, OfficeQAResultSchema, ResultSchema } from '../../../server/workers/agents';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { resultGate } from '../../../server/cec/workflow';
import type { Ticket } from '../../../src/shared';
const stores:Store[]=[];afterEach(()=>{vi.restoreAllMocks();stores.splice(0).forEach(s=>s.close());});
const makeStore=()=>{const s=new Store(':memory:');stores.push(s);return s;};
const result={outcome:'blocked',commit:'a'.repeat(40),summary:'Synthetic setup block',evidence:[],findings:[],receipts:[],paidRuns:0,blocker:'Needs access',qa:null,qaRunDir:'',branch:'',worktree:'',previewUrl:'',prId:0} as any;
test('actual GitHub QA dispatch binds the new protocol and strict report schema before provider work',async()=>{
    const store=makeStore();store.state.coordination=coordination();store.state.coordination.jobs=[{id:'job',key:'GH-1'}] as any;
    const run=vi.spyOn(WorkerRuntime.prototype,'run').mockResolvedValue(result);
    await new Agents(store).run('qa','Synthetic assignment',ResultSchema,{officeQA:true,stage:'github-validate',requestId:'job',ticket:'GH-1'});
    expect(store.state.coordination.jobs![0].qaProtocol).toBe('office-v1');
    expect(run.mock.calls[0][2]).toBe(OfficeQAResultSchema);expect(run.mock.calls[0][3]).toMatchObject({officeQA:true});
});
test('actual CEC dispatch retains prior setup results and assigns a distinct report path for each supported invocation',async()=>{
    const store=makeStore(),run=vi.spyOn(WorkerRuntime.prototype,'run').mockResolvedValue(result);
    const t={key:'CEC-900',runId:'synthetic-new-qa',attempt:1,stage:'qa',commit:result.commit,results:{},approach:{plan:'none',review:'focused',validation:'independent-checks',checks:['API acceptance'],reason:'API change'}} as Ticket;
    const agents=new Agents(store);await agents.stage(t,'qa','qa');
    t.results.qa=result;await agents.stage(t,'qa','qa');
    const tasks=run.mock.calls.map(c=>c[1]);
    expect(tasks[0].match(/Return qaRunDir=([^;]+)/)?.[1]).not.toBe(tasks[1].match(/Return qaRunDir=([^;]+)/)?.[1]);
    expect(t.qaHistory).toEqual([{stage:'qa',result}]);expect(t.qaProtocol?.qa).toBe('office-v1');
    expect(resultGate(t,'qa',{...result,outcome:'passed',qa:null},store.dataRoot)).toContain('structured Office QA report');
});
