import type { EvidencePacket, ExpectedWait, Incident, IncidentState } from '../../src/contracts/incidents';
import type { CorrectionCase, FileReference, HarnessDefectResult, SourceRange, SubjectReference, TriageResult } from '../../src/contracts/overseer';
import { citationFault, resolveRange, type SourceVersions } from '../incidents/cited-sources';
import { repairSubject } from '../incidents/subject-digest';
import { agreement, anchor, factsKey } from './agreement';
import { ROUND_LIMITS } from './budget-policy';
import { packetDigest, readOpinionInput, type CheckedOpinionInput, type FrozenInput, type Opinion, type Provider, type SourceClass } from './stages/triage';

/**
 * Turns at most two opinions on one frozen input into one proposal, by six rules in order. A repair
 * is admitted only for two independent, current, high-confidence harness-defect verdicts that agree on
 * a supported correction. Either valid real-block keeps the block. Anything else is bounded research or
 * a question for Joe. Every outcome is a proposal: nothing here changes the Office.
 */

export type CorroborationOutcome = 'admit-repair' | 'retain-block' | 'stale-state' | 'false-positive' | 'research' | 'needs-joe';
export interface Corroboration {
    outcome: CorroborationOutcome;
    reasons: string[];
    /** For `research`: the call that could settle it. */
    next?: { stage: 'triage' | 'second-opinion'; round: number };
    /** For `admit-repair`: the agreed case and what it rests on. */
    admitted?: { case: CorrectionCase; inputIdentity: string; reservations: [string, string] };
}

/** The Office as it stands now, read independently of the frozen input. */
export interface CurrentFacts {
    packet: EvidencePacket;
    versions: SourceVersions;
    release: { status: 'verified' | 'unknown'; commit: string | null };
    incident: { id: string; revision: number; state: IncidentState; research: { eligible: boolean } };
    /** Per-source detail from an independently read incident snapshot. */
    detail?: Pick<Incident, 'id' | 'revision' | 'subjects'>;
    /** What `selectIncident` keeps in flight. */
    selected: { incident: string; revision: number } | null;
}
/** What the harness launched for a slot: never taken from the opinion itself. */
export interface LaunchFacts { reservation: string; provider: Provider; session: string; round: number }
/** From the ledger: the stage slots this incident has used, and whether another call could be admitted at all. */
export interface SlotFacts { triageUsed: number; secondOpinionUsed: number; admissible: boolean | null }

export interface CorroborationRequest {
    input: FrozenInput;
    current: CurrentFacts;
    triage: { opinion: Opinion; launch: LaunchFacts } | null;
    secondOpinion: { opinion: Opinion; launch: LaunchFacts } | null;
    slots: SlotFacts;
}

const SELECTABLE: readonly IncidentState[] = ['observed', 'triaged', 'recurred'];
/** Waits that protect work: no repair may run over one. */
const PROTECTED: readonly ExpectedWait[] = ['hold', 'decision', 'merge-approval', 'prerequisite', 'pause', 'authentication', 'question', 'uncertain-effect'];
/** Displayed waits a protected wait from another source may hide behind. */
const MASKING: readonly ExpectedWait[] = ['retry', 'provider-wait'];

type Included = EvidencePacket['subjects']['included'][number];
const subjectId = (reference: SubjectReference) => `${reference.key}@${reference.stopDigest}`;

/** Why the frozen input no longer describes the Office, or null when it still does. */
function releaseFault(input: CheckedOpinionInput, current: CurrentFacts): string | null {
    if (current.release.status !== 'verified' || current.release.commit !== input.commit) return 'the running release is not the one the input was frozen from';
    for (const { path, hash } of input.manifest) {
        const fault = citationFault({ path, sha256: hash }, current.versions);
        if (fault) return fault;
    }
    return current.versions.size === input.manifest.length ? null : 'the running release has a different source inventory';
}

/** Why one opinion cannot be used, or null: its launch, its references and every citation are checked before its verdict is read. */
function opinionFault(slot: { opinion: Opinion; launch: LaunchFacts }, stage: 'triage' | 'second-opinion', input: CheckedOpinionInput): string | null {
    const { opinion, launch } = slot, { envelope } = opinion;
    if (opinion.status !== 'valid') return `${stage}: ${opinion.status}: ${opinion.reason}`;
    if (envelope.stage !== stage || envelope.incident !== input.packet.incident.id || envelope.round !== launch.round || envelope.reservation !== launch.reservation
        || envelope.session !== launch.session || envelope.provider !== launch.provider || envelope.inputIdentity !== input.identity)
        return `${stage}: the opinion is not the call the harness launched`;
    const fault = evidenceFault(opinion.result, input);
    return fault ? `${stage}: forged-or-stale: ${fault}` : null;
}

