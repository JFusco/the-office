import { expect, test } from 'vitest';
import { initialSnapshot } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';
import { markAwaitingRepair, NOTHING_STRONGER } from '../incidents/repair/mark-fixture';
import { planReadRetry, readRetryPending, RETRY_PLAN_GRACE_MS } from '../../../server/scheduling/read-retries';

const STOPPED = '2026-11-19T19:46:40.000Z', SOON = new Date('2026-11-19T19:46:50.000Z');
const TIMED_OUT = 'Error: git read timed out; saved observations retained; safe to retry the read';
const job = (extra: Record<string, unknown> = {}) => ({ id: 'job', key: 'GH-173', status: 'blocked', stage: 'lead-pr', requestedAt: '2026-11-19T19:00:00Z', detail: TIMED_OUT, stop: { kind: 'transient', at: STOPPED }, steps: [], pr: 176, prUrl: 'https://example.test/pull/176', ...extra }) as any;
const outbox = (j: any, paused = false, at = SOON) => {
    const state = { ...initialSnapshot(), paused, coordination: coordination() } as any;
    state.coordination.jobs = [j];
    return projectOutbox(state, at).filter(action => action.id === 'ticket-job:job').map(action => action.title);
};

test('a stop the Office will retry by itself is not put to Joe, before or after the retry is scheduled', () => {
    const stopped = job();
    expect(readRetryPending(stopped, SOON)).toBe(true);
    expect(outbox(stopped)).toEqual([]);
    planReadRetry(stopped, new Date('2026-11-19T19:47:07Z'));
    expect(stopped.retry.nextAt).toBeTruthy();
    expect(readRetryPending(stopped, SOON)).toBe(true);
    expect(outbox(stopped)).toEqual([]);
});

test('a stop the Office will not retry, or has stopped retrying, is still put to Joe', () => {
    for (const [name, extra] of [
        ['retries exhausted', { retry: { attempts: 3, nextAt: '', history: [], exhausted: true } }],
        ['a third retry that failed, before the planner records it as exhausted', { retry: { attempts: 3, nextAt: '', history: [], exhausted: false } }],
        ['a stop that is not a temporary read failure', { detail: 'Error: Adopted repair ownership, inputs or effects changed' }],
        ['a permission failure that happens to time out', { detail: 'Error: OAuth token refresh timed out' }],
        ['a writer stage', { stage: 'update-base' }],
        ['a stop with no recorded time', { stop: undefined }],
        ['an attempted merge', { mergeAttempt: { head: 'a'.repeat(40) } }],
        ['an unsettled write on the job', { steps: [{ stage: 'draft', result: { receipts: [{ action: 'git-push', verified: false, uncertain: true }] } }] }],
    ] as const) {
        const stopped = job(extra);
        expect(readRetryPending(stopped, SOON), name).toBe(false);
        expect(outbox(stopped), name).toEqual(['Read back GH-173 delivery']);
    }
    // Retries are not planned while the Office is paused, so the stop is shown.
    expect(outbox(job(), true)).toEqual(['Read back GH-173 delivery']);
    // A job that is not stopped is never pending a retry.
    expect(readRetryPending(job({ status: 'working' }), SOON)).toBe(false);
});

test('an interrupted read and a reply cut off by the output limit are retried the same way', () => {
    expect(outbox(job({ status: 'interrupted' }))).toEqual([]);
    expect(outbox(job({ detail: 'Error: codex exited 1: Incomplete response returned, reason: max_output_tokens' }))).toEqual([]);
});

test('the wait for the planner is bounded: a stop nobody scheduled a retry for within the grace period is put to Joe', () => {
    const late = new Date(Date.parse(STOPPED) + RETRY_PLAN_GRACE_MS + 1000);
    expect(readRetryPending(job(), late)).toBe(false);
    expect(outbox(job(), false, late)).toEqual(['Read back GH-173 delivery']);
    // Once a retry is scheduled the job stays out of the outbox however long the back-off is.
    const scheduled = job();
    planReadRetry(scheduled, SOON);
    expect(readRetryPending(scheduled, late)).toBe(true);
    expect(outbox(scheduled, false, late)).toEqual([]);
});

