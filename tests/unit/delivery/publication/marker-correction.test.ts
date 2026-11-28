import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { ReleaseMarkerCorrectionResultSchema, ResultSchema } from '../../../../server/workers/agents';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { cleanupFakes } from '../support/fake-github';
import { markerDelivery } from '../support/marker-delivery';
import { cleanupMarkerRepos } from '../support/marker-repo';

const checksMode = vi.hoisted(() => ({ value: '' as '' | 'remove' | 'old-sha' | 'move-head' | 'change-mapping' | 'switch-branch' }));
vi.mock('../../../../server/delivery/publication/correction-checks', async original => {
    const actual = await original<typeof import('../../../../server/delivery/publication/correction-checks')>();
    return { correctionChecks: async (...args: Parameters<typeof actual.correctionChecks>) => {
        const evidence = await actual.correctionChecks(...args), pending = args[3];
        if (checksMode.value === 'remove') rmSync(evidence.path);
        if (checksMode.value === 'old-sha') return { ...evidence, commit: pending.refusedHead };
        if (checksMode.value === 'move-head') execFileSync('git', ['checkout', '-q', '--detach', pending.refusedHead], { cwd: pending.worktree });
        // The saved mapping changed in place while a history check ran.
        if (checksMode.value === 'change-mapping') pending.correction!.mapping = { ...pending.correction!.mapping!, sha256: '0'.repeat(64) };
        // Another branch checked out at the same mapped SHA.
        if (checksMode.value === 'switch-branch') execFileSync('git', ['checkout', '-q', '-b', 'elsewhere'], { cwd: pending.worktree });
        return evidence;
    } };
});
afterEach(() => { checksMode.value = ''; vi.restoreAllMocks(); cleanupFakes(); cleanupMarkerRepos(); });

/** P (unmarked wiki), A (a marked README change) and B (unmarked wiki): A is refused and must be reworded mid-suffix. */
function refusedSuffix() {
    const d = markerDelivery();
    d.turns.push({ kind: 'implement', commits: [
        { files: { 'wiki/index.md': 'wiki p\n' }, message: 'docs(wiki): prepare' },
        { files: { 'README.md': 'readme with source acceptance\n' }, message: 'docs(readme): explain source acceptance [skip release]' },
        { files: { 'wiki/index.md': 'wiki b\n' }, message: 'docs(wiki): follow up' }] });
    return d;
}
const suffix = (d: ReturnType<typeof markerDelivery>, head: string) => d.git(['rev-list', '--reverse', head, `^${d.base}`]).trim().split('\n');
const raw = (d: ReturnType<typeof markerDelivery>, sha: string) => d.git(['cat-file', 'commit', sha]);

test('a refused marked package change is returned to its developer, then corrected by a harness rewrite and accepted through the ordinary gates', async () => {
    const d = refusedSuffix();
    await d.step();
    const [p, a, b] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
    expect(d.job).toMatchObject({ status: 'queued', stage: 'implement', head: '' });
    expect(d.job.approach).toBeUndefined();
    expect(d.job.steps.map(step => step.stage)).toEqual(['release-marker-return']);
    expect(d.job.steps[0].result.commit).toBe(b);
    expect(d.pending()).toMatchObject({ boundary: d.base, refusedHead: b, offending: [{ sha: a, paths: ['README.md'], message: 'docs(readme): explain source acceptance [skip release]\n' }] });

    let mappedBeforeMove = false;
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => {
        if (program === 'git' && args[0] === 'update-ref') {
            const bound = d.pending()?.correction?.mapping;
            mappedBeforeMove = !!bound && existsSync(bound.path) && JSON.parse(readFileSync(bound.path, 'utf8')).newHead === args[2];
        }
        return original(program, args, options);
    };
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain source acceptance' }] });
    await d.step();
    // The correction ran read-only on the developer's own stage, with its own schema; ordinary workers keep theirs.
    expect(d.dispatched.map(item => [item.role, item.options.stage, !!item.options.readOnly, item.schema === ReleaseMarkerCorrectionResultSchema])).toEqual([
        ['developer', 'github-implement', false, false], ['developer', 'github-implement', true, true]]);
    expect(d.dispatched[0].schema).toBe(ResultSchema);
    const head = d.git(['rev-parse', 'HEAD']).trim(), [p2, a2, b2] = suffix(d, head);
    expect(p2).toBe(p);
    expect(a2).not.toBe(a);
    expect(raw(d, a2)).toBe(raw(d, a).replace('docs(readme): explain source acceptance [skip release]\n', 'docs(readme): explain source acceptance\n'));
    expect(raw(d, b2)).toBe(raw(d, b).replace(`parent ${a}`, `parent ${a2}`));
    expect(mappedBeforeMove).toBe(true);
    expect(d.job).toMatchObject({ status: 'queued', stage: 'review', head, worktree: d.worktree, branch: d.job.branch });
    const accepted = d.job.steps.find(step => step.stage === 'implement')!;
    expect(accepted.result.commit).toBe(head);
    const checks = accepted.result.evidence.find(item => item.commit === head && item.kind === 'checks')!;
    expect(JSON.parse(readFileSync(checks.path, 'utf8'))).toMatchObject({ kind: 'checks', refusedHead: b, adoptedHead: head, carried: [{ commit: b }], fresh: [{ script: 'lint:commit', args: ['run', '--silent', 'lint:commit', '--from', d.base, '--to', head] }, { script: 'release:preflight' }] });
    // The native results stay at their actual SHAs; the original receipts and evidence are kept at the refused head.
    expect(d.job.steps.find(step => step.stage === 'release-marker-return')!.result).toMatchObject({ commit: b, evidence: [{ commit: b, kind: 'checks' }] });
    expect(d.job.steps.find(step => step.stage === 'release-marker-correction')!.result).toMatchObject({ commit: b, messages: [{ sha: a }] });
    expect(ResultSchema.parse(d.job.steps.find(step => step.stage === 'release-marker-correction')!.result)).toMatchObject({ messages: [{ sha: a }] });
    expect(d.job.releaseMarkerReturns![Object.keys(d.job.releaseMarkerReturns!)[0]].status).toBe('resolved');
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);

    // Review, then ordinary publication of the adopted SHA.
    d.turns.push({ kind: 'review' });
    await d.step();
    expect(d.job.stage).toBe('draft');
    await d.step();
    expect(d.job.status, d.job.detail).not.toBe('blocked');
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toEqual([`git push origin ${head}:refs/heads/${d.job.branch}`]);
    expect(d.state.prs[0].head.sha).toBe(head);
});

