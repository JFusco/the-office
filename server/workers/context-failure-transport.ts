import { ContextReadChanged } from './session-context-lines';
import { SessionContextDeadline, type ContextReadPhase } from './session-context-deadline';

/** What `sessionInventoryFailureDetail` reads from a reader failure, as plain data a thread can post. */
export interface PackedContextFailure {
    message: string;
    code?: string;
    changed?: true;
    deadline?: { session: string; phase: string; elapsedMS: number; bytes: number; phaseMS: number; activeMS: number; idleMS: number };
}

export function packContextFailure(error: unknown): PackedContextFailure {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    return {
        message, ...(code ? { code } : {}),
        ...(error instanceof ContextReadChanged ? { changed: true as const } : {}),
        ...(error instanceof SessionContextDeadline ? { deadline: { session: error.session, phase: error.phase, elapsedMS: error.elapsedMS,
            bytes: error.bytes, phaseMS: error.phaseMS, activeMS: error.activeMS, idleMS: error.idleMS } } : {}),
    };
}

/** The same failure class and fields on the receiving side, so it is classified exactly as it would have been. */
export function unpackContextFailure(packed: PackedContextFailure): Error {
    if (packed.changed) return new ContextReadChanged(packed.message);
    const timing = packed.deadline;
    if (timing) return new SessionContextDeadline(timing.session, timing.phase as ContextReadPhase, timing.elapsedMS, timing.bytes, timing);
    return Object.assign(new Error(packed.message), packed.code ? { code: packed.code } : {});
}