test('a stop a harness repair covers is not put to Joe while the wait holds, and is again when it ends; a decision always is', () => {
    const state = { ...initialSnapshot(), coordination: coordination() } as any, at = new Date('2026-11-20T13:00:00.000Z');
    const stopped = job({ id: 'job', detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: STOPPED }, retry: { attempts: 3, nextAt: '', history: [], exhausted: true } });
    const other = job({ id: 'other', key: 'GH-200', detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: STOPPED }, retry: { attempts: 3, nextAt: '', history: [], exhausted: true } });
    state.coordination.jobs = [stopped, other];
    const asked = (when = at, reads: typeof NOTHING_STRONGER | null = NOTHING_STRONGER) => projectOutbox(state, when, reads).filter(action => action.status === 'open').map(action => action.id).sort();
    expect(asked()).toEqual(['ticket-job:job', 'ticket-job:other']);
    markAwaitingRepair(state, 'brain', { kind: 'delivery', id: 'job' }, 'lead-pr');
    expect(asked()).toEqual(['ticket-job:other']);
    // A reader that cannot see the project's current writes hides nothing.
    expect(asked(at, null)).toEqual(['ticket-job:job', 'ticket-job:other']);
    expect(projectOutbox(state, at).filter(action => action.status === 'open')).toHaveLength(2);
    // A write for it that is unsettled now is Joe's to read back.
    expect(asked(at, { ...NOTHING_STRONGER, unsettled: () => ({ workKeys: new Set(['brain:delivery:job']), attempts: new Set() }) })).toEqual(['ticket-job:job', 'ticket-job:other']);
    // A decision that reached the board is Joe's whatever is being repaired.
    Object.assign(stopped, { detail: 'Decision needed: choose', parked: { published: true, reason: 'choose', stage: 'lead-pr', marker: 'm' } });
    expect(projectOutbox(state, at, NOTHING_STRONGER).find(action => action.id === 'ticket-job:job')?.title).toBe('GH-173 needs a decision on the board');
    Object.assign(stopped, { detail: 'Error: Worktree is missing', parked: undefined });
    expect(asked()).toEqual(['ticket-job:other']);
    // 48 hours without progress: the request is back.
    expect(asked(new Date('2026-11-22T12:00:00.000Z'))).toEqual(['ticket-job:job', 'ticket-job:other']);
    // A paused project hides nothing behind a repair wait.
    state.paused = true;
    expect(asked()).toEqual(['ticket-job:job', 'ticket-job:other']);
});

test('the same holds for a checkpoint, an intake review, a maintenance run and a ticket: each request leaves while its record is held and only then', () => {
    const at = new Date('2026-11-20T13:00:00.000Z');
    const cases: { id: string; work: { kind: 'checkpoint' | 'intake' | 'maintenance' | 'delivery'; id: string }; stage: string; build: (state: any) => void }[] = [
        { id: 'checkpoint:cp-1', work: { kind: 'checkpoint', id: 'cp-1' }, stage: 'checkpoint', build: state => { state.coordination.checkpoints = [{ id: 'cp-1', runId: 'no-run', date: '2026-11-20', status: 'blocked', detail: 'Worktree is missing', requestedAt: 'r', endedAt: 'e1' }]; } },
        { id: 'assignment:rv-1', work: { kind: 'intake', id: 'rv-1' }, stage: 'assignment-review', build: state => { state.coordination.listener.reviews = [{ id: 'rv-1', key: 'GH-91', status: 'blocked', detail: 'Worktree is missing', queuedAt: 'q', endedAt: 'e1', url: '' }]; } },
        { id: 'maintenance:run-1', work: { kind: 'maintenance', id: 'run-1' }, stage: 'follow-up', build: state => { state.maintenance = { runs: [{ id: 'run-1', requestedAt: 'r', startedAt: 's', endedAt: 'e1', status: 'blocked', weekly: false, stage: 'follow-up', error: 'Worktree is missing', steps: [] }], lastDaily: '', lastWeekly: '', ledger: '' }; } },
        { id: 'ticket:CEC-9:develop', work: { kind: 'delivery', id: 'ticket:CEC-9' }, stage: 'develop', build: state => { state.tickets = [{ key: 'CEC-9', title: 't', url: '', stage: 'develop', activity: 'blocked', blocker: 'Worktree is missing', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true, status: 'open' }]; } },
    ];
    for (const { id, work, stage, build } of cases) {
        const state = { ...initialSnapshot(), coordination: coordination() } as any;
        build(state);
        const open = (reads: typeof NOTHING_STRONGER | null = NOTHING_STRONGER, when = at) => projectOutbox(state, when, reads).filter(action => action.status === 'open').map(action => action.id);
        expect(open(), id).toContain(id);
        markAwaitingRepair(state, 'brain', work, stage);
        expect(open(), id).not.toContain(id);
        expect(open(null), id).toContain(id);
        expect(open(NOTHING_STRONGER, new Date('2026-11-22T13:00:00.000Z')), id).toContain(id);
    }
});

