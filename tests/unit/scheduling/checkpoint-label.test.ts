import { expect, test } from 'vitest';
import { checkpointLabel } from '../../../server/scheduling/checkpoint-label';
import { checkpointWindow } from '../../../server/scheduling/coordination';
import { resolveProjectPolicy } from '../../../server/office/project-policy';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';

test('the label states the days and the Eastern hour on a 12-hour clock', () => {
    expect(checkpointLabel({ hour: 9, weekends: false })).toBe('Weekdays · 9:00 AM America/New_York');
    expect(checkpointLabel({ hour: 15, weekends: true })).toBe('Daily · 3:00 PM America/New_York');
    expect(checkpointLabel({ hour: 0, weekends: true })).toBe('Daily · 12:00 AM America/New_York');
    expect(checkpointLabel({ hour: 12, weekends: false })).toBe('Weekdays · 12:00 PM America/New_York');
});

test('the three existing projects show the schedule they had before policy was configurable', () => {
    const schedule = (id: string) => { const store = new Store(':memory:', projectById(id)); try { return store.state.intake.schedule; } finally { store.close(); } };
    expect(schedule('cec')).toBe('Weekdays · 9:00 AM America/New_York');
    expect(schedule('cms-field-vocabulary')).toBe('Daily · 3:00 PM America/New_York · deeper review due Monday');
    expect(schedule('brain')).toBe('Daily · 5:00 PM America/New_York');
});

test('a configured checkpoint moves the due time and the weekend rule together', () => {
    // Saturday 2026-10-31, 18:00 UTC is 14:00 Eastern (EDT).
    const saturday = new Date('2026-10-31T18:00:00Z'), activated = '2026-10-28T12:00:00Z';
    const policy = (input: Parameters<typeof resolveProjectPolicy>[1]) => resolveProjectPolicy({ id: 'web', provider: 'github' }, input).checkpoint;
    expect(checkpointWindow(policy({ checkpoint: { hour: 13 } }), saturday, activated).due?.date).toBe('2026-10-31');
    expect(checkpointWindow(policy({ checkpoint: { hour: 13, weekends: false } }), saturday, activated).due?.date).toBe('2026-10-30');
    expect(checkpointWindow(policy({ checkpoint: { hour: 15 } }), saturday, activated)).toMatchObject({ due: { date: '2026-10-30' }, next: '2026-10-31T19:00:00.000Z' });
    // After the DST change on 2026-11-01 the same wall-clock hour is one UTC hour later.
    expect(checkpointWindow(policy({ checkpoint: { hour: 15 } }), new Date('2026-11-02T12:00:00Z'), activated).next).toBe('2026-11-02T20:00:00.000Z');
});
