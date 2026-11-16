import { describe, expect, it } from 'vitest';
import { workGroup } from '../../../server/telemetry/work-group';

describe('workGroup', () => {
    it('reads bare maintenance stage names as maintenance on GitHub projects only', () => {
        expect(workGroup('draft-pr', 'github')).toBe('maintenance');
        expect(workGroup('follow-up', 'github')).toBe('maintenance');
        expect(workGroup('draft-pr', 'azure')).toBe('delivery');
        expect(workGroup('github-draft', 'github')).toBe('delivery');
    });
    it('matches delivery stages exactly before any recovery pattern', () => {
        expect(workGroup('github-implement')).toBe('delivery');
        expect(workGroup('ci-recovery')).toBe('delivery');
        expect(workGroup('retest')).toBe('delivery');
    });
    it('treats read-backs and reconciliations of any domain as readback', () => {
        expect(workGroup('maintenance-readback')).toBe('readback');
        expect(workGroup('conversation-readback')).toBe('readback');
        expect(workGroup('ci-recovery-original-readback')).toBe('readback');
        expect(workGroup('candidate-adoption')).toBe('readback');
    });
    it('groups the remaining support work by purpose', () => {
        expect(workGroup('knowledge-slack-intake')).toBe('knowledge');
        expect(workGroup('brain-maintenance')).toBe('maintenance');
        expect(workGroup('package-verification')).toBe('maintenance');
        expect(workGroup('feature-research')).toBe('planning');
        expect(workGroup('deferred-conversation')).toBe('messaging');
        expect(workGroup('assignment-review')).toBe('intake');
        expect(workGroup('slack-send')).toBe('messaging');
        expect(workGroup('daily-cto')).toBe('leadership');
        expect(workGroup('it-investigation')).toBe('it');
        expect(workGroup('something-new')).toBe('other');
    });
});
