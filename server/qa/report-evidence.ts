import { officeValidation } from './assignment';
import { safeWebUrl } from '../office/security';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { StageResult, WorkApproach } from '../../src/shared';
import { OfficeQAReportSchema } from './report-schema';
import { qaCriteria } from './criteria';
import { underSetupUrl } from './setup-url';
const contained = (path: string, root: string) => !!path && existsSync(path) && existsSync(root) && realpathSync(path).startsWith(realpathSync(root) + sep);
/** Every fixed thing the gate below can say when it refuses a report; a setup stop names its own next action instead. */
export const QA_GATE_REFUSALS: readonly string[] = [
    'A complete structured Office QA report is required',
    'Change the QA route before execution through an explicit reroute; preserve the assigned checks',
    'Office QA report does not match the assigned ticket, head, stage or saved route',
    'Saved Office QA report is missing',
    'Saved Office QA report differs from its worker result',
    'Saved Office QA report is unreadable',
    'QA provider usage or effects require reconciliation',
    'QA has unresolved findings',
    'QA has failing, blocked, untested or duplicate cases',
    'QA must cover every saved required check',
    'QA criterion references must match the saved acceptance baseline',
    'Adjacent regression coverage is required',
    'Each QA case needs saved current-head evidence',
    'Saved focused check output is required',
    'Real browser, actor, resource and screenshot evidence is required',
];
export function officeQAEvidenceGap(result: StageResult, expected: { key: string; head: string; stage: string; approach?: WorkApproach }, root: string): string {
    const parsed = OfficeQAReportSchema.safeParse(result.qa);
    if (!parsed.success) return 'A complete structured Office QA report is required';
    const qa = parsed.data;
    if (result.approach && JSON.stringify(result.approach) !== JSON.stringify(expected.approach)) return 'Change the QA route before execution through an explicit reroute; preserve the assigned checks';
    if (qa.ticket !== expected.key || qa.commit !== expected.head || result.commit !== expected.head || qa.stage !== expected.stage ||
        qa.validation !== officeValidation(expected.approach)) return 'Office QA report does not match the assigned ticket, head, stage or saved route';
    const file = resolve(result.qaRunDir, 'report.json');
    if (!contained(file, root)) return 'Saved Office QA report is missing';
    try { if (JSON.stringify(JSON.parse(readFileSync(file, 'utf8'))) !== JSON.stringify(result.qa)) return 'Saved Office QA report differs from its worker result'; } catch { return 'Saved Office QA report is unreadable'; }
    if (qa.setup.status !== 'ready') return `Setup needed: ${qa.setup.nextAction} Owner: ${qa.setup.owner}`;
    if (result.paidRuns === null || result.receipts.some(r => r.uncertain || !r.verified)) return 'QA provider usage or effects require reconciliation';
    if (result.findings.some(f => f.status !== 'verified')) return 'QA has unresolved findings';
    if (!qa.cases.length || new Set(qa.cases.map(c => c.id)).size !== qa.cases.length || qa.cases.some(c => c.status !== 'passed')) return 'QA has failing, blocked, untested or duplicate cases';
    const criteria = qaCriteria(expected.approach?.checks);
    if (!criteria.length || criteria.some(criterion => !qa.cases.some(c => c.kind === 'acceptance' && (qa.version === 2 ? 'criterionId' in c && c.criterionId === criterion.id : c.check === criterion.check)))) return 'QA must cover every saved required check';
    // Every saved check is covered above. An acceptance case with no reference is further coverage (a ticket criterion that is
    // not a saved check); a reference must be one of the saved ones, and a regression case carries none.
    if (qa.version === 2 && qa.cases.some(c => !('criterionId' in c) || c.criterionId !== null && (c.kind !== 'acceptance' || !criteria.some(criterion => criterion.id === c.criterionId)))) return 'QA criterion references must match the saved acceptance baseline';
    if (!qa.cases.some(c => c.kind === 'regression')) return 'Adjacent regression coverage is required';
    if (qa.cases.some(c => !c.evidenceIds.length || c.evidenceIds.some(id => !result.evidence.some(e => e.id === id && e.commit === expected.head && contained(e.path, root))))) return 'Each QA case needs saved current-head evidence';
    if (qa.validation === 'independent-checks' && !result.evidence.some(e => e.kind === 'checks' && e.commit === expected.head && contained(e.path, root))) return 'Saved focused check output is required';
    if (qa.validation === 'browser' && (!safeWebUrl(qa.setup.url) || !qa.setup.actor || !qa.setup.resources.length ||
        !result.evidence.some(e => e.kind === 'browser' && e.commit === expected.head && underSetupUrl(e.url, qa.setup.url)) ||
        !result.evidence.some(e => e.kind === 'screenshot' && e.commit === expected.head && contained(e.path, root)))) return 'Real browser, actor, resource and screenshot evidence is required';
    return '';
}
