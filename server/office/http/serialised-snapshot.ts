import type { StoreTimings } from '../../store/store-timings';

/**
 * The text of a snapshot that is already built, timed and sized under its own name. Building and redacting the
 * snapshot is timed separately, where it is built: this figure is the serialisation alone.
 */
export function serialisedSnapshot(store: { timings: StoreTimings }, snapshot: unknown, purpose: 'a request' | 'a push'): string {
    return store.timings.time(`browser snapshot: serialise for ${purpose}`, () => JSON.stringify(snapshot), text => text.length);
}
