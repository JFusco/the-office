import { expect, test } from 'vitest';
import { officeConfigRoute, officeConfigSummary, type OfficeConfigInputs } from '../../../../server/office/http/office-config';
import { parseBindingBlocks } from '../../../../server/office/project-binding-blocks';
import { legacyCecBindings } from '../../../../server/office/project-bindings-config';
import { ownProjectBindings } from '../../../../server/office/own-project-bindings';
import type { OwnBindingBlocks } from '../../../../server/office/own-binding-blocks';
import { ACME_AUTHORITY, acmeEntry } from '../second-project-fixture';
import type { OfficeConfigSummary, OfficeProject } from '../../../../src/shared';

const inputs: OfficeConfigInputs = {
    projects: [
        { id: 'cec', name: 'CEC', provider: 'azure', repo: '/Users/private/cec', repository: 'cec-repo', target: 'staging', goalEvidencePaths: ['docs/goals.md'], board: { name: 'CEC Jira board', url: 'https://example.atlassian.net/board' } },
        { id: 'gh', name: 'Fixture', provider: 'github', repo: '/Users/private/gh', repository: 'owner/fixture', target: 'main', githubProject: { owner: 'owner', number: 1, url: 'https://github.com/users/owner/projects/1' } },
        { id: 'bare', name: 'Bare', provider: 'github', repo: '/tmp/bare', repository: 'owner/bare', target: 'main' },
    ],
    cec: { site: 'https://example.atlassian.net', cloudId: 'secret-cloud', board: 7, account: 'secret-account', repo: '/Users/private/cec', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', repositoryId: 'secret-repo-id', target: 'staging', goalEvidencePaths: ['docs/goals.md'] },
    holds: { 'CEC-1': 'Fixture hold reason.' },
};

test('projects only allowlisted fields, deriving GitHub boards and nulling missing ones', () => {
    const summary = officeConfigSummary(inputs);
    expect(summary).toEqual({
        projects: [
            { id: 'cec', name: 'CEC', provider: 'azure', repository: 'cec-repo', target: 'staging', boardName: 'CEC Jira board', boardUrl: 'https://example.atlassian.net/board', policy: { merge: 'human', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 9, weekends: false } } },
            { id: 'gh', name: 'Fixture', provider: 'github', repository: 'owner/fixture', target: 'main', boardName: 'Fixture GitHub board', boardUrl: 'https://github.com/users/owner/projects/1', policy: { merge: 'harness', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true } }, autoAdopt: { bots: [], source: 'none' } },
            { id: 'bare', name: 'Bare', provider: 'github', repository: 'owner/bare', target: 'main', boardName: null, boardUrl: null, policy: { merge: 'harness', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true } }, autoAdopt: { bots: [], source: 'none' } },
        ],
        cec: { site: 'https://example.atlassian.net', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', target: 'staging' },
        holds: [{ key: 'CEC-1', reason: 'Fixture hold reason.' }],
    });
    const text = JSON.stringify(summary);
    for (const secret of ['secret-cloud', 'secret-account', 'secret-repo-id', '/Users/private', 'goals.md']) expect(text).not.toContain(secret);
});
test('each bound Jira/Azure project shows its own allowlisted connection and resolved policy, never secrets', () => {
    const acme = { id: 'acme', name: 'Acme', provider: 'azure' as const, repo: '/tmp/acme-web', repository: 'acme-web', target: 'develop' };
    const blocks = parseBindingBlocks(JSON.parse(JSON.stringify(acmeEntry)), undefined) as OwnBindingBlocks;
    const bindings = new Map([['cec', legacyCecBindings(inputs.cec)], ['acme', ownProjectBindings(acme, blocks)]]);
    const summary = officeConfigSummary({ ...inputs, projects: [inputs.projects[0], acme, inputs.projects[1]], bindings, policies: new Map([['gh', { handsOff: true }]]) });
    expect(summary.projects[0]).toMatchObject({ id: 'cec', jira: { site: 'https://example.atlassian.net', projectKey: 'CEC', intakeStatuses: ['To Do', 'Open'], defaultPickup: 'To Do' }, azure: { organization: 'https://dev.azure.com/example', project: 'example' } });
    expect(summary.projects[1]).toEqual({ id: 'acme', name: 'Acme', provider: 'azure', repository: 'acme-web', target: 'develop', boardName: null, boardUrl: null,
        policy: { merge: 'human', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true } },
        jira: { site: 'https://acme.example.net', projectKey: 'ACME', intakeStatuses: ['Selected', 'Ready'], defaultPickup: 'Selected' },
        azure: { organization: 'https://dev.azure.com/acme', project: 'Acme' } });
    expect(summary.projects[2]).toMatchObject({ id: 'gh', policy: { handsOff: true } });
    expect(summary.projects[2]).not.toHaveProperty('jira');
    expect(summary.cec).toEqual({ site: 'https://example.atlassian.net', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', target: 'staging' });
    const text = JSON.stringify(summary);
    for (const secret of ['secret-cloud', 'secret-account', 'secret-repo-id', '/Users/private', 'acme-cloud', 'acme-account', 'office@acme.example', 'acme-sub', 'acme-rg', 'acme-repo-id', '/tmp/acme-web', ACME_AUTHORITY, 'Living Dev/QA/PM', '"twgProfile"', 'ca-cos-conductor'])
        expect(text).not.toContain(secret);
});
test('GET shows each GitHub project\'s effective bot adoption under its injected policy, and none for Azure', async () => {
    const board = (n: number) => ({ owner: 'owner', number: n, url: `https://github.com/users/owner/projects/${n}` });
    const github = (id: string, extra: Partial<OfficeProject> = {}): OfficeProject => ({ id, name: id, provider: 'github', repo: `/tmp/${id}`, repository: `owner/${id}`, target: 'main', githubProject: board(1), ...extra });
    const projects = [inputs.projects[0],
        github('gh'), github('subset', { autoAdopt: ['wiki-sync', 'dependabot'] }), github('empty', { autoAdopt: [] }),
        // `brain` is hands-off by default; its injected policy turns that off, so even its explicit list is inactive.
        github('brain', { autoAdopt: ['pin-courier'] }), github('bare', { githubProject: undefined })];
    const policies = new Map([['gh', { handsOff: true }], ['subset', { handsOff: true }], ['empty', { handsOff: true }], ['brain', { handsOff: false }], ['bare', { handsOff: true }]]);
    const response = (await officeConfigRoute(new Request('http://local/api/office-config'), new URL('http://local/api/office-config'), { config: { ...inputs, projects, policies } }))!;
    const body = await response.json() as OfficeConfigSummary;
    expect(body.projects.map(project => [project.id, project.policy?.handsOff, project.autoAdopt])).toEqual([
        ['cec', false, undefined],
        ['gh', true, { bots: ['dependabot', 'pin-courier', 'wiki-sync'], source: 'default' }],
        ['subset', true, { bots: ['wiki-sync', 'dependabot'], source: 'explicit' }],
        ['empty', true, { bots: [], source: 'explicit' }],
        ['brain', false, { bots: [], source: 'none' }],
        ['bare', true, { bots: [], source: 'none' }],
    ]);
    expect(body.projects[0]).not.toHaveProperty('autoAdopt');
    expect(body.projects.at(-1)).toMatchObject({ boardName: null, boardUrl: null });
});
test('serves the projection on GET, rejects other methods and ignores other paths', async () => {
    const call = (method: string, path = '/api/office-config') => officeConfigRoute(new Request('http://local' + path, { method }), new URL('http://local' + path), { config: { ...inputs, holds: {} } });
    const response = (await call('GET'))!;
    expect(response.status).toBe(200);
    expect((await response.json()).holds).toEqual([]);
    expect((await call('POST'))!.status).toBe(405);
    expect(await call('GET', '/api/office')).toBeUndefined();
});

test('each project summary carries the effective release-marker opt-in: the CMS default, an explicit false, and off elsewhere', () => {
    const cms = { id: 'cms-field-vocabulary', name: 'CMS', provider: 'github' as const, repo: '/tmp/cms', repository: 'JFusco/cms-field-vocabulary', target: 'main' };
    const on = officeConfigSummary({ ...inputs, projects: [...inputs.projects, cms] });
    expect(on.projects.map(project => [project.id, project.policy?.releaseMarkerCheck])).toEqual([['cec', false], ['gh', false], ['bare', false], ['cms-field-vocabulary', true]]);
    const off = officeConfigSummary({ ...inputs, projects: [cms], policies: new Map([['cms-field-vocabulary', { releaseMarkerCheck: false }]]) });
    expect(off.projects[0].policy).toMatchObject({ handsOff: true, releaseMarkerCheck: false });
});
