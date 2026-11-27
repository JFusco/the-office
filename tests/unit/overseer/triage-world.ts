import { createHash } from 'node:crypto';
import { vi } from 'vitest';
import type { EvidencePacket, IncidentSubjectRecord } from '../../../src/contracts/incidents';
import type { HarnessDefectResult, SourceRange, SubjectReference, TriageResult } from '../../../src/contracts/overseer';
import { canonical } from '../../../server/incidents/canonical-json';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { repairSubject } from '../../../server/incidents/subject-digest';
import type { CurrentFacts } from '../../../server/overseer/corroborate';
import { prepareOpinionInput, type Budgeted, type FrozenInput, type OpinionSources, type Provider, type ProviderAnswer, type ProviderCall, type ProviderInvoke, type RequirementExample } from '../../../server/overseer/stages/triage';
import type { LedgerOptions } from '../../../server/overseer/budget-ledger';
import { runBudgeted } from '../../../server/overseer/budgeted-run';
import type { RunnerPaths } from '../../../server/overseer/config';
import { claudeCost } from '../../../server/telemetry/run-cost';

/** Test support for triage and corroboration: a synthetic incident, its sources, and honest verdicts about it. */

export const sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
export const INCIDENT = 'inc-0000000000000001';
export const COMMIT = 'c'.repeat(40);

export const GUARD_PATH = 'server/delivery/harness/write-guards.ts';
export const GUARD = Buffer.from([
    "import { refuse } from './refusal';",
    'export function writeGuard(job: { branch: string; owner: string }) {',
    "    if (job.branch !== job.owner) return refuse('not-owner');",
    '    return null;',
    '}',
    '',
].join('\n'));
export const DOC_PATH = 'docs/office-process.md';
export const DOC = Buffer.from(['# Office process', '', 'A job owns the branch it created.', 'A writer may push to a branch it owns, even after a rebase renamed it.', ''].join('\n'));
export const TEST_PATH = 'tests/unit/delivery/write-guards.test.ts';
export const TEST = Buffer.from(["import { test } from 'vitest';", "test('owned branch', () => {});", ''].join('\n'));
const OTHER_TEST = Buffer.from(["import { test } from 'vitest';", "test('renamed branch', () => {});", ''].join('\n'));
export const OTHER_TARGET = { path: 'tests/unit/delivery/branch-ownership.test.ts', sha256: sha(OTHER_TEST) };

/** One-based inclusive lines of `bytes` and the SHA-256 of them joined with LF. */
export function rangeOf(path: string, bytes: Buffer, startLine: number, endLine = startLine, decisiveLine = startLine): SourceRange {
    const lines = bytes.toString('utf8').replace(/\n$/, '').split('\n');
    return { path, sha256: sha(bytes), startLine, endLine, decisiveLine, excerptSha256: sha(lines.slice(startLine - 1, endLine).join('\n')) };
}

export function subjectRecord(extra: Partial<IncidentSubjectRecord> = {}): IncidentSubjectRecord {
    return {
        projectId: 'office', kind: 'job', id: 'GH-7', episode: 'ep-1', stage: 'lead-pr', stop: { kind: 'not-owner', at: '2026-11-26T10:00:00.000Z' },
        lastWorker: 'w-1', head: 'abc1234', unsettledEffect: false, status: 'open', expected: null, sources: ['stopped-work'],
        evidence: 'refused: not-owner', firstObservedAt: '2026-11-26T10:00:00.000Z', lastObservedAt: '2026-11-26T10:05:00.000Z',
        openedAt: '2026-11-26T10:00:00.000Z', clearedAt: null, episodes: ['ep-1'], episodeCount: 1, ...extra,
    };
}

export function episodeOf(record: IncidentSubjectRecord): SubjectReference {
    const { subject, digest } = repairSubject(record);
    return { kind: 'subject', key: subject, stopDigest: digest };
}

