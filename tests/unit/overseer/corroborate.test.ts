import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import type { IncidentSubjectRecord } from '../../../src/contracts/incidents';
import type { HarnessDefectResult, TriageResult } from '../../../src/contracts/overseer';
import { canonical } from '../../../server/incidents/canonical-json';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { repairSubject } from '../../../server/incidents/subject-digest';
import { readStanding, type ReservationRow } from '../../../server/overseer/budget-ledger';
import { DAILY_LIMITS, budgetRequest, reservationFor } from '../../../server/overseer/budget-policy';
import { runBudgeted } from '../../../server/overseer/budgeted-run';
import { corroborate, type CorroborationRequest } from '../../../server/overseer/corroborate';
import { collectSecondOpinion } from '../../../server/overseer/stages/second-opinion';
import { collectTriage, type Budgeted, type FrozenInput, type Opinion, type OpinionStage, type Provider, type RequirementExample } from '../../../server/overseer/stages/triage';
import { clock, runnerRoot } from './runner-world';
import {
    DOC, DOC_PATH, EXAMPLE, GUARD, GUARD_PATH, INCIDENT, MANIFEST, OTHER_TARGET, currentFor, defect, episodeOf, falsePositive, fixtureCost, frozen, needsJoe, packetFor, rangeOf, realBlock, redigest, sha, sourcesFor, staleState, subjectRecord, syntheticProvider,
} from './triage-world';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function slot(result: TriageResult, input: FrozenInput, stage: OpinionStage, provider: Provider, reservation: string, round = 1) {
    const session = `${provider}-${reservation}`;
    return { opinion: { status: 'valid' as const, result, envelope: { incident: INCIDENT, stage, round, reservation, provider, model: 'm', session, inputIdentity: input.identity } }, launch: { reservation, provider, session, round } };
}
/** An admitted pair on the last legal calls, unless a case changes something. */
function request(edit: { triage?: TriageResult | null; second?: TriageResult | null; records?: IncidentSubjectRecord[]; open?: number; packet?: ReturnType<typeof packetFor>; examples?: RequirementExample[] } = {}, extra: Partial<CorroborationRequest> = {}): CorroborationRequest {
    const records = edit.records ?? [subjectRecord()], packet = edit.packet ?? packetFor(records, { open: edit.open });
    const input = frozen(sourcesFor(packet, edit.examples ? { examples: edit.examples } : {}));
    const first = edit.triage === undefined ? defect(packet) : edit.triage, second = edit.second === undefined ? defect(packet) : edit.second;
    return {
        input, current: currentFor(packet, records),
        triage: first ? slot(first, input, 'triage', 'claude', 'r-1') : null,
        secondOpinion: second ? slot(second, input, 'second-opinion', 'codex', 'r-2') : null,
        slots: { triageUsed: 2, secondOpinionUsed: 1, admissible: false }, ...extra,
    };
}
const outcome = (value: CorroborationRequest) => corroborate(value).outcome;
const withDefect = (edit: (result: HarnessDefectResult) => void) => { const result = clone(defect()); edit(result); return result; };

test('two independent, current, high-confidence, agreeing and supported defects admit a repair, even on the last legal calls', () => {
    const decided = corroborate(request());
    expect(decided).toMatchObject({ outcome: 'admit-repair', admitted: { reservations: ['r-1', 'r-2'] } });
    expect(decided.admitted?.case).toEqual(defect().correction.case);
    const recurred = request();
    recurred.current.incident.state = 'recurred';
    expect(outcome(recurred)).toBe('admit-repair');
    // Cleared history the packet omits does not block coverage of the open stops.
    const records = [subjectRecord(), subjectRecord({ id: 'GH-9', status: 'cleared', clearedAt: '2026-11-26T09:00:00.000Z' })];
    const packet = packetFor(records);
    const projection = redigest({ ...packet, subjects: { ...packet.subjects, included: packet.subjects.included.slice(0, 1) } });
    expect(projection.subjects).toMatchObject({ total: 2, open: 1 });
    expect(outcome(request({ packet: projection, records }))).toBe('admit-repair');
});

