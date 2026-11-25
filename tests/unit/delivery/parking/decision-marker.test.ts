import { expect, test } from 'vitest';
import { decisionMarker } from '../../../../server/delivery/parking/decision-marker';

test('the persisted decision marker binds the job and its step count', () => {
    const step = { stage: 'lead-pr', result: {} as Parameters<typeof decisionMarker>[0]['steps'][number]['result'] };
    expect(decisionMarker({ id: 'GH-5-job', steps: [] })).toBe('Office decision GH-5-job:0');
    expect(decisionMarker({ id: 'GH-5-job', steps: [step, step] })).toBe('Office decision GH-5-job:2');
});
