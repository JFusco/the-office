import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../../delivery/support/fake-github';
import { boardDraft, transientDraft } from '../../delivery/attempts/retry-fixture';
import { observeProjects } from '../../../../server/incidents/observe-projects';
import { stoppedWork } from '../../../../server/incidents/sources/stopped-work';
import { stoppedRecord } from '../../../../server/incidents/sources/stopped-record';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import { item } from '../incident-fixture';
import type { TicketJob } from '../../../../src/shared';

afterEach(cleanupFakes);
type Fake = ReturnType<typeof fakeGitHub>;

/** The incident collector's reading of one stopped delivery job, through the real per-project observation. */
const expected = (f: Fake, job: TicketJob, now = new Date()) => {
    const cause = job.stop?.kind === 'uncertain-effect' ? 'unconfirmed' as const : undefined;
    const { observations } = observeProjects([{ store: f.store }], (_entry, lane) => lane === 'delivery' ? [item('delivery', job.id, job.stage, 'blocked', job.detail, cause)] : [], now);
    return stoppedWork(observations[0]).find(candidate => candidate.subject.id === job.id)?.expected;
};

test('GH-407 reads as an expected retry while its card read-back is pending, and as an uncertain write once it is exhausted or ineligible', () => {
    const pending = boardDraft();
    pending.f.store.state.paused = false;
    reconcileReadRetries(pending.f.store, new Date());
    expect(pending.job.retry!.nextAt).toBeTruthy();
    expect(expected(pending.f, pending.job)).toBe('retry');
    // Repair handling reads the original stop, with no retry decision in it.
    const original = stoppedRecord(pending.f.store.state, { projectId: pending.f.store.project.id, kind: 'delivery', id: pending.job.id }, 'draft');
    expect(original?.facts).toMatchObject({ stopKind: 'uncertain-effect' });
    expect(original?.facts.deliveryRetry).toBeUndefined();
    const exhausted = boardDraft();
    exhausted.job.retry = { attempts: 3, nextAt: '', history: [], exhausted: true, stage: 'draft', head: exhausted.job.head, limit: 3 };
    expect(expected(exhausted.f, exhausted.job)).toBe('uncertain-effect');
    // An unrelated unsettled write makes the decision negative: the uncertain write is what the stop is.
    const unrelated = boardDraft();
    unrelated.f.store.db.prepare('INSERT INTO effects(id, work_key, status, body) VALUES(?, ?, ?, ?)').run('other', `${unrelated.f.store.project.id}:delivery:${unrelated.job.id}`, 'dispatching', JSON.stringify({ attemptId: unrelated.job.id }));
    expect(expected(unrelated.f, unrelated.job)).toBe('uncertain-effect');
});

test('a pending GitHub quota wait reads as an expected retry; a negative decision is no retry for a transient stop', () => {
    const quota = transientDraft();
    quota.job.retry = { attempts: 0, nextAt: new Date(Date.now() + 600_000).toISOString(), history: [], exhausted: false, stage: 'draft', head: quota.job.head,
        failure: { category: 'provider-limit', retryAt: new Date(Date.now() + 600_000).toISOString(), detail: 'API rate limit exceeded', dispatched: true }, quota: { since: new Date().toISOString() } };
    expect(expected(quota.f, quota.job)).toBe('retry');
    const declined = transientDraft();
    declined.job.mergeAttempt = { head: declined.job.head, at: new Date().toISOString() };
    expect(expected(declined.f, declined.job)).toBeNull();
});
