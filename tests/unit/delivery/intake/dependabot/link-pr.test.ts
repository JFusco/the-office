import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { linkPR } from '../../../../../server/delivery/intake/dependabot/link-pr';
import { dependabotPR } from '../../../../../server/delivery/intake/dependabot/qualify';
afterEach(cleanupFakes);

function link(fail: 'none' | 'patch' | 'guard') {
    const f = fakeGitHub();
    const row = { number: 121, html_url: `https://github.com/${REPOSITORY}/pull/121`, state: 'open', body: 'Updates `eslint`', head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint' }, base: { ref: 'main', sha: BASE } };
    f.state.prs.push(row);
    // A timeout after the PATCH left: GitHub may or may not have the new body.
    if (fail === 'patch') f.state.fail = (_program, args) => args.includes('PATCH') ? 'timeout' : false;
    let invalidated = 0;
    const run = () => linkPR(f.store, f.execute as any, { id: 'adoption' }, dependabotPR(row), 5, () => { if (fail === 'guard') throw new Error('Office paused'); }, { invalidate: () => invalidated++ });
    return { f, row, run, invalidated: () => invalidated };
}

test('a dispatched body PATCH leaves the shared open-PR rows stale', async () => {
    const x = link('none');
    await x.run();
    expect(x.row.body).toContain('Closes #5');
    expect(x.invalidated()).toBe(1);
});
test('a PATCH whose outcome is unknown does too, and is never resent', async () => {
    const x = link('patch');
    await expect(x.run()).rejects.toThrow('timeout');
    expect(x.invalidated()).toBe(1);
    expect(x.f.store.getEffect(`harness:adoption:pr-body:121:${HEAD}`)?.status).toBe('uncertain');
    await expect(x.run()).rejects.toThrow('will not be resent');
    expect(x.f.state.calls.filter(call => call.includes('PATCH'))).toHaveLength(1);
    expect(x.invalidated()).toBe(1);
});
test('a write refused before dispatch leaves the rows as they are', async () => {
    const x = link('guard');
    await expect(x.run()).rejects.toThrow('Office paused');
    expect(x.invalidated()).toBe(0);
});
