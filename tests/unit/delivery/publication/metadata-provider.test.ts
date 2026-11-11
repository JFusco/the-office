import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { bindMetadata } from '../../../../server/delivery/publication/metadata-context';
import { metadataProvider, metadataOwnership } from '../../../../server/delivery/publication/metadata-provider';
afterEach(cleanupFakes);

function setup() {
    const f = fakeGitHub(), job = f.candidate(); f.store.state.coordination!.enabled = true;
    Object.assign(job, { pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    const pr = { number: 200, html_url: job.prUrl, state: 'open', draft: false, merged_at: null, title: 'fix: release scans', body: 'Closes #5',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: REPOSITORY } }, base: { sha: BASE, ref: 'main', repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    job.prMetadataRepair = bindMetadata(f.delivery, job, pr, ['pr-metadata'], 'lead-pr');
    return { ...f, job, pr };
}

test('native readback requires the unchanged bound PR and original open assigned issue', async () => {
    const f = setup();
    expect(await metadataProvider(f.delivery, f.job)).toMatchObject({ number: 200, head: { sha: HEAD } });
    f.pr.head.sha = 'c'.repeat(40);
    await expect(metadataProvider(f.delivery, f.job)).rejects.toThrow('native metadata');
    f.pr.head.sha = HEAD; f.state.issue.state = 'closed';
    await expect(metadataProvider(f.delivery, f.job)).rejects.toThrow('native metadata');
    expect(f.state.calls.some(c => /--method (POST|PATCH)/.test(c))).toBe(false);
});

test('metadata uses its exact claim without depending on complete chat context', async () => {
    const f = setup(); f.job.status='working'; f.job.stage='lead-pr';
    await expect(metadataOwnership(f.delivery,f.job,false)).rejects.toThrow('scheduler claim');
    await claimedDelivery(f.store,f.job,()=>metadataOwnership(f.delivery,f.job,false));
    expect(f.state.calls.some(c=>c.startsWith('curl'))).toBe(false);
});
