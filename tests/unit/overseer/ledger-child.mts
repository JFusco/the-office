// Test support: drives the budget ledger from a separate process.
//   admit ROOT REQUEST_JSON   prints "ready", admits, prints the admission as JSON
//   admit-and-die ROOT REQUEST_JSON   admits, then dies without settling
//   hot-journal ROOT          starts a large write, lets dirty pages spill to the database, and is killed mid-transaction
import { DatabaseSync } from 'node:sqlite';
import { admit } from '../../../server/overseer/budget-ledger.ts';
import { runnerPaths } from '../../../server/overseer/config.ts';

const [action, root, request] = process.argv.slice(2);
const paths = runnerPaths(root);
if (action === 'admit') {
    process.stdout.write('ready\n');
    try { process.stdout.write(`${JSON.stringify(admit(paths, JSON.parse(request), { busyTimeoutMs: 10_000 }))}\n`); }
    catch (error) { process.stdout.write(`${JSON.stringify({ error: (error as Error).message, code: (error as { code?: string }).code })}\n`); }
} else if (action === 'admit-and-die') {
    admit(paths, JSON.parse(request));
    process.kill(process.pid, 'SIGKILL');
} else if (action === 'hot-journal') {
    const db = new DatabaseSync(paths.budgetDb);
    db.exec('PRAGMA cache_size=1; BEGIN IMMEDIATE');
    const insert = db.prepare("INSERT INTO deployments (id, day, at) VALUES (?, '2026-11-25', '2026-11-25T12:00:00.000Z')");
    for (let n = 0; n < 5_000; n++) insert.run(`spill-${n}-${'x'.repeat(200)}`);
    process.kill(process.pid, 'SIGKILL');
}
