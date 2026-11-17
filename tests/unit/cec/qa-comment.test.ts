import { expect, test } from 'vitest';
import { qaComment } from '../../../server/cec/qa-comment';
import { commentMarkdown } from '../../../server/comments/readable-comment';

const finding = (id: string, status: string, summary: string): any => ({ id, status, summary, expected: '', actual: '', attempts: 1 });
const evidence = (url: string, path = '', summary = 'Hosted build'): any => ({ id: url || path, kind: 'checks', summary, path, commit: '', environment: '', url, observedAt: '' });

test('a blocked retest reads as a headline, a short summary, what is needed, grouped findings, real links and one reference line', () => {
    const result: any = { outcome: 'blocked', resolution: { kind: 'scope' }, receipts: [], commit: '7d6ce8896da1102af6972afe594e313e36cebbec',
        summary: 'Most of the feature passed on candidate 7d6ce8896da1102af6972afe594e313e36cebbec. Regeneration could not run. Details are in /Users/x/.local/runs/r/final.json. Fourth sentence is kept. Fifth sentence is dropped.',
        blocker: 'A supported Target DXP and a second BA are needed.',
        findings: [finding('A-1', 'verified', 'Replay'), finding('A-2', 'verified', 'Removal'), finding('A-3', 'fixed', 'Keys'), finding('A-4', 'open', 'Local date-format failures are environmental. More detail.')],
        evidence: [evidence('http://localhost:3000/x'), evidence('', '/Users/x/report.json'), evidence('https://verndale.atlassian.net/browse/CEC-154'), evidence('https://dev.azure.com/build/9'), evidence('https://dev.azure.com/build/9'),
            evidence('https://a.test/1', '', 'One'), evidence('https://a.test/2', '', 'Two'), evidence('https://a.test/3', '', 'Three')] };
    expect(commentMarkdown(qaComment('CEC-154', 'retest', '410bc6e6-c837-4f86-bd48-442e6f0f6551', result))).toBe([
        '**QA retest: blocked, needs a decision**',
        'Most of the feature passed on candidate 7d6ce88. Regeneration could not run. Fourth sentence is kept.',
        "**What's needed:** A supported Target DXP and a second BA are needed.",
        '**Findings**\n- 2 earlier findings verified fixed\n- 1 finding fixed, not yet verified\n- Open: Local date-format failures are environmental.',
        '**Links**\n- [Hosted build](https://dev.azure.com/build/9)\n- [One](https://a.test/1)\n- [Two](https://a.test/2)',
        'Build 7d6ce88 · Office ref 410bc6e6 (retest)'].join('\n\n'));
});

test('a passed QA with nothing to list is three short blocks', () => {
    const result: any = { outcome: 'passed', commit: 'a'.repeat(40), summary: 'Every acceptance case passed in the browser.', blocker: '', findings: [], evidence: [] };
    expect(commentMarkdown(qaComment('CEC-1', 'qa', 'attempt-1', result))).toBe('**QA: passed**\n\nEvery acceptance case passed in the browser.\n\nBuild aaaaaaa · Office ref attempt- (qa)');
});

test('only a block the Office will park for a person says it needs a decision; a missing summary is said plainly', () => {
    const blocked = (kind: string | null, receipts: any[] = []): any => ({ outcome: 'blocked', resolution: kind ? { kind } : null, receipts, commit: 'a'.repeat(40), summary: '', blocker: 'Something is needed.', findings: [], evidence: [] });
    const headline = (result: any) => qaComment('CEC-1', 'staging-qa', 'attempt-1', result).headline;
    for (const kind of ['human-hold', 'scope', 'permission', 'provider-wait']) expect(headline(blocked(kind)), kind).toBe('Staging QA: blocked, needs a decision');
    for (const kind of ['source-repair', 'conflict-repair', 'uncertain-effect', null]) expect(headline(blocked(kind)), String(kind)).toBe('Staging QA: blocked');
    expect(headline(blocked('scope', [{ id: 'x', action: 'jira-update', target: 'CEC-1', verified: false, uncertain: true, detail: '' }]))).toBe('Staging QA: blocked');
    expect(qaComment('CEC-1', 'qa', 'attempt-1', blocked(null)).paragraphs).toEqual(['No summary was recorded for this run.']);
});
