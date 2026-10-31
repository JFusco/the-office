import { resolveProjectLabel } from '../store/migrations';
import { z } from 'zod';
import type { Store } from '../store/store';
import type { ProjectGoal } from '../../src/shared';
export const GoalInput = z.object({ id: z.string().uuid(), expectedUpdatedAt: z.string(), project: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(200), detail: z.string().max(6000), priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), status: z.enum(['idea', 'planned', 'active', 'blocked', 'done']) }).strict();
export function saveGoal(store: Store, input: unknown): ProjectGoal {
    const { expectedUpdatedAt, ...data } = GoalInput.parse(input), goals = store.state.goals ??= [], old = goals.find(g => g.id === data.id);
    if (resolveProjectLabel(data.project)?.id !== store.project.id)
        throw new Error('Goal label must match its owning configured project; relocation requires an explicit move');
    if (old && !expectedUpdatedAt && Object.entries(data).every(([k, v]) => old[k as keyof ProjectGoal] === v))
        return old;
    if (old ? old.updatedAt !== expectedUpdatedAt : !!expectedUpdatedAt)
        throw new Error('This goal changed. Reopen it before saving your edit.');
    const next: ProjectGoal = { ...data, projectId: store.project.id, mapping: 'mapped', progress: old?.progress, requestId: 'human', updatedAt: new Date(Math.max(Date.now(), old ? Date.parse(old.updatedAt) + 1 : 0)).toISOString() };
    if (old)
        Object.assign(old, next);
    else
        goals.push(next);
    store.emit('goals-updated', `Joe ${old ? 'updated' : 'added'} a goal for ${data.project}: ${data.title}`, 'cto');
    return old || next;
}
export function goalContext(store: Store) { return (store.state.goals || []).map(({ id, projectId, project, mapping, title, detail, priority, status, updatedAt, progress }) => ({ id, projectId, project, mapping, title, detail, priority, status, updatedAt, progress })); }
