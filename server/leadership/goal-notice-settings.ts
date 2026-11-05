import { z } from 'zod';
import type { Store } from '../store/store';
import { noticeState } from '../conversations/notifications';

const Settings = z.object({ enabled: z.boolean(), targetId: z.string().regex(/^U[A-Z0-9]+$/), targetName: z.string().trim().min(1).max(100), workspaceId: z.string().regex(/^T[A-Z0-9]+$/) }).strict();
export function configureGoalNotices(store: Store, input: unknown) {
    const settings = Settings.parse(input), state = noticeState(store), old = state.policy.goals;
    if (old && Object.entries(settings).every(([key, value]) => old[key as keyof typeof old] === value)) return;
    state.policy.goals = { ...settings, enabledAt: settings.enabled ? store.clock.now().toISOString() : '', version: crypto.randomUUID() };
    for (const notice of state.entries) if (notice.kind === 'goal' && notice.status === 'queued') {
        notice.status = 'cancelled'; notice.detail = 'Goal notification settings changed before sending.';
    }
    store.emit('goal-notices-configured', `Avery’s goal-completion Slack DMs ${settings.enabled ? `enabled for ${settings.targetName}` : 'disabled'} in ${store.project.name}.`, 'cto');
}
