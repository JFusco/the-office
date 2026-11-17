import { expect, test } from 'vitest';
import { resolveBlockedTransition } from '../../../../server/cec/parking/blocked-transition';

const offering = (transitions: any[]) => { const calls: any[] = []; const execute: any = async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return JSON.stringify({ data: { transitions } }); }; return { execute, calls }; };
const blocked = { id: '131', name: 'Blocked', toName: 'Blocked', fields: [{ fieldId: 'assignee', required: false }] };

test('the Blocked transition id is read from Jira for that issue with a read-only discovery', async () => {
    const jira = offering([{ id: '291', name: 'QA', toName: 'QA', fields: [] }, blocked]);
    expect(await resolveBlockedTransition(jira.execute, 'CEC-900')).toBe('131');
    expect(jira.calls).toHaveLength(1);
    expect(jira.calls[0].options.readOnly).toBe(true);
    expect(jira.calls[0].args.slice(0, 5)).toEqual(['jira', 'workitem', 'transition', '--id', 'CEC-900']);
    expect(jira.calls[0].args).not.toContain('--transition-id');
    expect(await resolveBlockedTransition(offering([{ ...blocked, fields: [{ fieldId: 'comment', required: true }] }]).execute, 'CEC-900')).toBe('131');
});

test('a missing, ambiguous or field-requiring Blocked transition is refused, and a failed read is not guessed around', async () => {
    await expect(resolveBlockedTransition(offering([{ id: '291', toName: 'QA' }]).execute, 'CEC-900')).rejects.toThrow('0 transitions to Blocked');
    await expect(resolveBlockedTransition(offering([blocked, { ...blocked, id: '132' }]).execute, 'CEC-900')).rejects.toThrow('2 transitions to Blocked');
    await expect(resolveBlockedTransition(offering([{ ...blocked, fields: [{ fieldId: 'resolution', required: true }] }]).execute, 'CEC-900')).rejects.toThrow('requires fields');
    await expect(resolveBlockedTransition((async () => { throw new Error('Jira unavailable'); }) as any, 'CEC-900')).rejects.toThrow('Jira unavailable');
});
