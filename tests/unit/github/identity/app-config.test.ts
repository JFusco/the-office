import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { parseGitHubApp, type KnownProject } from '../../../../server/github/identity/app-config';

const projects: KnownProject[] = [
    { id: 'the-office', provider: 'github', repository: 'JFusco/the-office' },
    { id: 'brain', provider: 'github', repository: 'JFusco/brain' },
    { id: 'cec', provider: 'azure', repository: 'example' },
];
const digest = 'a'.repeat(64);
function block(change: Record<string, unknown> = {}) {
    return {
        appId: 5932019, installationId: 186014638, botLogin: 'the-office-app[bot]',
        keySource: { kind: 'keychain', service: 'the-office-github-app', account: 'service' },
        repositories: { 'the-office': { repository: 'JFusco/the-office', repositoryId: 101 }, brain: { repository: 'JFusco/brain', repositoryId: 102 } },
        writes: { 'the-office': { comment: 'operator' } }, ...change,
    };
}
const qualify = (change: Record<string, unknown> = {}) => ({ mode: 'qualify', effectId: 'harness:job:issue-close:5', installationId: 186014638, repositoryId: 101,
    adapter: 'github-issue-close', target: 'https://github.com/JFusco/the-office/issues/5', beforeDigest: digest, expectedDigest: digest, ...change });
const routes = (writes: Record<string, unknown>) => block({ writes: { 'the-office': writes } });

test('an absent block stays absent: every route then selects the operator', () => {
    expect(parseGitHubApp(undefined, projects)).toBeUndefined();
});

test('the four entry forms parse, keyed by project and operation', () => {
    const config = parseGitHubApp(routes({
        comment: 'operator', 'issue-close': qualify(), 'pr-ready': { mode: 'office-app', proofEffectIds: ['b', 'a'] }, merge: { mode: 'operator', revokes: 'harness:job:merge' },
        'issue-edit': qualify({ adapter: 'feature-update', revokes: 'prior' }),
    }), projects)!;
    expect(config.writes['the-office']).toEqual({
        comment: 'operator', 'issue-close': qualify(), 'pr-ready': { mode: 'office-app', proofEffectIds: ['b', 'a'] }, merge: { mode: 'operator', revokes: 'harness:job:merge' },
        'issue-edit': qualify({ adapter: 'feature-update', revokes: 'prior' }),
    });
    expect(config.writes.brain).toBeUndefined();
});

