import { expectedWait } from '../expected-block';
import { boundedEvidence } from '../bounded-evidence';
import { fingerprint } from '../fingerprint';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

export const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** How many failed runs of one cause a project shows as subjects of their own: the newest. */
export const FAILURES_KEPT = 20;

/**
 * Runs that failed after they were dispatched, by the category the harness gave the failure. A
 * failed run is a moment, not a state, so each is counted for 24 hours after it ended; the same
 * failure on several runs in a day is what makes it an incident worth a look. A run the harness
 * cancelled itself, or whose saved result the stage accepted anyway, is not a failure.
 *
 * A cause that fails without end would otherwise add a subject for every run. Of the runs of one
 * cause, only the newest `FAILURES_KEPT` are subjects of their own; an older one is reported
 * `foldedOnly`, so the stopped job it belongs to still takes it in and nothing else shows it. The
 * runs are ranked before an accepted result is left out: a later acceptance frees no place, and
 * since an older run leaves the 24 hours before a newer one, a run once past the newest never
 * comes back as if the cause had returned.
 */
export const workerFailures: IncidentCollector = ({ projectId, state, now }) => {
    const failed = (state.workLog ?? [])
        .filter(run => ['failed', 'interrupted'].includes(run.status) && run.failure?.dispatched && run.failure.category !== 'cancelled' && now.getTime() - Date.parse(run.endedAt) < FAILURE_WINDOW_MS)
        .map(run => {
            const subject = { projectId, kind: 'worker', id: run.id, episode: run.endedAt, stage: run.stage, stop: null, lastWorker: run.id, head: '', unsettledEffect: false };
            const cause = { source: 'worker-failure' as const, provider: run.provider, stage: run.stage, kind: run.failure!.code ?? run.failure!.category, text: normalizeCause(run.failure!.detail), author: 'harness' as const };
            return { run, subject, cause, print: fingerprint(cause, subject) };
        });
    const byCause = new Map<string, typeof failed>();
    for (const entry of failed) { const runs = byCause.get(entry.print); if (runs) runs.push(entry); else byCause.set(entry.print, [entry]); }
    const past = new Set<string>();
    for (const runs of byCause.values()) {
        if (runs.length <= FAILURES_KEPT) continue;
        const newestFirst = [...runs].sort((a, b) => Date.parse(b.run.endedAt) - Date.parse(a.run.endedAt) || (a.run.id < b.run.id ? -1 : a.run.id > b.run.id ? 1 : 0));
        for (const { run } of newestFirst.slice(FAILURES_KEPT)) past.add(run.id);
    }
    return failed.filter(({ run }) => !run.completionAccepted).map(({ run, subject, cause }) => ({
        subject, cause,
        expected: expectedWait({ failure: run.failure!.category }),
        evidence: boundedEvidence(run.failure!.detail),
        ...(past.has(run.id) ? { foldedOnly: true as const } : {}),
    }));
};