function evidenceFault(result: TriageResult, input: CheckedOpinionInput): string | null {
    const included = new Map(input.packet.subjects.included.map(entry => [entry.subject, entry]));
    const events = new Set(input.packet.events.recent.map(event => event.id));
    const subject = (reference: SubjectReference) => {
        const entry = included.get(reference.key);
        if (!entry || entry.digest !== reference.stopDigest) return `${reference.key} at that stop is not in the packet`;
        return entry.status !== 'open' ? `${reference.key} is not open` : null;
    };
    for (const reference of result.references) {
        const fault = reference.kind === 'subject' ? subject(reference) : events.has(reference.id) ? null : `event ${reference.id} is not in the packet`;
        if (fault) return fault;
    }
    const source = (reference: FileReference, classes: readonly SourceClass[]) => {
        const frozen = input.sources.get(reference.path);
        if (!frozen || frozen.sha256 !== reference.sha256) return `${reference.path} at ${reference.sha256.slice(0, 12)} is not a frozen source`;
        // Whether a runtime file still is what the release runs is checked against the entire frozen manifest in `releaseFault`.
        return classes.includes(frozen.class) ? null : `${reference.path} is a ${frozen.class} file, not ${classes.join(' or ')}`;
    };
    const range = (claimed: SourceRange, classes: readonly SourceClass[]) => {
        const fault = source(claimed, classes);
        if (fault) return fault;
        const resolved = resolveRange(Buffer.from(input.sources.get(claimed.path)!.bytes, 'base64'), claimed.sha256, claimed);
        return resolved.ok ? null : `${claimed.path}: ${resolved.reason}`;
    };
    const all = ['runtime', 'requirement', 'test'] as const;
    const checks: (string | null)[] = [];
    switch (result.verdict) {
        case 'harness-defect':
            checks.push(range(result.refusalSite, ['runtime']), range(result.invariant.requirement, ['requirement', 'test']), range(result.correction.site, ['runtime']),
                range(result.correction.case.trigger.clause, ['requirement', 'test']), source(result.regression.target, ['test']),
                ...result.correction.editPaths.map(file => source(file, ['runtime', 'test'])), ...result.affectedFiles.map(file => source(file, all)),
                ...result.correction.case.episodes.map(subject));
            break;
        case 'real-block':
            checks.push(subject(result.stop), range(result.refusalSite, ['runtime']), range(result.rule, all));
            break;
        case 'false-positive':
            checks.push(range(result.citation, ['runtime']), ...result.stops.map(subject));
            break;
        case 'stale-state':
            checks.push(...result.change.map(reference => reference.kind === 'subject' ? subject(reference) : events.has(reference.id) ? null : `event ${reference.id} is not in the packet`));
            break;
        case 'needs-joe':
            break;
    }
    return checks.find(fault => fault !== null) ?? null;
}

/** The open subjects a proposal must cover: all of them, and the packet must include them all. */
function coverageFault(covered: readonly SubjectReference[], packet: EvidencePacket): string | null {
    const open = packet.subjects.included.filter(entry => entry.status === 'open');
    if (!open.length) return 'the packet has no open subject to cover';
    if (open.length !== packet.subjects.open) return `the packet includes ${open.length} of ${packet.subjects.open} open subjects`;
    const want = new Set(open.map(entry => `${entry.subject}@${entry.digest}`)), have = new Set(covered.map(subjectId));
    return want.size === have.size && [...want].every(id => have.has(id)) ? null : 'the proposal does not cover exactly the open subjects';
}

/** Why a multi-source open subject showing only a retry may hide a protected wait, or null once its sources clear it. */
function maskedWait(entry: Included, detail: CurrentFacts['detail'], packet: EvidencePacket): string | null {
    if (entry.status !== 'open' || entry.sources.length < 2 || !entry.expected || !MASKING.includes(entry.expected)) return null;
    // Rule 1 has already bound the packet to the selection.
    if (!detail || detail.id !== packet.incident.id || detail.revision !== packet.incident.revision)
        return `${entry.subject}: the per-source detail is not from the selected incident at the packet's revision`;
    const record = detail.subjects.find(candidate => {
        const { subject, digest } = repairSubject(candidate);
        return subject === entry.subject && digest === entry.digest;
    });
    if (!record) return `${entry.subject}: its per-source detail cannot be bound to this stop`;
    if (record.carried) return `${entry.subject}: an earlier aggregate is carried, so a source's own wait is unknown`;
    const contributions = record.contributions;
    if (!contributions || ![...entry.sources, ...record.sources].every(source => contributions[source])) return `${entry.subject}: not every source's own wait is known`;
    for (const [source, contribution] of Object.entries(contributions))
        if (contribution && (contribution.unsettledEffect || (contribution.expected && PROTECTED.includes(contribution.expected)))) return `${entry.subject}: ${source} reports a protected wait`;
    return null;
}

