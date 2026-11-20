import { Effects } from '../../store/effects';
import { likePrefix } from '../../store/like-prefix';
import type { Store } from '../../store/store';

/** An attempted write is read as not landed only after this long, so one still in flight is never raced. */
export const NOT_LANDED_SETTLE_MS = 10 * 60 * 1000;

/**
 * For an absolute write only (one that cannot apply twice, and whose read-back excludes its having
 * applied): settles the attempted intent `id` as not landed when the caller's read says so, the attempt
 * has had time to settle, and no earlier attempt under `base` was already settled that way. True when it
 * did, and the caller may then dispatch once under a fresh intent. A second miss returns false: that one
 * is not sent again and stays with a person.
 */
export async function settleNotLanded(store: Store, base: string, id: string, notLanded: () => Promise<boolean>): Promise<boolean> {
    const intent = store.getEffect(id);
    if (!intent || !['dispatching', 'uncertain'].includes(intent.status) || !intent.dispatchedAt) return false;
    if (store.clock.now().getTime() - Date.parse(intent.dispatchedAt) < NOT_LANDED_SETTLE_MS) return false;
    const earlier = (store.db.prepare("SELECT body FROM effects WHERE id=? OR id LIKE ? ESCAPE '\\'").all(base, likePrefix(`${base}:`)) as { body: string }[]).map(row => JSON.parse(row.body));
    if (earlier.some(effect => effect.notLandedAt) || !await notLanded()) return false;
    new Effects(store).notLanded(id, 'the target still shows the state from before the attempt');
    return true;
}
