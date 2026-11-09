import type { Store } from '../store/store';
import { learningDigest } from './learning-events';
/** Unknown create identity fences new intake, never existing owned delivery. */
export function improvementIntakeGate(store: Store, key: string) {
    const items = store.state.knowledge?.improvements || [];
    const version = learningDigest(items.map(item => [item.id, item.status, item.providerId, item.digest]));
    const existing = store.state.coordination?.jobs?.some(job => job.key === key && job.status !== 'cancelled' && (job.steps?.length || 0) > 0) || store.state.tickets.some(ticket => ticket.key === key && ticket.pilot);
    if (existing) return { allowed: true, reason: '', version };
    const pending = items.find(item => ['reserved', 'publishing', 'uncertain'].includes(item.status) && (!item.providerId || item.providerId === key));
    return { allowed: !pending, reason: pending ? 'Morgan is reconciling Harper improvement publication before new admission' : '', version };
}
