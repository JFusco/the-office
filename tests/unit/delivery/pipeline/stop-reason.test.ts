import { describe, expect, it } from 'vitest';
import { classifyStop, stopReason } from '../../../../server/delivery/pipeline/stop-reason';
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

    it('labels a pause only when nothing more specific is known, and leaves the rest unclassified', () => {
        expect(classifyStop(new Error('Stage stopped'), true)).toBe('paused');
        expect(classifyStop(new EffectUncertainError('merge:1', 'cannot be resent'), true)).toBe('uncertain-effect');
        expect(classifyStop(new CurrentChecksWait('running'), true)).toBe('provider-checks');
        expect(classifyStop(new Error('Candidate changed since independent review'))).toBe('unclassified');
        expect(classifyStop('plain text')).toBe('unclassified');
    });
});

describe('stopReason', () => {
    it('saves the kind with the harness clock time', () => {
        expect(stopReason(new SourceClosed('closed'), false, new Date('2026-11-15T12:00:00Z'))).toEqual({ kind: 'source-closed', at: '2026-11-15T12:00:00.000Z' });
    });
});
