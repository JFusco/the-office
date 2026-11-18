import { expect, test } from 'vitest';
import { followUpStatus, outstandingFollowUps } from '../../../../src/health/outstanding-follow-ups';
import { itAgent } from '../../../../src/health/it-agent';
import { itDiagnostics } from '../../../../src/health/it-diagnostics';
import type { ITFollowUp } from '../../../../src/shared';

const watch: ITFollowUp = { id: 'session-visibility', owner: 'IT', detail: 'Ellis keeps reading the session inventory.', routine: true };
const probe: ITFollowUp = { id: 'probe:anthropic', owner: 'IT', detail: 'Status check timed out.', routine: true };
const retry: ITFollowUp = { id: 'board', owner: 'IT', detail: 'Read-only recovery 1/3 did not finish; retry scheduled.' };
const team: ITFollowUp = { id: 'closeout:1', owner: 'Morgan', detail: 'Inspect the closeout.' };

test('routine follow-ups are listed but not counted, and never make Ellis look busy', () => {
    expect(outstandingFollowUps([watch, probe])).toEqual([]);
    expect(outstandingFollowUps([watch, retry, probe, team])).toEqual([retry, team]);
    expect(followUpStatus([watch, probe])).toBe('monitoring');
    expect(followUpStatus([watch, retry])).toBe('retrying');
    expect(followUpStatus([probe, team])).toBe('needs-attention');
    // Anything addressed to Joe is counted however it is flagged.
    const forJoe: ITFollowUp = { id: 'session-visibility', owner: 'You', detail: 'Sign in again.', routine: true };
    expect(outstandingFollowUps([forJoe])).toEqual([forJoe]);
    expect(followUpStatus([forJoe])).toBe('needs-attention');
});

test('Ellis shows no follow-up when only routine notes remain, and counts only what is outstanding', () => {
    const at = Date.parse('2026-11-18T14:00:00Z');
    const snapshot = (followUps: ITFollowUp[]) => ({ agents: [], project: { id: 'cec' }, it: { checkedAt: new Date(at).toISOString(), projectId: 'cec', followUps, reports: [] } }) as any;
    expect(itAgent(snapshot([watch, probe]), at)).toMatchObject({ activity: 'idle', task: 'No current IT follow-up.' });
    expect(itAgent(snapshot([watch, probe, retry]), at)).toMatchObject({ activity: 'working', task: '1 operational follow-up remain.' });
    expect(itAgent(snapshot([watch, team, retry]), at)).toMatchObject({ activity: 'blocked', task: '2 operational follow-ups remain.' });
    // The full list is still there to show.
    expect(itDiagnostics(snapshot([watch, probe, retry]).it, 'cec', at)).toMatchObject({ followUps: [watch, probe, retry], status: 'retrying' });
});