/** A version 1 packet with the Office's own digests: each subject's from `repairSubject`, the packet's from its canonical body. */
export function packetFor(records: IncidentSubjectRecord[] = [subjectRecord()], extra: { open?: number; events?: string[]; revision?: number } = {}): EvidencePacket {
    const included = records.map(record => ({
        ...repairSubject(record), projectId: record.projectId, kind: record.kind, id: record.id, status: record.status, stage: record.stage, stop: record.stop,
        lastWorker: record.lastWorker, head: record.head, unsettledEffect: record.unsettledEffect, expected: record.expected, sources: record.sources,
        episode: record.episode, episodeCount: record.episodeCount, openedAt: record.openedAt, clearedAt: record.clearedAt, evidence: record.evidence,
    }));
    const body: Omit<EvidencePacket, 'digest'> = {
        version: 1,
        incident: {
            id: INCIDENT, fingerprint: 'f'.repeat(64), state: 'observed', revision: extra.revision ?? 3,
            cause: { source: 'stopped-work', provider: 'github', stage: 'lead-pr', kind: 'not-owner', text: '', author: 'harness' },
            expected: null, research: { eligible: true, reason: 'repeated', at: '2026-11-26T10:06:00.000Z' }, firstObservedAt: '2026-11-26T10:00:00.000Z', lastObservedAt: '2026-11-26T10:05:00.000Z',
        },
        release: { loadedHash: 'b'.repeat(64), status: 'verified', commit: COMMIT, manifestDigest: 'd'.repeat(64), operation: 'deploy-1', activatedAt: '2026-11-26T09:00:00.000Z', reason: null },
        subjects: { total: records.length, open: extra.open ?? records.filter(record => record.status === 'open').length, included },
        repair: null, fixes: { total: 0, recent: [] }, dismissals: { total: 0, recent: [] },
        events: { total: 1, recent: (extra.events ?? ['ev-1']).map(id => ({ id, at: '2026-11-26T10:00:01.000Z', kind: 'subject-observed' as const })) },
    };
    return { ...(JSON.parse(canonical(body)) as typeof body), digest: sha(canonical(body)) };
}

/** The packet with its digest recomputed, so a test can change it and still present a self-consistent packet. */
export function redigest(packet: EvidencePacket): EvidencePacket {
    const { digest: _digest, ...body } = packet;
    return { ...(JSON.parse(canonical(body)) as typeof body), digest: sha(canonical(body)) };
}

export const MANIFEST = [{ path: GUARD_PATH, hash: sha(GUARD) }, { path: 'server/delivery/harness/refusal.ts', hash: 'e'.repeat(64) }];
export const EXAMPLE: RequirementExample = {
    id: 'renamed-branch', clause: rangeOf(DOC_PATH, DOC, 4), facts: [{ name: 'branch', value: 'renamed by rebase' }],
    requirement: rangeOf(DOC_PATH, DOC, 3), episodes: [episodeOf(subjectRecord())],
    scope: 'conditional', condition: 'the job created the branch before the rebase', required: { outcome: 'allow', cause: 'owned-branch' },
};

export function sourcesFor(packet = packetFor(), extra: Partial<OpinionSources> = {}): OpinionSources {
    return {
        packet, manifest: MANIFEST, runtime: [{ path: GUARD_PATH, bytes: GUARD }],
        repository: { commit: COMMIT, files: [
            { path: DOC_PATH, sha256: sha(DOC), bytes: DOC },
            { path: TEST_PATH, sha256: sha(TEST), bytes: TEST },
            { ...OTHER_TARGET, bytes: OTHER_TEST },
        ] },
        examples: [EXAMPLE], guidance: null, ...extra,
    };
}
export function frozen(sources = sourcesFor()): FrozenInput {
    const prepared = prepareOpinionInput(sources);
    if (!prepared.ok) throw new Error(prepared.reason);
    return prepared.input;
}

