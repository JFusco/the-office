import { expect, test } from 'vitest';
import { AUTO_ADOPT_BOTS, effectiveAutoAdopt } from '../../../../../server/delivery/intake/dependency-bots/effective-auto-adopt';
import type { OfficeProject } from '../../../../../src/shared';

const board = { owner: 'JFusco', number: 6, url: 'https://github.com/users/JFusco/projects/6' };
const github = (extra: Partial<OfficeProject> = {}): Pick<OfficeProject, 'provider' | 'autoAdopt' | 'githubProject'> => ({ provider: 'github', githubProject: board, ...extra });

test('every supported bot, Dependabot included, is the hands-off GitHub default', () => {
    expect(AUTO_ADOPT_BOTS).toEqual(['dependabot', 'pin-courier', 'wiki-sync']);
    expect(effectiveAutoAdopt(github(), true)).toEqual({ bots: ['dependabot', 'pin-courier', 'wiki-sync'], source: 'default' });
});

test('an explicit list wins as written, in its own order, and an empty list adopts none', () => {
    expect(effectiveAutoAdopt(github({ autoAdopt: ['wiki-sync', 'dependabot'] }), true)).toEqual({ bots: ['wiki-sync', 'dependabot'], source: 'explicit' });
    expect(effectiveAutoAdopt(github({ autoAdopt: ['pin-courier'] }), true)).toEqual({ bots: ['pin-courier'], source: 'explicit' });
    expect(effectiveAutoAdopt(github({ autoAdopt: [] }), true)).toEqual({ bots: [], source: 'explicit' });
});

test.each([
    { name: 'a GitHub project that is not hands-off', project: github(), handsOff: false },
    { name: 'a GitHub project that is not hands-off, with a populated list', project: github({ autoAdopt: ['dependabot', 'pin-courier'] }), handsOff: false },
    { name: 'a hands-off GitHub project without a board', project: { provider: 'github' as const }, handsOff: true },
    { name: 'a hands-off GitHub project without a board, with a populated list', project: { provider: 'github' as const, autoAdopt: ['wiki-sync' as const] }, handsOff: true },
    { name: 'a Jira/Azure project', project: { provider: 'azure' as const, githubProject: board }, handsOff: true },
])('$name adopts no bot', ({ project, handsOff }) => {
    expect(effectiveAutoAdopt(project, handsOff)).toEqual({ bots: [], source: 'none' });
});

test('the returned list is a copy, so a caller cannot change the configured project', () => {
    const project = github({ autoAdopt: ['pin-courier'] });
    effectiveAutoAdopt(project, true).bots.push('dependabot');
    expect(project.autoAdopt).toEqual(['pin-courier']);
});
