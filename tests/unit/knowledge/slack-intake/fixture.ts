import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { knowledgeStore } from '../knowledge-fixture';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { configDigest, type Config } from '../../../../server/knowledge/slack-intake/config';
import { readArguments, readMethod } from '../../../../server/knowledge/slack-intake/observations';
export const config: Config = {
    enabled: true, workspace: 'https://fixture.slack.com', appId: 'fixture', domains: ['tooling'], publicHosts: ['www.sqlite.org'],
    tools: { channel: 'slack.slack_read_channel', thread: 'slack.slack_read_thread', search: 'slack.slack_search_public_and_private', file: 'slack.slack_read_file', canvas: 'slack.slack_read_canvas', lookup: 'slack.slack_search_channels' },
    channels: [{ id: 'C123', name: 'fixture-channel' }],
};
export function intakeFixture() {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z'); f.store.state.knowledge!.enabled = true;
    mkdirSync(resolve(f.store.dataRoot, 'slack-intake'), { mode: 0o700 });
    const configure = (value: Config = config) => writeFileSync(resolve(f.store.dataRoot, 'slack-intake/config.json'), JSON.stringify(value), { mode: 0o600 });
    configure();
    const ledger = new IntakeLedger(f.store), task = newTask(config, 'C123', 'channel', '', '0.000000', '200.000000', '2026-11-06', f.store.clock.now().toISOString());
    ledger.put('task', task.id, task);
    ledger.put('identity', 'C123', { configHash: configDigest(config), observation: 'synthetic-fixture' });
    return { ...f, ledger, task, configure };
}
/** Synthetic structured transport. This is not a fixture of the currently formatted Slack connector. */
export function event(task: ReturnType<typeof newTask>, messages: ({ ts: string; text: string } & Record<string, unknown>)[] = [{ ts: '100.000001', text: 'Useful technique' }], more = false) {
    return { type: 'item.completed', item: { id: 'read-1', type: 'mcp_tool_call', tool: readMethod(config, task.kind), status: 'completed', arguments: readArguments(task) as Record<string, unknown>, result: { structuredContent: { channel: task.channel, messages, has_more: more, response_metadata: { next_cursor: more ? 'transient-cursor' : '' }, truncated: false } } } };
}