test('runtime source cannot establish the requirement for a defect', () => {
    const result = withDefect(r => { r.invariant.requirement = rangeOf(GUARD_PATH, GUARD, 4); });
    const decided = corroborate(request({ triage: result, second: result }));
    expect(decided.outcome).toBe('needs-joe');
    for (const stage of ['triage', 'second-opinion'])
        expect(decided.reasons).toContain(`${stage}: forged-or-stale: ${GUARD_PATH} is a runtime file, not requirement or test`);
});

test('a cleared stop cannot be cited in common references or in a stale-state change', () => {
    const cleared = subjectRecord({ id: 'GH-9', status: 'cleared', clearedAt: '2026-11-26T09:00:00.000Z' });
    const records = [subjectRecord(), cleared], packet = packetFor(records), reference = episodeOf(cleared);
    const result = defect(packet);
    result.references.push(reference);
    const first = corroborate(request({ records, triage: result }));
    expect(first).toMatchObject({ outcome: 'needs-joe', reasons: expect.arrayContaining([`triage: forged-or-stale: ${reference.key} is not open`]) });
    const stale = { ...staleState(packet), change: [reference] } as TriageResult;
    const second = corroborate(request({ records, triage: staleState(packet), second: stale }));
    expect(second).toMatchObject({ outcome: 'needs-joe', reasons: expect.arrayContaining([`second-opinion: forged-or-stale: ${reference.key} is not open`]) });
});

test('a forged or stale citation makes that opinion count as missing, before its verdict is read', () => {
    const forged: [string, HarnessDefectResult][] = [
        ['impossible end line', withDefect(r => { r.refusalSite = { ...r.refusalSite, endLine: 40, decisiveLine: 3 }; })],
        ['wrong excerpt', withDefect(r => { r.refusalSite = { ...r.refusalSite, excerptSha256: 'a'.repeat(64) }; })],
        ['wrong requirement excerpt', withDefect(r => { r.invariant.requirement = { ...r.invariant.requirement, excerptSha256: 'a'.repeat(64) }; })],
        ['unknown file version', withDefect(r => { r.refusalSite = { ...r.refusalSite, sha256: 'a'.repeat(64) }; })],
        ['file never offered', withDefect(r => { r.refusalSite = { ...r.refusalSite, path: 'server/delivery/harness/elsewhere.ts' }; })],
        ['requirement in a runtime class only test file', withDefect(r => { r.regression.target = { path: GUARD_PATH, sha256: sha(GUARD) }; })],
        ['unknown event', withDefect(r => { r.references = [...r.references, { kind: 'event', id: 'ev-404' }]; })],
        ['later episode under the same key', withDefect(r => { r.correction.case.episodes = [{ ...r.correction.case.episodes[0], stopDigest: 'a'.repeat(64) }]; })],
        ['unknown affected file', withDefect(r => { r.affectedFiles = [...r.affectedFiles, { path: 'server/x.ts', sha256: 'a'.repeat(64) }]; })],
    ];
    for (const [name, result] of forged) {
        const decided = corroborate(request({ triage: result }));
        expect(decided.outcome, name).toBe('needs-joe');
        expect(decided.reasons.join('\n'), name).toContain('triage: forged-or-stale');
    }
    const cleared = subjectRecord({ status: 'cleared', clearedAt: '2026-11-26T10:30:00.000Z' });
    expect(outcome(request({ records: [cleared], triage: defect(packetFor([cleared])), second: defect(packetFor([cleared])) }))).not.toBe('admit-repair');
});