/** Why a defect's correction is not supported by the frozen examples and the covered stops, or null. */
function supportFault(result: HarnessDefectResult, input: CheckedOpinionInput): string | null {
    const { case: correction, direction } = result.correction, { trigger, observed, required } = correction;
    const clause = anchor(trigger.clause);
    const examples = input.examples.filter(example => anchor(example.clause) === clause);
    if (!examples.length) return 'the trigger cites no frozen requirement example';
    const facts = factsKey(trigger.facts);
    const matching = examples.filter(example => example.scope === trigger.scope && example.condition === trigger.condition && factsKey(example.facts) === facts);
    if (!matching.length) return "the trigger is not the example's condition";

    const requirement = anchor(result.invariant.requirement);
    const included = new Map(input.packet.subjects.included.map(entry => [entry.subject, entry]));
    for (const episode of correction.episodes) {
        const stop = included.get(episode.key)?.stop;
        if (observed.outcome !== 'refuse' || !stop || stop.kind !== observed.cause) return `${episode.key}: the observed refusal is not that stop`;
        const applicable = matching.filter(example => example.episodes.some(bound => bound.key === episode.key && bound.stopDigest === episode.stopDigest));
        if (!applicable.length) return `${episode.key}: the trigger condition is unproven for this stop`;
        const expected = applicable[0].required;
        if (applicable.some(example => example.required.outcome !== expected.outcome || example.required.cause !== expected.cause))
            return `${episode.key}: the examples require conflicting dispositions for this stop`;
        if (!applicable.some(example => anchor(example.requirement) === requirement))
            return `${episode.key}: the cited invariant does not match a supporting requirement`;
        if (expected.outcome !== required.outcome || expected.cause !== required.cause) return "the required disposition is not the example's";
    }
    const expected = required.outcome === 'allow' ? 'refuse-less' : required.cause === observed.cause ? null : 'refuse-differently';
    if (expected === null) return 'the correction keeps the incorrect refusal';
    return direction === expected ? null : `the direction is ${direction}, but the case is ${expected}`;
}

