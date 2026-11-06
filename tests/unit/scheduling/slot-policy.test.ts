import { expect, test } from 'vitest';
import { admitsWork, canDispatch, foreignWork } from '../../../server/scheduling/slot-policy';
import { officeCapacity } from '../../../server/office/projects';

const slot = (role?: 'developer' | 'lead' | 'qa' | 'pm') => ({ role });

test('limit 1 admits exactly one stage', () => {
    const capacity = officeCapacity(1);
    expect(canDispatch({ projectId: 'a', slot: slot('developer') }, capacity, false)).toBe(true);
    capacity.slots.set('a', { role: 'developer', exclusive: false });
    expect(canDispatch({ projectId: 'b', slot: slot('lead') }, capacity, false)).toBe(false);
});

test('one stage per project and one stage per role across projects', () => {
    const capacity = officeCapacity(3);
    capacity.slots.set('a', { role: 'developer', exclusive: false });
    expect(canDispatch({ projectId: 'a', slot: slot('lead') }, capacity, false)).toBe(false);
    expect(canDispatch({ projectId: 'b', slot: slot('developer') }, capacity, false)).toBe(false);
    expect(canDispatch({ projectId: 'b', slot: slot('lead') }, capacity, false)).toBe(true);
    capacity.slots.set('b', { role: 'lead', exclusive: false });
    expect(canDispatch({ projectId: 'c', slot: slot('qa') }, capacity, false)).toBe(true);
    capacity.slots.set('c', { role: 'qa', exclusive: false });
    expect(admitsWork(capacity)).toBe(false);
});

test('harness-only stages without a role still take a project slot', () => {
    const capacity = officeCapacity(2);
    capacity.slots.set('a', { role: undefined, exclusive: false });
    expect(canDispatch({ projectId: 'a', slot: slot() }, capacity, false)).toBe(false);
    expect(canDispatch({ projectId: 'b', slot: slot() }, capacity, false)).toBe(true);
});

test('exclusive work runs only alone and drains slotted admissions while it waits', () => {
    const capacity = officeCapacity(3);
    expect(canDispatch({ projectId: 'a' }, capacity, true)).toBe(true);
    capacity.slots.set('b', { role: 'lead', exclusive: false });
    expect(canDispatch({ projectId: 'a' }, capacity, true)).toBe(false);
    expect(canDispatch({ projectId: 'c', slot: slot('qa') }, capacity, true)).toBe(false);
    expect(canDispatch({ projectId: 'c', slot: slot('qa') }, capacity, false)).toBe(true);
    capacity.slots.clear();
    capacity.slots.set('a', { exclusive: true });
    expect(canDispatch({ projectId: 'b', slot: slot('lead') }, capacity, false)).toBe(false);
});

test('engine work outside the scheduler holds the office like the single lane did', () => {
    const capacity = officeCapacity(3);
    capacity.busy.add('a');
    expect(foreignWork(capacity)).toBe(true);
    expect(canDispatch({ projectId: 'b', slot: slot('lead') }, capacity, false)).toBe(false);
    capacity.busy.clear();
    capacity.active.set('pm', new AbortController());
    expect(foreignWork(capacity)).toBe(true);
    capacity.slots.set('a', { role: 'pm', exclusive: false });
    expect(foreignWork(capacity)).toBe(false);
    capacity.busy.add('a');
    expect(foreignWork(capacity)).toBe(false);
    expect(canDispatch({ projectId: 'b', slot: slot('pm') }, capacity, false)).toBe(false);
});
