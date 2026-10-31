import { afterEach, expect, test } from 'vitest';
import { z } from 'zod';
import { tmpdir } from 'node:os';
import { Agents } from '../../../../server/workers/agents';
import { Store } from '../../../../server/store/store';
import { command } from '../../../../server/workers/process';
import { projectById } from '../../../../server/office/projects';

const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); });
const schema = z.object({ ok: z.boolean() }).strict();
/** A synthetic Codex CLI that answers correctly, then exits 0 leaving a persistent helper in its process group. */
const fakeCodex = `const {spawn}=require('node:child_process');spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'}).unref();for(const e of [{type:'thread.started',thread_id:'synthetic'},{type:'item.completed',item:{type:'agent_message',text:'{"ok":true}'}}])console.log(JSON.stringify(e));process.exit(0);`;

function agents(project: string) {
    const store = new Store(':memory:', projectById(project)); stores.push(store);
    const execute: typeof command = (_program, _args, options = {}) => command(process.execPath, ['-e', fakeCodex], { ...options, cwd: tmpdir(), input: '' });
    return { store, agents: new Agents(store, execute) };
}
test('hands-off model writers treat leftover helpers after a clean exit as cleanup', async () => {
    for (const project of ['cms-field-vocabulary', 'brain']) {
        const handsOff = agents(project);
        expect(await handsOff.agents.run('pm', 'Synthetic writer; no real work', schema, { stage: 'proposal' })).toEqual({ ok: true });
        expect(handsOff.store.state.workLog!.at(-1)).toMatchObject({ status: 'completed', executionStatus: 'completed' });
    }
    for (const project of ['cec']) {
        const other = agents(project);
        await expect(other.agents.run('pm', 'Synthetic writer; no real work', schema, { stage: 'proposal' })).rejects.toThrow('surviving subprocesses');
        expect(other.store.state.workLog!.at(-1)?.executionStatus).toBeUndefined();
    }
}, 30000);
