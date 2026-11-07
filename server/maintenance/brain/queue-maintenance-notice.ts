import type { MaintenanceRun } from '../../../src/shared';
import type { Store } from '../../store/store';

// Keeps every line of the run's own summary; the cap stays well inside Slack's 5000-character request limit.
const MAX_SUMMARY = 1500;
const capped = (summary: string) => { const text = summary.trim() || 'No summary was recorded.'; return text.length > MAX_SUMMARY ? `${text.slice(0, MAX_SUMMARY - 1)}…` : text; };

/** Called in the same saved state change that records a completed Brain run; never scans earlier runs. */
export function queueMaintenanceNotice(store: Store, run: MaintenanceRun, summary: string) {
    const state = store.state.coordination?.notices, policy = state?.policy.goals;
    if (run.status !== 'completed' || run.stage !== 'brain-completed' || !state || !policy?.enabled || !policy.enabledAt) return;
    const event = `maintenance-completed:${store.project.id}:${run.id}`;
    if (state.entries.some(notice => notice.event === event)) return;
    state.entries.push({ kind: 'maintenance', id: event, event, runId: run.id, policyVersion: policy.version,
        key: '', identity: policy.targetId, email: '', resolved: { targetId: policy.targetId, targetName: policy.targetName, workspaceId: policy.workspaceId },
        text: `Morgan · ${store.project.name}\nNightly maintenance completed: ${capped(summary)}\nVerified against the project's nightly gate; saved in the Office.`,
        createdAt: store.clock.now().toISOString(), status: 'queued', detail: 'Maintenance completion is saved. Slack DM queued.' });
}