test('a packet, release or runtime file that changed since the input was frozen makes both opinions unusable', () => {
    const changedPacket = request();
    changedPacket.current.packet = packetFor([subjectRecord()], { events: ['ev-1', 'ev-2'] });
    const changedCommit = request();
    changedCommit.current.release = { status: 'verified', commit: 'a'.repeat(40) };
    const changedRuntime = request();
    changedRuntime.current.versions = sourceVersions([{ path: GUARD_PATH, hash: 'a'.repeat(64) }, MANIFEST[1]]);
    const changedManifest = request();
    changedManifest.current.versions = sourceVersions([MANIFEST[0], { ...MANIFEST[1], hash: 'a'.repeat(64) }]);
    const tampered = request();
    const material = JSON.parse(tampered.input.serialized);
    material.packet.incident.revision = 9;
    const serialized = canonical(material);
    tampered.input = { serialized, identity: sha(serialized) };
    for (const [name, value] of [['packet', changedPacket], ['commit', changedCommit], ['runtime', changedRuntime], ['manifest', changedManifest], ['tampered', tampered]] as const) {
        const decided = corroborate(value);
        expect(decided.outcome, name).toBe('needs-joe');
        expect(decided.reasons[0], name).toContain('the common input is unusable');
    }
    expect(corroborate({ ...tampered, slots: { triageUsed: 1, secondOpinionUsed: 0, admissible: true } })).toMatchObject({
        outcome: 'research', next: { stage: 'triage', round: 2 },
        reasons: expect.arrayContaining(['the common input is unusable: the frozen packet does not match its digest']),
    });
    // The blind slot was spent on evidence that has since changed: no further round can use it.
    const spent = request({}, { slots: { triageUsed: 1, secondOpinionUsed: 1, admissible: true } });
    spent.current.packet = changedPacket.current.packet;
    expect(corroborate(spent)).toMatchObject({ outcome: 'needs-joe', reasons: expect.arrayContaining(['the blind opinion is spent on other evidence']) });
});

test('only the selected, eligible incident at its revision is decided', () => {
    const fixing = request();
    fixing.current.incident.state = 'fixing';
    expect(corroborate(fixing)).toMatchObject({ outcome: 'needs-joe', reasons: ['the incident is fixing'] });
    const withdrawn = request();
    withdrawn.current.incident.research = { eligible: false };
    expect(corroborate(withdrawn).reasons[0]).toContain('no longer eligible for research');
    const other = request();
    other.current.selected = { incident: 'inc-0000000000000002', revision: 3 };
    expect(outcome(other)).toBe('needs-joe');
    const moved = request();
    moved.current.selected = { incident: INCIDENT, revision: 4 };
    expect(outcome(moved)).toBe('needs-joe');
    moved.current.incident.revision = 4;
    expect(corroborate(moved)).toEqual({ outcome: 'needs-joe', reasons: ['the incident is not the one selected, at that revision'] });
});

test('protected work and a block either provider affirms are kept', () => {
    expect(outcome(request({ records: [subjectRecord({ expected: 'hold' })] }))).toBe('retain-block');
    expect(outcome(request({ records: [subjectRecord({ unsettledEffect: true })] }))).toBe('retain-block');
    expect(outcome(request({ second: realBlock() }))).toBe('retain-block');
    expect(outcome(request({ triage: realBlock(), second: null }))).toBe('retain-block');
    const forgedBlock = { ...realBlock(), rule: { ...rangeOf(DOC_PATH, DOC, 3), excerptSha256: 'a'.repeat(64) } } as TriageResult;
    expect(outcome(request({ triage: forgedBlock, second: null }))).toBe('needs-joe');
});