test.each(['remove', 'old-sha', 'move-head', 'failed-check'] as const)('a correction whose new-SHA evidence is %s never records a successful implement step', async mode => {
    const d = refusedSuffix();
    await d.step();
    const [, a] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
    if (mode === 'failed-check') d.state.lintFails = true; else checksMode.value = mode;
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain source acceptance' }] });
    await d.step();
    expect(d.job.status).toBe('blocked');
    expect(d.job.steps.some(step => step.stage === 'implement')).toBe(false);
    expect(d.job.head).toBe('');
    expect(d.pending()).toBeDefined();
    if (mode !== 'move-head') expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(d.pending()!.correction!.mapping!.newHead);
    if (mode === 'failed-check') expect(d.job.stop).toMatchObject({ kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('lint:commit failed'), correction: { mappedHead: d.pending()!.correction!.mapping!.newHead } } });
});

test('identical messages, even without a final LF, write no object or ref and spend exactly the next return; the third refusal blocks', async () => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim(), [, a] = suffix(d, head);
    const writes: string[][] = [];
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => { if (program === 'git' && ['hash-object', 'update-ref'].includes(args[0])) writes.push(args); return original(program, args, options); };
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain source acceptance [skip release]' }] });
    await d.step();
    expect(writes).toEqual([]);
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(2);
    expect(d.pending()).toMatchObject({ refusedHead: head, previousWorkId: expect.any(String), offending: [{ sha: a }] });
    expect(d.job).toMatchObject({ status: 'queued', stage: 'implement', head: '' });
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain source acceptance [skip release]\n' }] });
    await d.step();
    expect(writes).toEqual([]);
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(2);
    expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'marked-package-change', disposition: 'return-cap', commit: a, paths: ['README.md'] } } });
});

test('a partial reword that still carries a marker moves the branch once and returns the mapped SHAs as the next allowlist', async () => {
    const d = markerDelivery();
    d.turns.push({ kind: 'implement', commits: [
        { files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): one [skip release]' },
        { files: { 'OPERATING.md': 'operating 2\n' }, message: 'docs(operating): two [skip release]' }] });
    await d.step();
    const [one, two] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
    expect(d.pending()!.offending.map(c => c.sha)).toEqual([one, two]);
    d.turns.push({ kind: 'correction', messages: () => [{ sha: one, message: 'docs(readme): one' }] });
    await d.step();
    const moved = d.git(['rev-parse', 'HEAD']).trim(), [one2, two2] = suffix(d, moved);
    expect(one2).not.toBe(one);
    // The next return keeps the original boundary and links the mapping that produced its refused head.
    expect(d.pending()).toMatchObject({ refusedHead: moved, boundary: d.base, offending: [{ sha: two2, paths: ['OPERATING.md'] }], mapping: { refusedHead: d.job.steps[0].result.commit, newHead: moved } });
    expect(d.job).toMatchObject({ status: 'queued', stage: 'implement', head: '' });
    // The old SHA is no longer authorized.
    d.turns.push({ kind: 'correction', messages: () => [{ sha: two, message: 'docs(operating): two' }] });
    await d.step();
    expect(d.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('not one of the refused commits') } } });
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(moved);
});

