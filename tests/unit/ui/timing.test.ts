import { afterEach, expect, test } from 'vitest';
import { z } from 'zod';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { buildTiming, timelineTiming, rememberCi } from '../../../server/time/ci-timing';
import { observedDuration, timeReport } from '../../../src/timing/timing';
import { liveTiming } from '../../../src/timing/live-timing';
import type { AzureBuild, AzurePR, WorkTime } from '../../../src/shared';
let millis = Date.parse('2026-10-27T10:00:00.000Z');
const clock = { now: () => new Date(millis), monotonic: () => millis };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => {
    for (const s of stores.splice(0))
        s.close();
    for (const p of paths.splice(0))
        rmSync(p, { recursive: true, force: true });
});
const start = '2026-10-27T10:00:00.000Z', end = '2026-10-27T10:05:00.000Z';
function record(p: Partial<WorkTime> = {}): WorkTime { return { id: crypto.randomUUID(), role: 'developer', task: 'Synthetic timing fixture', ticket: 'CEC-999', stage: 'implement', requestId: 'request', sessionId: 'session', provider: 'claude', model: 'claude-opus-5-5', effort: 'medium', status: 'running', startedAt: start, lastHeartbeatAt: start, endedAt: '', elapsedMs: 0, queuedMs: 12000, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '', ...p }; }
function store() { const s = new Store(':memory:', undefined, undefined, clock); stores.push(s); return s; }
test('live elapsed time includes heartbeat phase and stays monotonic across snapshots', () => {
    const s = store(), origin = Date.parse(start);
    const snapshot = (server: number, heartbeat: number) => ({ ...s.state, serverTime: new Date(origin + server).toISOString(), workLog: [record({ elapsedMs: heartbeat, lastHeartbeatAt: new Date(origin + heartbeat).toISOString() })] });
    const before = liveTiming(snapshot(12000, 10000), 0, 11999, true, true).workLog![0];
    const after = liveTiming(snapshot(24000, 20000), 11999, 11999, true, true).workLog![0];
    expect(before.elapsedMs).toBe(23999);
    expect(after.elapsedMs).toBe(24000);
    expect(after.elapsedMs).toBeGreaterThan(before.elapsedMs);
    for (const lastHeartbeatAt of ['', 'malformed', new Date(origin + 13000).toISOString(), new Date(origin - 4000).toISOString()]) {
        const state = snapshot(12000, 10000);
        state.workLog[0].lastHeartbeatAt = lastHeartbeatAt;
        expect(liveTiming(state, 0, 1000, true, true).workLog![0].elapsedMs).toBe(10000);
    }
});
test('all worker outcomes report time to PM exactly once; retries stay separate and queue time is excluded', () => {
    millis = Date.parse(start);
    const s = store(), a = record(), b = record({ role: 'qa' });
    s.beginWork(a);
    s.beginWork(b);
    millis += 12000;
    s.checkpointWork(a.id, 12000, { inputTokens: 50, outputTokens: 4 });
    millis += 3000;
    s.finishWork(a.id, 'failed', 15000);
    s.finishWork(a.id, 'completed', 99000);
    s.finishWork(b.id, 'completed', 15000);
    const totals = timeReport(s.state, 'CEC-999');
    expect(totals.workerMs).toBe(30000);
    expect(totals.workerQueueMs).toBe(24000);
    expect(s.state.events.filter(e => e.kind === 'work-time-reported')).toHaveLength(2);
    expect(s.state.workLog!.every(w => !!w.reportedAt)).toBe(true);
    expect(s.state.workLog![0].status).toBe('failed');
    expect(s.state.workLog![0].inputTokens).toBe(50);
});
test('restart uses the last checkpoint for interrupted work, with no sleep/offline inflation or automatic replay', () => {
    millis = Date.parse(start);
    const path = mkdtempSync(resolve(tmpdir(), 'office-time-'));
    paths.push(path);
    const file = resolve(path, 'state.sqlite'), a = new Store(file, undefined, undefined, clock), w = record();
    a.beginWork(w);
    millis += 5000;
    a.checkpointWork(w.id, 5000);
    const checkpoint = a.state.workLog![0].lastHeartbeatAt;
    a.close();
    const b = new Store(file);
    stores.push(b);
    b.recover();
    b.recover();
    const restored = b.state.workLog![0];
    expect(restored.elapsedMs).toBe(5000);
    expect(restored.endedAt).toBe(checkpoint);
    expect(restored.durationUncertain).toBe(true);
    expect(restored.status).toBe('interrupted');
    expect(b.state.events.filter(e => e.kind === 'work-time-reported')).toHaveLength(1);
});
test('Azure build timing separates queue, build, parallel jobs and missing timestamps', () => {
    const timing = buildTiming({ queueTime: '2026-10-27T09:59:00Z', startTime: start, finishTime: end, status: 'completed' }, end);
    expect(timing.queueMs).toBe(60000);
    expect(timing.durationMs).toBe(300000);
    const stages = timelineTiming([{ id: 'job-a', type: 'Job', name: 'Parallel A', state: 'completed', startTime: start, finishTime: end }, { id: 'job-b', type: 'Job', name: 'Parallel B', state: 'completed', startTime: start, finishTime: end }], end);
    expect(stages.map(s => s.durationMs)).toEqual([300000, 300000]);
    expect(buildTiming({ status: 'completed', startTime: start }, end).durationMs).toBeNull();
    expect(observedDuration('bad', '', end)).toBeNull();
    expect(observedDuration(end, start, end)).toBeNull();
});
test('CI history deduplicates polls, retains reruns/job attempts, and links PR/commit evidence to the ticket', () => {
    const s = store();
    const pr: AzurePR = { id: 3, title: 'CEC-999 synthetic fixture', draft: false, status: 'active', source: 'refs/heads/codex/cec-999-fixture', target: 'refs/heads/staging', commit: 'a'.repeat(40), mergeCommit: 'b'.repeat(40), url: '', policies: [{ name: 'Build', status: 'approved', buildId: 9 }] };
    const build: AzureBuild = { id: 9, name: 'Synthetic CI', status: 'completed', result: 'failed', commit: pr.mergeCommit, branch: 'refs/pull/3/merge', url: 'https://example.org/9', durationMs: 300000, queueMs: 60000, stages: [{ id: 'job', attempt: 1, type: 'Job', name: 'Build', state: 'completed', result: 'failed', issues: [], durationMs: 300000 }] };
    rememberCi(s.state, [build], [pr]);
    rememberCi(s.state, [build], [pr]);
    expect(s.state.ciHistory).toHaveLength(1);
    rememberCi(s.state, [{ ...build, result: 'succeeded', stages: [{ ...build.stages[0], attempt: 2, result: 'succeeded' }] }], [pr]);
    expect(s.state.ciHistory![0].stages).toHaveLength(2);
    rememberCi(s.state, [{ ...build, id: 10 }], [pr]);
    expect(s.state.ciHistory![0].linkedTickets).toEqual(['CEC-999']);
    expect(timeReport(s.state, 'CEC-999').buildMs).toBe(600000);
    expect(timeReport(s.state).buildRuns).toBe(2);
});

test('the transport receives the verified profile read-only flag rather than the caller preference', async () => {
    const path=mkdtempSync(resolve(tmpdir(),'office-read-profile-'));paths.push(path);
    const s=new Store(':memory:',undefined,path,clock);stores.push(s);const modes:boolean[]=[];
    const execute:any=async(_program:string,_args:string[],options:any)=>{
        modes.push(options.readOnly);
        for(const event of [{type:'thread.started',thread_id:crypto.randomUUID()},{type:'item.completed',item:{type:'agent_message',text:'{"ok":true}'}}])options.onLine(JSON.stringify(event));
        return '';
    };
    const runtime=new WorkerRuntime(s,execute),schema=z.object({ok:z.boolean()}).strict();
    await runtime.run('cto','Read-only profile fixture',schema,{stage:'daily-cto',readOnly:false});
    await runtime.run('pm','Native edit profile fixture',schema,{stage:'enhance',readOnly:false});
    await runtime.run('pm','Native Slack send profile fixture',schema,{stage:'slack-send',readOnly:true,slackSend:true});
    expect(modes).toEqual([true,false,false]);expect(runtime.active.size).toBe(0);
});
