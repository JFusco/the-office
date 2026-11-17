import { plainWords } from '../comments/plain-words';
import type { ReadableComment } from '../comments/readable-comment';
import type { StageResult } from '../../src/shared';

const HEADLINE: Record<string, string> = { 'draft-pr': 'Dev update: draft pull request opened', repair: 'Dev update: fixes ready for review' };

/** The developer's progress note a person reads on the Jira ticket after a draft PR or a repair. */
export function devUpdate(stage: string, attempt: string, result: StageResult, pullRequest: string): ReadableComment {
    const count = (status: string) => result.findings.filter(finding => finding.status === status).length, open = result.findings.filter(finding => finding.status === 'open');
    const plural = (n: number, text: string) => `${n} ${text.replace('(s)', n === 1 ? '' : 's')}`;
    return {
        headline: HEADLINE[stage] || `Dev update: ${stage}`,
        paragraphs: [plainWords(result.summary, 3) || 'No summary was recorded for this run.'],
        points: { title: 'Findings', items: [
            ...(count('fixed') ? [`${plural(count('fixed'), 'finding(s)')} fixed, not yet verified`] : []),
            ...(count('verified') ? [`${plural(count('verified'), 'earlier finding(s)')} verified fixed`] : []),
            ...open.slice(0, 5).map(finding => `Open: ${plainWords(finding.summary, 1, 160)}`),
            ...(open.length > 5 ? [`and ${open.length - 5} more open`] : [])] },
        links: /^https:\/\//.test(pullRequest) ? [{ label: stage === 'draft-pr' ? 'Draft pull request' : 'Pull request', url: pullRequest }] : [],
        reference: `Build ${result.commit.slice(0, 7)} · Office ref ${attempt.slice(0, 8)} (${stage})`,
    };
}
