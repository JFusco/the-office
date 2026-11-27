import { describe, expect, it } from 'vitest';
import { APPROACH_GUARD_REJECTION, recordJobApproach } from '../../../../server/delivery/pipeline/approach';
import { classifyStop, stopReason } from '../../../../server/delivery/pipeline/stop-reason';
import type { TicketJob } from '../../../../src/shared';
import { SourceClosed } from '../../../../server/delivery/pipeline/source-closed';
import { CurrentChecksWait } from '../../../../server/delivery/readiness/github-check-selection';
import { EffectUncertainError } from '../../../../server/store/effects';
import { CommandFailure } from '../../../../server/workers/process';

describe('classifyStop', () => {
    it('classifies by error type before wording', () => {
        expect(classifyStop(new CurrentChecksWait('Current-head checks are still running'))).toBe('provider-checks');
        expect(classifyStop(new SourceClosed('Issue is closed'))).toBe('source-closed');
        expect(classifyStop(new EffectUncertainError('merge:1', 'cannot be resent'))).toBe('uncertain-effect');
        expect(classifyStop(new CommandFailure('timed out', 'transient-read', false))).toBe('transient');
        expect(classifyStop(new CommandFailure('surviving subprocesses', 'uncertain-effect', true, 'surviving-subprocesses'))).toBe('uncertain-effect');
        expect(classifyStop(new CommandFailure('HTTP 403', 'permission', false))).toBe('authority');
        expect(classifyStop(new CommandFailure('aborted', 'cancelled', false))).toBe('paused');
        expect(classifyStop(new CommandFailure('Worker paused; reconcile any external effects', 'cancelled', true))).toBe('uncertain-effect');
    });

    it('recognises holds, uncertain writes and temporary reads from known wording', () => {
        expect(classifyStop(new Error('GH-5 is held: waiting for approval'))).toBe('hold');
        expect(classifyStop(new Error('Continuation is paused or held'))).toBe('hold');
        expect(classifyStop(new Error('Prior merge attempt needs read-back; it will not be repeated'))).toBe('uncertain-effect');
        expect(classifyStop(new Error('gh exited 1: HTTP 502'))).toBe('transient');
    });

    it('never treats a hold, permission or uncertain write as a temporary read', () => {
        expect(classifyStop(new Error('permission denied after timeout'))).toBe('unclassified');
        expect(classifyStop(new Error('uncertain effect after connection reset'))).toBe('uncertain-effect');
    });

    it('leaves the approach guard\'s exact rejection unclassified, as thrown, as saved and bare; longer wording and a typed uncertain effect stay uncertain', () => {
        let thrown: unknown;
        // The guard's own refusal: a reduced approach after a failed worker.
        try { recordJobApproach({ id: 'job1', key: 'GH-1', stage: 'implement', steps: [] } as unknown as TicketJob, { plan: 'brief', review: 'focused', validation: 'developer-checks', checks: ['pnpm test'], reason: 'Small.' }, 'developer', true); }
        catch (error) { thrown = error; }
        expect(thrown).toBeInstanceOf(Error);
        expect((thrown as Error).message).toBe(APPROACH_GUARD_REJECTION);
        expect(classifyStop(thrown)).toBe('unclassified');
        // The text a blocked job saves (`String(error)`), and the bare message.
        expect(classifyStop(String(thrown))).toBe('unclassified');
        expect(classifyStop(`Error: ${APPROACH_GUARD_REJECTION}`)).toBe('unclassified');
        expect(classifyStop(APPROACH_GUARD_REJECTION)).toBe('unclassified');
        expect(stopReason(thrown, false, new Date('2026-11-15T12:00:00Z'))).toEqual({ kind: 'unclassified', at: '2026-11-15T12:00:00.000Z' });
        // Anything more than the exact message keeps the uncertain-write rule.
        expect(classifyStop(new Error(`${APPROACH_GUARD_REJECTION}; the merge needs read-back`))).toBe('uncertain-effect');
        expect(classifyStop(new Error('Prior publication cannot be resent'))).toBe('uncertain-effect');
        // A type says more than the words it carries.
        expect(classifyStop(new EffectUncertainError('merge:1', APPROACH_GUARD_REJECTION))).toBe('uncertain-effect');
    });

    it('labels a pause only when nothing more specific is known, and leaves the rest unclassified', () => {
        expect(classifyStop(new Error('Stage stopped'), true)).toBe('paused');
        expect(classifyStop(new EffectUncertainError('merge:1', 'cannot be resent'), true)).toBe('uncertain-effect');
        expect(classifyStop(new CurrentChecksWait('running'), true)).toBe('provider-checks');
        expect(classifyStop(new Error('Candidate changed since independent review'))).toBe('unclassified');
        expect(classifyStop('plain text')).toBe('unclassified');
    });
});

describe('classifyStop for transient GitHub reads', () => {
    it('saves every gh status a later read can outlast as transient, GH-376\'s exact text included', () => {
        expect(classifyStop(new Error('gh exited 1: gh: HTTP 499'))).toBe('transient');
        for (const status of ['408', '429', '499', '500', '502', '503', '504']) {
            expect(classifyStop(new Error(`gh exited 1: gh: HTTP ${status}`)), status).toBe('transient');
            expect(classifyStop(new CommandFailure(`gh exited 1: gh: HTTP ${status}`, 'other', true)), status).toBe('transient');
        }
        expect(classifyStop(new CommandFailure('gh exited 1: gh: Resource not accessible by integration (HTTP 403)', 'permission', true))).toBe('authority');
        expect(classifyStop(new Error('gh exited 1: gh: Resource not accessible by integration (HTTP 403)'))).toBe('unclassified');
    });

    it('classifies a write\'s uncertainty before any temporary read, typed or worded', () => {
        // The wording harnessEffect uses after a failed read-back.
        expect(classifyStop(new Error('github-pr-create for JFusco/x:codex/5 is unverified after read-back; it will not be resent'))).toBe('uncertain-effect');
        // A typed transient read whose words say a write is unconfirmed is not a read.
        expect(classifyStop(new CommandFailure('gh read timed out; previous action outcome needs read-back', 'transient-read', true))).toBe('uncertain-effect');
        expect(classifyStop(new CommandFailure('Board transition needs read-back: gh: HTTP 499', 'transient-read', true))).toBe('uncertain-effect');
        // A failed write carrying the same HTTP text keeps its uncertainty.
        expect(classifyStop(new CommandFailure('gh exited 1: gh: HTTP 499', 'uncertain-effect', true))).toBe('uncertain-effect');
        expect(classifyStop(new Error('Board transition needs read-back: gh: HTTP 499'))).toBe('uncertain-effect');
        // The approach guard's exact rejection is still excepted.
        expect(classifyStop(APPROACH_GUARD_REJECTION)).toBe('unclassified');
    });
});

describe('stopReason', () => {
    it('saves the kind with the harness clock time', () => {
        expect(stopReason(new SourceClosed('closed'), false, new Date('2026-11-15T12:00:00Z'))).toEqual({ kind: 'source-closed', at: '2026-11-15T12:00:00.000Z' });
    });
});
