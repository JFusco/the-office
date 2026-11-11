import { expect, test } from 'vitest';
import { itFollowUpView, sessionVisibilityCopy } from '../../../src/health/it-follow-up-view';
import type { ITFollowUp, ITState } from '../../../src/shared';

const warning: ITFollowUp = { id: 'original-case', owner: 'Morgan', detail: 'Original technical diagnostic' };
const state = { investigations: [{ id: warning.id, status: 'blocked', attempts: 3, updatedAt: '2026-11-08T10:00:00Z', source: { failureKind: 'surviving-subprocesses' }, report: { officeFix: { status: 'blocked' } } }] } as ITState;

test('only positively matched blocked shutdown investigations are grouped; history and counts stay unchanged', () => {
    const before = structuredClone(state), current = { id: 'session-visibility', owner: 'Morgan', detail: 'Current failure' } as ITFollowUp;
    expect(itFollowUpView(state, [warning, current])).toEqual({ current: [current], investigations: [{ followUp: warning, entry: state.investigations![0] }] });
    expect(state).toEqual(before);
});

test('unknown, working, other failure kinds and explicit human follow-ups stay visible as current follow-ups', () => {
    expect(itFollowUpView({} as ITState, [warning]).current).toEqual([warning]);
    for (const change of [{ status: 'working' }, { source: { failureKind: 'transient-read' } }, { report: { officeFix: { status: 'proposed' } } }]) {
        const it = { ...state, investigations: [{ ...state.investigations![0], ...change }] } as ITState;
        expect(itFollowUpView(it, [warning]).investigations).toEqual([]);
    }
    const human = { ...warning, owner: 'You' as const };
    expect(itFollowUpView(state, [human]).current).toEqual([human]);
    expect(sessionVisibilityCopy({ ...human, id: 'session-visibility' })).toBeUndefined();
});

test('IT-owned session recovery retains its raw owner and retry status', () => {
    expect(sessionVisibilityCopy({ id: 'session-visibility', owner: 'IT', detail: 'Read-only recovery 1/3 did not finish; retry scheduled.' })).toBeUndefined();
});
test('Brain and CMS describe optional context while the unchanged CEC gate remains explicit', () => {
    const followUp: ITFollowUp = { id: 'session-visibility', owner: 'Morgan', detail: 'Current unavailable source' };
    for (const project of ['brain', 'cms-field-vocabulary']) {
        const copy = sessionVisibilityCopy(followUp, project)!;
        expect(copy.title).toBe('Optional chat context unavailable');
        expect(copy.explanation).toContain('assignments and holds');
        expect(copy.explanation).not.toContain('waits for a complete check');
    }
    expect(sessionVisibilityCopy(followUp, 'cec')!.explanation).toContain('waits for a complete check');
    expect(followUp.detail).toBe('Current unavailable source');
});