test.each([
    ['an empty passing proposal', () => [], undefined],
    ['a duplicate SHA', (shas: string[]) => [{ sha: shas[0], message: 'a' }, { sha: shas[0], message: 'b' }], undefined],
    ['an unauthorized SHA', () => [{ sha: 'e'.repeat(40), message: 'a' }], undefined],
    ['a blank message', (shas: string[]) => [{ sha: shas[0], message: '   ' }], undefined],
    ['a NUL message', (shas: string[]) => [{ sha: shas[0], message: 'a\0b' }], undefined],
    ['requested prerequisites', (shas: string[]) => [{ sha: shas[0], message: 'docs(readme): reword' }], { prerequisites: [{ target: { projectId: 'cms-field-vocabulary', kind: 'pr', id: '7' }, condition: 'pr-merged', evidence: 'x', observedAt: '2026-11-20T00:00:00Z' }] }],
    ['a nonpassing result', () => [], { outcome: 'blocked', blocker: 'Should not release' }],
])('%s stops typed before any Git write and spends no return', async (_name, messages, result) => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim(), writes: string[][] = [];
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => { if (program === 'git' && ['hash-object', 'update-ref'].includes(args[0])) writes.push(args); return original(program, args, options); };
    d.turns.push({ kind: 'correction', messages: messages as any, result });
    await d.step();
    expect(writes).toEqual([]);
    expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate' } } });
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(head);
    expect(d.job.steps.filter(step => step.stage === 'release-marker-correction')).toHaveLength(1);
});

/** Tamper with what the helper hashes, after its own checks, so only independent verification can catch it. */
test.each([
    ['a wrong replacement', (input: string) => input.replace('docs(readme): reword', 'docs(readme): something else')],
    ['a changed committer', (input: string) => input.replace(/^committer Office Test/m, 'committer Someone Else')],
    ['a changed intermediate tree', (input: string, trees: string[]) => input.includes('docs(readme): reword') ? input.replace(/^tree [a-f0-9]{40}$/m, `tree ${trees[0]}`) : input],
    ['a collateral newline', (input: string) => input.replace('docs(wiki): follow up\n', 'docs(wiki): follow up\n\n')],
])('%s offered by the helper stops before the ref moves', async (_name, tamper) => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim(), [p, a] = suffix(d, head), trees = [d.git(['rev-parse', `${p}^{tree}`]).trim()];
    const updates: string[][] = [];
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => {
        if (program === 'git' && args[0] === 'update-ref') updates.push(args);
        return original(program, args, program === 'git' && args[0] === 'hash-object' ? { ...options, input: tamper(options.input, trees) } : options);
    };
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword' }] });
    await d.step();
    expect(updates).toEqual([]);
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(head);
    expect(d.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringMatching(/unverified correction|message helper refused/) } } });
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
});

test('a branch moved just before the compare-and-swap keeps the verified mapping, reports the competing tip and writes nothing more', async () => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim(), [p, a] = suffix(d, head), updates: string[][] = [];
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => {
        if (program === 'git' && args[0] === 'update-ref') { updates.push(args); d.git(['update-ref', `refs/heads/${d.job.branch}`, p]); }
        return original(program, args, options);
    };
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword' }] });
    await d.step();
    expect(updates).toHaveLength(1);
    expect(d.git(['rev-parse', `refs/heads/${d.job.branch}`]).trim()).toBe(p);
    const mapping = d.pending()!.correction!.mapping!;
    expect(existsSync(mapping.path)).toBe(true);
    expect(d.job.stop).toMatchObject({ kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining(`moved to ${p}`), correction: { mappedHead: mapping.newHead, checkout: { state: 'other', head: p } } } });
});

