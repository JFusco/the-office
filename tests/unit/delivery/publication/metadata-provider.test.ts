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

test('live ownership must be fresh, complete, clear and bound to this exact issue', async () => {
    const f = setup();
    const owner = { complete: true, fresh: true, project: f.store.project.id, key: f.job.key, ownership: { status: 'clear' } };
    f.delivery.execute = (async (program, args, options) => {
        expect(program).toBe('curl'); expect(args.at(-1)).toContain(`requestId=${f.job.id}`); expect(options?.readOnly).toBe(true);
        return JSON.stringify(owner);
    }) as typeof f.delivery.execute;
    await expect(metadataOwnership(f.delivery, f.job)).resolves.toBeUndefined();
    owner.complete = false;
    await expect(metadataOwnership(f.delivery, f.job)).rejects.toThrow('Fresh complete clear');
    owner.complete = true; owner.key = 'GH-999';
    await expect(metadataOwnership(f.delivery, f.job)).rejects.toThrow('Fresh complete clear');
});
