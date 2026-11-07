import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { Store } from '../../../server/store/store';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { codexAccounting } from '../../../server/telemetry/run-accounting';
import { rollout } from './support/rollout';

const clock = { now: () => new Date('2026-11-07T15:00:00Z'), monotonic: () => Date.parse('2026-11-07T15:00:00Z') };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });

const PARENT = '01a1b7a7-5cc0-7162-b396-290c5af105ba', CHILD = '01a1b806-c02f-7120-a8fc-6ed25d5edf09', GRANDCHILD = '01a1b806-d111-7120-a8fc-6ed25d5edf10';
function home() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-codex-home-')); paths.push(root);
    const local = new Date(clock.now());
    const dir = resolve(root, 'sessions', String(local.getFullYear()), String(local.getMonth() + 1).padStart(2, '0'), String(local.getDate()).padStart(2, '0'));
    mkdirSync(dir, { recursive: true });
    const stamp = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}T${String(local.getHours()).padStart(2, '0')}-${String(local.getMinutes()).padStart(2, '0')}-00`;
    return { root, write: (thread: string, text: string, at = stamp) => writeFileSync(resolve(dir, `rollout-${at}-${thread}.jsonl`), text) };
}

test('a terminated Codex run is valued from its rollout, including child threads such as the approval guardian', () => {
    const h = home();
    h.write(PARENT, rollout(PARENT, [{ input: 1_000, output: 10 }]));
    h.write(CHILD, rollout(CHILD, [{ input: 500, output: 5 }], { model: 'codex-auto-review', effort: 'low', parent: PARENT }));
    const accounting = codexAccounting(h.root, PARENT, clock.now().toISOString(), clock.now().toISOString());
    expect(accounting.usage).toMatchObject({ requests: 2, uncachedInputTokens: 1_500, outputTokens: 15 });
    // The guardian model has no public list price, so the run is a partial subtotal, not complete.
    expect(accounting.cost).toMatchObject({ completeness: 'partial', microUsd: null, partialMicroUsd: 10_500, reasons: ['no-price-row:codex-auto-review'] });
    expect(accounting.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
});

test('missing evidence is explicitly unpriced', () => {
    const h = home();
    expect(codexAccounting(h.root, '', clock.now().toISOString(), '').cost).toMatchObject({ completeness: 'unpriced', reasons: ['no-thread-started'] });
    expect(codexAccounting(h.root, PARENT, clock.now().toISOString(), '').cost).toMatchObject({ completeness: 'unpriced', reasons: ['rollout-not-found'] });
});

test('the worker runtime pins the model, records requested settings and attaches accounting after termination', async () => {
    const h = home();
    const previous = process.env.CODEX_HOME; process.env.CODEX_HOME = h.root;
    try {
        const s = new Store(':memory:', undefined, mkdtempSync(resolve(tmpdir(), 'office-capture-')), clock); stores.push(s);
        const calls: string[][] = [];
        const execute: any = async (_program: string, args: string[], options: any) => {
            calls.push(args);
            h.write(PARENT, rollout(PARENT, [{ input: 2_000, cached: 1_000, output: 20 }]));
            for (const event of [{ type: 'thread.started', thread_id: PARENT }, { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }]) options.onLine(JSON.stringify(event));
            return '';
        };
        await new WorkerRuntime(s, execute).run('cto', 'Capture fixture', z.object({ ok: z.boolean() }).strict(), { stage: 'daily-cto' });
        expect(calls[0].filter(arg => arg === '--model')).toHaveLength(1);
        expect(calls[0]).toContain('gpt-6-astra');
        const work = s.state.workLog!.at(-1)!;
        expect(work).toMatchObject({ requestedModel: 'gpt-6-astra', requestedEffort: 'high', status: 'completed' });
        // 1,000 uncached×$10 + 1,000 cached×$1 + 20 out×$50 = 12,000 µ$
        expect(work.accounting?.cost).toMatchObject({ completeness: 'complete', microUsd: 12_000, valuation: 'price-table' });
    }
    finally { if (previous === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = previous; }
});

test('descendant threads are followed (a sub-agent guardian), and rollouts created before the run are ignored', () => {
    const h = home();
    h.write(PARENT, rollout(PARENT, [{ input: 1_000, output: 10 }]));
    h.write(CHILD, rollout(CHILD, [{ input: 100, output: 1 }], { parent: PARENT }));
    h.write(GRANDCHILD, rollout(GRANDCHILD, [{ input: 10, output: 1 }], { model: 'codex-auto-review', parent: CHILD }));
    const stale = '01a1b000-0000-7000-8000-000000000000';
    const d = new Date(Date.parse(clock.now().toISOString()) - 3 * 3600_000);
    h.write(stale, rollout(stale, [{ input: 9_999, output: 9 }], { parent: PARENT }), `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}-00-00`);
    const accounting = codexAccounting(h.root, PARENT, clock.now().toISOString(), '');
    expect(accounting.usage.requests).toBe(3);
    expect(accounting.cost).toMatchObject({ completeness: 'partial', reasons: ['no-price-row:codex-auto-review'] });
});