test('a foreign marked prefix, a signed suffix, a non-UTF-8 author and a published branch stop without a return', async () => {
    // A marked package change already in the accepted base, not the writer's own commit.
    const foreign = markerDelivery();
    const prefix = foreign.commit({ 'README.md': 'foreign\n' }, 'docs(readme): foreign [skip release]');
    foreign.job.candidateBase = prefix;
    foreign.turns.push({ kind: 'implement', commits: [{ files: { 'wiki/index.md': 'w\n' }, message: 'docs(wiki): mine [skip release]' }] });
    await foreign.step();
    expect(foreign.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'marked-package-change', commit: prefix, diagnostic: expect.stringContaining('foreign prefix') } } });
    expect(foreign.job.releaseMarkerReturns).toBeUndefined();
    // Latin-1 author bytes cannot be read back exactly.
    const latin = markerDelivery();
    latin.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'r\n' }, message: 'docs(readme): r [skip release]' }] });
    const run = latin.engine.agents.run as any, impl = run.getMockImplementation();
    run.mockImplementationOnce(async (...args: any[]) => {
        const tree = latin.git(['write-tree']).trim();
        const result = await impl(...args), head = latin.git(['rev-parse', 'HEAD']).trim(), parent = latin.git(['rev-parse', 'HEAD^']).trim();
        const object = Buffer.concat([Buffer.from(`tree ${latin.git(['rev-parse', 'HEAD^{tree}']).trim()}\nparent ${parent}\nauthor Jos`), Buffer.from([0xe9]), Buffer.from(` <j@example.com> 1700000000 +0000\ncommitter Office Test <test@example.com> 1700000000 +0000\nencoding ISO-8859-1\n\ndocs(readme): r [skip release]\n`)]);
        const sha = execFileSync('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], { cwd: latin.worktree, input: object }).toString().trim();
        latin.git(['update-ref', `refs/heads/${latin.job.branch}`, sha, head]);
        expect(tree).toBeTruthy();
        const work = latin.store.state.workLog!.at(-1)!;
        result.commit = sha; result.evidence[0].commit = sha;
        require('node:fs').writeFileSync(require('node:path').resolve(latin.store.dataRoot, 'sessions', work.id, 'result.json'), JSON.stringify({ session: work.id, result }));
        return result;
    });
    await latin.step();
    expect(latin.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('incompatible history') } } });
    expect(latin.job.releaseMarkerReturns).toBeUndefined();
    // A candidate branch already on the remote is a published suffix.
    const published = markerDelivery();
    published.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'r\n' }, message: 'docs(readme): r [skip release]' }] });
    published.state.remote[published.job.branch] = published.base;
    await published.step();
    expect(published.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('published suffix') } } });
});

test('a duplicate delivery of the same refused work spends nothing further, and two distinct returns survive a reload', async () => {
    const d = refusedSuffix();
    await d.step();
    const [entry] = Object.values(d.job.releaseMarkerReturns!);
    const { returnMarkedCandidate } = await import('../../../../server/delivery/publication/return-marked-candidate');
    const result = d.job.steps[0].result, before = new Set<string>((d.store.state.workLog ?? []).filter(work => work.id !== entry.workId).map(work => work.id));
    const claim = d.store.claimWork({ projectId: d.store.project.id, kind: 'delivery', id: d.job.id }, 'replay', 'implement', 'delivery')!;
    (d.store.state.workLog!.find(work => work.id === entry.workId) as any).claimId = claim.id;
    const { withAssignment } = await import('../../../../server/workers/assignment-context');
    const replayed = await withAssignment(claim, 'delivery', () => returnMarkedCandidate(d.delivery, { job: d.job, result, root: d.artifactRoot(d.job), inputSha256: '', beforeWorkers: before,
        writerCheckout: { head: d.base, branch: d.job.branch, worktree: d.worktree, clean: true, accepted: d.base, claimId: claim.id, observedAt: '' } } as any));
    d.store.finishClaim(claim.id, 'completed');
    expect(replayed).toBe(true);
    expect(Object.keys(d.job.releaseMarkerReturns!)).toEqual([entry.workId]);
    expect(d.job.steps.filter(step => step.stage === 'release-marker-return')).toHaveLength(1);
});

test('a correction interrupted before its developer returns blocks, keeps its record and checkout, and is never redispatched', async () => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim();
    d.turns.push({ kind: 'correction', messages: () => [], throws: new Error('Worker paused; reconcile any external effects before resuming') });
    await d.step();
    expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { disposition: 'interrupted-correction', reason: 'marked-package-change', paths: ['README.md'],
        correction: { refusedHead: head, checkout: { state: 'refused-tip', head, branch: d.job.branch, clean: true } } } } });
    expect(d.pending()!.correction!.dispatchedAt).toBeTruthy();
    // Queued again by hand, it still does not dispatch a second developer.
    d.job.status = 'queued';
    await d.step();
    expect(d.dispatched).toHaveLength(2);
    expect(d.job.stop?.releaseMarker?.disposition).toBe('interrupted-correction');
    const { restartStoppedWriters } = await import('../../../../server/delivery/attempts/restart-stopped-writers');
    await restartStoppedWriters(d.delivery);
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(head);
    expect(d.dispatched).toHaveLength(2);
});