/** An honest, supported defect verdict about the packet's open subject. */
export function defect(packet: EvidencePacket = packetFor(), extra: Partial<HarnessDefectResult> = {}): HarnessDefectResult {
    const open = packet.subjects.included.filter(entry => entry.status === 'open').map(entry => ({ kind: 'subject' as const, key: entry.subject, stopDigest: entry.digest }));
    const site = rangeOf(GUARD_PATH, GUARD, 2, 4, 3), guard = { path: GUARD_PATH, sha256: sha(GUARD) }, test = { path: TEST_PATH, sha256: sha(TEST) };
    return {
        version: 1, verdict: 'harness-defect', confidence: 'high', references: [...open, { kind: 'event', id: 'ev-1' }],
        causalExplanation: 'The guard compares the branch name, which a rebase changes, instead of who created it.', authorityPrerequisite: null,
        refusalSite: site, invariant: { statement: 'A job may push to the branch it created.', requirement: rangeOf(DOC_PATH, DOC, 3) },
        correction: {
            direction: 'refuse-less', site, editPaths: [guard, test], explanation: 'Compare the creating job, not the current name.',
            case: { episodes: open, trigger: { clause: EXAMPLE.clause, facts: [...EXAMPLE.facts], scope: EXAMPLE.scope, condition: EXAMPLE.condition }, observed: { outcome: 'refuse', cause: 'not-owner' }, required: { outcome: 'allow', cause: 'owned-branch' } },
        },
        affectedFiles: [guard, test], regression: { target: test, description: 'A renamed branch created by the job is accepted.' }, ...extra,
    };
}
export const realBlock = (packet = packetFor()): TriageResult => {
    const open = packet.subjects.included[0];
    return {
        version: 1, verdict: 'real-block', confidence: 'high', references: [{ kind: 'subject', key: open.subject, stopDigest: open.digest }], causalExplanation: 'The branch is another job\'s.',
        authorityPrerequisite: null, invariant: null, correction: null, affectedFiles: [], regression: null,
        stop: { kind: 'subject', key: open.subject, stopDigest: open.digest }, refusalSite: rangeOf(GUARD_PATH, GUARD, 3), rule: rangeOf(DOC_PATH, DOC, 3),
    };
};
export const needsJoe = (packet = packetFor()): TriageResult => ({
    version: 1, verdict: 'needs-joe', confidence: 'medium', references: [{ kind: 'event', id: packet.events.recent[0].id }], causalExplanation: 'Ownership after a rebase is a policy question.',
    authorityPrerequisite: null, invariant: null, correction: null, affectedFiles: [], regression: null, refusalSite: null, question: 'Should a rebased branch stay owned?',
});
export const falsePositive = (packet = packetFor()): TriageResult => ({
    version: 1, verdict: 'false-positive', confidence: 'high', references: [{ kind: 'event', id: packet.events.recent[0].id }], causalExplanation: 'The stop is the guard working as written.',
    authorityPrerequisite: null, invariant: null, correction: null, affectedFiles: [], regression: null, refusalSite: null,
    stops: packet.subjects.included.filter(entry => entry.status === 'open').map(entry => ({ kind: 'subject' as const, key: entry.subject, stopDigest: entry.digest })),
    reason: 'Not a defect.', citation: rangeOf(GUARD_PATH, GUARD, 3),
});
export const staleState = (packet = packetFor()): TriageResult => ({
    version: 1, verdict: 'stale-state', confidence: 'high', references: [{ kind: 'event', id: packet.events.recent[0].id }], causalExplanation: 'The job has since finished.',
    authorityPrerequisite: null, invariant: null, correction: null, affectedFiles: [], regression: null, refusalSite: null,
    change: packet.subjects.included.filter(entry => entry.status === 'open').map(entry => ({ kind: 'subject' as const, key: entry.subject, stopDigest: entry.digest })),
});

/** The Office now, matching the frozen input unless a test changes something. */
export function currentFor(packet = packetFor(), records: IncidentSubjectRecord[] = [subjectRecord()], extra: Partial<CurrentFacts> = {}): CurrentFacts {
    return {
        packet, versions: sourceVersions(MANIFEST), release: { status: 'verified', commit: COMMIT },
        incident: { id: INCIDENT, revision: packet.incident.revision, state: 'observed', research: { eligible: true } },
        detail: { id: INCIDENT, revision: packet.incident.revision, subjects: records },
        selected: { incident: INCIDENT, revision: packet.incident.revision }, ...extra,
    };
}

export const fixtureCost = (session: string) => claudeCost({
    type: 'result', subtype: 'success', is_error: false, session_id: session,
    total_cost_usd: 0.5, modelUsage: { fixture: { costUSD: 0.5, costBasis: 'list' } },
});

/** A read-only invocation seam over test-owned remote and provider state. */
export function syntheticProvider(edit: (answer: ProviderAnswer, call: ProviderCall) => ProviderAnswer = answer => answer) {
    const state = {
        remote: { pull: { number: 7, state: 'open' } },
        provider: { history: ['interactive-1'], models: { claude: 'claude-opus-5-5', codex: 'gpt-6.2-astra' } },
    };
    const remote = {
        readPull: () => state.remote.pull,
        closePull: vi.fn(() => { state.remote.pull.state = 'closed'; }),
    };
    const provider = {
        readModel: (name: Provider) => state.provider.models[name],
        clearHistory: vi.fn(() => { state.provider.history.length = 0; }),
    };
    const calls: ProviderCall[] = [];
    const launches: { provider: Provider; session: string }[] = [];
    const invoke = async (call: ProviderCall) => {
        calls.push(call);
        const session = `session-${calls.length}`;
        launches.push({ provider: call.provider, session });
        call.onSession(session);
        call.activity();
        const output = remote.readPull().state === 'open' ? defect() : staleState();
        return edit({ provider: call.provider, model: provider.readModel(call.provider), session, output, receipt: { evidenceId: session, cost: fixtureCost(session) } }, call);
    };
    return { invoke, calls, launches, state, remote, provider };
}

/** The real ledger at these paths, with this fake provider as the invocation every admitted call is handed. */
export const fixtureBudgeted = (paths: RunnerPaths, invoke: ProviderInvoke, options: LedgerOptions = {}): Budgeted =>
    (call, use) => runBudgeted(paths, call.request, run => use(run, invoke), options);
