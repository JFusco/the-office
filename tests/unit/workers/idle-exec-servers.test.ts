import { expect, test } from 'vitest';
import { idleExecServers } from '../../../server/workers/idle-exec-servers';
import { accountCodexProcesses } from '../../../server/workers/codex-process-inventory';

const server = ['/bin/codex', '-c', 'forced_login_method="chatgpt"', 'exec-server', '--remote', 'https://example.test'];

test('an exec-server is idle only while no process is its child', () => {
    const commands = new Map([[81, server], [82, server], [83, ['/bin/codex', 'app-server']], [84, ['/bin/sh', '-c', 'make']], [85, ['/bin/codex', 'exec-server-helper']]]);
    // 84 is a command 82 started; 83 and 85 are not exec-servers.
    expect(idleExecServers({ parents: new Map([[81, 1], [82, 1], [83, 1], [84, 82], [85, 1]]), commands })).toEqual([81]);
    expect(idleExecServers({ parents: new Map(), commands: new Map() })).toEqual([]);
});
test('exec-server counts only as the subcommand, not as a word in a prompt', () => {
    const observed = ['/bin/codex', '-c', 'forced_login_method="chatgpt"', 'exec-server', '--concurrent-requests', '32', '--remote', 'https://example.test'];
    const commands = new Map([[91, ['/bin/codex', 'exec', 'fix', 'exec-server']], [92, ['/bin/codex', 'explain', 'exec-server']], [93, observed], [94, ['/bin/codex', 'exec-server', 'is', 'slow']], [95, ['/bin/codex', 'exec-server']]]);
    expect(idleExecServers({ parents: new Map([[91, 1], [92, 1], [93, 1], [94, 1], [95, 1]]), commands })).toEqual([93]);
});
test('an idle exec-server is accounted for whether or not the runtime answers; a busy one and its command are not', () => {
    const idle = accountCodexProcesses('p81\np86', () => null, new Set(), new Map([[81, 1], [86, 1]]), [], [81]);
    expect(idle.unaccounted).toEqual([86]); expect(idle.besideRuntime).toEqual([86]);
    // 82 is busy, so the rule does not name it idle: it and the Codex command it started both stay unaccounted.
    const parents = new Map([[82, 1], [87, 82]]);
    const busy = accountCodexProcesses('p82\np87', () => null, new Set(), parents, [], idleExecServers({ parents, commands: new Map([[82, server]]) }));
    expect(busy.unaccounted).toEqual([82, 87]); expect(busy.besideRuntime).toEqual([82, 87]);
});
