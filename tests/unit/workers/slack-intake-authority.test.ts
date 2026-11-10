import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { authority, config, intakeFixture } from '../knowledge/slack-intake/fixture';
import { assertSlackIntakeCapability } from '../../../server/workers/slack-intake-profile';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';

const invalid = [
    { ...authority, tools: { ...authority.tools, file: 'slack.slack_delete_file' } },
    { ...authority, tools: { ...authority.tools, send: 'slack.slack_send_message' } },
    { ...authority, appId: 'fixture.app' }, { ...authority, workspace: 'https://fixture.slack.com/path' },
    { ...authority, channels: [] }, { ...authority, channels: [...authority.channels, { id: 'C456', name: 'second' }] },
    { ...authority, channels: [{ id: 'not-a-channel', name: 'fixture' }] },
    { ...authority, channels: [{ id: 'C123', name: 'bad name' }] },
    { ...authority, domains: ['tooling'] }, { ...authority, enabled: true }, config,
];
test.each(invalid.map((value, i) => [i, value] as const))('invalid authority %s executes no capability probe or worker', async (_i, value) => {
    const execute = vi.fn(async () => ''), launched = vi.fn(), f = intakeFixture();
    try {
        await expect(assertSlackIntakeCapability(execute, f.store.dataRoot, value as typeof authority)).rejects.toThrow();
        const runtime = new WorkerRuntime(f.store, execute);
        await expect(runtime.run('knowledge', 'Read', z.object({ units: z.array(z.string()) }).strict(), {
            readOnly: true, stage: 'knowledge-slack-intake', cwd: f.store.dataRoot, intakeConfig: value as typeof authority,
            intakeBinding: f.binding(), onIntakeEvent: () => {}, onIntakeLaunch: launched,
        })).rejects.toThrow();
        expect(execute).not.toHaveBeenCalled(); expect(launched).not.toHaveBeenCalled(); expect(f.budget.used()).toBe(0);
    } finally { f.close(); }
});
test.each(['channel', 'source', 'home', 'digest'])('fresh runtime rejects a mismatched %s before probing', async field => {
    const f = intakeFixture(), execute = vi.fn(async () => ''), launched = vi.fn();
    try {
        f.task.status = 'running'; f.task.attempt = 'fixture-runtime';
        if (field === 'channel') f.task.channel = 'C999';
        if (field === 'source') f.task.sourceId = 'another-source';
        if (field === 'digest') f.task.sourceDigest = 'outdated';
        f.ledger.put('task', f.task.id, f.task);
        await expect(new WorkerRuntime(f.store, execute).run('knowledge', 'Read', z.object({ summary: z.string() }).strict(), {
            readOnly: true, stage: 'knowledge-slack-intake', cwd: f.store.dataRoot, intakeConfig: authority, onIntakeEvent: () => {}, onIntakeLaunch: launched,
            intakeBinding: { ...f.binding(), taskId: f.task.id, ...(field === 'home' ? { homeProjectId: 'cec' } : {}) },
        })).rejects.toThrow(/binding/);
        expect(execute).not.toHaveBeenCalled(); expect(launched).not.toHaveBeenCalled();
    } finally { f.close(); }
});
test.each(['same-role','full'])('real runtime reports %s capacity rejection as unspawned exactly once',async mode=>{
    const f=intakeFixture(),execute=vi.fn(async()=>''),notSpawned=vi.fn(),launched=vi.fn();try{
        const runtime=new WorkerRuntime(f.store,execute);
        if(mode==='same-role')runtime.active.set('knowledge',new AbortController());else for(const role of ['pm','analyst','developer'] as const)runtime.active.set(role,new AbortController());
        await expect(runtime.run('knowledge','Read',z.object({ok:z.boolean()}).strict(),{readOnly:true,stage:'knowledge-slack-intake',cwd:f.store.dataRoot,intakeConfig:authority,intakeBinding:f.binding(),onIntakeEvent:()=>{},onIntakeNotSpawned:notSpawned,onIntakeLaunch:launched})).rejects.toThrow('capacity');
        expect(notSpawned).toHaveBeenCalledOnce();expect(launched).not.toHaveBeenCalled();expect(execute).not.toHaveBeenCalled();
    }finally{f.close();}
});
