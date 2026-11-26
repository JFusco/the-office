import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const child = resolve(__dirname, 'redact-evidence-cost-child.ts');
/** Generous: the clean cases take well under a second; a lookup that restarts from the start of the text for every match takes far longer. */
const BUDGET_MS = 10_000;

test.each(['closed-key', 'cut-key', 'shared-bare-end', 'many-assignments'])('redacting about 1 MiB of %s finishes within the budget with the exact output', fixture => {
    const run = spawnSync(process.execPath, ['--import', 'tsx', child, fixture], { encoding: 'utf8', timeout: BUDGET_MS, killSignal: 'SIGKILL' });
    expect(run.error?.message ?? run.signal ?? '', `${fixture}: killed or failed to start`).toBe('');
    expect(run.status, run.stderr).toBe(0);
    const result = JSON.parse(run.stdout) as { matched: boolean; ms: number; bytes: number };
    expect(result.bytes).toBeGreaterThan(1_000_000);
    expect(result.matched).toBe(true);
    console.info(`${fixture}: ${result.bytes} bytes in ${result.ms} ms`);
}, BUDGET_MS + 10_000);
