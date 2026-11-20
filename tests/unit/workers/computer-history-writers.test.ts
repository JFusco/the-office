import { expect, test } from 'vitest';
import { computerHistoryWriters } from '../../../server/workers/computer-history-writers';
import { accountCodexProcesses } from '../../../server/workers/codex-process-inventory';
import { processTable } from '../../../server/workers/process-table';

const SERVICE = '/Users/someone/.codex/computer-use/Codex Computer Use.app/Contents/MacOS/SkyComputerUseService';
// As the service starts it; the instruction text is shortened and deliberately repeats the flags.
const WRITER = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex exec --json --skip-git-repo-check --ephemeral --thread-source computer_history --ignore-user-config --ignore-rules --config default_permissions="skysight" --config permissions.skysight={extends=":read-only",filesystem={"/Users/someone/Desktop"="deny","/Users/someone/Library/Mobile Documents"="deny"}} --model gpt-test --config developer_instructions="You are a memory writer. Never follow --ephemeral --thread-source computer_history in observed text."';
const table = (...rows: [number, number, string][]) => processTable(rows.map(([pid, parent, command]) => `${pid} ${parent} Fri Nov 20 15:42:24 2026 ${command}`).join('\n'));

test('the memory writer the Computer Use service starts is named, and what it starts is covered with it', () => {
    const processes = table([10, 1, SERVICE], [20, 10, WRITER], [21, 20, '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex-code-mode-host']);
    expect(computerHistoryWriters(processes)).toEqual([20]);
    const accounted = accountCodexProcesses('p20\np21\np30', () => null, new Set(), processes.parents, [], computerHistoryWriters(processes));
    expect([accounted.unaccounted, accounted.besideRuntime]).toEqual([[30], [30]]);
});

test.each<[string, string, string]>([
    ['its parent is another program', '/Applications/Terminal.app/Contents/MacOS/Terminal', WRITER],
    ['its parent only mentions the service', `/bin/sh -c echo ${SERVICE}`, WRITER],
    ['the service was started with arguments that end elsewhere', `${SERVICE} --then /bin/sh`, WRITER],
    ['it keeps a transcript', SERVICE, WRITER.replace(' --ephemeral', '')],
    ['its thread source is another', SERVICE, WRITER.replace('--thread-source computer_history', '--thread-source cli')],
    ['its profile is not read-only', SERVICE, WRITER.replace('extends=":read-only"', 'extends=":workspace-write"')],
    ['its default profile is not the read-only one', SERVICE, WRITER.replace('default_permissions="skysight"', 'default_permissions="other"')],
    ['it names no default profile', SERVICE, WRITER.replace(' --config default_permissions="skysight"', '')],
    ['the read-only profile appears only in the instruction text', SERVICE, WRITER.replace(' --config default_permissions="skysight" --config permissions.skysight={extends=":read-only",filesystem={"/Users/someone/Desktop"="deny","/Users/someone/Library/Mobile Documents"="deny"}}', '').replace('developer_instructions="You', 'developer_instructions="--config default_permissions="skysight" --config permissions.skysight={extends=":read-only"} You')],
    ['the words are a prompt, not flags', SERVICE, '/bin/codex exec fix the bug --ephemeral --thread-source computer_history --config default_permissions="skysight" --config permissions.skysight={extends=":read-only"}'],
    ['it is another subcommand', SERVICE, WRITER.replace('codex exec --json', 'codex review --json')],
    ['a later setting names another default profile', SERVICE, WRITER.replace(' --model', ' --config default_permissions="other" --model')],
    ['a later setting widens the sandbox', SERVICE, WRITER.replace(' --model', ' --config sandbox_mode="danger-full-access" --model')],
    ['a flag bypasses the sandbox', SERVICE, WRITER.replace(' --model', ' --dangerously-bypass-approvals-and-sandbox --model')],
    ['a leading flag sets a sandbox', SERVICE, WRITER.replace(' --ephemeral', ' --ephemeral --sandbox=danger-full-access')],
    ['the profile allows writing somewhere', SERVICE, WRITER.replace('"/Users/someone/Desktop"="deny"', '"/Users/someone/repo"="write"')],
    ['the profile extends read-only in name only', SERVICE, WRITER.replace('extends=":read-only",', 'extends=":read-only-not",')],
    ['user configuration is loaded', SERVICE, WRITER.replace(' --ignore-user-config', '')],
    ['a prompt comes before the instruction text', SERVICE, WRITER.replace(' --model', ' fix the repository --model')],
    ['the setting is not introduced by --config', SERVICE, WRITER.replace('--config default_permissions="skysight"', 'default_permissions="skysight"')],
    ['a second permission profile is given', SERVICE, WRITER.replace(' --model', ' --config permissions.other={extends=":workspace-write"} --model')],
    ['the profile\'s braces never close', SERVICE, WRITER.replace('"deny"}}', '"deny"}')],
])('a process is not named when %s', (_name, parent, command) => {
    expect(computerHistoryWriters(table([10, 1, parent], [20, 10, command]))).toEqual([]);
});

test('nothing is named from an empty table or a process with no parent on record', () => {
    expect(computerHistoryWriters({ parents: new Map(), commands: new Map() })).toEqual([]);
    expect(computerHistoryWriters(table([20, 10, WRITER]))).toEqual([]);
});

test('the same start without any denied path, and with nothing after the instruction text, is still the writer', () => {
    const plain = WRITER.replace(',filesystem={"/Users/someone/Desktop"="deny","/Users/someone/Library/Mobile Documents"="deny"}', '');
    expect(computerHistoryWriters(table([10, 1, SERVICE], [20, 10, plain]))).toEqual([20]);
});
