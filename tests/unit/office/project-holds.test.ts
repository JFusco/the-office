import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { HOLDS } from '../../../server/office/config';
import { localBindings } from '../../../server/office/local-config';
import { holdReason, holdsFor, topLevelHold } from '../../../server/office/project-holds';
import { parseProjectPolicy, type ProjectPolicyInput } from '../../../server/office/project-policy-config';
import { projectPolicy, resolveProjectPolicy } from '../../../server/office/project-policy';
import { persistedProject } from '../../../server/office/projects';

const roots: string[] = [], added: string[] = [];
afterEach(() => {
    vi.unstubAllEnvs();
    roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
    added.splice(0).forEach(key => delete HOLDS[key]);
});
const hold = (key: string, reason: string) => { HOLDS[key] = reason; added.push(key); };

const web = { id: 'web', provider: 'github' as const }, docs = { id: 'docs', provider: 'github' as const }, cec = { id: 'cec', provider: 'azure' as const };
const inputs = (entries: [string, ProjectPolicyInput][]) => new Map(entries);

test("a project's own hold wins over the top-level hold for the same key", () => {
    hold('GH-901', 'top-level');
    const registry = inputs([['web', { holds: { 'GH-901': 'own' } }]]);
    expect(holdReason(web, 'GH-901', registry)).toBe('own');
    expect(holdsFor(web, registry)['GH-901']).toBe('own');
});

test('a top-level hold applies to every project, as before, including the built-in CEC holds', () => {
    hold('GH-902', 'top-level');
    const registry = inputs([['web', { holds: { 'GH-1': 'other' } }]]);
    for (const project of [web, docs, cec]) expect(holdReason(project, 'GH-902', registry)).toBe('top-level');
    expect(holdReason(cec, 'CEC-108')).toBe(HOLDS['CEC-108']);
    expect(holdReason(cec, 'CEC-108')).toBeTruthy();
    expect(holdReason(web, 'CEC-120')).toBe(HOLDS['CEC-120']);
    expect(topLevelHold('GH-902')).toBe('top-level');
    expect(holdReason(web, 'GH-903')).toBeUndefined();
});

test("a hold in one project never holds another project's ticket with the same key", () => {
    const registry = inputs([['web', { holds: { 'GH-12': 'web only' } }]]);
    expect(holdReason(web, 'GH-12', registry)).toBe('web only');
    expect(holdReason(docs, 'GH-12', registry)).toBeUndefined();
    expect(holdsFor(docs, registry)['GH-12']).toBeUndefined();
});

test('inherited keys never resolve as holds', () => {
    const registry = inputs([['web', { holds: { 'GH-1': 'own' } }]]);
    for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
        expect(holdReason(web, key, registry)).toBeUndefined();
        expect(topLevelHold(key)).toBeUndefined();
        expect(holdsFor(web, registry)[key]).toBeUndefined();
    }
});

test('the merged view is a frozen snapshot with the same precedence', () => {
    hold('GH-904', 'top-level');
    const view = holdsFor(web, inputs([['web', { holds: { 'GH-905': 'own' } }]]));
    expect(Object.isFrozen(view)).toBe(true);
    expect({ ...view }).toMatchObject({ 'GH-904': 'top-level', 'GH-905': 'own', 'CEC-108': HOLDS['CEC-108'] });
});

test('policy.holds is validated strictly and returned as written', () => {
    expect(parseProjectPolicy(web, { holds: {} })).toEqual({ holds: {} });
    expect(parseProjectPolicy(web, { holds: { 'GH-1': 'Waiting on design', 'ACME_2-40': 'Legal' } })).toEqual({ holds: { 'GH-1': 'Waiting on design', 'ACME_2-40': 'Legal' } });
    expect(parseProjectPolicy(web, { merge: 'human' })).toEqual({ merge: 'human' });
});

