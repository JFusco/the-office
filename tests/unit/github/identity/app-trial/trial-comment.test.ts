import { afterEach, describe, expect, test, vi } from 'vitest';
import { canonicalDigest, entryDigest } from '../../../../../server/github/identity/route-entry';
import { APP_POST, BOT, comment, ENTRY, ISSUE, MARKER, BODY, OPERATOR, PACKET, PR_ENTRY, PR_PACKET, prPacket, prPayload, PULL, PULL_CONVERSATION, trialOffice, type ProviderHooks, type TrialOffice } from './support/trial-fixture';

const holds = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('../../../../../server/office/project-holds', async original => ({
    ...await original<typeof import('../../../../../server/office/project-holds')>(),
    holdReason: (_project: unknown, key: string) => holds.value[key],
}));

let f: TrialOffice | undefined;
afterEach(() => { f?.cleanup(); f = undefined; holds.value = {}; });
const nothing = (office: TrialOffice) => [office.effects(), office.counts.posts];

test('check binds the approved packet read-only and creates, mints and sends nothing', async () => {
    f = trialOffice();
    await expect(f.run(PACKET, 'check')).resolves.toMatchObject({ mode: 'check', status: 'none', dispatched: false, qualified: false, target: ISSUE });
    expect([...nothing(f), f.counts.tokens]).toEqual([[], [], 0]);
    f.comments.push(comment(101, BODY));
    await expect(f.run(PACKET, 'check')).rejects.toThrow(/already shows the marker/);
    expect([...nothing(f), f.counts.tokens]).toEqual([[], [], 0]);
});

test('a matching run sends one App POST on the approved open issue and records the bot by login and id', async () => {
    f = trialOffice();
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', dispatched: true, qualified: true, receipt: { id: 900, url: `${ISSUE}#issuecomment-900` },
        writer: { principal: 'app', login: BOT.login, botId: BOT.id, grant: 'trial' }, qualification: { record: `${ISSUE}#issuecomment-900`, target: ISSUE, actor: BOT } });
    expect(f.counts.posts).toEqual([APP_POST]);
    // The one token is requested for the packet's own installation and repository.
    expect(f.counts.issued).toEqual([{ installationId: PACKET.installationId, repositoryId: PACKET.repositoryId }]);
    // The target is read before the intent exists, then again under the App token as the last step before the claim.
    expect(f.counts.issuePrincipals).toEqual(['operator', APP_POST]);
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ authorization: 'joe-approved-app-trial', work: { projectId: 'the-office', kind: 'issue', id: '629' },
        attemptId: PACKET.effectId, payload: { number: 629, marker: MARKER, body: BODY, author: BOT.login },
        expectedState: { entryDigest: entryDigest(ENTRY), packetDigest: canonicalDigest(PACKET) }, writer: { appId: PACKET.appId, repositoryId: PACKET.repositoryId } });
    // Running it again, even after a restart, is the read-back: the saved receipt, no second POST and no new read.
    f.reopen();
    const reads = f.counts.idReads + f.counts.listReads;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true, receipt: { id: 900 } });
    expect([f.counts.posts, f.effects(), f.counts.idReads + f.counts.listReads]).toEqual([[APP_POST], [PACKET.effectId], reads]);
});

test('without the designated entry the route would pick the operator for this id, and the command refuses instead', async () => {
    for (const writes of [{}, { comment: 'operator' }, { comment: { ...ENTRY, effectId: 'office-app-trial:the-office:comment:629:other' } }]) {
        f = trialOffice(writes);
        await expect(f.run()).rejects.toThrow(/refused before dispatch/);
        expect([...nothing(f), f.counts.tokens]).toEqual([[], [], 0]);
        f.cleanup(); f = undefined;
    }
});

test('a route that changes to the operator while the token is issued sends nothing and creates no intent', async () => {
    f = trialOffice();
    f.hooks.atToken = () => f!.configure({ comment: 'operator' });
    await expect(f.run()).rejects.toThrow(/route changed while its credential was acquired/);
    expect(nothing(f)).toEqual([[], []]);
});