export function corroborate({ input: frozen, current, triage, secondOpinion, slots }: CorroborationRequest): Corroboration {
    const reasons: string[] = [];
    // 1. Only the incident in flight, and only while its input still describes the Office.
    const { incident, selected } = current;
    const selectionMismatch = { outcome: 'needs-joe' as const, reasons: ['the incident is not the one selected, at that revision'] };
    if (!selected || incident.id !== selected.incident || incident.revision !== selected.revision) return selectionMismatch;
    if (!SELECTABLE.includes(incident.state) || !incident.research.eligible)
        return { outcome: 'needs-joe', reasons: [`the incident is ${incident.state}${incident.research.eligible ? '' : ', and no longer eligible for research'}`] };
    const checked = readOpinionInput(frozen);
    if (!checked.ok) return fallback([`the common input is unusable: ${checked.reason}`], slots);
    const { input } = checked;
    if (input.packet.incident.id !== selected.incident) return selectionMismatch;
    if (current.packet.digest !== input.packet.digest || packetDigest(current.packet) !== current.packet.digest)
        return fallback(['the common input is unusable: the incident packet has changed since the input was frozen'], slots);
    if (input.packet.incident.revision !== selected.revision) return selectionMismatch;
    const stale = releaseFault(input, current);
    if (stale) return fallback([`the common input is unusable: ${stale}`], slots);
    // 2. Each slot is the call the harness launched, with evidence that checks out; otherwise it counts as missing.
    let first: TriageResult | null = null, blind: TriageResult | null = null;
    if (triage) { const fault = opinionFault(triage, 'triage', input); if (fault) reasons.push(fault); else first = (triage.opinion as Extract<Opinion, { status: 'valid' }>).result; }
    if (secondOpinion) { const fault = opinionFault(secondOpinion, 'second-opinion', input); if (fault) reasons.push(fault); else blind = (secondOpinion.opinion as Extract<Opinion, { status: 'valid' }>).result; }
    if (first && blind && (triage!.launch.reservation === secondOpinion!.launch.reservation || triage!.launch.provider === secondOpinion!.launch.provider)) {
        reasons.push('the two opinions are not independent calls to opposite providers');
        blind = null;
    }
    const valid = [first, blind].filter((result): result is TriageResult => result !== null);
    // 3. Protected work stays protected; a block either provider affirms is kept.
    const guarded = input.packet.subjects.included.find(entry => entry.status === 'open' && (entry.unsettledEffect || (entry.expected && PROTECTED.includes(entry.expected))));
    if (guarded) return { outcome: 'retain-block', reasons: [...reasons, `${guarded.subject} is ${guarded.unsettledEffect ? 'waiting on an unsettled effect' : `in a ${guarded.expected} wait`}`] };
    if (valid.some(result => result.verdict === 'real-block')) return { outcome: 'retain-block', reasons: [...reasons, 'a valid opinion affirms the refusal'] };
    const pair = first && blind ? agreement(first, blind) : null;
    // 4. Authority first, then the proposals two agreeing opinions can make.
    const veto = valid.find(result => result.authorityPrerequisite !== null);
    if (veto) reasons.push(`an unresolved authority prerequisite: ${veto.authorityPrerequisite}`);
    if (first && blind && first.verdict === 'needs-joe' && blind.verdict === 'needs-joe') return { outcome: 'needs-joe', reasons: [...reasons, 'both opinions ask for Joe'] };
    if (first && blind && pair?.agree && (first.verdict === 'stale-state' || first.verdict === 'false-positive')) {
        const covered = first.verdict === 'false-positive' ? first.stops : first.change.filter((reference): reference is SubjectReference => reference.kind === 'subject');
        const fault = coverageFault(covered, input.packet);
        if (!fault) return { outcome: first.verdict, reasons: [...reasons, 'both opinions agree on that proposal and its basis'] };
        reasons.push(fault);
    }
    // 5. A repair: no masked wait, two agreeing supported defects, every open stop covered.
    const masked = input.packet.subjects.included.map(entry => maskedWait(entry, current.detail, input.packet)).find(fault => fault !== null);
    if (masked) reasons.push(`authority is unresolved: ${masked}`);
    else if (first && blind && first.verdict === 'harness-defect' && blind.verdict === 'harness-defect' && !veto) {
        const faults = [
            first.confidence !== 'high' || blind.confidence !== 'high' ? 'both opinions must be high confidence' : null,
            pair?.agree ? null : `the opinions differ on ${pair?.differences.join(', ')}`,
            supportFault(first, input), supportFault(blind, input),
            coverageFault(first.correction.case.episodes, input.packet),
        ].filter((fault): fault is string => fault !== null);
        if (!faults.length) return { outcome: 'admit-repair', reasons: ['two independent opinions agree on a supported correction'], admitted: { case: first.correction.case, inputIdentity: input.identity, reservations: [triage!.launch.reservation, secondOpinion!.launch.reservation] } };
        reasons.push(...faults);
    }
    // 6. Spend the blind slot only if the triage passes every gate it can meet alone.
    const needsBlind = !secondOpinion && !masked && first?.verdict === 'harness-defect' && first.confidence === 'high' && !veto
        && !supportFault(first, input) && !coverageFault(first.correction.case.episodes, input.packet);
    return fallback(reasons, slots, needsBlind, blind !== null);
}

function fallback(reasons: string[], slots: SlotFacts, needsBlind = false, hasValidBlind = false): Corroboration {
    if (slots.admissible !== true) return { outcome: 'needs-joe', reasons: [...reasons, slots.admissible === null ? 'budget facts are unavailable' : 'no further call can be admitted'] };
    const blindOpen = slots.secondOpinionUsed === 0, triageLeft = slots.triageUsed < ROUND_LIMITS.triage;
    if (needsBlind && blindOpen) return { outcome: 'research', reasons: [...reasons, 'the triage qualifies and lacks only its blind opinion'], next: { stage: 'second-opinion', round: 1 } };
    if (triageLeft && (blindOpen || hasValidBlind)) return { outcome: 'research', reasons: [...reasons, 'another triage round may settle it'], next: { stage: 'triage', round: slots.triageUsed + 1 } };
    return { outcome: 'needs-joe', reasons: [...reasons, triageLeft ? 'the blind opinion is spent on other evidence' : 'the triage rounds are spent'] };
}