test('board routes bind their board and field', () => {
    expect(parseGitHubApp(routes({ 'board-status': qualify({ adapter: 'github-project-status', board: 'PVT_1', field: 'PVTSSF_1' }) }), projects)!.writes['the-office']!['board-status'])
        .toMatchObject({ board: 'PVT_1', field: 'PVTSSF_1' });
    expect(() => parseGitHubApp(routes({ 'board-add': qualify({ adapter: 'github-project-add', board: 'PVT_1', field: 'PVTSSF_1' }) }), projects)).toThrow('board-add.field: unknown field');
    expect(() => parseGitHubApp(routes({ 'board-field': qualify({ adapter: 'github-cost-field' }) }), projects)).toThrow('board-field.board: malformed value');
    expect(() => parseGitHubApp(routes({ comment: qualify({ adapter: 'github-issue-comment', board: 'PVT_1' }) }), projects)).toThrow('comment.board: unknown field');
});

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
test.each([
    ['an unknown field', block({ extra: true }), 'githubApp.extra: unknown field'],
    ['a private key field', block({ privateKey: 'x' }), 'secret material never belongs'],
    ['a key pasted into a value', block({ botLogin: privateKey }), 'secret material never belongs'],
    ['an installation token pasted into a value', block({ keySource: { kind: 'keychain', service: 'ghs_abcdefghijklmnopqrstuvwxyz0123456789', account: 'a' } }), 'secret material never belongs'],
    ['a signed JWT pasted into a value', routes({ comment: { mode: 'operator', revokes: 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiIxIn0.c2ln' } }), 'secret material never belongs'],
    ['a token field in an entry', routes({ comment: { mode: 'operator', revokes: 'a', token: 'x' } }), 'secret material never belongs'],
    ['an unapproved key source', block({ keySource: { kind: 'file', path: '/tmp/key.pem' } }), 'keySource.path'],
    ['an unknown repository project', block({ repositories: { nowhere: { repository: 'JFusco/nowhere', repositoryId: 1 } } }), 'repositories.nowhere: unknown GitHub project'],
    ['a Jira/Azure project', block({ repositories: { cec: { repository: 'example', repositoryId: 1 } } }), 'repositories.cec: unknown GitHub project'],
    ['a conflicting repository name', block({ repositories: { brain: { repository: 'JFusco/other', repositoryId: 1 } } }), "conflicts with the project's repository"],
    ['a repeated repository id', block({ repositories: { 'the-office': { repository: 'JFusco/the-office', repositoryId: 7 }, brain: { repository: 'JFusco/brain', repositoryId: 7 } } }), 'two projects name the same repository id'],
    ['an unknown write project', block({ writes: { nowhere: {} } }), 'writes.nowhere: unknown GitHub project'],
    ['an unknown operation', routes({ board: 'operator' }), 'writes.the-office.board: unknown write operation'],
    ['an unknown mode', routes({ comment: { mode: 'app' } }), "expected 'qualify', 'office-app' or 'operator'"],
    ['a rollback with no reference', routes({ comment: { mode: 'operator' } }), 'comment.revokes: a saved Effect id is required'],
    ['a malformed reference', routes({ comment: { mode: 'operator', revokes: 'has spaces in it' } }), 'comment.revokes: a saved Effect id is required'],
    ['an empty proof set', routes({ comment: { mode: 'office-app', proofEffectIds: [] } }), 'one or more proof Effect ids are required'],
    ['repeated proofs', routes({ comment: { mode: 'office-app', proofEffectIds: ['a', 'a'] } }), 'proof Effect ids repeat'],
    ['an active entry that also revokes', routes({ comment: { mode: 'office-app', proofEffectIds: ['a'], revokes: 'b' } }), 'comment.revokes: unknown field'],
    ['a trial for another installation', routes({ 'issue-close': qualify({ installationId: 1 }) }), 'conflicts with githubApp.installationId'],
    ['a trial for another repository', routes({ 'issue-close': qualify({ repositoryId: 102 }) }), "conflicts with the project's repository binding"],
    ['a trial on another route\'s adapter', routes({ 'issue-close': qualify({ adapter: 'github-issue-comment' }) }), 'is not a issue-close adapter'],
    ['a malformed digest', routes({ 'issue-close': qualify({ beforeDigest: 'abc' }) }), 'beforeDigest: malformed value'],
    ['an App route without a repository binding', block({ repositories: {}, writes: { brain: { 'issue-close': qualify() } } }), 'needs the project in githubApp.repositories'],
    ['a malformed bot login', block({ botLogin: 'the-office-app' }), 'botLogin: malformed value'],
])('%s stops start-up and the error never repeats a value', (_, raw, message) => {
    let error: Error | undefined;
    try { parseGitHubApp(raw, projects); } catch (caught) { error = caught as Error; }
    expect(error?.message).toContain(message);
    expect(error?.message).not.toMatch(/BEGIN|ghs_|eyJ/);
});

test('the block requires configured projects to bind its repositories', () => {
    expect(() => parseGitHubApp(block(), undefined)).toThrow('requires configured projects');
});

test('the example config ships the App block with every route on the operator, and it parses', () => {
    const example = JSON.parse(readFileSync(resolve(__dirname, '../../../../office-config.example.json'), 'utf8'));
    const config = parseGitHubApp(example.githubApp, example.projects)!;
    expect(Object.values(config.writes).flatMap(routes => Object.values(routes))).toEqual(expect.arrayContaining(['operator']));
    expect(Object.values(config.writes).flatMap(routes => Object.values(routes)).every(entry => entry === 'operator')).toBe(true);
});