test('a prerequisite, low confidence, no-op, unsupported requirement or missing stop never admits', () => {
    const cases: [string, Parameters<typeof request>[0]][] = [
        ['prerequisite', { second: withDefect(r => { r.authorityPrerequisite = 'Joe must approve guard changes to write ownership'; }) }],
        ['low confidence', { triage: withDefect(r => { r.confidence = 'medium'; }) }],
        ['no-op', { triage: withDefect(r => { r.correction.case.required = { outcome: 'refuse', cause: 'not-owner' }; r.correction.direction = 'refuse-differently'; }), second: withDefect(r => { r.correction.case.required = { outcome: 'refuse', cause: 'not-owner' }; r.correction.direction = 'refuse-differently'; }) }],
        ['requirement is the refusal', { triage: withDefect(r => { r.invariant.requirement = r.refusalSite; }), second: withDefect(r => { r.invariant.requirement = r.refusalSite; }) }],
        ['unsupported clause', { triage: withDefect(r => { r.correction.case.trigger.clause = rangeOf(DOC_PATH, DOC, 3); }), second: withDefect(r => { r.correction.case.trigger.clause = rangeOf(DOC_PATH, DOC, 3); }) }],
        ['omitted open subject', { open: 2 }],
    ];
    for (const [name, edit] of cases) expect(outcome(request(edit)), name).toBe('needs-joe');
});

test('two valid defects with the same affected files disagree on different frozen regression targets', () => {
    const first = withDefect(result => { result.affectedFiles.push(OTHER_TARGET); });
    const second = clone(first);
    second.regression.target = OTHER_TARGET;
    expect(corroborate(request({ triage: first, second }))).toEqual({
        outcome: 'needs-joe', reasons: ['the opinions differ on regression-target', 'no further call can be admitted'],
    });
});

test('only two independent calls to opposite providers, exactly as launched, are a pair', () => {
    const same = request();
    same.secondOpinion!.launch.provider = 'claude';
    same.secondOpinion!.opinion.envelope.provider = 'claude';
    expect(corroborate(same).reasons).toContain('the two opinions are not independent calls to opposite providers');
    const copied = request();
    copied.secondOpinion = { ...copied.triage!, launch: { ...copied.triage!.launch } };
    expect(outcome(copied)).toBe('needs-joe');
    const swapped = request();
    swapped.triage!.launch = { ...swapped.secondOpinion!.launch };
    expect(corroborate(swapped).reasons.join('\n')).toContain('triage: the opinion is not the call the harness launched');
    const invalid = request();
    invalid.secondOpinion!.opinion = { status: 'invalid', reason: 'not a valid verdict', envelope: invalid.secondOpinion!.opinion.envelope };
    expect(outcome(invalid)).toBe('needs-joe');
});

