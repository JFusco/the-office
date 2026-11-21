import { expect, test } from 'vitest';
import { GONE_READ_MS, readGoneTickets } from '../../../server/scheduling/assignment-poll';
import { projectById } from '../../../server/office/projects';

/** The part of a coordinator the read uses, with a recorded command runner. */
function coordinator(project: string, answer: () => string) {
    let now = Date.parse('2026-11-21T00:30:00Z');
    const calls: string[][] = [], events: string[] = [];
    const store = { project: projectById(project), clock: { now: () => new Date(now) }, emit: (_kind: string, message: string) => { events.push(message); } };
    const self = { store, execute: async (program: string, args: string[], options: any) => { calls.push([program, ...args, `readOnly=${options.readOnly}`]); return answer(); } };
    return { read: (keys: string[]) => readGoneTickets.call(self as any, keys), calls, events, advance: (ms: number) => { now += ms; } };
}
const issues = (...keys: string[]) => JSON.stringify({ ok: true, data: { issues: keys.map(key => ({ key })) } });

test('one read-only Jira search for exactly the asked-for tickets; only those it returns are confirmed', async () => {
    const c = coordinator('cec', () => issues('CEC-16', 'CEC-999'));
    expect([...await c.read(['CEC-16', 'CEC-19'])]).toEqual(['CEC-16']);
    expect(c.calls).toHaveLength(1);
    const [program, ...args] = c.calls[0];
    expect([program, args[0], args[1], args[2]]).toEqual(['twg', 'jira', 'workitem', 'query']);
    expect(args[args.indexOf('--jql') + 1]).toContain('key in (CEC-16, CEC-19) AND (resolution is not EMPTY OR assignee is EMPTY OR assignee != ');
    expect(args.at(-1)).toBe('readOnly=true');
    expect(c.events).toEqual([]);
});

test('the read is made at most once in ten minutes for a project', async () => {
    const c = coordinator('cec', () => issues());
    await c.read(['CEC-16']); await c.read(['CEC-16']);
    expect(c.calls).toHaveLength(1);
    c.advance(GONE_READ_MS);
    await c.read(['CEC-16']);
    expect(c.calls).toHaveLength(2);
});

test('a failed or unusable answer confirms nothing and is said once per distinct failure', async () => {
    for (const answer of [() => { throw new Error('twg exited 1'); }, () => 'not json', () => JSON.stringify({ ok: false, error: { message: 'bad key' } }), () => JSON.stringify({ ok: true, data: {} })]) {
        const c = coordinator('cec', answer as () => string);
        expect((await c.read(['CEC-16'])).size).toBe(0);
        c.advance(GONE_READ_MS);
        expect((await c.read(['CEC-16'])).size).toBe(0);
        expect(c.calls).toHaveLength(2);
        expect(c.events).toHaveLength(1);
        expect(c.events[0]).toContain('could not be checked against Jira, so none was closed');
    }
});

test('nothing is read for a GitHub project or when there is nothing to ask', async () => {
    const github = coordinator('brain', () => issues('GH-1'));
    expect((await github.read(['GH-1'])).size).toBe(0);
    const empty = coordinator('cec', () => issues());
    expect((await empty.read([])).size).toBe(0);
    expect([github.calls.length, empty.calls.length]).toEqual([0, 0]);
});