test('two distinct returns survive reloads, and the third proven refusal after a reload blocks', async () => {
    const d = markerDelivery({ onDisk: true });
    d.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): reword [skip release]' }] });
    await d.step();
    const [, a] = [d.base, ...suffix(d, d.git(['rev-parse', 'HEAD']).trim())];
    d.restart();
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword [skip release]' }] });
    await d.step();
    d.restart();
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(2);
    expect(Object.values(d.job.releaseMarkerReturns!).map(item => item.status).sort()).toEqual(['pending', 'superseded']);
    expect(d.job).toMatchObject({ status: 'queued', stage: 'implement' });
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword [skip release]' }] });
    await d.step();
    d.restart();
    expect(d.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { disposition: 'return-cap', commit: a } } });
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(2);
});

test('a signed or merged writer suffix is incompatible history and gets no return', async () => {
    const signed = markerDelivery();
    signed.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'r\n' }, message: 'docs(readme): r [skip release]' }] });
    const run = signed.engine.agents.run as any, impl = run.getMockImplementation();
    run.mockImplementationOnce(async (...args: any[]) => {
        const result = await impl(...args), head = signed.git(['rev-parse', 'HEAD']).trim();
        // The same commit with a signature header, as a signing writer would have made it.
        const object = signed.git(['cat-file', 'commit', head]).replace(/^(committer [^\n]*\n)/m, '$1gpgsig -----BEGIN PGP SIGNATURE-----\n \n -----END PGP SIGNATURE-----\n');
        const sha = execFileSync('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], { cwd: signed.worktree, input: object }).toString().trim();
        signed.git(['update-ref', `refs/heads/${signed.job.branch}`, sha, head]);
        result.commit = sha; result.evidence[0].commit = sha;
        const work = signed.store.state.workLog!.at(-1)!;
        require('node:fs').writeFileSync(require('node:path').resolve(signed.store.dataRoot, 'sessions', work.id, 'result.json'), JSON.stringify({ session: work.id, result }));
        return result;
    });
    await signed.step();
    expect(signed.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('is signed') } } });
    expect(signed.job.releaseMarkerReturns).toBeUndefined();
    const merged = markerDelivery();
    merged.git(['checkout', '-q', '-b', 'side']);
    merged.commit({ 'wiki/index.md': 'side\n' }, 'docs(wiki): side');
    merged.git(['checkout', '-q', merged.job.branch]);
    merged.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'r\n' }, message: 'docs(readme): r [skip release]' }] });
    const mergedRun = merged.engine.agents.run as any, mergedImpl = mergedRun.getMockImplementation();
    mergedRun.mockImplementationOnce(async (...args: any[]) => {
        merged.git(['merge', '-q', '--no-ff', '--no-edit', '-m', 'chore(merge): side', 'side']);
        return mergedImpl(...args);
    });
    await merged.step();
    expect(merged.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('single-parent') } } });
});

test('a refused checkout that moved or was published before the correction stops before dispatch, with no return spent', async () => {
    for (const change of ['dirty', 'published'] as const) {
        const d = refusedSuffix();
        await d.step();
        if (change === 'dirty') require('node:fs').writeFileSync(require('node:path').resolve(d.worktree, 'stray.txt'), 'x');
        else d.state.remote[d.job.branch] = d.git(['rev-parse', 'HEAD']).trim();
        d.turns.push({ kind: 'correction', messages: shas => [{ sha: shas[0], message: 'docs(readme): reword' }] });
        await d.step();
        expect(d.dispatched).toHaveLength(1);
        expect(d.job.status).toBe('blocked');
        expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
        expect(d.pending()!.correction?.dispatchedAt).toBeUndefined();
    }
});

test('an unmarked writer range is screened locally and accepted with no publication read, no npm and no return', async () => {
    const d = markerDelivery();
    d.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): explain sources' }] });
    const before = d.provider.length;
    await d.step();
    expect(d.job).toMatchObject({ status: 'queued', stage: 'review', head: d.git(['rev-parse', 'HEAD']).trim() });
    expect(d.job.releaseMarkerReturns).toBeUndefined();
    expect(d.provider.slice(before).filter(call => /^(git ls-remote|gh pr list)/.test(call))).toEqual([]);
    expect(d.npm).toHaveLength(0);
});

