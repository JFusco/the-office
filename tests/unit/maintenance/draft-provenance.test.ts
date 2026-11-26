import { rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { maintenanceDraftProvenance } from '../../../server/maintenance/draft-provenance';
import { readDescriptionHistory } from '../../../server/delivery/publication/description-history';
import { digest } from '../../../server/store/readback-evidence';
import { INCIDENTS, liveBody, RUN, staleFixture, type IncidentKey } from '../../fixtures/stale-description';

async function proof(f: ReturnType<typeof staleFixture>) {
    return maintenanceDraftProvenance(f.store, f.job, await readDescriptionHistory(f.store, f.delivery.execute, f.job.pr), f.nativeRoot);
}

test.each(['GH-193', 'GH-195'] as const)('%s: the run\'s own draft worker created the live description, from its proposal group', async key => {
    const f = staleFixture(key), i = INCIDENTS[key];
    expect(await proof(f)).toEqual({ proven: true, draft: { head: i.published, source: { kind: 'maintenance', runId: RUN, step: key === 'GH-193' ? 5 : 9, workerId: i.draft.worker },
        contentSha256: digest({ title: i.title, body: liveBody(key) }) } });
    // No provider write and no live read of anything but the description.
    expect(f.state.calls.filter(c => /PATCH|POST|pr create/.test(c))).toEqual([]);
});

test('the head comes from the proposal even when the draft step reported no candidates and the delivery merged main since', async () => {
    const f = staleFixture('GH-193', { emptyDraftCandidates: true });
    expect(f.job.head).toBe(INCIDENTS['GH-193'].head);
    expect(await proof(f)).toMatchObject({ proven: true, draft: { head: INCIDENTS['GH-193'].published } });
});

test.each<[string, (f: ReturnType<typeof staleFixture>) => void, RegExp]>([
    ['a creation outside the draft step', f => { (f.pr as any).created_at = '2026-11-23T20:58:00Z'; }, /no completed maintenance draft step spans/],
    ['a creation before the draft worker started', f => { (f.pr as any).created_at = '2026-11-23T20:52:30Z'; }, /no single draft worker/],
    ['the other incident\'s body file', f => f.session('GH-193', { bodyFile: resolve(f.runDir, INCIDENTS['GH-195'].bodyFile) }), /read-back does not show this draft/],
    ['the other worker\'s session', f => writeFileSync(resolve(f.nativeRoot, f.store.project.repo.replace(/[^a-zA-Z0-9-]/g, '-'), `${INCIDENTS['GH-193'].draft.worker}.jsonl`),
        '{"type":"user","sessionId":"44361e64-f29a-42c7-8336-53ed150dc7ad"}\n'), /evidence is unavailable/],
    ['a failed create followed by a matching human pull request', f => f.session('GH-193', { createFailed: true,
        createOutput: `a pull request for branch "${INCIDENTS['GH-193'].branch}" into branch "main" already exists:\nhttps://github.com/JFusco/cms-field-vocabulary/pull/194` }), /no single successful create/],
    ['a create that never printed this pull request, beside its model-written receipt', f => f.session('GH-193', { createOutput: 'Created.' }), /no single successful create/],
    ['no read-back of the new pull request', f => f.session('GH-193', { skipView: true }), /no single read-back/],
    ['a body file changed after creation', f => writeFileSync(resolve(f.runDir, INCIDENTS['GH-193'].bodyFile), liveBody('GH-193').trimEnd()), /read-back does not show this draft/],
    ['a missing session artifact', f => rmSync(resolve(f.store.dataRoot, 'sessions', INCIDENTS['GH-193'].draft.worker, 'assignment.json')), /evidence is unavailable/],
    ['a draft worker of another provider', f => { f.draftWorker().provider = 'codex'; }, /did not complete|assignment, identity or provider differs/],
    ['a run still in flight', f => { f.maintenance.status = 'working'; }, /no completed maintenance draft step/],
    ['a draft step with an unsettled write', f => { f.maintenance.steps[5].result.receipts[1].uncertain = true; }, /did not pass with settled receipts/],
])('%s declines attribution', async (_name, change, reason) => {
    const f = staleFixture('GH-193');
    change(f);
    const result = await proof(f);
    expect(result.proven).toBe(false);
    expect(result.proven ? '' : result.reason).toMatch(reason);
});

test('a live description that differs from what the worker created declines, even with the same evidence', async () => {
    const f = staleFixture('GH-195');
    f.pr.body = `${liveBody('GH-195')}Edited text\n`;
    expect(await proof(f)).toMatchObject({ proven: false, reason: expect.stringMatching(/not the one the worker created/) });
    f.pr.body = liveBody('GH-195'); f.pr.title = 'feat(optimizely): renamed';
    expect(await proof(f)).toMatchObject({ proven: false });
});

test('the job must be this pull request\'s issue branch', async () => {
    const f = staleFixture('GH-193'), key: IncidentKey = 'GH-195';
    const h = await readDescriptionHistory(f.store, f.delivery.execute, f.job.pr);
    expect(maintenanceDraftProvenance(f.store, { key, branch: INCIDENTS[key].branch }, h, f.nativeRoot)).toMatchObject({ proven: false });
});
