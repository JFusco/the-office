import { symlinkSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { GitHubDelivery } from '../../server/github-delivery';
import { ProjectProgress } from '../../server/project-progress';
import { projectById } from '../../server/projects';
import { coordination } from '../../server/coordination';
import { enqueueRequest } from '../../server/requests';
import { bindDiscoveryResume, discoveryRecoveryCandidate, recoverDiscovery, discoveryReviewSatisfied } from '../../server/discovery-recovery';
import type { StageResult, TicketJob, HarnessRequest } from '../../src/shared';
import type { parseBrainStatus } from '../../server/brain-status';
const roots: string[] = [], stores: Store[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-discovery-resume-')); roots.push(root);
    const store = new Store(':memory:', { ...projectById('brain'), repo: root }, root); stores.push(store); store.state.coordination = coordination();
    const result: StageResult = { outcome: 'blocked', summary: 'Index preflight failed before writes', commit: 'a'.repeat(40), worktree: '', branch: '', previewUrl: '', prId: 0, paidRuns: 0, qaRunDir: '', evidence: [], receipts: [], blocker: 'Old discovery restriction', findings: [{ id: 'index-429', status: 'open', attempts: 1, expected: 'Official index', actual: '429', summary: '429 retained' }], approach: null };
    const job: TicketJob = { id: 'job', key: 'GH-67', requestedAt: '', stage: 'implement', status: 'blocked', detail: 'Stopped original', head: '', branch: '', worktree: '', pr: 0, prUrl: '', steps: [{ stage: 'implement', result }] }; store.state.coordination.jobs = [job];
    store.state.workLog = [{ id: 'original', sessionId: 'native-original', requestId: job.id, role: 'developer', provider: 'claude', stage: 'github-implement', status: 'blocked', endedAt: '2026-10-29T21:00:00Z' } as any];
    const noteId = '11111111-1111-4111-8111-111111111111';
    store.state.projectNotes = [{ id: noteId, ticket: job.key, requestId: 'human-request', createdAt: '2026-10-29T22:00:00Z', summary: 'Updated discovery instruction', detail: 'Start at official navigation; preserve retrieval gates' }];
    store.state.messages = [{ id: 'human-request', requestId: 'human-request', from: 'human', to: 'pm', ticket: job.key, status: 'answered', body: 'Continue official navigation discovery', actionId: '', recheck: false, createdAt: '2026-10-29T22:00:00Z', sessionId: '', recipients: [], error: '', receipts: [] } as any];
    function save(id: string, name: string, data: unknown) { const dir = resolve(root, 'sessions', id); mkdirSync(dir, { recursive: true }); writeFileSync(resolve(dir, name), JSON.stringify(data)); }
    save('original', 'provider.json', { project: 'brain', repository: 'JFusco/brain', role: 'developer', provider: 'claude' });
    save('original', 'result.json', { session: 'native-original', result });
    const issue = { number: 67, state: 'open', html_url: 'https://github.com/JFusco/brain/issues/67', assignees: [{ login: 'JFusco' }], updated_at: '2026-10-29T22:00:00Z', body: 'Amended official discovery' };
    const native: ReturnType<typeof parseBrainStatus> = { slotDate: '2026-10-29', active: null, completed: null, attempts: 1, retryAfter: null };
    const fetchConfig = { origin: 'https://github.com/JFusco/brain.git', refspec: '+refs/heads/*:refs/remotes/origin/*' };
    const execute = vi.fn(async (program: string, args: string[]) => program === 'git' ? args[0] === 'remote' ? fetchConfig.origin : fetchConfig.refspec : program === 'node' ? JSON.stringify(native) : args[1].includes('/comments?') ? '[[]]' : JSON.stringify(issue));
    const engine = new Engine(store), delivery = new GitHubDelivery(store, engine, execute as any);
    const board = { items: [{ number: 67, repository: 'JFusco/brain', status: 'Ready' }], error: '' };
    vi.spyOn(engine.github, 'board').mockImplementation(async () => structuredClone(board) as any);
    const assessment = { outcome: 'passed', contract: 'discovery-delivery-effects-v3', originalAttemptId: 'original', originalSessionId: 'native-original', administrativeEffects: [] as { kind: 'git-fetch' | 'private-diagnostic-file' | 'private-diagnostic-directory'; target: string; status: 'succeeded' | 'failed' | 'unknown'; summary: string }[], verifiedNoDeliveryEffects: true, nativeClaimsClear: true, baselineCommit: result.commit, summary: 'Complete original native fixture proves no effects', findings: [{ id: 'index-429', disposition: 'Earlier failure retained; the newer human scope permits navigation discovery' }], references: [{ locator: 'https://github.com/JFusco/brain/issues/67', summary: 'Semantic reference' }, { locator: root, summary: 'A directory is not a file to hash' }] };
    const run = vi.spyOn(engine.agents, 'run').mockImplementation(async () => {
        store.state.workLog!.push({ id: 'reader', sessionId: 'native-reader', requestId: job.id, role: 'lead', provider: 'codex', stage: 'discovery-readback', status: 'completed', endedAt: '2026-10-29T22:10:00Z' } as any);
        save('reader', 'provider.json', { project: 'brain', repository: 'JFusco/brain', role: 'lead', provider: 'codex', readOnly: true, session: null });
        save('reader', 'result.json', { session: 'native-reader', result: assessment });
        save('reader', 'assignment-identity.json', { threadId: 'native-reader', projectId: 'brain', requestId: job.id, role: 'lead' });
        return structuredClone(assessment) as any;
    });
    const ownership = vi.fn(async () => ({ complete: true, fresh: true, ownership: { status: 'clear' } }));
    const request = enqueueRequest(store, 'resume-discovery', job.key, 'original'); request.discoveryResume = bindDiscoveryResume(store, job.key, 'original', { noteId });
    return { store, engine, job, result, root, save, issue, native, board, assessment, run, ownership, request, delivery, noteId, execute, fetchConfig };
}
test('one fresh attempt is queued without inventing a candidate or rewriting stopped history', async () => {
    const f = fixture(), original = JSON.stringify(f.job.steps[0]);
    await recoverDiscovery(f.delivery, f.request, f.ownership);
    expect(f.job).toMatchObject({ stage: 'implement', status: 'queued', head: '', branch: '', worktree: '', discoveryRecovery: { originalWorkId: 'original', baseline: 'a'.repeat(40) }, approach: { review: 'focused', validation: 'independent-checks' } });
    expect(JSON.stringify(f.job.steps[0])).toBe(original); expect(f.run).toHaveBeenCalledTimes(1);
    expect(f.run.mock.calls[0][3]).toMatchObject({ readOnly: true, effortKind: 'administrative', stage: 'discovery-readback' });
    const proof = JSON.parse(readFileSync(f.job.steps.at(-1)!.result.evidence[0].path, 'utf8'));
    expect(proof.artifacts).toHaveLength(5); expect(proof.artifacts.every((artifact: any) => /^[a-f0-9]{64}$/.test(artifact.sha256))).toBe(true);
    expect(proof.assessment.references[0].locator).toMatch(/^https:/);
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow('identity'); expect(f.run).toHaveBeenCalledTimes(1);
});
test.each(['candidate', 'uncertain', 'effects', 'active', 'native', 'human-scope', 'duplicate-original', 'not-brain'] as const)('rejects %s before another model call', async kind => {
    const f = fixture();
    expect(discoveryRecoveryCandidate(f.store, f.job)).toBeDefined();
    if (kind === 'candidate') f.job.head = 'b'.repeat(40);
    if (kind === 'uncertain') f.result.receipts.push({ id: 'effect', action: 'comment', target: '', verified: false, uncertain: true, detail: '' });
    if (kind === 'effects') f.store.putEffect({ id: 'effect', work: { projectId: 'brain', kind: 'delivery', id: f.job.id }, attemptId: 'original', operation: 'comment', target: f.job.key, authorization: 'fixture', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: '', verifiedAt: '', receipt: null, error: 'Uncertain original write', elapsedMs: null });
    if (kind === 'active') f.store.state.workLog![0].status = 'stopping';
    if (kind === 'native') f.native.active = { id: '22222222-2222-4222-8222-222222222222', authorId: '33333333-3333-4333-8333-333333333333', slotDate: f.native.slotDate, phase: 'discovery' };
    if (kind === 'human-scope') f.store.state.messages[0].status = 'queued';
    if (kind === 'duplicate-original') f.store.state.workLog!.push({ ...f.store.state.workLog![0], id: 'other' });
    if (kind === 'not-brain') (f.store.project as any).id = 'cms-field-vocabulary';
    if (!['native', 'human-scope'].includes(kind)) expect(discoveryRecoveryCandidate(f.store, f.job)).toBeUndefined();
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow(kind === 'native' ? 'A native Brain run is active' : kind === 'human-scope' ? 'newer confirmed human' : 'identity');
    expect(f.run).not.toHaveBeenCalled(); expect(f.job.status).toBe('blocked');
});
test.each(['missing', 'stale', 'same-time'] as const)('binding rejects a %s human scope note', kind => {
    const f = fixture();
    if (kind === 'missing') f.store.state.projectNotes = [];
    else f.store.state.projectNotes[0].createdAt = kind === 'stale' ? '2026-10-29T20:59:00Z' : f.store.state.workLog![0].endedAt;
    expect(discoveryRecoveryCandidate(f.store, f.job)).toBeDefined();
    expect(() => bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId })).toThrow('newer confirmed human');
});
test('a rebound original session is rejected before remote reads or readback, even with matching saved artifacts', async () => {
    const f = fixture(), before = JSON.stringify(f.job), session = 'replacement-session';
    f.store.state.workLog![0].sessionId = session;
    f.save('original', 'provider.json', { project: 'brain', repository: 'JFusco/brain', role: 'developer', provider: 'claude', session });
    f.save('original', 'result.json', { session, result: f.result });
    f.assessment.originalSessionId = session;
    expect(discoveryRecoveryCandidate(f.store, f.job)).toBeDefined();
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow('identity');
    expect(f.execute).not.toHaveBeenCalled(); expect(f.engine.github.board).not.toHaveBeenCalled();
    expect(f.ownership).not.toHaveBeenCalled(); expect(f.run).not.toHaveBeenCalled(); expect(JSON.stringify(f.job)).toBe(before);
});
test('an issue change after the final ownership refresh yields blocks recovery without a receipt', async () => {
    const f = fixture(), before = JSON.stringify(f.job);
    f.ownership.mockImplementation(async () => {
        if (f.ownership.mock.calls.length === 2) {
            await Promise.resolve();
            f.issue.body = 'Human changed the issue during the final ownership refresh';
        }
        return { complete: true, fresh: true, ownership: { status: 'clear' } };
    });
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow('issue/comments/board changed');
    expect(f.ownership).toHaveBeenCalledTimes(2); expect(f.run).toHaveBeenCalledTimes(1); expect(JSON.stringify(f.job)).toBe(before);
    expect(existsSync(resolve(f.root, 'ticket-work', f.job.id, `discovery-resume-${f.request.id}.json`))).toBe(false);
});
test('a second completed readback arriving during the final ownership refresh blocks recovery without a receipt', async () => {
    const f = fixture(), before = JSON.stringify(f.job);
    f.ownership.mockImplementation(async () => {
        if (f.ownership.mock.calls.length === 2) {
            await Promise.resolve();
            f.store.state.workLog!.push({ ...f.store.state.workLog!.find(work => work.id === 'reader')!, id: 'second-reader' });
        }
        return { complete: true, fresh: true, ownership: { status: 'clear' } };
    });
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow('Exactly one unchanged');
    expect(f.ownership).toHaveBeenCalledTimes(2); expect(f.run).toHaveBeenCalledTimes(1); expect(JSON.stringify(f.job)).toBe(before);
    expect(existsSync(resolve(f.root, 'ticket-work', f.job.id, `discovery-resume-${f.request.id}.json`))).toBe(false);
});
test.each(['no-effects', 'finding', 'session', 'missing-reader', 'reader-result', 'scope-race', 'ownership-race', 'duplicate-reader', 'wrong-role', 'artifact-race'] as const)('a %s failure preserves original and blocks resumption', async kind => {
    const f = fixture(), before = JSON.stringify(f.job), original = f.run.getMockImplementation()!;
    f.run.mockImplementation(async (...args: any[]) => {
        if (kind === 'no-effects') f.assessment.verifiedNoDeliveryEffects = false;
        if (kind === 'finding') f.assessment.findings = [];
        if (kind === 'session') f.assessment.originalSessionId = 'wrong';
        const value = await (original as any)(...args);
        if (kind === 'missing-reader') f.store.state.workLog = f.store.state.workLog!.filter(work => work.id !== 'reader');
        if (kind === 'duplicate-reader') f.store.state.workLog!.push({ ...f.store.state.workLog!.at(-1)!, id: 'second-reader' });
        if (kind === 'wrong-role') f.save('reader', 'provider.json', { project: 'brain', repository: 'JFusco/brain', provider: 'codex', role: 'cto', readOnly: true });
        if (kind === 'artifact-race') f.ownership.mockImplementation(async () => { f.save('reader', 'result.json', { session: 'native-reader', result: { ...value, summary: 'Replaced after accepted result' } }); return { complete: true, fresh: true, ownership: { status: 'clear' } }; });
        if (kind === 'reader-result') f.save('reader', 'result.json', { session: 'wrong', result: value });
        if (kind === 'scope-race') f.store.state.projectNotes[0].detail = 'Concurrent edit';
        if (kind === 'ownership-race') f.ownership.mockResolvedValue({ complete: false, fresh: false, ownership: { status: 'unknown' } });
        return value;
    });
    await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow(); expect(JSON.stringify(f.job)).toBe(before);
});
test('original findings require independent source review and verified QA dispositions', () => {
    const f = fixture(); f.job.discoveryRecovery = { requestId: 'request', originalWorkId: 'original', originalSessionId: 'native', baseline: f.result.commit, noteId: f.noteId, findingIds: ['index-429'], at: '' };
    expect(discoveryReviewSatisfied(f.job, 'review', { ...f.result, findings: [] })).toBe(false);
    const fixed = { ...f.result, findings: f.result.findings.map(finding => ({ ...finding, status: 'fixed' as const })) };
    expect(discoveryReviewSatisfied(f.job, 'review', fixed)).toBe(true); expect(discoveryReviewSatisfied(f.job, 'validate', fixed)).toBe(false);
    expect(discoveryReviewSatisfied(f.job, 'validate', { ...fixed, findings: fixed.findings.map(finding => ({ ...finding, status: 'verified' as const })) })).toBe(true);
});
test.each(['implement', 'review', 'validate'] as const)('%s receives the revised discovery scope and explicit original finding dispositions', async stage => {
    const f = fixture(), note = structuredClone(f.store.state.projectNotes[0]);
    f.result.findings.push({ id: 'assignment-identity-missing', status: 'open', attempts: 1, expected: 'Native identity', actual: 'Missing', summary: 'Original missing identity retained' });
    f.save('original', 'result.json', { session: 'native-original', result: f.result });
    f.assessment.findings.push({ id: 'assignment-identity-missing', disposition: 'Fresh workers receive an actual assignment identity' });
    f.request.discoveryResume = bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId });
    await recoverDiscovery(f.delivery, f.request, f.ownership);
    f.job.stage = stage;
    if (stage !== 'implement') { f.job.head = 'b'.repeat(40); f.job.worktree = resolve(f.root, 'candidate'); }
    vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined);
    f.run.mockClear().mockResolvedValueOnce(structuredClone(f.result) as any);
    await f.delivery.step(f.job);
    expect(f.run).toHaveBeenCalledTimes(1);
    const [role, task, , options] = f.run.mock.calls[0];
    expect(role).toBe(stage === 'implement' ? 'developer' : stage === 'review' ? 'lead' : 'qa');
    expect(options).toMatchObject({ stage: `github-${stage}`, requestId: f.job.id });
    expect(task).toContain(`REVISED HUMAN DISCOVERY SCOPE: ${JSON.stringify(note)}`);
    expect(task).toContain(note.detail);
    const instructions = task.match(/RECOVERED FINDINGS: ([^\n]+)/)?.[1];
    for (const finding of f.result.findings) expect(instructions).toContain(finding.id);
    expect(instructions).toContain('Review must return status=fixed or status=verified for each ID');
    expect(instructions).toContain('QA must independently return status=verified for each ID on the exact candidate commit');
    if (stage !== 'implement') expect(task).toContain(`candidate ${'b'.repeat(40)}`);
});
test('a missing revised discovery scope blocks the fresh implement step before model dispatch', async () => {
    const f = fixture();
    await recoverDiscovery(f.delivery, f.request, f.ownership);
    f.store.state.projectNotes = [];
    f.run.mockClear();
    await f.delivery.step(f.job);
    expect(f.run).not.toHaveBeenCalled();
    expect(f.job).toMatchObject({ status: 'blocked', stage: 'implement', detail: 'Error: Revised discovery scope note is missing' });
});


