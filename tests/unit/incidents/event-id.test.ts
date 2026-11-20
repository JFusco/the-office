import { expect, test } from 'vitest';
import { eventId } from '../../../server/incidents/event-id';

test('an event with no parts is named by its incident and kind alone', () => {
    expect(eventId('inc-1', 'incident-observed')).toBe('inc-1:incident-observed');
});

test('the same parts always name the same event, and any different part names another', () => {
    const id = eventId('inc-1', 'subject-observed', 'brain/delivery/job-1', 'r1');
    expect(id).toMatch(/^inc-1:subject-observed:[0-9a-f]{16}$/);
    expect(eventId('inc-1', 'subject-observed', 'brain/delivery/job-1', 'r1')).toBe(id);
    expect(eventId('inc-1', 'subject-observed', 'brain/delivery/job-1', 'r2')).not.toBe(id);
    expect(eventId('inc-1', 'subject-observed', 'brain/delivery/job-2', 'r1')).not.toBe(id);
    expect(eventId('inc-1', 'subject-cleared', 'brain/delivery/job-1', 'r1')).not.toBe(id);
    expect(eventId('inc-2', 'subject-observed', 'brain/delivery/job-1', 'r1')).not.toBe(id);
});
