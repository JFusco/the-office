import { afterEach, expect, test } from 'vitest';
import { attemptsBegunBy, ticketAttempts, ticketProgress } from '../../../../server/incidents/repair/ticket-progress';
import type { Store } from '../../../../server/store/store';
import type { Stage } from '../../../../src/shared';
import { projectStore } from '../incident-fixture';
import { ticket } from './ticket-resume-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function cec(...keys: string[]) { const s = projectStore('cec'); stores.push(s); s.state.tickets = keys.map(key => ticket(key)); return s; }
/** One stage attempt of a ticket: begun, and ended with `outcome` when one is given. */
const attempt = (s: Store, key: string, stage: Stage, outcome?: string) => { const id = s.begin(s.state.tickets.find(held => held.key === key)!, stage); if (outcome) s.finish(id, { outcome } as never); return id; };

test('a ticket is read as a job is: its stage, and one step per stage attempt in the order they were saved', () => {
    const s = cec('CEC-1', 'CEC-2');
    expect(ticketProgress(s, 'CEC-1')).toEqual({ stage: 'qa', status: 'blocked', steps: [] });
    attempt(s, 'CEC-1', 'implement', 'passed'); attempt(s, 'CEC-2', 'qa', 'passed'); attempt(s, 'CEC-1', 'qa', 'blocked'); attempt(s, 'CEC-1', 'qa');
    expect(ticketProgress(s, 'CEC-1')).toEqual({ stage: 'qa', status: 'blocked', steps: [{ stage: 'implement', result: { outcome: 'passed' } }, { stage: 'qa', result: { outcome: 'blocked' } }, { stage: 'qa', result: { outcome: 'running' } }] });
    expect(ticketProgress(s, 'CEC-2')!.steps).toEqual([{ stage: 'qa', result: { outcome: 'passed' } }]);
    // An attempt that ends later keeps the place it began at.
    const first = attempt(s, 'CEC-2', 'retest'); attempt(s, 'CEC-2', 'publish', 'passed'); s.finish(first, { outcome: 'failed' } as never);
    expect(ticketProgress(s, 'CEC-2')!.steps.map(step => [step.stage, step.result.outcome])).toEqual([['qa', 'passed'], ['retest', 'failed'], ['publish', 'passed']]);
});

test('a ticket is completed at the stage complete and at no other, is never cancelled, and one the project does not hold is no progress', () => {
    const s = cec('CEC-1');
    for (const [stage, activity, status] of [['complete', 'idle', 'completed'], ['ready-for-staging', 'waiting', 'waiting'], ['publish', 'working', 'working'], ['qa', 'idle', 'idle']]) {
        Object.assign(s.state.tickets[0], { stage, activity });
        expect(ticketProgress(s, 'CEC-1')).toMatchObject({ stage, status });
    }
    expect(ticketProgress(s, 'CEC-9')).toBeUndefined();
});

test('a ticket\'s attempts are counted for that ticket alone, and those begun by an instant are told from the later ones', () => {
    const s = cec('CEC-1', 'CEC-2');
    expect(ticketAttempts(s, 'CEC-1')).toBe(0);
    attempt(s, 'CEC-1', 'qa', 'blocked'); attempt(s, 'CEC-2', 'qa', 'passed'); attempt(s, 'CEC-1', 'qa');
    expect([ticketAttempts(s, 'CEC-1'), ticketAttempts(s, 'CEC-2'), ticketAttempts(s, 'CEC-9')]).toEqual([2, 1, 0]);
    const began = (s.db.prepare("SELECT json_extract(body,'$.startedAt') AS at FROM attempts WHERE ticket='CEC-1' ORDER BY rowid").all() as { at: string }[]).map(row => row.at);
    expect(attemptsBegunBy(s, 'CEC-1', began[1])).toBe(2);
    expect(attemptsBegunBy(s, 'CEC-1', new Date(Date.parse(began[0]) - 1).toISOString())).toBe(0);
    expect(attemptsBegunBy(s, 'CEC-2', '9999-01-01T00:00:00.000Z')).toBe(1);
    // Reading changes nothing.
    expect(ticketAttempts(s, 'CEC-1')).toBe(2);
});
