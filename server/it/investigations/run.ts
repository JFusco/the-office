import { captureLearning } from '../../knowledge/learning-events';
import { OfficeFixResult, OFFICE_FIX_PROMPT, validateOfficeFix } from './office-fix';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import { z } from 'zod';
import { sanitize } from '../../office/security';
import { investigationEvidence } from './evidence';
import { investigationReady } from './readiness';
import { processGroupAlive } from '../../workers/process';
import { syncInvestigations } from './ledger';
import type { Store } from '../../store/store';
import { INVESTIGATION_TIMEOUT, INVESTIGATION_ATTEMPTS } from './budget';
export { INVESTIGATION_TIMEOUT, INVESTIGATION_ATTEMPTS } from './budget';

export const InvestigationReport = z.object({ summary: z.string().min(1).max(1500), cause: z.enum(['process', 'authentication', 'provider', 'harness', 'unknown']), evidence: z.array(z.object({ ref: z.string().max(200), observation: z.string().min(1).max(800) }).strict()).min(1).max(8), recommendation: z.string().max(1500), blocker: z.string().max(1000) }).strict();
export const SubprocessReport = InvestigationReport.extend({ officeFix: OfficeFixResult });
export interface InvestigationOptions { readOnly: true; effortKind: 'administrative'; stage: 'it-investigation'; requestId: string; ticket: string; timeout: number }
export type InvestigationRunner = <T>(prompt: string, schema: z.ZodType<T>, options: InvestigationOptions) => Promise<T>;

/** Diagnosis is read-only, budgeted before dispatch, and cannot mutate or declare the source resolved. */
export async function runInvestigation(store: Store, id: string, run: InvestigationRunner, alive = processGroupAlive): Promise<void> {
    syncInvestigations(store);
    const entry = store.state.it?.investigations?.find(entry => entry.id === id), now = store.clock.now();
    if (!entry || !['queued', 'working'].includes(entry.status) || entry.attempts >= INVESTIGATION_ATTEMPTS || entry.nextAt && Date.parse(entry.nextAt) > now.getTime() || !investigationReady(store, entry, alive)) return;
    const ownWorkers = store.state.workLog?.filter(work => work.requestId === id) || [];
    if (ownWorkers.some(work => !work.processId || ['running', 'stopping'].includes(work.status) || alive(work.processId))) return;
    entry.attempts++; entry.status = 'working'; entry.updatedAt = now.toISOString();
    entry.nextAt = new Date(now.getTime() + INVESTIGATION_TIMEOUT + 30000).toISOString();
    store.save();
    try {
        const packet = investigationEvidence(store, entry), subprocess = entry.source.failureKind === 'surviving-subprocesses';
        const schema = subprocess ? SubprocessReport : InvestigationReport;
        const report: NonNullable<ITInvestigation['report']> = schema.parse(await run(`READ ONLY operational diagnosis for Ellis. Use only this bounded, redacted evidence packet. No private transcript reads, writes, sends, retries of original actions, credentials, process termination or service changes. Returned findings are advisory: never claim that a source effect is resolved. Unknown dispatch stays unknown; negative history never proves non-execution. Authentication may be diagnosed only from explicit authentication evidence. Cite only supplied evidence refs. A missing cause is a valid unknown diagnosis with a precise blocker and owner. Recommend a separate scoped fix when warranted. Packet:\n${JSON.stringify(packet)}\n${subprocess ? OFFICE_FIX_PROMPT : ''}`, schema, { readOnly: true, effortKind: 'administrative', stage: 'it-investigation', requestId: id, ticket: entry.source.ticket, timeout: INVESTIGATION_TIMEOUT }));
        if (report.cause === 'authentication' && !/\"category\":\"authentication\"|not_authed|invalid_auth|token_revoked|authentication required|logged out|sign.in required/i.test(JSON.stringify(packet.evidence))) throw new Error('Diagnosis needs explicit authentication evidence');
        const refs = new Set(packet.evidence.map(evidence => evidence.ref));
        if (report.evidence.some(evidence => !refs.has(evidence.ref))) throw new Error('Investigation cited evidence outside the bounded packet');
        if (subprocess) {
            report.officeFix = validateOfficeFix(report.officeFix, entry.source.id, packet.evidence);
            if (report.officeFix.status === 'proposed' && (report.cause === 'unknown' || report.blocker)) throw new Error('An unknown or blocked diagnosis cannot claim a supported Office fix');
            if (report.officeFix.status === 'blocked') report.blocker = report.officeFix.reason;
        }
        const current = store.state.it?.investigations?.find(entry => entry.id === id);
        if (!current) return;
        if (current.report) (current.diagnosisHistory ??= []).push({ supersededAt: store.clock.now().toISOString(), report: current.report, reportEvidence: current.reportEvidence || [] });
        current.reportEvidence = packet.evidence.flatMap(item => {
            const hash = (item.facts as { sha256?: unknown })?.sha256;
            return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash) ? [{ ref: item.ref, sha256: hash }] : [];
        });
        current.report = report; current.status = report.blocker ? 'blocked' : 'diagnosed'; current.nextAt = ''; current.lastError = '';
        captureLearning(store, { kind: 'investigation', id: entry.id }, entry.source.ticket, 'it-investigation', String(entry.attempts), report, report.summary);
        store.emit('it-investigation-diagnosed', `${report.summary} ${subprocess ? 'Office fix proposal or evidence blocker is ready for Morgan.' : 'Original outcome requires its own verified resolution.'}`, 'it', entry.source.ticket);
    } catch (error) {
        const current = store.state.it?.investigations?.find(entry => entry.id === id);
        if (!current) return;
        current.lastError = sanitize(String(error)).slice(0, 1000);
        current.status = current.attempts >= INVESTIGATION_ATTEMPTS ? 'blocked' : 'queued';
        current.nextAt = current.status === 'blocked' ? '' : new Date(store.clock.now().getTime() + [30000, 120000, 300000][current.attempts - 1]).toISOString();
    } finally {
        const current = store.state.it?.investigations?.find(entry => entry.id === id);
        if (current) current.updatedAt = store.clock.now().toISOString();
        syncInvestigations(store); store.save();
    }
}