test('a grant withdrawn and an installation replaced during the selection listing refuse before any token, intent or POST', async () => {
    f = trialOffice();
    f.hooks.list = (all, read) => { if (read === 1) f!.configure({}, { installationId: 1 }); return all; };
    await expect(f.run()).rejects.toThrow(/refused before dispatch: the configured App, installation or bot/);
    expect([...nothing(f), f.counts.tokens, f.counts.issued]).toEqual([[], [], 0, []]);
});

test('a drain during the final check listing makes check refuse, creating, minting and sending nothing', async () => {
    f = trialOffice();
    f.hooks.list = (all, read) => { if (read === 1) f!.store.state.draining = true; return all; };
    await expect(f.run(PACKET, 'check')).rejects.toThrow(/refused before dispatch: the project is paused or draining/);
    expect([...nothing(f), f.counts.tokens]).toEqual([[], [], 0]);
    f.hooks.list = undefined; f.store.state.draining = false;
    await expect(f.run(PACKET, 'check')).resolves.toMatchObject({ status: 'none' });
});

test('a drain during token acquisition on a fresh run creates no intent, so the same approval can still run', async () => {
    f = trialOffice();
    f.hooks.atToken = () => { f!.store.state.draining = true; };
    await expect(f.run()).rejects.toThrow(/refused before dispatch: the project is paused or draining/);
    expect(nothing(f)).toEqual([[], []]);
    f.hooks.atToken = undefined; f.store.state.draining = false;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true });
    expect([f.counts.posts, f.effects()]).toEqual([[APP_POST], [PACKET.effectId]]);
});

test('a target that already differs at the first read refuses before the intent exists, so the trial is not spent', async () => {
    f = trialOffice();
    f.hooks.issue = read => read === 1 ? { state: 'closed' } : undefined;
    await expect(f.run()).rejects.toThrow(/refused before dispatch: the issue is not open and unlocked/);
    expect([...nothing(f), f.counts.tokens]).toEqual([[], [], 0]);
    f.hooks.issue = undefined;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true });
    expect(f.counts.posts).toEqual([APP_POST]);
});

const DRIFT: [string, ProviderHooks][] = [
    ['closed', { issue: () => ({ state: 'closed' }) }],
    ['locked', { issue: () => ({ locked: true }) }],
    ['moved', { issue: () => ({ html_url: 'https://github.com/JFusco/brain/issues/12' }) }],
    ['replaced', { issue: () => ({ node_id: 'I_other' }) }],
    ['rebound to another repository id', { repositoryId: () => 1 }],
];
/** The first answer to a trial its preflight or claim rejected: the spent, unsent trial with its saved reason. */
const spent = (reason: RegExp) => ({ status: 'rejected', dispatched: false, qualified: false, receipt: null, error: expect.stringMatching(reason), next: expect.stringMatching(/spent/) });

test.each(DRIFT)('a target %s while the final marker listing is in flight rejects the same intent unsent', async (_name, drift) => {
    f = trialOffice();
    f.hooks.list = (all, read) => { if (read === 2) Object.assign(f!.hooks, drift); return all; };
    await expect(f.run()).resolves.toMatchObject(spent(/different|not open and unlocked/));
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.counts.posts).toEqual([]);
    await expect(f.run()).rejects.toThrow(/already refused or rejected/);
    expect(nothing(f)).toEqual([[PACKET.effectId], []]);
});

test('a marker that appears before the preflight re-read rejects the trial unsent, and the spent trial is never replaced', async () => {
    f = trialOffice();
    f.hooks.list = (all, read) => read >= 2 ? [...all, comment(101, BODY)] : all;
    await expect(f.run()).resolves.toMatchObject(spent(/pre-state changed/));
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    f.hooks.list = undefined;
    await expect(f.run()).rejects.toThrow(/already refused or rejected/);
    await expect(f.run(PACKET, 'check')).rejects.toThrow(/already refused or rejected/);
    expect(nothing(f)).toEqual([[PACKET.effectId], []]);
});

/** Changes local policy during the preflight's last awaited read: the App-scoped issue read just before the synchronous claim. */
const atLastRead = (office: TrialOffice, change: () => void) => { office.hooks.issue = read => { if (read === 2) change(); return undefined; }; };