test('a retry that may hide a protected wait needs detail bound to this incident, revision and stop', () => {
    const multi = (extra: Partial<IncidentSubjectRecord> = {}) => subjectRecord({ expected: 'retry', sources: ['stopped-work', 'worker-failure'], ...extra });
    const clear = multi({ contributions: { 'stopped-work': { unsettledEffect: false, expected: 'retry' }, 'worker-failure': { unsettledEffect: false, expected: null } } });
    expect(outcome(request({ records: [clear] }))).toBe('admit-repair');
    const masked = multi({ contributions: { 'stopped-work': { unsettledEffect: false, expected: 'retry' }, 'worker-failure': { unsettledEffect: false, expected: 'authentication' } } });
    expect(outcome(request({ records: [masked] }))).toBe('needs-joe');
    // No detail for this subject at all.
    const absent = request({ records: [clear] });
    absent.current.detail = undefined;
    expect(outcome(absent)).toBe('needs-joe');
    // The detail's subject matches but its stop does not: only `stop.at` differs.
    const otherStop = request({ records: [clear] });
    const movedStop = { ...clear, stop: { kind: 'not-owner', at: '2026-11-26T11:00:00.000Z' } };
    expect(repairSubject(movedStop).subject).toBe(repairSubject(clear).subject);
    expect(repairSubject(movedStop).digest).not.toBe(repairSubject(clear).digest);
    otherStop.current.detail!.subjects = [movedStop];
    const decided = corroborate(otherStop);
    expect(decided.outcome).toBe('needs-joe');
    expect(decided.reasons.join('\n')).toContain('cannot be bound to this stop');
    // Only the independently obtained detail revision changes.
    const otherRevision = request({ records: [clear] });
    otherRevision.current.detail!.revision = 4;
    expect(corroborate(otherRevision)).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining([expect.stringMatching(/^authority is unresolved: .*not from the selected incident at the packet's revision$/)]),
    });
    // An earlier aggregate is carried: even complete clear contributions leave that source's own wait unknown.
    expect(outcome(request({ records: [{ ...clear, carried: { unsettledEffect: false, expected: 'retry', sources: ['stopped-work'] } }] }))).toBe('needs-joe');
    const partial = multi({ contributions: { 'stopped-work': { unsettledEffect: false, expected: 'retry' } } });
    expect(corroborate(request({ records: [partial] })).reasons.join('\n')).toContain("not every source's own wait is known");
    const missingSource = request({ records: [clear] });
    const incomplete = { ...partial, sources: ['stopped-work'] as const };
    const incompleteRecord = { ...incomplete, sources: [...incomplete.sources] };
    expect(repairSubject(incompleteRecord)).toEqual(repairSubject(clear));
    missingSource.current.detail!.subjects = [incompleteRecord];
    expect(corroborate(missingSource)).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining([expect.stringMatching(/^authority is unresolved: .*not every source's own wait is known$/)]),
    });
});

test('missing open coverage or a masked wait keeps the blind slot available', () => {
    const slots = { triageUsed: 1, secondOpinionUsed: 0, admissible: true };
    const masked = subjectRecord({
        expected: 'retry', sources: ['stopped-work', 'worker-failure'],
        contributions: { 'stopped-work': { unsettledEffect: false, expected: 'retry' }, 'worker-failure': { unsettledEffect: false, expected: 'authentication' } },
    });
    expect(corroborate(request({ open: 2, second: null }, { slots }))).toMatchObject({ outcome: 'research', next: { stage: 'triage', round: 2 } });
    expect(corroborate(request({ records: [masked], second: null }, { slots }))).toMatchObject({
        outcome: 'research', next: { stage: 'triage', round: 2 },
        reasons: expect.arrayContaining([expect.stringContaining('worker-failure reports a protected wait')]),
    });
});

test.each([
    [defect, 'admit-repair', 'two independent opinions agree on a supported correction'],
    [realBlock, 'retain-block', 'a valid opinion affirms the refusal'],
    [falsePositive, 'false-positive', 'both opinions agree on that proposal and its basis'],
    [staleState, 'stale-state', 'both opinions agree on that proposal and its basis'],
    [needsJoe, 'needs-joe', 'both opinions ask for Joe'],
] as const)('%s applies the verdict in either slot with a valid, forged or missing peer', (make, pairedOutcome, pairedReason) => {
    const valid = make();
    const forged = { ...make(), references: [...valid.references, { kind: 'event' as const, id: 'ev-404' }] };
    const loneOutcome = valid.verdict === 'real-block' ? 'retain-block' : 'needs-joe';
    const loneReason = valid.verdict === 'real-block' ? pairedReason : 'no further call can be admitted';
    for (const reverse of [false, true]) {
        const decide = (peer: TriageResult | null) => corroborate(request(reverse ? { triage: peer, second: valid } : { triage: valid, second: peer }));
        expect(decide(make())).toMatchObject({ outcome: pairedOutcome, reasons: [pairedReason] });
        expect(decide(forged)).toMatchObject({
            outcome: loneOutcome, reasons: [`${reverse ? 'triage' : 'second-opinion'}: forged-or-stale: event ev-404 is not in the packet`, loneReason],
        });
        expect(decide(null)).toMatchObject({ outcome: loneOutcome, reasons: [loneReason] });
    }
});

test('an inconclusive pair gets another triage round only while the budget and slots allow it', () => {
    expect(outcome(request({ triage: staleState(), second: falsePositive() }))).toBe('needs-joe');
    const open = { triageUsed: 1, secondOpinionUsed: 0, admissible: true };
    expect(corroborate(request({ second: null }, { slots: open }))).toMatchObject({ outcome: 'research', next: { stage: 'second-opinion', round: 1 } });
    expect(corroborate(request({ second: withDefect(r => { r.correction.direction = 'refuse-differently'; }) }, { slots: { triageUsed: 1, secondOpinionUsed: 1, admissible: true } })))
        .toMatchObject({ outcome: 'research', next: { stage: 'triage', round: 2 } });
    expect(outcome(request({ second: withDefect(r => { r.correction.direction = 'refuse-differently'; }) }))).toBe('needs-joe');
    expect(corroborate(request({ second: null }, { slots: { ...open, admissible: null } }))).toMatchObject({ outcome: 'needs-joe', reasons: expect.arrayContaining(['budget facts are unavailable']) });
});

test.each(['valid', 'invalid'] as const)('cross-day triage uses the only blind slot and receives a %s verdict', async blindStatus => {
    const paths = runnerRoot();
    const { now, advance } = clock('2026-11-27T04:55:00.000Z');
    const packet = packetFor(), input = frozen(sourcesFor(packet)), current = currentFor(packet);
    const budgeted: Budgeted = (request, invoke) => runBudgeted(paths, request, invoke, { now });
    const fake = syntheticProvider(answer => answer.session === 'session-1' || (answer.provider === 'codex' && blindStatus === 'invalid')
        ? { ...answer, output: { verdict: 'unknown' } } : answer);

    const research = await runBudgeted(paths, budgetRequest(INCIDENT, 'research', 1), async run => {
        run.bindSession('research-1');
        return { evidenceId: 'research-1', cost: fixtureCost('research-1') };
    }, { now });
    expect(research.status).toBe('completed');
    const first = await collectTriage({ budgeted, input, invoke: fake.invoke, provider: 'claude', round: 1 });
    expect(first.status).toBe('invalid');

    const rows = () => {
        const db = new DatabaseSync(paths.budgetDb, { readOnly: true });
        try {
            return db.prepare('SELECT * FROM reservations WHERE incident = ? ORDER BY rowid').all(INCIDENT) as unknown as ReservationRow[];
        } finally {
            db.close();
        }
    };
    const decide = (triage: Opinion, round: number, blind?: Opinion) => {
        const reservations = rows();
        const readSlot = (opinion: Opinion, stage: OpinionStage, round: number) => {
            const row = reservations.find(entry => entry.stage === stage && entry.round === round);
            const launch = fake.launches.find(launch => launch.session === row?.evidence_id);
            if (!row || !launch) throw new Error(`Missing recorded launch for ${stage} round ${round}`);
            return { opinion, launch: { ...launch, reservation: row.id, round: row.round } };
        };
        const daily = readStanding(paths, now());
        return corroborate({
            input, current, triage: readSlot(triage, 'triage', round),
            secondOpinion: blind ? readSlot(blind, 'second-opinion', 1) : null,
            slots: {
                triageUsed: reservations.filter(row => row.stage === 'triage').length,
                secondOpinionUsed: reservations.filter(row => row.stage === 'second-opinion').length,
                admissible: 'standing' in daily
                    ? daily.standing.runs.used < DAILY_LIMITS.modelRuns && daily.standing.available >= reservationFor('triage')
                    : null,
            },
        });
    };

    expect(readStanding(paths, now())).toMatchObject({ standing: { day: '2026-11-26', runs: { used: 2 } } });
    expect(rows().map(({ stage, round }) => [stage, round])).toEqual([['research', 1], ['triage', 1]]);
    expect(new Set(rows().map(row => row.id)).size).toBe(2);
    advance(10 * 60_000);
    expect(readStanding(paths, now())).toMatchObject({ standing: { day: '2026-11-27', runs: { used: 0 } } });
    const retry = decide(first, 1);
    expect(retry).toMatchObject({ outcome: 'research', next: { stage: 'triage', round: 2 } });
    const round2 = await collectTriage({ budgeted, input, invoke: fake.invoke, provider: 'claude', round: retry.next!.round });
    expect(round2.status).toBe('valid');
    const asked = decide(round2, 2);
    expect(asked).toMatchObject({ outcome: 'research', next: { stage: 'second-opinion', round: 1 } });
    const blindRequest = { budgeted, input, invoke: fake.invoke, first: { provider: round2.envelope.provider, inputIdentity: round2.envelope.inputIdentity } };
    const blind = await collectSecondOpinion(blindRequest);
    expect(blind.status).toBe(blindStatus);
    const [researchRow, firstRow, secondRow, blindRow] = rows();
    expect([researchRow, firstRow, secondRow, blindRow].map(row => [row.stage, row.round, row.day, row.evidence_id])).toEqual([
        ['research', 1, '2026-11-26', 'research-1'], ['triage', 1, '2026-11-26', 'session-1'],
        ['triage', 2, '2026-11-27', 'session-2'], ['second-opinion', 1, '2026-11-27', 'session-3'],
    ]);
    const final = decide(round2, 2, blind);
    if (blindStatus === 'valid') {
        expect(final).toMatchObject({ outcome: 'admit-repair', admitted: { reservations: [secondRow.id, blindRow.id] } });
    } else {
        expect(final).toMatchObject({
            outcome: 'needs-joe', reasons: [expect.stringContaining('second-opinion: invalid'), 'the triage rounds are spent'],
        });
    }
    expect(final.next).toBeUndefined();
    expect(await collectSecondOpinion(blindRequest)).toMatchObject({ status: 'unavailable', reason: 'admission refused: stage-repeated' });
    expect(fake.calls.map(call => call.provider)).toEqual(['claude', 'claude', 'codex']);
    expect(readStanding(paths, now())).toMatchObject({ standing: { day: '2026-11-27', runs: { used: 2 } } });
});

test('examples added after preparation cannot support opinions on the original input', () => {
    const examples: RequirementExample[] = [];
    const base = request({ examples });
    examples.push(EXAMPLE);
    expect(corroborate(base)).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining(['the trigger cites no frozen requirement example']),
    });
    const supported = request({ examples });
    expect(corroborate(supported).outcome).toBe('admit-repair');
    expect(corroborate({ ...base, input: { ...base.input, serialized: supported.input.serialized } })).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining(['the common input is unusable: the frozen evidence does not match its identity']),
    });
});

