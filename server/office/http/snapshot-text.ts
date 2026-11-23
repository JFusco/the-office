import { redactedText } from '../security';
import type { StoreTimings } from '../../store/store-timings';

/**
 * The redacted text of one project's snapshot, as it is sent to the browser. The snapshot is built, then redacted
 * and serialised in a single pass: the text is exactly what serialising the redacted object would give, without
 * building that object first. Both steps are timed under their own names, the second sized by the text sent.
 */
export function snapshotText(store: { timings: StoreTimings }, build: () => unknown, purpose: 'a request' | 'a push'): string {
    const snapshot = store.timings.time('browser snapshot: build', build);
    return store.timings.time(`browser snapshot: redact and serialise for ${purpose}`, () => redactedText(snapshot), text => text.length);
}
