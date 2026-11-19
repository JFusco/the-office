import { plainWords } from '../comments/plain-words';
import type { ReadableComment } from '../comments/readable-comment';
import { parksInJira } from './parking/parks-in-jira';
import type { StageResult } from '../../src/shared';

const STAGE: Record<string, string> = { qa: 'QA', retest: 'QA retest', 'staging-qa': 'Staging QA' };
const OUTCOME: Record<string, string> = { passed: 'passed', failed: 'failed', blocked: 'blocked', reroute: 'sent back' };
const remote = (url: string) => /^https:\/\//.test(url) && !/^https:\/\/(localhost|127\.|\[::1\])/.test(url);

/** The QA outcome a person reads on the Jira ticket: what happened, what is needed, the findings and a few real links. */
export function qaComment(key: string, stage: string, attempt: string, result: StageResult, carried?: { checks: string[]; commit: string }): ReadableComment {
    const decision = result.outcome === 'blocked' && parksInJira(result);
    const open = result.findings.filter(finding => finding.status === 'open'), count = (status: string) => result.findings.filter(finding => finding.status === status).length;
    const plural = (n: number, text: string) => `${n} ${text.replace('(s)', n === 1 ? '' : 's')}`;
    const seen = new Set<string>(), links = result.evidence.filter(evidence => remote(evidence.url) && !evidence.url.includes(`/browse/${key}`) && !seen.has(evidence.url) && !!seen.add(evidence.url)).slice(0, 3)
        .map(evidence => ({ label: plainWords(evidence.summary, 1, 80) || evidence.kind, url: evidence.url }));
    return {
        headline: `${STAGE[stage] || stage}: ${OUTCOME[result.outcome] || result.outcome}${decision ? ', needs a decision' : ''}`,
        // Truthful about what ran on this build: checks an earlier run passed are said to be carried, not retested.
        paragraphs: [plainWords(result.summary, 3) || 'No summary was recorded for this run.',
            ...(carried?.checks.length ? [`${plural(carried.checks.length, 'required check(s)')} passed in the earlier QA run on build ${carried.commit.slice(0, 7)} and ${carried.checks.length === 1 ? 'was' : 'were'} carried, not run again on this build.`] : [])],
        needed: result.blocker ? plainWords(result.blocker, 2, 320) : undefined,
        points: { title: 'Findings', items: [
            ...(count('verified') ? [`${plural(count('verified'), 'earlier finding(s)')} verified fixed`] : []),
            ...(count('fixed') ? [`${plural(count('fixed'), 'finding(s)')} fixed, not yet verified`] : []),
            ...open.slice(0, 5).map(finding => `Open: ${plainWords(finding.summary, 1, 160)}`),
            ...(open.length > 5 ? [`and ${open.length - 5} more open`] : [])] },
        links,
        reference: `Build ${result.commit.slice(0, 7)} · Office ref ${attempt.slice(0, 8)} (${stage})`,
    };
}