test('a frozen requirement must establish the condition for each covered stop', () => {
    const second = subjectRecord({ id: 'GH-8' });
    const records = [subjectRecord(), second];
    expect(corroborate(request({ records }))).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining([`${episodeOf(second).key}: the trigger condition is unproven for this stop`]),
    });
    const examples = [EXAMPLE, { ...EXAMPLE, id: 'second-stop', episodes: [episodeOf(second)] }];
    expect(outcome(request({ records, examples }))).toBe('admit-repair');

    const heading = withDefect(result => { result.invariant.requirement = rangeOf(DOC_PATH, DOC, 1); });
    expect(corroborate(request({ triage: heading, second: heading }))).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining([expect.stringContaining('the cited invariant does not match a supporting requirement')]),
    });
});

test('examples sharing a clause are matched by condition and conflicting dispositions fail in either order', () => {
    const different: RequirementExample = {
        ...EXAMPLE, id: 'foreign-branch', facts: [{ name: 'branch', value: 'renamed by another job' }],
        required: { outcome: 'refuse', cause: 'not-owner' },
    };
    const conflict = { ...different, facts: EXAMPLE.facts };
    for (const examples of [[EXAMPLE, different], [different, EXAMPLE]]) {
        expect(outcome(request({ examples }))).toBe('admit-repair');
    }
    for (const examples of [[EXAMPLE, conflict], [conflict, EXAMPLE]]) {
        expect(corroborate(request({ examples }))).toMatchObject({
            outcome: 'needs-joe', reasons: expect.arrayContaining([expect.stringContaining('the examples require conflicting dispositions')]),
        });
    }
});

