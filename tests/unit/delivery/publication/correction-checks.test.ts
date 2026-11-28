import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { correctionChecks } from '../../../../server/delivery/publication/correction-checks';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import type { VerifiedMapping } from '../../../../server/delivery/publication/verify-reword';
import type { WorkApproach } from '../../../../src/shared';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { passingResult, savedReturn } from '../support/marker-records';

afterEach(cleanupFakes);
const REFUSED = 'c'.repeat(40), ADOPTED = 'f'.repeat(40), BOUNDARY = 'b'.repeat(40);

function checking(scripts: Record<string, string> | null = { 'lint:commit': 'commitlint', 'release:preflight': 'node scripts/check-release-commit.cjs' }, fail = '') {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement' }), root = f.artifactRoot(job);
    const log = resolve(root, 'checks.log');
    writeFileSync(log, 'all checks passed');
    const original = passingResult(REFUSED, { evidence: [{ id: 'checks', kind: 'checks', summary: 'Synthetic', path: log, commit: REFUSED, environment: 'test', url: '', observedAt: '' }] });
    const pending = savedReturn({ worktree: job.worktree, refusedHead: REFUSED, boundary: BOUNDARY });
    const mapping: VerifiedMapping = { boundary: BOUNDARY, refusedHead: REFUSED, newHead: ADOPTED, mapping: [{ oldHead: REFUSED, newHead: ADOPTED, tree: 't'.repeat(40) }] };
    const calls: { program: string; args: string[]; options: any }[] = [];
    const execute = (async (program: string, args: string[], options: any) => {
        calls.push({ program, args, options });
        if (program === 'git' && args[0] === 'cat-file') { if (!scripts) throw new Error('missing'); return JSON.stringify({ scripts }); }
        if (program === 'pnpm') { if (fail && args.includes(fail)) throw new Error(`${fail} exited 1`); return `${args[2]} ok`; }
        throw new Error(`unexpected ${program} ${args.join(' ')}`);
    }) as any;
    const run = (over: { original?: typeof original; mapping?: VerifiedMapping; retained?: WorkApproach } = {}) => correctionChecks(f.store, execute, root, pending, over.original ?? original, over.mapping ?? mapping, { allowed: [ADOPTED] }, over.retained);
    return { f, root, log, original, mapping, calls, run };
}
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('a contained checks artifact for the adopted SHA carries the original evidence forward and runs every history-sensitive script fresh', async () => {
    const c = checking(), evidence = await c.run();
    expect(evidence).toMatchObject({ kind: 'checks', commit: ADOPTED, environment: 'Office release-marker correction' });
    expect(evidence.path.startsWith(c.root)).toBe(true);
    const saved = JSON.parse(readFileSync(evidence.path, 'utf8'));
    expect(saved).toMatchObject({ kind: 'checks', refusedHead: REFUSED, adoptedHead: ADOPTED, boundary: BOUNDARY, mapping: c.mapping.mapping, verdict: { allowed: [ADOPTED], offending: [] },
        carried: [{ id: 'checks', commit: REFUSED, path: c.log, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }] });
    expect(saved.fresh.map((item: any) => item.args)).toEqual([['run', '--silent', 'lint:commit', '--from', BOUNDARY, '--to', ADOPTED], ['run', '--silent', 'release:preflight']]);
    expect(saved.fresh.map((item: any) => item.output)).toEqual(['lint:commit ok', 'release:preflight ok']);
    // The manifest is read at the adopted head as committed, and the scripts run in the candidate's worktree, read-only.
    expect(c.calls[0]).toMatchObject({ program: 'git', args: ['cat-file', 'blob', `${ADOPTED}:package.json`] });
    for (const call of c.calls.filter(call => call.program === 'pnpm')) expect(call.options).toMatchObject({ readOnly: true });
});

