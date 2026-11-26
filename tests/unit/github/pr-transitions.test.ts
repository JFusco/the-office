import { expect, test } from 'vitest';
import { currentGitHubOperation } from '../../../server/github/call-scope';
import { restPR } from '../../../server/github/pr-rest-shape';
import { terminalPRs } from '../../../server/github/pr-transitions';
import { QuotaHeld } from '../../../server/github/quota-hold';
import { FROZEN_GOLDEN } from './support/frozen-prs';
import { H22, pr21, pr22 } from './support/pull-fixtures';

const MERGED = '2026-11-26T11:00:00Z';
function api(details: Record<number, any>) {
    const calls: { path: string; operation?: string }[] = [];
    const read = async (path: string) => {
        calls.push({ path, operation: currentGitHubOperation() });
        const number = Number(path.match(/^pulls\/(\d+)/)?.[1]);
        if (/^pulls\/\d+$/.test(path)) return details[number];
        if (path.includes('/reviews')) return pr22.rest.reviews;
        if (path.includes('/check-runs')) return pr22.rest.checks;
        if (path.includes('/statuses')) return pr22.rest.statuses;
        throw new Error(`unexpected ${path}`);
    };
    return { calls, read };
}

test('a merged and a closed PR reuse their detail and read every review, check and status of the returned head once', async () => {
    const merged = { ...pr22.rest.detail, state: 'closed', merged_at: MERGED }, closed = { ...pr21.rest.detail, state: 'closed' };
    const a = api({ 22: merged, 21: closed });
    const rows = await terminalPRs(FROZEN_GOLDEN, new Set([20]), a.read);
    expect(rows).toStrictEqual([restPR(merged, pr22.rest.reviews, pr22.rest.checks, pr22.rest.statuses), restPR(closed, pr22.rest.reviews, pr22.rest.checks, pr22.rest.statuses)]);
    expect(rows[0]).toMatchObject({ number: 22, state: 'closed', mergedAt: MERGED, url: 'https://github.com/JFusco/brain/pull/22' });
    expect(rows[1]).toMatchObject({ number: 21, state: 'closed', mergedAt: '' });
    expect(a.calls.map(call => call.path)).toEqual(['pulls/22', 'pulls/22/reviews?per_page=100', `commits/${H22}/check-runs?per_page=100`, `commits/${H22}/statuses?per_page=100`,
        'pulls/21', 'pulls/21/reviews?per_page=100', `commits/${pr21.rest.detail.head.sha}/check-runs?per_page=100`, `commits/${pr21.rest.detail.head.sha}/statuses?per_page=100`]);
    expect(a.calls.every(call => call.operation === 'pr-terminal')).toBe(true);
});

test('a PR still open by its detail keeps its last row; listed and already closed rows are not read', async () => {
    const a = api({ 22: pr22.rest.detail });
    const prior = [FROZEN_GOLDEN[0], { ...FROZEN_GOLDEN[1], state: 'closed' }, FROZEN_GOLDEN[2]];
    expect(await terminalPRs(prior, new Set([20]), a.read)).toStrictEqual([FROZEN_GOLDEN[0]]);
    expect(a.calls.map(call => call.path)).toEqual(['pulls/22']);
});

test('a failed terminal read fails the observation, so the open row is read again next time', async () => {
    await expect(terminalPRs(FROZEN_GOLDEN, new Set([21, 20]), async () => { throw new Error('gh exited 1: Server Error (HTTP 502)'); })).rejects.toThrow('HTTP 502');
});

test('the quota check is asked before each PR is read; a hold it raises reads nothing more', async () => {
    const a = api({ 22: { ...pr22.rest.detail, state: 'closed' }, 21: { ...pr21.rest.detail, state: 'closed' } });
    let checks = 0;
    const check = () => { if (++checks === 2) throw new QuotaHeld({ until: '2026-11-26T14:00:00.000Z' }); };
    await expect(terminalPRs(FROZEN_GOLDEN, new Set([20]), a.read, check)).rejects.toBeInstanceOf(QuotaHeld);
    expect(a.calls.map(call => call.path)).toEqual(['pulls/22', 'pulls/22/reviews?per_page=100', `commits/${H22}/check-runs?per_page=100`, `commits/${H22}/statuses?per_page=100`]);
});