test('a fact with an equals sign cannot stand in for a different frozen fact', () => {
    const facts = [{ name: 'a=b', value: 'c' }, { name: 'unrelated', value: 'unchanged' }];
    const examples = [{ ...EXAMPLE, facts }];
    const matching = withDefect(result => { result.correction.case.trigger.facts = [...facts].reverse(); });
    const different = withDefect(result => { result.correction.case.trigger.facts = [{ name: 'a', value: 'b=c' }, facts[1]]; });
    expect(outcome(request({ triage: matching, second: matching, examples }))).toBe('admit-repair');
    expect(corroborate(request({ triage: different, second: different, examples }))).toMatchObject({
        outcome: 'needs-joe', reasons: expect.arrayContaining(["the trigger is not the example's condition"]),
    });
});

test('a correction is supported only by its frozen example, the covered stops and a real change', () => {
    const both = (edit: (result: HarnessDefectResult) => void) => ({ triage: withDefect(edit), second: withDefect(edit) });
    const cases: [string, Parameters<typeof request>[0], string][] = [
        ['facts', both(r => { r.correction.case.trigger.facts = [{ name: 'branch', value: 'renamed by hand' }]; }), "the trigger is not the example's condition"],
        ['required', both(r => { r.correction.case.required = { outcome: 'allow', cause: 'maintainer-override' }; }), "the required disposition is not the example's"],
        ['observed', both(r => { r.correction.case.observed = { outcome: 'refuse', cause: 'protected-branch' }; }), 'the observed refusal is not that stop'],
    ];
    for (const [name, edit, reason] of cases) {
        const decided = corroborate(request(edit));
        expect(decided.outcome, name).toBe('needs-joe');
        expect(decided.reasons.join('\n'), name).toContain(reason);
    }
    // An example that requires the same refusal: a correction to it changes nothing.
    const keeps: RequirementExample = { ...EXAMPLE, required: { outcome: 'refuse', cause: 'not-owner' } };
    const noOp = both(r => { r.correction.case.required = { outcome: 'refuse', cause: 'not-owner' }; r.correction.direction = 'refuse-differently'; });
    expect(corroborate(request({ ...noOp, examples: [keeps] })).reasons).toContain('the correction keeps the incorrect refusal');
});

