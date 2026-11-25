import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { apiRoute } from '../../../../server/office/http/api-routes';
import { DeploymentFence } from '../../../../server/office/deployment-fence';
import { InFlightOperations } from '../../../../server/office/in-flight-operations';
import { officeCapacity } from '../../../../server/office/projects';
import { ResumeControl } from '../../../../server/incidents/repair/resume-control';
import { GitHubCalls } from '../../../../server/github/github-calls';
import { withGitHubSource } from '../../../../server/github/call-scope';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function context(githubCalls?: GitHubCalls) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const offices = { fence: new DeploymentFence(db), resumes: new ResumeControl(db), operations: new InFlightOperations(), capacity: officeCapacity(), entries: new Map(), serviceInstanceId: 'instance', control: { summaries: () => [] }, stores: () => new Map(), githubCalls };
    const store = { state: { startedAt: '2026-11-24T12:00:00.000Z', paused: false }, project: { id: 'cec' } };
    return { offices, itSpecialist: { running: false }, loadedRevision: { hash: 'h' }, store, engine: { features: {} }, project: 'cec' } as any;
}
async function health(ctx: any) { const url = new URL('http://127.0.0.1:4318/api/health'); return (await apiRoute(new Request(url), url, ctx))!.text(); }

test('health reports the GitHub calls of the last hour from memory, with no provider call and no call contents', async () => {
    const raw = vi.fn(async (_program: string, args: string[]) => args.includes('rate_limit') ? JSON.stringify({ resources: { core: { limit: 5000, used: 9, remaining: 4991, reset: 1795000000 } } }) : '[[{"n":1}],[{"n":2}]]');
    let now = Date.parse('2026-11-24T12:00:00.000Z');
    const calls = new GitHubCalls(raw, 'instance', () => now);
    await withGitHubSource('monitor', () => calls.run('gh', ['api', 'repos/JFusco/secret-repo/pulls?state=open', '--paginate', '--slurp', '-H', 'Authorization: token ghp_SECRET', '-f', 'body=private text'], { input: 'private input' }));
    await calls.quota.sample();
    // Another sample is due by now, so a read that sampled would be seen.
    now += 5 * 60_000;
    raw.mockClear();
    const text = await health(context(calls)), body = JSON.parse(text);
    expect(raw).not.toHaveBeenCalled();
    expect(body.github).toMatchObject({ serviceInstanceId: 'instance', window: { complete: false }, totals: { invocations: 2, pages: 3 }, quota: { core: { used: 9, remaining: 4991 } } });
    expect(body.github.sources.find((s: any) => s.source === 'monitor')).toMatchObject({ invocations: 1, pages: 2, families: [{ family: 'pulls', pages: 2 }] });
    for (const secret of ['secret-repo', 'ghp_SECRET', 'Authorization', 'private text', 'private input', 'state=open']) expect(text).not.toContain(secret);
});

test('an Office built without the ledger reports none', async () => {
    expect(JSON.parse(await health(context())).github).toBeNull();
});