test('certain fetch and original private diagnostics do not imply source or provider delivery effects', async () => {
    const f = fixture(), directory = resolve(f.root, 'ticket-work', f.job.id), path = resolve(directory, 'original-probe.txt');
    mkdirSync(directory, { recursive: true }); writeFileSync(path, 'Original endpoint-specific429 evidence');
    f.result.evidence.push({ id: 'original-probe', kind: 'checks', path, commit: f.result.commit, summary: 'Original diagnostic', environment: 'fixture', url: '', observedAt: '' });
    f.save('original', 'result.json', { session: 'native-original', result: f.result });
    f.request.discoveryResume = bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId });
    f.assessment.administrativeEffects = [{ kind: 'git-fetch', target: f.store.project.repo, status: 'succeeded', summary: 'Complete native command and result show only git fetch origin' }, { kind: 'private-diagnostic-file', target: path, status: 'succeeded', summary: 'Certain private evidence write' }, { kind: 'private-diagnostic-directory', target: directory, status: 'succeeded', summary: 'Private diagnostic directory' }];
    await recoverDiscovery(f.delivery, f.request, f.ownership);
    expect(f.job).toMatchObject({ status: 'queued', head: '', branch: '', worktree: '' });
    const proof = JSON.parse(readFileSync(f.job.steps.at(-1)!.result.evidence[0].path, 'utf8'));
    expect(proof.administrativeProofs).toEqual([expect.objectContaining({ path, directory: false, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }), { path: directory, directory: true, sha256: null }]);
    const schema = f.run.mock.calls[0][2];
    expect(schema.safeParse({ ...f.assessment, originalAttemptId: f.job.id }).success).toBe(false);
    expect(schema.safeParse({ ...f.assessment, administrativeEffects: [{ kind: 'git-push', target: f.store.project.repo, summary: 'Not allowed' }] }).success).toBe(false);
});
test.each([
    ['foreign-fetch', 'another repository'],
    ['foreign-diagnostic', 'outside the original job'],
    ['outside-evidence', 'outside the original job'],
    ['file-as-directory', 'outside the original job'],
    ['directory-as-file', 'type or size differs'],
    ['diagnostic-race', 'Administrative evidence changed'],
] as const)('administrative %s evidence cannot authorize continuation', async (kind, message) => {
    const f = fixture(), directory = resolve(f.root, 'ticket-work', f.job.id);
    const path = kind === 'outside-evidence' ? resolve(f.root, 'outside.txt') : resolve(directory, kind === 'directory-as-file' ? 'probe' : 'probe.txt');
    mkdirSync(directory, { recursive: true });
    if (kind === 'directory-as-file') mkdirSync(path);
    else writeFileSync(path, 'Original diagnostic');
    f.result.evidence.push({ id: 'probe', kind: 'checks', path, commit: f.result.commit, summary: 'Original', environment: '', url: '', observedAt: '' });
    f.save('original', 'result.json', { session: 'native-original', result: f.result }); f.request.discoveryResume = bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId });
    f.assessment.administrativeEffects = [{ kind: kind === 'foreign-fetch' ? 'git-fetch' : kind === 'file-as-directory' ? 'private-diagnostic-directory' : 'private-diagnostic-file', target: kind === 'foreign-fetch' ? resolve(f.root, 'another-repo') : kind === 'foreign-diagnostic' ? resolve(f.root, 'source.ts') : path, status: 'succeeded', summary: 'Observed preflight effect' }];
    if (kind === 'diagnostic-race') f.ownership.mockImplementation(async () => { if (f.store.state.workLog!.some(work => work.id === 'reader')) writeFileSync(path, 'Changed after proof'); return { complete: true, fresh: true, ownership: { status: 'clear' } }; });
    const prior = JSON.stringify(f.job); await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow(message); expect(JSON.stringify(f.job)).toBe(prior);
});
test.each(['workDigest', 'jobDigest', 'scopeDigest', 'queued'] as const)('an exact completed discovery continuation retires its earlier failure, while %s differences retain it', async kind => {
    const f = fixture(); f.request.status = 'blocked'; const old = structuredClone(f.request);
    const success: HarnessRequest = { ...structuredClone(f.request), id: 'success', status: 'completed' };
    f.store.state.coordination!.requests!.push(success);
    f.job.discoveryRecovery = { requestId: success.id, originalWorkId: 'original', originalSessionId: 'native-original', baseline: f.result.commit, noteId: f.noteId, findingIds: ['index-429'], at: '' };
    const { scheduledWork } = await import('../../server/scheduled-work');
    const rows = scheduledWork({ store: f.store, engine: f.engine, conversations: {} as any, coordinator: {} as any }, new Map([[f.store.project.id, f.store]]));
    expect(rows.find(row => row.work.id === f.request.id)!.eligibility.state).toBe('terminal'); expect(f.request).toEqual(old);
    if (kind === 'queued') success.status = 'queued';
    else success.discoveryResume![kind] = 'different-original';
    const changed = scheduledWork({ store: f.store, engine: f.engine, conversations: {} as any, coordinator: {} as any }, new Map([[f.store.project.id, f.store]]));
    expect(changed.find(row => row.work.id === f.request.id)!.eligibility.state).toBe('blocked'); expect(f.request).toEqual(old);
});