// Direct cases for applyCorrection itself, outside the step.
async function direct(options: { readOnly?: boolean; worker?: boolean; dirty?: boolean } = {}) {
    const d = refusedSuffix();
    await d.step();
    const { applyCorrection } = await import('../../../../server/delivery/publication/marker-correction');
    const { withAssignment } = await import('../../../../server/workers/assignment-context');
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const pending = d.pending()!, before = new Set((d.store.state.workLog ?? []).map(work => work.id));
    const claim = d.store.claimWork({ projectId: d.store.project.id, kind: 'delivery', id: d.job.id }, 'direct', 'implement', 'delivery')!;
    pending.correction = { claimId: claim.id, at: 'x', dispatchedAt: 'y' };
    d.job.status = 'working';
    const native = ReleaseMarkerCorrectionResultSchema.parse({ ...d.job.steps[0].result, commit: pending.refusedHead, approach: null, resolution: null, prerequisites: [], evidence: [], receipts: [],
        messages: [{ sha: pending.offending[0].sha, message: 'docs(readme): explain source acceptance' }] });
    if (options.worker !== false) {
        const id = 'direct-worker';
        d.store.state.workLog!.push({ id, requestId: d.job.id, ticket: d.job.key, role: 'developer', provider: 'claude', stage: 'github-implement', status: 'completed', claimId: claim.id } as any);
        const dir = resolve(d.store.dataRoot, 'sessions', id); mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'provider.json'), JSON.stringify({ readOnly: options.readOnly ?? true }));
        writeFileSync(resolve(dir, 'result.json'), JSON.stringify({ result: native }));
    }
    if (options.dirty) writeFileSync(resolve(d.worktree, 'stray.txt'), 'x');
    const steps = d.job.steps.length, head = d.git(['rev-parse', 'HEAD']).trim();
    const run = () => withAssignment(claim, 'delivery', () => applyCorrection({ delivery: d.delivery, job: d.job, pending, native, root: d.artifactRoot(d.job), inputSha256: deliveryInputSha256(d.store, d.job.key), beforeWorkers: before }));
    return { d, run, steps, head, pending };
}

test('applyCorrection refuses typed, before any Git write, without its own completed read-only run or with a moved checkout', async () => {
    for (const [options, diagnostic, retained] of [[{ worker: false }, 'not bound to exactly one newly completed developer run', 0], [{ readOnly: false }, 'was not read-only', 0], [{ dirty: true }, 'the refused checkout moved', 1]] as const) {
        const c = await direct(options);
        const error = await c.run().then(() => undefined, failure => failure);
        expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
        expect((error as ReleaseMarkerRefusal).evidence).toMatchObject({ reason: 'indeterminate', correction: { refusedWorkId: c.pending.workId, refusedHead: c.pending.refusedHead } });
        expect((error as ReleaseMarkerRefusal).evidence.diagnostic).toContain(diagnostic);
        // The native proposal is retained only once its own run is proven; nothing is rewritten either way.
        expect(c.d.job.steps.length - c.steps).toBe(retained);
        expect(c.d.git(['rev-parse', 'HEAD']).trim()).toBe(c.head);
        expect(Object.keys(c.d.job.releaseMarkerReturns!)).toHaveLength(1);
    }
});

// Review repair pass (run 1ce11217): publication identity, required history checks and independent validation.
test('a target that advanced after the return stops the correction before its developer is dispatched', async () => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim();
    d.state.targetTip = 'a'.repeat(40);
    d.turns.push({ kind: 'correction', messages: shas => [{ sha: shas[0], message: 'docs(readme): reword' }] });
    await d.step();
    expect(d.dispatched).toHaveLength(1);
    expect(d.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('the remote refs moved since the return') } } });
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(head);
});

test('a target that advances at the final publication read stops with no ref update and no further return', async () => {
    const d = refusedSuffix();
    await d.step();
    const head = d.git(['rev-parse', 'HEAD']).trim(), [, a] = suffix(d, head), updates: string[][] = [];
    let reworded = false;
    const original = d.execute;
    (d.delivery as any).execute = async (program: string, args: string[], options: any) => {
        if (program === 'git' && args[0] === 'hash-object') reworded = true;
        if (program === 'git' && args[0] === 'update-ref') updates.push(args);
        if (program === 'git' && args[0] === 'ls-remote' && reworded) d.state.targetTip = 'a'.repeat(40);
        return original(program, args, options);
    };
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword' }] });
    await d.step();
    expect(reworded).toBe(true);
    expect(updates).toEqual([]);
    expect(d.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('the remote refs moved before the branch moved') } } });
    expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(head);
});

