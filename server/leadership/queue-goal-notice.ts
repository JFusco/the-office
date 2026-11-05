import type { ProjectGoal } from '../../src/shared';
import type { Store } from '../store/store';

/** Called in the same saved state change as the goal transition; never scans old completions. */
export function queueGoalNotice(store: Store, previous: ProjectGoal['status'] | undefined, goal: ProjectGoal, acceptedBy: 'Joe' | 'Avery' | 'Office') {
    const state = store.state.coordination?.notices, policy = state?.policy.goals;
    if (goal.status !== 'done') {
        for (const notice of state?.entries || []) if (notice.kind === 'goal' && notice.goalId === goal.id && notice.status === 'queued') {
            notice.status = 'cancelled'; notice.detail = 'Goal reopened before the completion message was sent.';
        }
        return;
    }
    if (previous === 'done' || !state || !policy?.enabled || !policy.enabledAt || goal.projectId !== store.project.id || goal.mapping !== 'mapped') return;
    const event = `goal-completed:${store.project.id}:${goal.id}:${goal.updatedAt}`;
    if (state.entries.some(notice => notice.event === event)) return;
    state.entries.push({ kind: 'goal', id: event, event, goalId: goal.id, goalTitle: goal.title, completedAt: goal.updatedAt, policyVersion: policy.version,
        key: '', identity: policy.targetId, email: '', resolved: { targetId: policy.targetId, targetName: policy.targetName, workspaceId: policy.workspaceId },
        text: `Avery · ${store.project.name}\nGoal completed: ${goal.title}\n${acceptedBy === 'Joe' ? 'Accepted by Joe.' : acceptedBy === 'Avery' ? 'Verified by Avery against the saved goal and delivery evidence.' : 'Completion recorded by the Office.'}\nSaved under Completed in the Office.`,
        createdAt: store.clock.now().toISOString(), status: 'queued', detail: 'Goal completion is saved. Slack DM queued.' });
}
