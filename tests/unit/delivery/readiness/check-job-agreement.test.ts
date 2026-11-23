import { expect, test } from 'vitest';
import { checkJobAgreement } from '../../../../server/delivery/readiness/check-job-agreement';

const repository = 'JFusco/brain', head = '6837484c7f34cde6c07a35eca94c98854b2638ea', runId = 45206700566;
const check = () => ({ id: 137804255563, name: 'quality', status: 'completed', conclusion: 'success', started_at: '2026-11-23T15:34:18Z', completed_at: '2026-11-23T15:34:54Z', details_url: `https://github.com/${repository}/actions/runs/${runId}/job/137804255563` });
const job = () => ({ id: 137804255563, run_id: runId, run_attempt: 1, head_sha: head, name: 'quality', status: 'completed', conclusion: 'success', started_at: '2026-11-23T15:34:18Z', completed_at: '2026-11-23T15:34:54Z', html_url: `https://github.com/${repository}/actions/runs/${runId}/job/137804255563`, check_run_url: `https://api.github.com/repos/${repository}/check-runs/137804255563` });
const compare = (c: object, j: object | undefined) => checkJobAgreement(c, j, { repository, head, runId });

test('the two reads of a finished check agree', () => {
    expect(compare(check(), job())).toEqual({ identity: true, differing: [], moving: false });
});

test('a check read running on one side and completed on the other is moving, with the changed fields named', () => {
    const running = { status: 'in_progress', conclusion: null, completed_at: null };
    expect(compare({ ...check(), ...running }, job())).toEqual({ identity: true, differing: ['status', 'conclusion', 'completed_at'], moving: true });
    expect(compare(check(), { ...job(), ...running })).toEqual({ identity: true, differing: ['status', 'conclusion', 'completed_at'], moving: true });
    expect(compare({ ...check(), ...running }, { ...job(), ...running })).toEqual({ identity: true, differing: [], moving: true });
    for (const status of ['queued', 'waiting', 'requested', 'pending']) expect(compare({ ...check(), status, conclusion: null, completed_at: null }, job()).moving, status).toBe(true);
});

test('a status that is missing or unknown is no sign the check is unfinished', () => {
    const { status: _status, ...withoutStatus } = job();
    expect(compare(check(), withoutStatus)).toEqual({ identity: true, differing: ['status'], moving: false });
    expect(compare(check(), { ...job(), status: 'stale' })).toEqual({ identity: true, differing: ['status'], moving: false });
    expect(compare({ ...check(), status: undefined }, job()).moving).toBe(false);
});

test('two finished reads that differ are not moving', () => {
    expect(compare(check(), { ...job(), conclusion: 'failure' })).toEqual({ identity: true, differing: ['conclusion'], moving: false });
    expect(compare(check(), { ...job(), completed_at: '2026-11-23T15:34:55Z' })).toEqual({ identity: true, differing: ['completed_at'], moving: false });
});

test.each([['id', 1], ['run_id', 2], ['run_attempt', 0], ['head_sha', 'a'.repeat(40)], ['name', 'other'], ['html_url', 'https://github.com/x/y/actions/runs/1/job/1'], ['check_run_url', 'https://api.github.com/repos/x/y/check-runs/1']])('a job with another %s is not this check run', (field, value) => {
    expect(compare(check(), { ...job(), [field]: value }).identity).toBe(false);
});

test('a missing job is not this check run', () => {
    expect(compare(check(), undefined).identity).toBe(false);
});
