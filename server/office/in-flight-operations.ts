/**
 * Counts operations that began before a deployment took the fence and can still admit work: an Office tick
 * awaiting its reads, or an HTTP write that already passed the fence gate. Health stays `busy` until they end.
 */
export class InFlightOperations {
    private active = 0;
    get count(): number { return this.active; }
    /** Registers one operation synchronously; the returned function ends it, once. */
    begin(): () => void {
        this.active++;
        let ended = false;
        return () => { if (!ended) { ended = true; this.active--; } };
    }
    async run<T>(operation: () => Promise<T>): Promise<T> {
        const end = this.begin();
        try { return await operation(); } finally { end(); }
    }
}
