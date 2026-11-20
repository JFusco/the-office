import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { officeValidation } from '../../qa/assignment';
import { qaCriteria } from '../../qa/criteria';
import { underSetupUrl } from '../../qa/setup-url';
import { CurrentOfficeQAReportSchema } from '../../qa/report-schema';
import { safeWebUrl } from '../../office/security';
import { containedFile } from '../workflow';
import type { StageResult, Ticket } from '../../../src/shared';

export interface QACoverage { commit: string; carried: string[]; owed: string[] }
type Tested = Pick<Ticket, 'key' | 'approach' | 'commit' | 'results'>;

const latestQA = (ticket: Pick<Ticket, 'results'>): { stage: 'retest' | 'qa'; result: StageResult | undefined } => {
    const stage = ticket.results.retest ? 'retest' : 'qa';
    return { stage, result: ticket.results[stage] };
};
const same = (file: string, report: unknown) => { try { return JSON.stringify(JSON.parse(readFileSync(file, 'utf8'))) === JSON.stringify(report); } catch { return false; } };

/**
 * What the latest QA run on the current candidate already established, read from its saved report and
 * never from a claim. The run must be QA's own failed verdict for this ticket, stage and validation
 * level: a complete current report equal to the one saved in the run, ready setup, known provider usage,
 * every write settled, and the evidence a pass at that level needs (saved check output, or a real
 * browser session with its actor and resources). A result a gate refused and a setup stop establish
 * nothing. A required check is carried when at least one case refers to it, every such case is an
 * acceptance case that passed, and every item of evidence they cite is saved under the run's artifact
 * root on that commit (with a screenshot when the validation is browser). Every other required check is
 * owed. Null when nothing can be read.
 */
export function qaCoverage(ticket: Tested, root: string): QACoverage | null {
    const { stage, result } = latestQA(ticket), checks = ticket.approach?.checks || [], parsed = CurrentOfficeQAReportSchema.safeParse(result?.qa);
    if (!result || !parsed.success || !checks.length || result.outcome !== 'failed' || result.commit !== ticket.commit) return null;
    const qa = parsed.data, file = resolve(result.qaRunDir || '', 'report.json');
    if (qa.commit !== ticket.commit || qa.ticket !== ticket.key || qa.stage !== stage || qa.validation !== officeValidation(ticket.approach) || qa.setup.status !== 'ready' ||
        result.paidRuns === null || result.receipts.some(receipt => receipt.uncertain || !receipt.verified) || !result.qaRunDir || !containedFile(file, root) || !same(file, result.qa)) return null;
    const onCommit = (kind: string) => result.evidence.filter(item => item.kind === kind && item.commit === ticket.commit);
    if (qa.validation === 'independent-checks' && !onCommit('checks').some(item => containedFile(item.path, root))) return null;
    if (qa.validation === 'browser' && (!safeWebUrl(qa.setup.url) || !qa.setup.actor || !qa.setup.resources.length || !onCommit('browser').some(item => underSetupUrl(item.url, qa.setup.url)))) return null;
    const evidence = (id: string) => result.evidence.find(item => item.id === id && item.commit === ticket.commit && containedFile(item.path, root));
    const proven = (item: (typeof qa.cases)[number]) => item.kind === 'acceptance' && item.status === 'passed' && item.evidenceIds.length > 0 && item.evidenceIds.every(id => !!evidence(id)) &&
        (qa.validation !== 'browser' || item.evidenceIds.some(id => evidence(id)!.kind === 'screenshot'));
    const carried: string[] = [], owed: string[] = [];
    for (const criterion of qaCriteria(checks)) {
        const cases = qa.cases.filter(item => item.criterionId === criterion.id);
        (cases.length && cases.every(proven) ? carried : owed).push(criterion.check);
    }
    return { commit: ticket.commit, carried, owed };
}

/**
 * The checks among these that the latest QA run on the current candidate reported a case for and did not
 * pass. Read loosely on purpose: anything QA reported as not passed is owed again, whatever else that
 * report lacks.
 */
export function notPassedInLatestQA(ticket: Pick<Ticket, 'commit' | 'results'>, checks: readonly string[]): string[] {
    const { result } = latestQA(ticket), cases: any[] = Array.isArray((result?.qa as any)?.cases) ? (result!.qa as any).cases : [];
    if (!result || result.commit !== ticket.commit) return [];
    return qaCriteria(checks).filter(criterion => cases.some(item => item?.criterionId === criterion.id && item.status !== 'passed')).map(criterion => criterion.check);
}