test('a CMS correction without a required history check stops typed, keeping the mapped checkout and pending return', async () => {
    for (const script of ['release:preflight', 'lint:commit']) {
        const d = markerDelivery();
        const { cmsPolicy } = await import('../support/marker-repo');
        const manifest = cmsPolicy()['package.json'].replace(new RegExp(`\\s*"${script}": "[^"]*",`), '');
        expect(manifest).not.toContain(`"${script}"`);
        d.turns.push({ kind: 'implement', commits: [
            { files: { 'package.json': manifest }, message: 'chore(scripts): adjust' },
            { files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): explain [skip release]' }] });
        await d.step();
        const [, a] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
        d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain' }] });
        await d.step();
        expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining(`required check: ${script} is required`) } } });
        expect(d.job.steps.some(step => step.stage === 'implement')).toBe(false);
        const pending = d.pending()!;
        expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(pending.correction!.mapping!.newHead);
        const { readdirSync } = await import('node:fs');
        expect(readdirSync(d.artifactRoot(d.job)).some(name => name.startsWith('release-marker-checks-'))).toBe(false);
    }
});

test.each(['harness checks', 'model QA'] as const)('a correction whose retained approach selects independent validation is reviewed and validated (%s) on the mapped SHA before its one push', async route => {
    const d = markerDelivery();
    const { cmsPolicy } = await import('../support/marker-repo');
    // Without a verify:ci script the harness has no checks to run, so Riley validates.
    const prefix = route === 'model QA' ? [{ files: { 'package.json': cmsPolicy()['package.json'].replace(/\s*"verify:ci": "[^"]*",/, '') }, message: 'chore(scripts): adjust' }] : [];
    d.turns.push({ kind: 'implement', commits: [...prefix, { files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): explain [skip release]' }],
        result: { approach: { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['pnpm run verify:ci'], reason: 'Independent QA' } as any } });
    await d.step();
    const marked = suffix(d, d.git(['rev-parse', 'HEAD']).trim()).at(-1)!;
    d.turns.push({ kind: 'correction', messages: () => [{ sha: marked, message: 'docs(readme): explain' }] });
    await d.step();
    const mapped = d.git(['rev-parse', 'HEAD']).trim();
    expect(d.job).toMatchObject({ stage: 'review', head: mapped, approach: { validation: 'independent-checks' } });
    d.turns.push({ kind: 'review' });
    await d.step();
    expect(d.job).toMatchObject({ stage: 'validate', status: 'queued' });
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
    if (route === 'model QA') d.turns.push({ kind: 'validate' });
    const before = d.state.calls.length;
    await d.step();
    expect(d.job.stage, d.job.detail).toBe('draft');
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
    if (route === 'harness checks') expect(d.state.calls.slice(before)).toContain('pnpm run --silent verify:ci');
    for (const [stage, kind] of [['review', 'review'], ['validate', 'checks']] as const) {
        const step = d.job.steps.filter(item => item.stage === stage).at(-1)!;
        expect(step.result).toMatchObject({ outcome: 'passed', commit: mapped });
        expect(step.result.evidence.some(item => item.kind === kind && item.commit === mapped)).toBe(true);
    }
    expect(d.dispatched.map(item => [item.role, item.options.stage])).toEqual([['developer', 'github-implement'], ['developer', 'github-implement'], ['lead', 'github-review'],
        ...(route === 'model QA' ? [['qa', 'github-validate']] : [])]);
    expect(d.turns).toEqual([]);
    await d.step();
    expect(d.job.status, d.job.detail).not.toBe('blocked');
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toEqual([`git push origin ${mapped}:refs/heads/${d.job.branch}`]);
});

// Review repair pass (run cab5a4a5): authority at the ref write, the accepted return and checkout, history-dependent
// checks, and the working transition.
test('a pause or new human input during the final checkout read after the mapping is saved stops with zero ref updates', async () => {
    const { addMetadataHumanInput } = await import('../../../fixtures/pr-metadata');
    for (const change of ['pause', 'input'] as const) {
        const d = refusedSuffix();
        await d.step();
        const head = d.git(['rev-parse', 'HEAD']).trim(), [, a] = suffix(d, head), updates: string[][] = [];
        let changed = false;
        const original = d.execute;
        (d.delivery as any).execute = async (program: string, args: string[], options: any) => {
            if (program === 'git' && args[0] === 'update-ref') updates.push(args);
            // The last checkout observation before the ref write, once the mapping is bound to the return.
            if (program === 'git' && args[0] === 'status' && d.pending()?.correction?.mapping && !changed) {
                changed = true;
                if (change === 'pause') d.store.state.paused = true; else addMetadataHumanInput({ store: d.store, job: d.job });
            }
            return original(program, args, options);
        };
        d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): reword' }] });
        await d.step();
        expect(changed).toBe(true);
        expect(updates).toEqual([]);
        const mapping = d.pending()!.correction!.mapping!;
        expect(existsSync(mapping.path)).toBe(true);
        expect(d.git(['rev-parse', `refs/heads/${d.job.branch}`]).trim()).toBe(head);
        expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate',
            diagnostic: expect.stringMatching(change === 'pause' ? /Office paused/ : /ownership, claim, human inputs or the pending return changed/) } } });
        expect(Object.keys(d.job.releaseMarkerReturns!)).toHaveLength(1);
    }
});

