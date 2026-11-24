import { plainWords } from '../../comments/plain-words';
import type { Finding } from '../../../src/shared';
import type { MetadataHumanEdit } from '../publication/metadata-admission';

export type MetadataField = 'title' | 'body';
const FIELDS: readonly MetadataField[] = ['title', 'body'];

const sentence = (text: string) => !text || /[.!?…]$/.test(text) ? text : `${text}.`;
const field = (fields: readonly MetadataField[]) => fields.join(' and ');

/**
 * The part of the pull request the finding is about, for the words only: nothing routes on it. A field the
 * finding names, or whose live content holds what the finding says it found. Both when neither tells.
 */
export function metadataFields(finding: Pick<Finding, 'summary' | 'expected' | 'actual'>, live: { title: string; body: string }): MetadataField[] {
    const said = `${finding.summary} ${finding.expected} ${finding.actual}`, found = finding.actual.trim();
    const fields = FIELDS.filter(name => new RegExp(`\\b${name === 'body' ? '(?:body|description)' : name}\\b`, 'i').test(said) || found.length >= 3 && live[name].includes(found));
    return fields.length ? fields : [...FIELDS];
}

/**
 * The reason and resume instruction of a park for a pull request edit the harness may not make: which pull
 * request and field, the edit the finding asks for, every other open finding, and how to resume from the
 * board. Model-written finding text is reduced to plain words.
 */
export function metadataParkWords(decision: MetadataHumanEdit, pickup: string): { reason: string; instruction: string } {
    const pr = `PR #${decision.pr.number}`, fields = field(metadataFields(decision.finding, decision.pr));
    const found = sentence(plainWords(decision.finding.actual, 2, 240) || plainWords(decision.finding.summary, 2, 240));
    const asked = sentence(plainWords(decision.finding.expected, 2, 240));
    const why = decision.why === 'lint-accepted'
        ? `The repository's own PR check accepts the current ${fields}, so the Office will not rewrite it.`
        : 'The same review left other findings open, so the Office will not rewrite it on its own.';
    return {
        reason: `${pr} needs an edit to its ${fields} that the Office may not make itself.`,
        instruction: [
            [`Sam's review found: ${found || 'a problem with the pull request metadata.'}`, ...(asked ? [`The edit it asks for: ${asked}`] : []), why].join(' '),
            ...(decision.others.length ? [['Other open findings from the same review:', ...decision.others.map(other => `- ${other.id}: ${sentence(plainWords(other.summary, 1, 160)) || 'no summary was recorded.'}`)].join('\n')] : []),
            `What's needed: edit the ${fields} of ${pr} on GitHub. Then move the issue card, not the pull request's card, back to ${pickup}; the Office then runs a fresh review. A reply to Morgan does not resume it.`,
        ].join('\n\n'),
    };
}

/** Why the harness stopped without parking: the edit, why moving a card cannot resume it, and how to ask for a fresh review. */
export function metadataStopWords(decision: MetadataHumanEdit, missing: string): string {
    const pr = `PR #${decision.pr.number}`, fields = field(metadataFields(decision.finding, decision.pr));
    const asked = sentence(plainWords(decision.finding.expected, 2, 240));
    return `${pr} needs an edit to its ${fields} that the Office may not make itself.${asked ? ` The edit Sam's review asks for: ${asked}` : ''} It was not parked: ${missing}, so moving a card cannot resume it. Edit the PR, then ask for a fresh review with review-pr.`;
}
