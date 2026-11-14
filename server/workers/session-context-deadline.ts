export type ContextReadPhase = 'snapshot' | 'fold' | 'identity';

/** Only bounded diagnostic metadata; no paths, native errors or transcript text. */
export class SessionContextDeadline extends Error {
    readonly session: string;
    readonly elapsedMS: number;
    readonly phase: ContextReadPhase | 'unavailable';
    readonly phaseMS: number;
    readonly activeMS: number;
    readonly idleMS: number;
    readonly bytes: number;
    constructor(id: string, phase: ContextReadPhase, elapsed: number, bytes: number,
        timing: { phaseMS: number; activeMS: number; idleMS: number } = { phaseMS: elapsed, activeMS: 0, idleMS: 0 }) {
        super('Session context scan exceeded its read deadline');
        const bounded = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.round(value))) : 0;
        this.session = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) ? id : 'unavailable';
        this.phase = ['snapshot', 'fold', 'identity'].includes(phase) ? phase : 'unavailable';
        this.elapsedMS = bounded(elapsed); this.bytes = bounded(bytes);
        this.phaseMS = bounded(timing.phaseMS); this.activeMS = bounded(timing.activeMS); this.idleMS = bounded(timing.idleMS);
    }
}