test('a CMS correction requires both history checks: a missing or unusable one stops before any artifact or script', async () => {
    for (const scripts of [{ 'release:preflight': 'node scripts/check-release-commit.cjs' }, { 'lint:commit': 'commitlint' }, { 'lint:commit': 'commitlint', 'release:preflight': '  ' },
        { 'lint:commit': 42, 'release:preflight': 'node scripts/check-release-commit.cjs' }, { test: 'node --test' }] as Record<string, any>[]) {
        const c = checking(scripts);
        expect(await refusal(c.run())).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringMatching(/^required check: (lint:commit|release:preflight) is required for this project's corrections/),
            correction: { mappedHead: ADOPTED } });
        expect(c.calls.some(call => call.program === 'pnpm')).toBe(false);
        expect(readdirSync(c.root).some(name => name.startsWith('release-marker-checks-'))).toBe(false);
    }
});

// Review repair pass (run cab5a4a5): only checks whose validity follows from equal trees carry forward.
test('a history-dependent check the retained approach requires is not credited from the refused SHA; a content-only check still carries forward', async () => {
    const scripts = { 'lint:commit': 'commitlint', 'release:preflight': 'node scripts/check-release-commit.cjs', 'release:dry': 'semantic-release --dry-run',
        'verify:push': 'pnpm run validate && pnpm run test', 'verify:ci': 'pnpm run lint && pnpm run release:preflight && pnpm run verify:push', 'verify:release': 'pnpm run verify:ci && pnpm run release:dry',
        validate: 'node scripts/validate.mjs', test: 'node --test', lint: 'eslint .' };
    const approach = (checks: string[]): WorkApproach => ({ plan: 'none', review: 'focused', validation: 'developer-checks', checks, reason: 'Retained' });
    // Named directly, reached through a composed script, or required by the job's own approach when the result keeps none.
    for (const [checks, source] of [[['pnpm run release:dry'], 'original'], [['pnpm run verify:release'], 'original'], [['pnpm run --silent release:dry'], 'job']] as const) {
        const c = checking(scripts);
        const run = source === 'original' ? c.run({ original: { ...c.original, approach: approach([...checks]) } }) : c.run({ retained: approach([...checks]) });
        expect(await refusal(run)).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('required check: release:dry depends on commit history'), correction: { mappedHead: ADOPTED } });
        expect(c.calls.some(call => call.program === 'pnpm')).toBe(false);
        expect(readdirSync(c.root).some(name => name.startsWith('release-marker-checks-'))).toBe(false);
    }
    // Content-only checks, composed or direct, carry forward; both mandatory history checks still run fresh on the mapped SHA.
    const c = checking(scripts), evidence = await c.run({ original: { ...c.original, approach: approach(['pnpm run verify:ci', 'pnpm test', 'pnpm run release:preflight:selftest']) } });
    const saved = JSON.parse(readFileSync(evidence.path, 'utf8'));
    expect(saved.carried).toEqual([expect.objectContaining({ id: 'checks', commit: REFUSED, provenance: 'carried forward: every mapped tree is identical' })]);
    expect(saved.fresh.map((item: any) => item.script)).toEqual(['lint:commit', 'release:preflight']);
    expect(saved.fresh.every((item: any) => item.args.includes(item.script))).toBe(true);
    expect(saved.adoptedHead).toBe(ADOPTED);
});

test.each([
    ['a failing script', () => checking(undefined, 'lint:commit'), {}, 'lint:commit failed'],
    ['an unreadable manifest', () => checking(null), {}, 'committed manifest at the adopted head is unreadable'],
    ['no original check evidence', () => checking(), { original: 'none' }, 'no exact-commit check evidence'],
    ['a missing original artifact', () => checking(), { original: 'missing' }, 'is missing or changed'],
    ['a mapping that ends elsewhere', () => checking(), { mapping: 'short' }, 'does not end at the adopted head'],
])('%s stops with the mapped head kept for reconciliation', async (_name, make, changed, diagnostic) => {
    const c = make(), change = changed as { original?: string; mapping?: string };
    const original = change.original === 'none' ? { ...c.original, evidence: [] } : change.original === 'missing' ? { ...c.original, evidence: [{ ...c.original.evidence[0], path: resolve(c.root, 'gone.log') }] } : c.original;
    const mapping = change.mapping === 'short' ? { ...c.mapping, mapping: [{ ...c.mapping.mapping[0], newHead: REFUSED }] } : c.mapping;
    expect(await refusal(c.run({ original, mapping }))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining(diagnostic), correction: { refusedWorkId: 'writer-1', refusedHead: REFUSED, mappedHead: ADOPTED } });
});