test.each<[string, (office: TrialOffice) => void, RegExp]>([
    ['a drain', office => { office.store.state.draining = true; }, /paused or draining/],
    ['a hold', () => { holds.value = { 'GH-629': 'Joe holds this issue.' }; }, /GH-629 is held/],
    ['another configured bot id', office => office.configure({ comment: ENTRY }, { botId: 1 }), /App, installation or bot/],
])('%s during the last read before the claim refuses at the claim: rejected unsent, no POST', async (_name, change, reason) => {
    f = trialOffice();
    atLastRead(f, () => change(f!));
    await expect(f.run()).resolves.toMatchObject(spent(reason));
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'rejected', dispatchedAt: '', writerRefusedAt: expect.any(String) });
    expect(f.counts.posts).toEqual([]);
    await expect(f.run()).rejects.toThrow(/already refused or rejected/);
    expect(nothing(f)).toEqual([[PACKET.effectId], []]);
});

test('a route moved to the operator during the last read is refused by the writer check first', async () => {
    f = trialOffice();
    atLastRead(f, () => f!.configure({ comment: 'operator' }));
    await expect(f.run()).resolves.toMatchObject(spent(/the route now selects the operator/));
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.counts.posts).toEqual([]);
});

test('an intent left prepared by a crash is resumed under the same id after restart, and sent once', async () => {
    f = trialOffice();
    let reached!: () => void;
    const atPreflight = new Promise<void>(resolve => { reached = resolve; });
    f.hooks.list = (all, read) => read === 2 ? (reached(), new Promise<never>(() => {})) : all;
    void f.run().catch(() => {});
    await atPreflight;
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'prepared', dispatchedAt: '' });
    // The process stops here: a new store on the same file sees the prepared intent.
    f.reopen();
    await expect(f.run(PACKET, 'check')).resolves.toMatchObject({ status: 'prepared', dispatched: false });
    // A drain that begins during the resumed run's target read refuses before the saved writer requests its token.
    const prepared = f.store.getEffect(PACKET.effectId), tokens = f.counts.tokens, drainAt = f.counts.issueReads + 1;
    f.hooks.issue = read => { if (read === drainAt) f!.store.state.draining = true; return undefined; };
    await expect(f.run()).rejects.toThrow(/paused or draining/);
    expect([f.counts.tokens, f.counts.posts, f.effects()]).toEqual([tokens, [], [PACKET.effectId]]);
    expect(f.store.getEffect(PACKET.effectId)).toEqual(prepared);
    // Once the drain clears, the same approved id continues.
    f.store.state.draining = false;
    f.hooks.issue = undefined;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true });
    expect([f.counts.posts, f.effects()]).toEqual([[APP_POST], [PACKET.effectId]]);
});

test('two concurrent runs send one comment', async () => {
    f = trialOffice();
    const both = await Promise.allSettled([f.run(), f.run()]);
    expect(both.map(outcome => outcome.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(String((both.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult).reason)).toMatch(/in progress/);
    expect(f.counts.posts).toEqual([APP_POST]);
});

const storeEffect = (office: TrialOffice, id: string) =>
    office.store.db.prepare('INSERT INTO effects (id, work_key, status, body) VALUES (?, ?, ?, ?)').run(id, 'x', 'rejected', '{}');

test('a retry or writer successor of the trial id in the store refuses the trial', async () => {
    for (const suffix of ['retry-1', 'writer-1', 'retry-1:writer-2']) {
        f = trialOffice();
        storeEffect(f, `${PACKET.effectId}:${suffix}`);
        await expect(f.run()).rejects.toThrow(/derived from this trial id/);
        expect(f.counts.posts).toEqual([]);
        f.cleanup(); f = undefined;
    }
});

test('an independently named id under the trial id is not a successor: the attempted trial is still read back', async () => {
    f = trialOffice();
    f.hooks.list = all => all.filter(item => item.id !== 900);
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', receipt: { id: 900 } });
    storeEffect(f, `${PACKET.effectId}:followup`);
    f.hooks.list = undefined;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true });
    expect(f.counts.posts).toEqual([APP_POST]);
});