test('an authority prerequisite is reported, and two requests for Joe go to Joe even with rounds left', () => {
    const vetoed = corroborate(request({ second: withDefect(r => { r.authorityPrerequisite = 'Joe must approve guard changes to write ownership'; }) }));
    expect(vetoed.reasons).toContain('an unresolved authority prerequisite: Joe must approve guard changes to write ownership');
    expect(corroborate(request({ triage: needsJoe(), second: needsJoe() }, { slots: { triageUsed: 1, secondOpinionUsed: 1, admissible: true } })))
        .toMatchObject({ outcome: 'needs-joe', reasons: ['both opinions ask for Joe'] });
});

test('the selection, the detail incident and the frozen packet must all name the same incident', () => {
    const OTHER = 'inc-0000000000000002';
    // No selection at all.
    const none = request();
    none.current.selected = null;
    expect(corroborate(none)).toMatchObject({ outcome: 'needs-joe', reasons: ['the incident is not the one selected, at that revision'] });
    // The detail is another incident's, though the selection and the packet agree.
    const otherDetail = request();
    otherDetail.current.incident.id = OTHER;
    expect(corroborate(otherDetail)).toMatchObject({ outcome: 'needs-joe', reasons: ['the incident is not the one selected, at that revision'] });
    // The selection and its detail agree on another incident than the one the input was frozen for.
    const otherPacket = request();
    otherPacket.current.incident.id = OTHER;
    otherPacket.current.selected = { incident: OTHER, revision: otherPacket.current.selected!.revision };
    expect(corroborate(otherPacket)).toMatchObject({ outcome: 'needs-joe', reasons: ['the incident is not the one selected, at that revision'] });
});
