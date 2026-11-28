import { afterEach, expect, test } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { qaSpec, readerSpec, reviewSpec, vendorReviewSpec } from '../../../../server/maintenance/publication/group-launches';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const binding = { worktree: '/w', branch: 'codex/5-x', gitDir: '/g/worktrees/x', gitCommonDir: '/g' };
const group = (bound = true): any => ({ ctx: { store: { project: { repo: '/repo' } }, run: { id: 'r' } }, binding: bound ? binding : undefined,
    observed: () => ({ targets: { branch: 'codex/5-x', worktree: '/w', issue: 5 }, progress: {} }) });

test('readers read the candidate once it exists; review and QA observe the owned targets; QA retains its outputs', () => {
    expect(readerSpec(group(false), 'proposal-plan').launch().policy).toEqual({ version: 1, kind: 'reader', cwd: '/repo' });
    expect(readerSpec(group(), 'proposal-plan').launch().policy.cwd).toBe('/w');
    expect(reviewSpec(group(), { issue: 5 } as any).observe?.targets.branch).toBe('codex/5-x');
    const root = resolve(tmpdir(), `office-qa-${Date.now()}`); mkdirSync(root); roots.push(root);
    const spec = qaSpec(group(), 'browser-verification', { issue: 5, branch: 'codex/5-x', head: 'h' } as any, true);
    expect(spec.retain).toBeTypeOf('function');
    expect(spec.observe).toBeTruthy();
});

test('the vendor review fetches its packet only for an unstarted position', async () => {
    let reads = 0;
    const execute = (async () => { reads++; return '[]'; }) as any;
    const ctx: any = { store: { project: { repo: '/repo', repository: 'o/r', target: 'main' }, state: { maintenance: { lastWeekly: '' } } }, execute, run: { steps: [{}, { stage: 'vendor-review' }] }, root: '/root', at: () => 1 };
    const saved = await vendorReviewSpec(ctx);
    expect([saved.packet, reads]).toEqual([undefined, 0]);
    expect(saved.instructionsSuffix).toMatch(/harness downloaded the scan artifacts/);
});
