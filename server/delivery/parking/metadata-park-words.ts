import { plainWords } from '../../comments/plain-words';
import { redactEvidence } from '../../incidents/redact-evidence';
import type { Finding } from '../../../src/shared';
import type { MetadataHumanEdit } from '../publication/metadata-admission';

export type MetadataField = 'title' | 'body';
const FIELDS: readonly MetadataField[] = ['title', 'body'];

const sentence = (text: string) => !text || /[.!?…]$/.test(text) ? text : `${text}.`;
const field = (fields: readonly MetadataField[]) => fields.join(' and ');

/**
 * Model-written text as a park shows it. Hidden HTML comments (an unterminated one through the end of the field)
 * and tag syntax go, the visible words stay; the whole field is normalized, credentials and provider tokens are
 * redacted and mentions broken so they notify nobody. Only then do the `plainWords` sentence and length budgets
 * apply, so hidden text spends none of them.
 */
function shown(text: string, sentences: number, max: number): string {
    const visible = String(text || '').normalize('NFKC')
        .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<!--[\s\S]*$/, ' ')
        .replace(/<\/?[a-z][^<>]*>/gi, ' ').replace(/<(?=[a-z/!?])/gi, '')
        .replace(/[​-‏‪-‮⁠-⁤﻿]/g, '')
        .replace(/\s+/g, ' ').trim();
    const words = plainWords(redactEvidence(visible), sentences, Number.MAX_SAFE_INTEGER);
    return plainWords(words.replace(/@(?=\w)/g, '@‍'), sentences, max);
}

/**
 * The part of the pull request the finding is about, for the words only: nothing routes on it. A field the
 * finding names, or whose live content holds what the finding says it found. Both when neither tells.
 */
export function metadataFields(finding: Pick<Finding, 'summary' | 'expected' | 'actual'>, live: { title: string; body: string }): MetadataField[] {
    const said = `${finding.summary} ${finding.expected} ${finding.actual}`, found = finding.actual.trim();
    const fields = FIELDS.filter(name => new RegExp(`\\b${name === 'body' ? '(?:body|description)' : name}\\b`, 'i').test(said) || found.length >= 3 && live[name].includes(found));
    return fields.length ? fields : [...FIELDS];
}

/** Which pull request and field need an edit, and the edit the finding asks for: its expected text, or its summary. */
function needed(decision: MetadataHumanEdit): string {
    const asked = sentence(shown(decision.finding.expected, 2, 240) || shown(decision.finding.summary, 2, 240));
    return `PR #${decision.pr.number} needs an edit to its ${field(metadataFields(decision.finding, decision.pr))} that the Office may not make itself.${asked ? ` The edit Sam's review asks for: ${asked}` : ''}`;
}

/**
 * The reason and resume instruction of a park for a pull request edit the harness may not make. The reason names
 * the pull request, the field and the edit, so it can be shown before the instruction is published; the instruction
 * says what Sam found, every other open finding, and how to resume from the board.
 */
export function metadataParkWords(decision: MetadataHumanEdit, pickup: string): { reason: string; instruction: string } {
    const pr = `PR #${decision.pr.number}`, fields = field(metadataFields(decision.finding, decision.pr));
    const found = sentence(shown(decision.finding.actual, 2, 240) || shown(decision.finding.summary, 2, 240));
    const why = decision.why === 'lint-accepted'
        ? `The repository's own PR check accepts the current ${fields}, so the Office will not rewrite it.`
        : 'The same review left other findings open, so the Office will not rewrite it on its own.';
    return {
        reason: needed(decision),
        instruction: [
            `Sam's review found: ${found || 'a problem with the pull request metadata.'} ${why}`,
            ...(decision.others.length ? [['Other open findings from the same review:', ...decision.others.map(other => `- ${shown(other.id, 1, 60) || 'unnamed'}: ${sentence(shown(other.summary, 1, 160)) || 'no summary was recorded.'}`)].join('\n')] : []),
            `What's needed: edit the ${fields} of ${pr} on GitHub. Then move the issue card, not the pull request's card, back to ${pickup}; the Office then runs a fresh review. A reply to Morgan does not resume it.`,
        ].join('\n\n'),
    };
}

/**
 * Why the harness stopped without parking: the edit, why moving a card cannot resume it, and how to ask for a fresh
 * review, after putting back `restore` when a fresh review needs it too.
 */
export function metadataStopWords(decision: MetadataHumanEdit, missing: string, restore?: string): string {
    const first = restore ? `${restore[0].toUpperCase()}${restore.slice(1)}, edit the PR` : 'Edit the PR';
    return `${needed(decision)} It was not parked: ${missing}, so moving a card cannot resume it. ${first}, then ask for a fresh review with review-pr.`;
}
