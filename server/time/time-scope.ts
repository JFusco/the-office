import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import type { HarnessRequest, TimeEntry, WorkTime } from '../../src/shared';
import type { Store } from '../store/store';
import { CURRENT_SCOPE_POLICY, ISSUE_KEY, isLegacyTicketWork, isTicketModelWork, scopeSelector } from '../telemetry/billable-work';
import { timeClassificationDigest } from './time-classification';
import { timeLedger } from './time-accounting';
import { ticketUnresolved } from './publishable';
import { ticketDayTotals } from './ticket-day-totals';

/**
 * Moving an existing ledger to the current scope (all ticket model work) is a client-visible
 * historical correction: GitHub board hours and already-posted Jira worklogs change. It never
 * happens on deploy. A preview names every changed ticket/day; `apply-time-scope` must carry the
 * preview's digest and is re-checked inside one transaction, so what is applied is exactly what
 * was shown. Nothing applies while affected tickets have live work or unresolved publications.
 */
export const TimeScopeInput = z.object({ policy: z.literal(CURRENT_SCOPE_POLICY), expectedSha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

export interface ScopeRow { id: string; key: string; date: string; status: TimeEntry['status'] | 'new'; revision: number; worklogId: string | null; oldSeconds: number; newSeconds: number }
export interface ScopePreview {
    project: string;
    from: 'legacy' | 'model-work-v1';
    to: typeof CURRENT_SCOPE_POLICY;
    applied: boolean;
    applicable: boolean;
    expectedSha256: string | null;
    rows: ScopeRow[];
    tickets: { key: string; oldSeconds: number; newSeconds: number }[];
    /** publications: tickets with unsettled or stuck hours (reconcile first); manual: Jira days whose worklog would drop to zero. */
    blockers: { disabled: boolean; liveWork: { ticket: string; workId: string; status: WorkTime['status'] }[]; publications: string[]; manual: string[] };
}

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function previewTimeScope(store: Store): ScopePreview {
    const ledger = timeLedger(store), from = ledger.scopePolicy ?? 'legacy';
    const base: ScopePreview = { project: store.project.id, from, to: CURRENT_SCOPE_POLICY, applied: from === CURRENT_SCOPE_POLICY, applicable: false, expectedSha256: null, rows: [], tickets: [], blockers: { disabled: !ledger.enabled, liveWork: [], publications: [], manual: [] } };
    if (base.applied || !ledger.enabled) return base; // a disabled ledger has an open window the totals cannot clip
    const proposed = ticketDayTotals(store, ledger, scopeSelector(CURRENT_SCOPE_POLICY));
    const rows: ScopeRow[] = [];
    for (const entry of ledger.entries) {
        if (!ISSUE_KEY.test(entry.key)) continue; // a label is not a board item; its legacy entry is left as it is
        const newSeconds = proposed.get(entry.id)?.seconds ?? 0;
        if (entry.status === 'excluded' && newSeconds < 1) continue; // already outside the published window
        if (newSeconds !== entry.seconds) rows.push({ id: entry.id, key: entry.key, date: entry.date, status: entry.status, revision: entry.revision || 1, worklogId: entry.worklogId || null, oldSeconds: entry.seconds, newSeconds });
    }
    for (const [id, day] of proposed)
        if (day.seconds >= 1 && !ledger.entries.some(entry => entry.id === id)) rows.push({ id, key: day.key, date: day.date, status: 'new', revision: 0, worklogId: null, oldSeconds: 0, newSeconds: day.seconds });
    rows.sort((a, b) => a.id.localeCompare(b.id));
    const affected = new Set(rows.map(row => row.key));
    // Work the new scope admits that is still running could add to any ticket, even before its first confirmed segment.
    for (const work of store.state.workLog || [])
        if (['running', 'stopping'].includes(work.status) && isTicketModelWork(work) && !isLegacyTicketWork(work)) affected.add(work.ticket);
    const liveWork = (store.state.workLog || []).filter(work => affected.has(work.ticket) && isTicketModelWork(work) && ['running', 'stopping'].includes(work.status)).map(work => ({ ticket: work.ticket, workId: work.id, status: work.status }));
    const publications = [...affected].filter(key => ticketUnresolved(ledger, key)).sort();
    const tickets = [...affected].sort().map(key => ({ key, oldSeconds: ledger.entries.filter(entry => entry.key === key).reduce((n, entry) => n + entry.seconds, 0), newSeconds: [...proposed.values()].filter(day => day.key === key).reduce((n, day) => n + day.seconds, 0) }));
    // A Jira worklog cannot be set to zero by the publisher; that day needs a manual correction.
    const manual = store.project.provider === 'azure' ? rows.filter(row => row.newSeconds < 1 && row.worklogId).map(row => row.id) : [];
    const preview: ScopePreview = { ...base, rows, tickets, blockers: { disabled: false, liveWork, publications, manual } };
    if (!rows.length || liveWork.length || publications.length || manual.length) return preview;
    // Bound to every input of the correction and nothing unrelated (other tickets' live work, timestamps).
    const sources = (store.state.workLog || []).filter(work => affected.has(work.ticket) && isTicketModelWork(work));
    preview.expectedSha256 = digest({
        project: store.project.id, from, to: CURRENT_SCOPE_POLICY,
        boundaries: { activatedAt: ledger.activatedAt, jiraActivatedAt: ledger.jiraActivatedAt ?? null, disabledPeriods: ledger.disabledPeriods ?? [], disabledSince: ledger.disabledSince ?? null },
        rows, sources: timeClassificationDigest(sources),
        baselines: [...affected].sort().map(key => [key, ledger.baselines?.[key] ?? null]),
        publications: (ledger.publications || []).filter(publication => affected.has(publication.key)).map(publication => [publication.id, publication.status]),
    });
    preview.applicable = true;
    return preview;
}

export function applyTimeScope(store: Store, request: HarnessRequest): void {
    const input = TimeScopeInput.parse(request.timeScope), ledger = timeLedger(store);
    if (ledger.scopePolicy === input.policy && ledger.scopeCorrection?.expectedSha256 === input.expectedSha256) return; // already applied
    if (ledger.scopePolicy === input.policy) throw new Error('This ledger already uses the current scope');
    const first = previewTimeScope(store);
    if (first.blockers.disabled) throw new Error('Time accounting is disabled; enable it before correcting scope');
    if (first.blockers.manual.length) throw new Error(`Jira worklogs would drop to zero and need manual correction: ${first.blockers.manual.join(', ')}`);
    if (first.blockers.liveWork.length) throw new Error(`blocked-by-live-work: ${first.blockers.liveWork.map(item => `${item.ticket} ${item.workId} (${item.status})`).join(', ')}; take a fresh preview once it finishes`);
    if (first.blockers.publications.length) throw new Error(`Hours for ${first.blockers.publications.join(', ')} need reconciliation first (an attempted write awaiting read-back, or a day stuck uncertain that needs manual reconciliation)`);
    if (first.expectedSha256 !== input.expectedSha256) throw new Error('The scope preview is stale; take a fresh preview');
    if (!/^[a-f0-9-]{36}$/.test(request.id)) throw new Error('Durable correction identity required');
    const root = resolve(store.dataRoot, 'accounting-corrections');
    mkdirSync(root, { recursive: true, mode: 0o700 });
    if (lstatSync(root).isSymbolicLink() || !realpathSync(root).startsWith(realpathSync(store.dataRoot) + sep)) throw new Error('Correction audit root is not owned');
    const auditPath = resolve(root, `${request.id}-scope.json`), at = store.clock.now().toISOString();
    store.transaction(() => {
        const current = previewTimeScope(store);
        if (current.blockers.liveWork.length) throw new Error('blocked-by-live-work: an affected ticket gained live work after the preview; take a fresh preview');
        if (!current.applicable || current.expectedSha256 !== input.expectedSha256) throw new Error('The scope preview is stale; take a fresh preview');
        // Written only once the correction is certain to apply (synchronous, inside the transaction).
        writeFileSync(auditPath, JSON.stringify({ requestId: request.id, input, preview: current, priorEntries: ledger.entries.filter(entry => current.rows.some(row => row.id === entry.id)), at, reason: 'Hours and cost count every ticket model invocation; harness work excluded.' }, null, 2), { mode: 0o600, flag: 'wx' });
        const days = ticketDayTotals(store, ledger, scopeSelector(CURRENT_SCOPE_POLICY));
        for (const row of current.rows) {
            const sources = [...new Set(days.get(row.id)?.ids || [])], entry = ledger.entries.find(item => item.id === row.id);
            const detail = store.project.provider === 'github' ? 'Scope correction: all ticket model work; pending board hours sync.' : 'Scope correction: all ticket model work; pending Jira worklog update.';
            if (!entry) { ledger.entries.push({ id: row.id, revision: 1, key: row.key, date: row.date, seconds: row.newSeconds, sourceIds: sources, status: 'pending', detail, url: '' }); continue; }
            // The worklog identity is kept, so Jira updates the same worklog rather than creating another.
            Object.assign(entry, { seconds: row.newSeconds, sourceIds: sources, revision: (entry.revision || 1) + 1, status: 'pending', detail });
        }
        ledger.scopePolicy = input.policy;
        ledger.scopeCorrection = { requestId: request.id, policy: input.policy, expectedSha256: input.expectedSha256, auditPath, changedEntries: current.rows.length, at };
        store.emit('time-scope-applied', `Hours now count all ticket model work: ${current.rows.length} ticket-day totals corrected across ${current.tickets.length} tickets and queued for verified publication. Audit: ${auditPath}`, 'pm');
    });
}