test('the fixture accepts a POST only on the approved conversation', async () => {
    f = trialOffice();
    await expect(f.execute('gh', ['api', 'repos/JFusco/the-office/issues/630/comments', '--method', 'POST', '-f', `body=${BODY}`])).rejects.toThrow(/Not Found/);
    expect([f.counts.posts, f.comments.map(item => item.id)]).toEqual([[], [100]]);
});

test('a lost POST response is read back with no second POST; a marker match alone does not qualify', async () => {
    f = trialOffice();
    f.hooks.lose = true;
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', dispatched: true, qualified: false, receipt: null });
    f.hooks.lose = false;
    await expect(f.run(PACKET, 'check')).resolves.toMatchObject({ status: 'uncertain' });
    // One exact marker match beside an unreadable body cannot show uniqueness: the attempt stays unsettled.
    f.hooks.list = all => [...all, { ...comment(102, 'unreadable', OPERATOR), body: null as unknown as string }];
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', receipt: null, error: expect.stringMatching(/Complete issue comment bodies are required/), next: expect.stringMatching(/same packet/) });
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'uncertain', receipt: null });
    f.hooks.list = undefined;
    f.reopen();
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: false, qualification: null, receipt: { id: 900 } });
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: false });
    expect([f.counts.posts, f.effects()]).toEqual([[APP_POST], [PACKET.effectId]]);
});

test('a lagging listing leaves the attempt for read-back; the saved receipt then qualifies under the pinned writer after the entry is withdrawn', async () => {
    f = trialOffice();
    f.hooks.list = all => all.filter(item => item.id !== 900);
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', dispatched: true, receipt: { id: 900 } });
    // Still lagging on the next run: the failed read-back is reported with the attempt, its receipt and the next step.
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', dispatched: true, qualified: false, receipt: { id: 900 },
        error: expect.stringMatching(/does not yet show the comment/), next: expect.stringMatching(/run again with the same packet/) });
    expect(f.store.getEffect(PACKET.effectId)).toMatchObject({ status: 'uncertain', receipt: { id: 900 } });
    f.hooks.list = undefined;
    // The pending entry is withdrawn; the App block, and so the saved writer's own token, remains.
    f.configure({});
    const tokens = f.counts.tokens;
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: true, qualification: { actor: BOT } });
    expect([f.counts.tokens, f.counts.posts, f.effects()]).toEqual([tokens + 1, [APP_POST], [PACKET.effectId]]);
});

test('GitHub recording another actor never qualifies and never resends', async () => {
    f = trialOffice();
    f.hooks.author = OPERATOR;
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', qualified: false, receipt: { id: 900 } });
    await expect(f.run()).resolves.toMatchObject({ status: 'uncertain', qualified: false });
    expect(f.counts.posts).toEqual([APP_POST]);
    f.cleanup();
    // The bot's login with another account id settles delivery but is not the approved actor.
    f = trialOffice();
    f.hooks.author = { login: BOT.login, id: 1 };
    await expect(f.run()).resolves.toMatchObject({ status: 'verified', qualified: false, qualification: null });
    expect(f.counts.posts).toEqual([APP_POST]);
});

