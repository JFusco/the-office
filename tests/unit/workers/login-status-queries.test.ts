import { expect, test } from 'vitest';
import { loginStatusQueries } from '../../../server/workers/login-status-queries';
import { accountCodexProcesses } from '../../../server/workers/codex-process-inventory';
import { processTable } from '../../../server/workers/process-table';

const table = (...rows: [number, number, string][]) => processTable(rows.map(([pid, parent, command]) => `${pid} ${parent} Fri Nov 20 15:42:24 2026 ${command}`).join('\n'));

test('a process that is only answering codex login status is named, whoever started it', () => {
    const processes = table([10, 1, 'node /Users/someone/.npm-global/bin/codex login status'], [11, 10, '/Users/someone/.npm-global/lib/node_modules/@openai/codex/vendor/codex/codex login status'], [12, 1, 'codex login status']);
    expect(loginStatusQueries(processes)).toEqual([11, 12]);
    const accounted = accountCodexProcesses('p11\np30', () => null, new Set(), processes.parents, [], loginStatusQueries(processes));
    expect([accounted.unaccounted, accounted.besideRuntime]).toEqual([[30], [30]]);
});

test.each([
    'codex login',
    'codex login status now',
    'codex exec login status',
    'codex exec check the login status',
    'codex logout status',
    'codex login --with-api-key status',
    'codex -c x=1 login status',
])('"%s" is not named', command => {
    expect(loginStatusQueries(table([20, 1, command]))).toEqual([]);
});
