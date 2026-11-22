import type { StoreTimings } from '../store/store-timings';

/**
 * Runs one named step of a service timer, adding the time it held the main thread to `timings`. A step that
 * returns a promise is timed only up to its first `await`, so its name ends in "(start)"; work after an `await`
 * is not attributed here. Store work done inside a step is also counted in that store's own timings, so the two
 * sets overlap, and a `timer:` total includes the `pump:` or `tick:` steps run inside it. Measurement only: the
 * step's result and any error pass through unchanged, and an Office built without timings runs the step untimed.
 */
export function timedStep<T>(timings: StoreTimings | undefined, name: string, work: () => T): T {
    return timings ? timings.time(name, work) : work();
}
