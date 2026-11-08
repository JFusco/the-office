import { expect, test } from 'vitest';
import { lifecycleFacts } from '../../../../server/workers/lifecycle/facts';
import { diagnostic } from './fixture';
test('investigation projection validates artifacts, strips private additions and bounds packet facts', () => {
    const d = diagnostic(); d.events = Array(24).fill(d.events[0]); d.snapshots[0].members = Array(8).fill(d.snapshots[0].members[0]);
    const facts = lifecycleFacts({ ...d, transcript: 'PRIVATE' })!;
    expect(facts.events).toHaveLength(12); expect(facts.snapshots[0].members).toHaveLength(4); expect(facts.snapshots[0].omittedMembers).toBe(4);
    expect(JSON.stringify(facts)).not.toContain('PRIVATE'); expect(lifecycleFacts({ version: 1 })).toBeUndefined();
});