test.each(['change-mapping', 'switch-branch'] as const)('a correction whose return or checkout changes during its checks (%s) records no implement step', async mode => {
    const d = refusedSuffix();
    await d.step();
    const [, a] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
    checksMode.value = mode;
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain source acceptance' }] });
    await d.step();
    const pending = d.pending()!;
    expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate',
        diagnostic: expect.stringContaining(mode === 'change-mapping' ? 'the pending correction, claim or human inputs changed before acceptance' : 'the corrected checkout moved') } } });
    expect(d.job.steps.some(step => step.stage === 'implement')).toBe(false);
    expect(pending.status).toBe('pending');
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(pending.correction!.mapping!.newHead);
    if (mode === 'switch-branch') expect(d.git(['branch', '--show-current']).trim()).toBe('elsewhere');
});

test('a retained approach requiring a history-dependent check the harness cannot run is not credited from the refused SHA', async () => {
    const d = markerDelivery();
    d.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): explain [skip release]' }],
        result: { approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci', 'pnpm run release:dry'], reason: 'Release dry run' } as any } });
    await d.step();
    const [a] = suffix(d, d.git(['rev-parse', 'HEAD']).trim());
    d.turns.push({ kind: 'correction', messages: () => [{ sha: a, message: 'docs(readme): explain' }] });
    await d.step();
    expect(d.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('required check: release:dry depends on commit history') } } });
    expect(d.job.steps.some(step => step.stage === 'implement')).toBe(false);
    expect(d.pending()).toBeDefined();
    const { readdirSync } = await import('node:fs');
    expect(readdirSync(d.artifactRoot(d.job)).some(name => name.startsWith('release-marker-checks-'))).toBe(false);
    expect(d.state.calls.some(call => call.startsWith('pnpm run --silent release:dry'))).toBe(false);
});

test('the first saved working record of a queued correction already names its claim; a typed refusal before dispatch unbinds it', async () => {
    const { savedState } = await import('../../store/saved-state-fixture');
    const { claimedDelivery } = await import('../../../fixtures/delivery-claim');
    const d = refusedSuffix();
    await d.step();
    expect(d.job.status).toBe('queued');
    const seen: { status: string; claimId?: string }[] = [];
    const listener = (event: { kind: string }) => {
        if (event.kind !== 'github-delivery-stage') return;
        const job = savedState<any>(d.store).coordination.jobs.find((item: any) => item.id === d.job.id);
        seen.push({ status: job.status, claimId: (Object.values(job.releaseMarkerReturns) as any[]).find(item => item.status === 'pending')?.correction?.claimId });
    };
    d.store.listeners.add(listener);
    d.turns.push({ kind: 'correction', messages: shas => [{ sha: shas[0], message: 'docs(readme): reword' }] });
    // As the scheduler calls it: the job is still queued when the step starts.
    await claimedDelivery(d.store, d.job, () => d.delivery.step(d.job), false);
    const claimId = Object.values(d.job.releaseMarkerReturns!).find(item => item.correction?.workId)!.correction!.claimId;
    expect(seen[0]).toEqual({ status: 'working', claimId });
    expect(d.job.stage).toBe('review');
    // A typed checkout refusal before dispatch keeps its stop, the return and its count, and clears the binding.
    const r = refusedSuffix();
    await r.step();
    require('node:fs').writeFileSync(require('node:path').resolve(r.worktree, 'stray.txt'), 'x');
    r.turns.push({ kind: 'correction', messages: shas => [{ sha: shas[0], message: 'docs(readme): reword' }] });
    await claimedDelivery(r.store, r.job, () => r.delivery.step(r.job), false);
    expect(r.dispatched).toHaveLength(1);
    expect(r.job).toMatchObject({ status: 'blocked', head: '', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('checkout moved') } } });
    expect(Object.keys(r.job.releaseMarkerReturns!)).toHaveLength(1);
    expect(r.pending()).toMatchObject({ status: 'pending' });
    expect(r.pending()!.correction).toBeUndefined();
    expect((Object.values(savedState<any>(r.store).coordination.jobs.find((item: any) => item.id === r.job.id).releaseMarkerReturns)[0] as any).correction).toBeUndefined();
});
