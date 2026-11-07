import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { helperAccounting } from '../../../server/telemetry/helper-usage';

const paths: string[] = [];
afterEach(() => paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })));
const folder = () => { const p = mkdtempSync(resolve(tmpdir(), 'office-helper-')); paths.push(p); return p; };

test('a Claude helper call is valued from the result event of its own session', () => {
    const dir = folder();
    const lines = [{ type: 'system', session_id: 'helper' }, { type: 'result', subtype: 'success', session_id: 'helper', total_cost_usd: 0.31, modelUsage: { 'claude-opus-5-5': { inputTokens: 5, outputTokens: 6, costUSD: 0.31, costBasis: 'list' } } }];
    writeFileSync(resolve(dir, 'stdout.log'), lines.map(line => JSON.stringify(line)).join('\n') + '\n{"type":"res');
    const accounting = helperAccounting(dir, 'claude', 'helper', '2026-11-07T10:00:00Z', 'now', dir)!;
    expect(accounting).toMatchObject({ provenance: 'helper-import', evidenceId: 'claude:helper' });
    expect(accounting.cost).toMatchObject({ completeness: 'complete', microUsd: 310_000 });
});

test('a helper without output or with another session is unpriced with a reason', () => {
    const dir = folder();
    expect(helperAccounting(dir, 'claude', 'helper', '2026-11-07T10:00:00Z', 'now', dir)!.cost.reasons).toEqual(['helper-output-missing']);
    writeFileSync(resolve(dir, 'stdout.log'), JSON.stringify({ type: 'result', session_id: 'someone-else', total_cost_usd: 1 }));
    expect(helperAccounting(dir, 'claude', 'helper', '2026-11-07T10:00:00Z', 'now', dir)!.cost).toMatchObject({ completeness: 'unpriced', reasons: ['no-provider-result'] });
    expect(helperAccounting(dir, 'codex', '', '2026-11-07T10:00:00Z', 'now', dir)!.cost.reasons).toEqual(['no-thread-started']);
});