test.each([
    [{ holds: null }, 'Project "web": policy.holds must be an object'],
    [{ holds: [] }, 'Project "web": policy.holds must be an object'],
    [{ holds: 'GH-1' }, 'Project "web": policy.holds must be an object'],
    [{ holds: { 'gh-1': 'x' } }, 'Project "web": policy.holds key "gh-1" must be a ticket key'],
    [{ holds: { 'GH-0': 'x' } }, 'Project "web": policy.holds key "GH-0" must be a ticket key'],
    [{ holds: { 'GH-01': 'x' } }, 'Project "web": policy.holds key "GH-01" must be a ticket key'],
    [{ holds: { constructor: 'x' } }, 'Project "web": policy.holds key "constructor" must be a ticket key'],
    [{ holds: { 'GH-1': '' } }, 'Project "web": policy.holds.GH-1 must be a non-empty reason'],
    [{ holds: { 'GH-1': 3 } }, 'Project "web": policy.holds.GH-1 must be a non-empty reason'],
])('policy %o fails naming the project and key', (raw, message) => {
    expect(() => parseProjectPolicy(web, raw)).toThrow(new Error(message));
});

test('a __proto__ key from JSON is rejected, never dropped', () => {
    expect(() => parseProjectPolicy(web, JSON.parse('{"holds":{"__proto__":"x"}}'))).toThrow(new Error('Project "web": policy.holds key "__proto__" must be a ticket key'));
});

test('the resolved policy defaults holds to none and freezes them', () => {
    expect(projectPolicy(web).holds).toEqual({});
    expect(Object.isFrozen(projectPolicy(web).holds)).toBe(true);
    const resolved = resolveProjectPolicy(web, { holds: { 'GH-1': 'own' } });
    expect(resolved.holds).toEqual({ 'GH-1': 'own' });
    expect(Object.isFrozen(resolved.holds)).toBe(true);
    expect(() => { (resolved.holds as Record<string, string>)['GH-2'] = 'x'; }).toThrow();
});

test('the loader validates policy.holds and keeps it out of the saved project', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-project-holds-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const entry = { id: 'web', name: 'Web', provider: 'github', repo: '/tmp/web', repository: 'example/web', target: 'main' };
    const load = (project: Record<string, unknown>) => { writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ projects: [project] })); return localBindings(root).projects![0]; };
    const loaded = load({ ...entry, policy: { holds: { 'GH-7': 'Waiting on Joe' } } });
    expect(loaded.policy).toEqual({ holds: { 'GH-7': 'Waiting on Joe' } });
    expect(persistedProject(loaded)).toEqual(entry);
    expect(JSON.stringify(persistedProject(loaded))).not.toContain('Waiting on Joe');
    expect(() => load({ ...entry, policy: { holds: { 'GH-7': '' } } })).toThrow('Project "web": policy.holds.GH-7 must be a non-empty reason');
});

test('a configured policy.holds entry reaches the start-up registry by project id and stops a harness write', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-project-holds-')); roots.push(root);
    const project = { id: 'held-site', name: 'Web', provider: 'github' as const, repo: '/tmp/web', repository: 'example/web', target: 'main' };
    writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ projects: [{ ...project, policy: { holds: { 'GH-7': 'Waiting on Joe' } } }] }));
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('OFFICE_DATA_ROOT', root);
    vi.resetModules();
    try {
        // Unmocked start-up imports: config reads the file above, projects builds PROJECT_POLICY_INPUTS from it.
        const startup = await import('../../../server/office/project-holds');
        const { assertMayMutate } = await import('../../../server/delivery/harness/guards');
        expect(startup.holdReason(project, 'GH-7')).toBe('Waiting on Joe');
        expect(startup.holdReason(web, 'GH-7')).toBeUndefined();
        const job = { id: 'job-7', key: 'GH-7' } as never;
        expect(() => assertMayMutate({ project, state: { paused: false } } as never, [job], job, '')).toThrow(new Error('GH-7 is held: Waiting on Joe'));
    } finally { vi.unstubAllEnvs(); vi.resetModules(); }
});