test('a held intake review is not named in the shared session-visibility request either', () => {
    const state = { ...initialSnapshot(), coordination: coordination() } as any, at = new Date('2026-11-20T13:00:00.000Z');
    const review = (key: string) => ({ id: key, key, status: 'blocked', detail: 'Office must restore complete session visibility; inventory unavailable', queuedAt: 'q', endedAt: 'e1', url: '' });
    state.coordination.listener.reviews = [review('GH-91'), review('GH-92')];
    const shared = () => projectOutbox(state, at, NOTHING_STRONGER).find(action => action.id === 'ownership-capability' && action.status === 'open')?.detail ?? '';
    expect(shared()).toContain('GH-91, GH-92');
    markAwaitingRepair(state, 'brain', { kind: 'intake', id: 'GH-91' }, 'assignment-review');
    expect(shared()).toContain('GH-92');
    expect(shared()).not.toContain('GH-91');
    markAwaitingRepair(state, 'brain', { kind: 'intake', id: 'GH-92' }, 'assignment-review');
    expect(shared()).toBe('');
});

const reason = "PR #176 needs an edit to its title that the Office may not make itself. The edit Sam's review asks for: Remove [skip release].";
const instruction = "Sam's review found: [skip release].\n\nWhat's needed: edit the title of PR #176 on GitHub. Then move the issue card, not the pull request's card, back to In progress; the Office then runs a fresh review.";
const harnessPark = (extra: Record<string, unknown> = {}) => ({ stage: 'lead-pr', reason, at: STOPPED, published: false, instruction, marker: 'Office decision job:1', metadata: { route: {} }, ...extra });
const detail = (j: any) => { const state = { ...initialSnapshot(), coordination: coordination() } as any; state.coordination.jobs = [j]; return projectOutbox(state, SOON).find(action => action.id === 'ticket-job:job'); };

test('a published harness-worded park shows its reason and its full instruction, with the pickup lane it names; a model park keeps the Ready wording', () => {
    expect(detail(job({ detail: `Decision needed: ${reason}`, parked: harnessPark({ published: true }) }))).toMatchObject({ title: 'GH-173 needs a decision on the board', detail: `${reason}\n\n${instruction}` });
    expect(detail(job({ detail: 'Decision needed: choose', parked: { stage: 'review', reason: 'choose', at: STOPPED, published: true } }))?.detail).toBe('choose\nMove the card back to Ready to resume review.');
});

test('an unpublished harness-worded park with an unconfirmed comment or card move is a visible stop with the edit, the write and its own error, even while a read retry is pending', () => {
    const comment = detail(job({ parked: harnessPark({ unconfirmed: [{ write: 'the decision comment on issue #173', error: 'Error: gh: HTTP 502 after the comment' }] }) }))!;
    expect(comment.title).toBe('GH-173 decision comment is not confirmed');
    expect(comment.detail).toContain(reason);
    expect(comment.detail).toContain('The Office has not confirmed its decision comment on the issue, and a card may already be in Block.');
    expect(comment.detail).toContain('Not yet read back: the decision comment on issue #173. Error: gh: HTTP 502 after the comment');
    expect(comment.detail).toContain(`Last stop: ${TIMED_OUT}`);
    expect(comment.detail).toContain('Moving a card cannot resume this job until the comment is confirmed.');
    // The outer board check said only that something is uncertain; the move's own provider error is what the item shows.
    const lane = detail(job({ detail: 'Error: Previous board transition remains uncertain; read back the saved attempt before another write',
        parked: harnessPark({ unconfirmed: [{ write: "the move of the pull request's card to Block", error: 'Error: gh: HTTP 502 Bad Gateway' }] }) }))!;
    expect(lane.detail).toContain("Not yet read back: the move of the pull request's card to Block. Error: gh: HTTP 502 Bad Gateway");
    expect(lane.detail).toContain('Last stop: Error: Previous board transition remains uncertain');
    // A known route stop explains itself; an unpublished park with nothing unconfirmed and no stop keeps the default item.
    expect(detail(job({ stop: undefined, detail: 'Error: x', parked: harnessPark({ stopped: 'The park sends nothing more: automatic pickup is turned off. Restore it, then ask for review-pr to finish the park.' }) }))?.detail).toContain('automatic pickup is turned off. Restore it');
    expect(detail(job({ stop: undefined, detail: 'Error: x', parked: harnessPark() }))?.title).toBe('Read back GH-173 delivery');
});
