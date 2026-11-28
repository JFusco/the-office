import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, HEAD } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { createMaintenanceDraft, settledReceipt } from '../../../../server/maintenance/publication/create-draft';
import { digest } from '../../../../server/store/readback-evidence';
afterEach(cleanupFakes);

const draft = (f: Awaited<ReturnType<typeof publicationRun>>, execute = f.execute) => f.claimed(f.run, 'maintenance', () => createMaintenanceDraft(f.store, execute as any, f.owner(),
    { branch: f.branch, head: HEAD, issueUrl: f.issue.html_url, title: f.content.title, body: f.content.body, worktree: f.project.repo }));

test('an original create records the head and the digest the printed URL proves; a replay creates nothing', async () => {
    const f = await publicationRun(); f.state.remote[f.branch] = HEAD;
    const created = await draft(f);
    expect(f.state.writes).toEqual([`pr-create ${f.branch}`]);
    expect(f.store.getEffect(created.effectId)).toMatchObject({ status: 'verified', operation: 'github-pr-create', expectedState: { key: `pr-create:${HEAD}` },
        receipt: { number: created.number, url: created.url, head: HEAD, contentSha256: digest(f.content) } });
    await draft(f);
    expect(f.state.writes).toHaveLength(1);
});

test('a lost create response settles with the state alone, never resent, and keeps no authorship proof', async () => {
    const f = await publicationRun(); f.state.remote[f.branch] = HEAD; f.state.faults['pr-create'] = 'lost';
    await expect(draft(f)).rejects.toThrow();
    const settled = await draft(f);
    expect(f.state.writes).toHaveLength(1);
    expect(f.store.getEffect(settled.effectId)!.receipt).toEqual({ number: settled.number, url: settled.url, head: HEAD });
});

test('reconciliation keeps a valid original proof only for the same PR, head and live bytes', () => {
    const found = { number: 7, url: 'u', head: HEAD, title: 't', body: 'b', author: 'JFusco' };
    expect(settledReceipt({ number: 7, url: 'u', head: HEAD, contentSha256: digest({ title: 't', body: 'b' }) }, found)).toEqual({ number: 7, url: 'u', head: HEAD, contentSha256: digest({ title: 't', body: 'b' }) });
    expect(settledReceipt({ number: 7, url: 'u', head: HEAD, contentSha256: digest({ title: 't', body: 'edited' }) }, found)).toEqual({ number: 7, url: 'u', head: HEAD });
});

test('a second PR on a later page, a fork branch, another base or changed content stop; nothing else is adopted', async () => {
    const later = await publicationRun(); later.state.pageSize = 1; later.state.remote[later.branch] = HEAD;
    later.addPull({ branch: later.branch, head: HEAD, title: later.content.title, body: later.content.body, closes: [later.issue.html_url] });
    later.addPull({ branch: later.branch, head: 'c'.repeat(40), title: 'old', body: 'old', state: 'closed' });
    await expect(draft(later)).rejects.toThrow(/2 pull requests/);
    const fork = await publicationRun(); fork.addPull({ branch: fork.branch, head: HEAD, title: fork.content.title, body: fork.content.body, fork: true, closes: [fork.issue.html_url] });
    await expect(draft(fork)).rejects.toThrow(/another repository/);
    const base = await publicationRun(); base.addPull({ branch: base.branch, head: HEAD, title: base.content.title, body: base.content.body, base: 'release', closes: [base.issue.html_url] });
    await expect(draft(base)).rejects.toThrow(/open draft of the reviewed head/);
    const content = await publicationRun(); content.addPull({ branch: content.branch, head: HEAD, title: content.content.title, body: 'different', closes: [content.issue.html_url] });
    await expect(draft(content)).rejects.toThrow(/approved title and body/);
    const unlinked = await publicationRun(); unlinked.addPull({ branch: unlinked.branch, head: HEAD, title: unlinked.content.title, body: unlinked.content.body });
    await expect(draft(unlinked)).rejects.toThrow(/natively close/);
    for (const f of [later, fork, base, content, unlinked]) expect(f.state.writes).toEqual([]);
    const adopt = await publicationRun(); adopt.addPull({ branch: adopt.branch, head: HEAD, title: adopt.content.title, body: adopt.content.body, closes: [adopt.issue.html_url] });
    expect(await draft(adopt)).toMatchObject({ adopted: true, effectId: '' });
});

test('the remote head is checked again in fresh draft preflight', async () => {
    const f = await publicationRun();
    f.state.remote[f.branch] = HEAD;
    let heads = 0;
    const execute: typeof f.execute = (program, args, options) => {
        if (program === 'git' && args[0] === 'ls-remote' && ++heads === 2) f.state.remote[f.branch] = 'c'.repeat(40);
        return f.execute(program, args, options);
    };
    await expect(draft(f, execute)).rejects.toMatchObject({ kind: 'authority' });
    expect(heads).toBe(2);
    expect(f.state.writes).toEqual([]);
});