describe('a pull request conversation trial', () => {
    const prOffice = () => trialOffice({ comment: PR_ENTRY }, {}, PULL_CONVERSATION);
    const runPr = (office: TrialOffice, packet: object = PR_PACKET, mode: 'check' | 'run' = 'run') => office.run(packet, mode);

    test('check reads the approved PR and its conversation and creates, mints and sends nothing', async () => {
        f = prOffice();
        await expect(runPr(f, PR_PACKET, 'check')).resolves.toMatchObject({ status: 'none', target: PULL });
        expect([...nothing(f), f.counts.tokens, f.counts.pullReads]).toEqual([[], [], 0, 1]);
    });

    test('a matching run sends one POST through the shared PR comment adapter under the Pull requests grant, and qualifies the bot on the PR', async () => {
        f = prOffice();
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: true, receipt: { id: 900, url: `${PULL}#issuecomment-900` },
            qualification: { record: `${PULL}#issuecomment-900`, target: PULL, transition: 'pull request comment created', actor: BOT } });
        expect([f.counts.posts, f.counts.permissions]).toEqual([[APP_POST], [{ pull_requests: 'write' }]]);
        expect(f.counts.pullPrincipals).toEqual(['operator', APP_POST]);
        expect(f.store.getEffect(PR_PACKET.effectId)).toMatchObject({ operation: 'github-pr-comment', target: PULL, work: { projectId: 'the-office', kind: 'pr', id: '9001' },
            payload: prPayload(), writer: { principal: 'app', operation: 'comment', binding: { adapter: 'github-pr-comment', target: PULL } } });
        f.reopen();
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: true });
        expect(f.counts.posts).toEqual([APP_POST]);
    });

    test('the issue trial keeps its Issues grant', async () => {
        f = trialOffice();
        await f.run();
        expect(f.counts.permissions).toEqual([{ issues: 'write' }]);
    });

    test('a replacement packet whose head GitHub agrees with cannot reuse the approved entry, with no saved intent', async () => {
        f = prOffice();
        const moved = { sha: 'b'.repeat(40), ref: PR_PACKET.pull.head.ref };
        f.hooks.pull = () => ({ head: { ...moved, repo: { full_name: 'JFusco/the-office' } } });
        await expect(runPr(f, prPacket({ ...PR_PACKET.pull, head: moved }))).rejects.toThrow(/does not name this Effect/);
        expect([...nothing(f), f.counts.tokens, f.counts.pullReads]).toEqual([[], [], 0, 0]);
    });

    test.each<[string, Record<string, unknown>]>([
        ['moved to a new head', { head: { sha: 'b'.repeat(40), ref: PR_PACKET.pull.head.ref, repo: { full_name: 'JFusco/the-office' } } }],
        ['merged', { merged: true }],
        ['closed', { state: 'closed' }],
        ['locked', { locked: true }],
    ])('a PR %s while the final marker listing is in flight rejects the same intent unsent', async (_name, drift) => {
        f = prOffice();
        f.hooks.list = (all, read) => { if (read === 2) f!.hooks.pull = () => drift; return all; };
        await expect(runPr(f)).resolves.toMatchObject(spent(/approved head and base|not open, unmerged and unlocked/));
        expect(f.store.getEffect(PR_PACKET.effectId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
        expect(f.counts.posts).toEqual([]);
        await expect(runPr(f)).rejects.toThrow(/already refused or rejected/);
        expect(nothing(f)).toEqual([[PR_PACKET.effectId], []]);
    });

    test('a lost response settles delivery by independent read-back with no second POST, and stays unqualified without the POST receipt', async () => {
        f = prOffice();
        f.hooks.lose = true;
        await expect(runPr(f)).resolves.toMatchObject({ status: 'uncertain', dispatched: true, qualified: false, receipt: null });
        f.hooks.lose = false;
        f.reopen();
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: false, qualification: null, receipt: { id: 900, url: `${PULL}#issuecomment-900` } });
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: false });
        expect([f.counts.posts, f.effects()]).toEqual([[APP_POST], [PR_PACKET.effectId]]);
    });

    test('a lagging listing leaves the attempt for read-back under the saved App writer, which then qualifies it with no resend', async () => {
        f = prOffice();
        f.hooks.list = all => all.filter(item => item.id !== 900);
        await expect(runPr(f)).resolves.toMatchObject({ status: 'uncertain', receipt: { id: 900 } });
        f.hooks.list = undefined;
        f.configure({});
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: true, qualification: { actor: BOT, target: PULL } });
        expect([f.counts.posts, f.counts.permissions.at(-1)]).toEqual([[APP_POST], { pull_requests: 'write' }]);
    });

    test('another actor recorded on the PR comment never qualifies and never resends', async () => {
        f = prOffice();
        f.hooks.author = { login: BOT.login, id: 1 };
        await expect(runPr(f)).resolves.toMatchObject({ status: 'verified', qualified: false, qualification: null });
        f.cleanup();
        f = prOffice();
        f.hooks.author = OPERATOR;
        await expect(runPr(f)).resolves.toMatchObject({ status: 'uncertain', qualified: false });
        await expect(runPr(f)).resolves.toMatchObject({ status: 'uncertain', qualified: false });
        expect(f.counts.posts).toEqual([APP_POST]);
    });
});
