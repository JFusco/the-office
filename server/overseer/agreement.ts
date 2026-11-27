import type { CorrectionCase, FileReference, SourceRange, SubjectReference, TriageResult } from '../../src/contracts/overseer';

/**
 * Whether two verdicts say the same thing: the same verdict on the same cited basis and, for a
 * defect, the same covered episodes, refusal, requirement, correction and regression. Wording,
 * explanations and confidence are not compared; admission weighs confidence itself.
 */
export interface Agreement { agree: boolean; matched: string[]; differences: string[] }

/** A source anchor: the line a claim turns on, in one version of one file. Context windows around it may differ. */
export const anchor = (range: SourceRange) => `${range.path}@${range.sha256}#${range.decisiveLine}`;
const file = (reference: FileReference) => `${reference.path}@${reference.sha256}`;
const subject = (reference: SubjectReference) => `${reference.key}@${reference.stopDigest}`;
const set = (values: readonly string[]) => JSON.stringify([...new Set(values)].sort());
export const factsKey = (facts: readonly CorrectionCase['trigger']['facts'][number][]) =>
    set(facts.map(({ name, value }) => JSON.stringify([name, value])));
const disposition = (value: CorrectionCase['required']) => `${value.outcome}:${value.cause}`;

function compare(pairs: [string, string, string][]): Agreement {
    const matched: string[] = [], differences: string[] = [];
    for (const [name, a, b] of pairs) (a === b ? matched : differences).push(name);
    return { agree: differences.length === 0, matched, differences };
}

export function agreement(a: TriageResult, b: TriageResult): Agreement {
    const pairs: [string, string, string][] = [['verdict', a.verdict, b.verdict]];
    if (a.verdict === 'harness-defect' && b.verdict === 'harness-defect') {
        const left = a.correction, right = b.correction;
        pairs.push(
            ['episodes', set(left.case.episodes.map(subject)), set(right.case.episodes.map(subject))],
            ['refusal', anchor(a.refusalSite), anchor(b.refusalSite)],
            ['requirement', anchor(a.invariant.requirement), anchor(b.invariant.requirement)],
            ['direction', left.direction, right.direction],
            ['site', anchor(left.site), anchor(right.site)],
            ['clause', anchor(left.case.trigger.clause), anchor(right.case.trigger.clause)],
            ['facts', factsKey(left.case.trigger.facts), factsKey(right.case.trigger.facts)],
            ['scope', `${left.case.trigger.scope}:${left.case.trigger.condition ?? ''}`, `${right.case.trigger.scope}:${right.case.trigger.condition ?? ''}`],
            ['observed', disposition(left.case.observed), disposition(right.case.observed)],
            ['required', disposition(left.case.required), disposition(right.case.required)],
            ['edit-paths', set(left.editPaths.map(file)), set(right.editPaths.map(file))],
            ['affected', set(a.affectedFiles.map(file)), set(b.affectedFiles.map(file))],
            ['regression-target', file(a.regression.target), file(b.regression.target)],
        );
    } else if (a.verdict === 'real-block' && b.verdict === 'real-block') {
        pairs.push(['stop', subject(a.stop), subject(b.stop)], ['refusal', anchor(a.refusalSite), anchor(b.refusalSite)], ['rule', anchor(a.rule), anchor(b.rule)]);
    } else if (a.verdict === 'false-positive' && b.verdict === 'false-positive') {
        pairs.push(['stops', set(a.stops.map(subject)), set(b.stops.map(subject))], ['citation', anchor(a.citation), anchor(b.citation)]);
    } else if (a.verdict === 'stale-state' && b.verdict === 'stale-state') {
        const reference = (entry: (typeof a.change)[number]) => entry.kind === 'subject' ? `subject:${subject(entry)}` : `event:${entry.id}`;
        pairs.push(['change', set(a.change.map(reference)), set(b.change.map(reference))]);
    }
    return compare(pairs);
}
