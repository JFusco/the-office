import { expect, test } from 'vitest';
import { requestAssessment } from '../../../../server/features/questions/assess-command';
import { openAssessment, closeAssessment, assessmentEpisodes } from '../../../../server/features/handoff/disposition-store';
import { handoffFixture } from './fixture';

test('explicit reassessment preserves a historical deadline episode and creates one fresh episode', () => {
    const fixture = handoffFixture();
    try {
        fixture.store.state.coordination!.listener.assigned.push({ key: 'GH-1', updated: 'v1' } as any);
        const old = openAssessment(fixture.store, 'GH-1', 'v1', true);
        closeAssessment(fixture.store, old, 'ordinary-by-deadline');
        const next = requestAssessment(fixture.store, 'GH-1');
        expect(next.episodeId).not.toBe(old.id);
        expect(requestAssessment(fixture.store, 'GH-1').episodeId).toBe(next.episodeId);
        expect(assessmentEpisodes(fixture.store)).toHaveLength(2);
        expect(assessmentEpisodes(fixture.store)[0].outcome).toBe('ordinary-by-deadline');
    } finally { fixture.close(); }
});

test('an explicit ordinary Start remains terminal when assessment is requested again', () => {
    const fixture = handoffFixture();
    try {
        const old = openAssessment(fixture.store, 'GH-1', 'v1', true);
        closeAssessment(fixture.store, old, 'ordinary-by-start');
        expect(requestAssessment(fixture.store, 'GH-1')).toEqual({ episodeId: old.id, outcome: 'ordinary-by-start' });
        expect(assessmentEpisodes(fixture.store)).toHaveLength(1);
    } finally { fixture.close(); }
});