test('a diagnostic symlink cannot authorize a resumed delivery', async () => {
    const f = fixture(), directory = resolve(f.root, 'ticket-work', f.job.id), path = resolve(directory, 'alias.txt'), outside = resolve(f.root, 'outside.txt');
    mkdirSync(directory, { recursive: true }); writeFileSync(outside, 'Outside original evidence'); symlinkSync(outside, path);
    f.result.evidence.push({ id: 'alias', kind: 'checks', path, commit: f.result.commit, summary: 'Untrusted diagnostic path', environment: '', url: '', observedAt: '' });
    f.save('original', 'result.json', { session: 'native-original', result: f.result }); f.request.discoveryResume = bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId });
    f.assessment.administrativeEffects = [{ kind: 'private-diagnostic-file', target: path, status: 'succeeded', summary: 'Claimed diagnostic write' }];
    const original = JSON.stringify(f.job); await expect(recoverDiscovery(f.delivery, f.request, f.ownership)).rejects.toThrow('symlink'); expect(JSON.stringify(f.job)).toBe(original);
});

async function continuedFixture() {
    const f = fixture(); await recoverDiscovery(f.delivery, f.request, f.ownership); f.request.status = 'completed';
    const priorRecovery = structuredClone(f.job.discoveryRecovery!), secondResult = structuredClone(f.result);
    secondResult.findings = [{ ...secondResult.findings[0], id: 'graph-coverage' }];
    f.job.steps.push({ stage: 'implement', result: secondResult }); f.job.status = 'blocked';
    f.store.state.workLog!.push({ ...structuredClone(f.store.state.workLog![0]), id: 'second', sessionId: 'native-second', endedAt: '2026-10-29T23:00:00Z' });
    f.save('second', 'provider.json', { project: 'brain', repository: 'JFusco/brain', role: 'developer', provider: 'claude' });
    f.save('second', 'result.json', { session: 'native-second', result: secondResult });
    f.assessment.originalAttemptId = 'second'; f.assessment.originalSessionId = 'native-second';
    f.assessment.findings = [{ id: 'graph-coverage', disposition: 'Research capability fixed; coverage still requires actual evidence' }];
    f.run.mockImplementation(async () => {
        f.store.state.workLog!.push({ id: 'reader-second', sessionId: 'native-reader-second', requestId: f.job.id, role: 'lead', provider: 'codex', stage: 'discovery-readback', status: 'completed', endedAt: '2026-10-29T23:10:00Z' } as any);
        f.save('reader-second', 'provider.json', { project: 'brain', repository: 'JFusco/brain', role: 'lead', provider: 'codex', readOnly: true });
        f.save('reader-second', 'result.json', { session: 'native-reader-second', result: f.assessment });
        f.save('reader-second', 'assignment-identity.json', { threadId: 'native-reader-second', projectId: 'brain', requestId: f.job.id, role: 'lead' });
        return structuredClone(f.assessment) as any;
    });
    return { ...f, priorRecovery, secondResult };
}
test('a later stopped discovery attempt inherits only the identical approved scope, preserves the chain and queues once', async () => {
    const f = await continuedFixture(), originalSteps = JSON.stringify(f.job.steps);
    const binding = bindDiscoveryResume(f.store, f.job.key, 'second', { noteId: f.noteId });
    const next = enqueueRequest(f.store, 'resume-discovery', f.job.key, 'second'); next.discoveryResume = binding;
    await recoverDiscovery(f.delivery, next, f.ownership); next.status = 'completed';
    expect(f.job.discoveryRecoveryHistory).toEqual([f.priorRecovery]);
    expect(f.job.discoveryRecovery).toMatchObject({ originalWorkId: 'second', findingIds: ['index-429', 'graph-coverage'] });
    expect(JSON.stringify(f.job.steps.slice(0, -1))).toBe(originalSteps); expect(f.job.status).toBe('queued');
    expect(f.run).toHaveBeenCalledTimes(2);
    await expect(recoverDiscovery(f.delivery, next, f.ownership)).rejects.toThrow('identity');
    expect(() => bindDiscoveryResume(f.store, f.job.key, 'original', { noteId: f.noteId })).toThrow();
    // Retiring earlier failed requests must survive replacement of the current continuation pointer.
    const failed: HarnessRequest = { ...structuredClone(f.request), id: 'old-failure', status: 'blocked' };
    f.store.state.coordination!.requests!.push(failed);
    const { scheduledWork } = await import('../../server/scheduled-work');
    const rows = scheduledWork({ store: f.store, engine: f.engine, coordinator: {} as any, conversations: {} as any }, new Map([['brain', f.store]]));
    expect(rows.find(row => row.work.id === failed.id)!.eligibility.state).toBe('terminal'); expect(failed.status).toBe('blocked');
});
test.each(['scope', 'human', 'prior-incomplete', 'prior-binding', 'receipt', 'duplicate-work', 'extra-step', 'replay'] as const)('a later discovery cannot inherit %s evidence', async mutation => {
    const f = await continuedFixture();
    if (mutation === 'scope') f.store.state.projectNotes[0].detail += ' Changed scope';
    if (mutation === 'human') f.store.state.messages[0].body += ' New hold';
    if (mutation === 'prior-incomplete') f.request.status = 'blocked';
    if (mutation === 'prior-binding') f.request.discoveryResume!.noteId = '22222222-2222-4222-8222-222222222222';
    if (mutation === 'receipt') f.job.steps[1].result.receipts[0].verified = false;
    if (mutation === 'duplicate-work') f.store.state.workLog!.push(structuredClone(f.store.state.workLog!.at(-1)!));
    if (mutation === 'extra-step') f.job.steps.push(structuredClone(f.job.steps.at(-1)!));
    if (mutation === 'replay') f.store.state.workLog!.at(-1)!.id = 'original';
    expect(() => bindDiscoveryResume(f.store, f.job.key, 'second', { noteId: f.noteId })).toThrow();
    expect(f.run).toHaveBeenCalledTimes(1); expect(f.job.status).toBe('blocked');
});


