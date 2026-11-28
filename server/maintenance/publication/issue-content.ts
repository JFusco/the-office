/**
 * The issue-creator rules a maintenance issue keeps (#612): one of the four title prefixes, the five level-two
 * headings exactly once and in order, acceptance criteria under Expected Outcome, and the harness's stable marker
 * on a line of its own. The model proposes the title, body and labels; the harness validates and publishes them.
 */
export const ISSUE_TITLE = /^\[(?:Bug|Feature|Task|Chore)\] \S.{0,240}$/;
export const ISSUE_HEADINGS = ['Summary', 'Context', 'Details', 'Expected Outcome', 'Additional Notes'] as const;

/** The hidden line that ties exactly one issue to a maintenance key across runs. */
export const issueMarker = (key: string) => `<!-- office-maintenance-issue:${key} -->`;

/** Why a proposed title and body break the rules, or undefined. The body is checked before the marker is appended. */
export function issueContentFault(title: string, body: string): string | undefined {
    if (!ISSUE_TITLE.test(title)) return 'The issue title needs a [Bug], [Feature], [Task] or [Chore] prefix and a subject';
    const lines = body.split(/\r?\n/), headings = lines.map((line, index) => ({ line: line.trim(), index })).filter(entry => /^## /.test(entry.line));
    const names = headings.map(entry => entry.line.slice(3).trim());
    if (names.length !== ISSUE_HEADINGS.length || names.some((name, index) => name !== ISSUE_HEADINGS[index]))
        return `The issue body needs exactly the headings ${ISSUE_HEADINGS.map(name => `## ${name}`).join(', ')}, in order`;
    const outcome = headings[3].index, notes = headings[4].index;
    const section = lines.slice(outcome + 1, notes);
    const criteria = section.findIndex(line => /^\*\*Acceptance Criteria\*\*\s*$/.test(line.trim()));
    if (criteria < 0 || !section.slice(criteria + 1).some(line => /^- \[ \] \S/.test(line.trim())))
        return 'Expected Outcome needs **Acceptance Criteria** with at least one unchecked criterion';
    if (body.includes('<!-- office-maintenance-issue:')) return 'The proposed body must not carry a maintenance marker; the harness adds it';
    if (/\bclose[sd]?\s+#\d+|\bfix(?:e[sd])?\s+#\d+|\bresolve[sd]?\s+#\d+/i.test(body)) return 'An issue body must not carry a closing keyword';
}

/** The exact body the harness publishes: the proposed body, then the marker (and any provenance line) on lines of their own. */
export function publishedIssueBody(body: string, key: string, provenance?: string): string {
    return `${body.trimEnd()}\n\n${provenance ? `${provenance}\n\n` : ''}${issueMarker(key)}\n`;
}

/** The marker on a line of its own: an issue that only quotes it is not the keyed issue. */
export const carriesMarker = (body: unknown, key: string) => String(body || '').split(/\r?\n/).some(line => line.trim() === issueMarker(key));