test.each(['succeeded','failed','unknown'] as const)('a fully isolated terminated git-fetch with %s exit outcome does not become an uncertain delivery write',async status=>{
 const f=fixture();f.assessment.administrativeEffects=[{kind:'git-fetch',target:f.store.project.repo,status,summary:'Complete terminated native command proves only git fetch origin; individual exit status is retained honestly'}];
 await recoverDiscovery(f.delivery,f.request,f.ownership);
 expect(f.job.status).toBe('queued');
 const proof=JSON.parse(readFileSync(f.job.steps.at(-1)!.result.evidence[0].path,'utf8'));
 expect(proof.assessment.administrativeEffects[0].status).toBe(status);
    expect(proof.fetchConfiguration).toEqual(status === 'succeeded' ? undefined : { origin: f.fetchConfig.origin, refspec: f.fetchConfig.refspec });
});
test.each(['failed','unknown'] as const)('an administrative diagnostic with %s completion still blocks without rewriting history',async status=>{
 const f=fixture(),dir=resolve(f.root,'ticket-work',f.job.id),path=resolve(dir,'diagnostic.txt');mkdirSync(dir,{recursive:true});writeFileSync(path,'Observed bytes');
 f.result.evidence.push({id:'diagnostic',kind:'checks',path,commit:f.result.commit,summary:'Original',environment:'',url:'',observedAt:''});
 f.save('original','result.json',{session:'native-original',result:f.result});f.request.discoveryResume=bindDiscoveryResume(f.store,f.job.key,'original',{noteId:f.noteId});
 f.assessment.administrativeEffects=[{kind:'private-diagnostic-file',target:path,status,summary:'Outcome not confirmed'}];
 const prior=JSON.stringify(f.job);await expect(recoverDiscovery(f.delivery,f.request,f.ownership)).rejects.toThrow('diagnostic completion');
 expect(JSON.stringify(f.job)).toBe(prior);
});


test.each(['origin','refspec','race'] as const)('an unproven %s cannot treat unknown fetch completion as isolated cache work',async kind=>{
 const f=fixture();f.assessment.administrativeEffects=[{kind:'git-fetch',target:f.store.project.repo,status:'unknown',summary:'Masked fetch exit'}];
 if(kind==='origin')f.fetchConfig.origin='https://example.com/another.git';
 if(kind==='refspec')f.fetchConfig.refspec='+refs/heads/*:refs/heads/*';
 if(kind==='race')f.ownership.mockImplementation(async()=>{if(f.store.state.workLog!.some(work=>work.id==='reader'))f.fetchConfig.refspec='+refs/heads/*:refs/heads/*';return{complete:true,fresh:true,ownership:{status:'clear'}};});
 const prior=JSON.stringify(f.job);await expect(recoverDiscovery(f.delivery,f.request,f.ownership)).rejects.toThrow('fetch configuration');expect(JSON.stringify(f.job)).toBe(prior);
});
