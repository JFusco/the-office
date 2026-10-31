import * as childContext from '../../server/candidate-child-context';
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { GitHubDelivery } from '../../server/github-delivery';
import { GitOperations } from '../../server/git-operations';
import { ProjectProgress } from '../../server/project-progress';
import { adoptCandidate } from '../../server/candidate-adoption';
import { projectById } from '../../server/projects';
import { coordination } from '../../server/coordination';
import { enqueueSourceAmendment } from '../../server/requests';
import { GH91, amendmentIssueSha256, authorizeSourceAmendment, requireSourceAmendmentAcceptance, withAmendmentOwnership } from '../../server/source-amendment';
import { RELEASE_AMENDMENT_PATHS, RELEASE_SOURCE_IDS, releaseAmendmentJournal, releaseAmendmentProfileIds, sourceHash, sourceJson, verifyReleaseAmendmentScope } from '../../server/source-amendment-scope';
import type { StageResult, TicketJob } from '../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const bound = ['optimizely-paas.cms13-admin', 'optimizely-paas.cms13-model'];
const graph = 'scripts/wiki/graph/data/graph.json', connections = 'wiki/connections.md';
const finalHead = 'c'.repeat(40), baseHead = 'b'.repeat(40);
const urls = ['https://docs.optimizely.com/cms-saas/release-notes', 'https://docs.optimizely.com/cms-12/release-notes', 'https://docs.optimizely.com/cms-13/release-notes'];
function sourceFixture() {
    const affectedProfiles = [...bound, ...Array.from({ length: 5 }, (_, i) => `affected.profile-${i}`)];
    const profiles = [...affectedProfiles, ...Array.from({ length: 10 }, (_, i) => `other.profile-${i}`)].map(id => ({ id, sourceIds: ['unrelated'], claims: ['unchanged'] }));
    const registrations = RELEASE_SOURCE_IDS.map((id, index) => ({ id, url: urls[index], profiles: index === 0 ? affectedProfiles.slice(2, 5) : index === 1 ? affectedProfiles.slice(5) : bound, role: 'release-index', extract: { identityPattern: '(2026\\.\\d+)', identityCapture: 1 } }));
    const observations = registrations.map(source => ({ sourceId: source.id, url: source.url, reviewStatus: 'reviewed', identities: ['2026.1'],
        rawSha256: sourceHash('Release 2026.1'), normalizedSha256: sourceHash('Release 2026.1'), fragmentSha256: sourceHash(sourceJson(['2026.1'])),
        observedAt: '2026-10-29T20:00:00Z', requiredTokens: [], missingRequiredTokens: [], missingObservedTokens: [], observedTokens: null, observedTokenSetSha256: null }));
    const lock = { reviewedAt: observations[0].observedAt, sources: observations.map(observation => ({ ...observation, reviewedAt: observation.observedAt, requiredTokenSetSha256: sourceHash(sourceJson([])) })).concat([{ sourceId: 'unrelated', stable: true } as any]) };
    const proposed: Record<string, string> = Object.fromEntries(RELEASE_AMENDMENT_PATHS.map(path => [path, '']));
    Object.assign(proposed, { 'sources.lock.json': sourceJson(lock), 'sources/official-sources.json': sourceJson({ sources: registrations }),
        'sources/evidence-locators.json': sourceJson({ sources: RELEASE_SOURCE_IDS.map(sourceId => ({ sourceId, locator: 'approved' })) }),
        'scripts/source-scan.mjs': 'start\nscanner approved\nmiddle\nbase behavior\nend\n', 'tests/source-scan.test.mjs': 'start\nreject approved\nmiddle\nbase checks\nend\n',
        [graph]: '{"nodes":[],"edges":[]}\n', [connections]: 'Approved connections\n',
        'wiki/topics/official-source-freshness.md': 'start\napproved amendment\nmiddle\nother docs\nend\n',
        'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md': 'Approved repair journal\n',
        'catalog/catalog.json': sourceJson({ profiles }), 'catalog/manifest.json': sourceJson({ profiles: profiles.map(profile => ({ id: profile.id, digest: 'unchanged' })) }),
        'package.json': sourceJson({ scripts: { 'wiki:graph': 'node scripts/wiki/build-graph.mjs' } }) });
    for (const id of bound) for (const dir of ['sources/profiles', 'catalog/profiles']) proposed[`${dir}/${id}.json`] = sourceJson({ ...profiles.find(profile => profile.id === id), sourceIds: ['unrelated', ...RELEASE_SOURCE_IDS] });
    const regenerate = (files: Record<string, string>) => {
        const catalog = JSON.parse(files['catalog/catalog.json']), manifest = JSON.parse(files['catalog/manifest.json']);
        catalog.profiles = catalog.profiles.map((profile: any) => bound.includes(profile.id) ? JSON.parse(files[`catalog/profiles/${profile.id}.json`]) : profile);
        catalog.sourceLockDigest = `sha256:${sourceHash(sourceJson(JSON.parse(files['sources.lock.json'])))}`;
        files['catalog/catalog.json'] = sourceJson(catalog);
        Object.assign(manifest, { catalogDigest: `sha256:${sourceHash(sourceJson(catalog))}`, sourceLockDigest: catalog.sourceLockDigest, sourceManifestDigest: `sha256:${sourceHash(sourceJson(JSON.parse(files['sources/official-sources.json'])))}` });
        manifest.profiles = manifest.profiles.map((profile: any) => bound.includes(profile.id) ? { ...profile, digest: `sha256:${sourceHash(sourceJson(JSON.parse(files[`catalog/profiles/${profile.id}.json`])))}` } : profile);
        files['catalog/manifest.json'] = sourceJson(manifest);
    };
    regenerate(proposed);
    const originalBase: Record<string, string> = { ...proposed, 'scripts/source-scan.mjs': proposed['scripts/source-scan.mjs'].replace('scanner approved', 'scanner old'),
        'tests/source-scan.test.mjs': proposed['tests/source-scan.test.mjs'].replace('reject approved', 'reject old'),
        'wiki/topics/official-source-freshness.md': proposed['wiki/topics/official-source-freshness.md'].replace('approved amendment', 'old docs'),
        'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md': '' };
    const base = { ...originalBase }, candidate = { ...proposed };
    const data: Record<string, Record<string, string>> = { originalBase, proposal: proposed, base, candidate };
    const changed = () => RELEASE_AMENDMENT_PATHS.filter(path => base[path] !== candidate[path]);
    const generated = { [graph]: proposed[graph], [connections]: proposed[connections] };
    const verify = () => verifyReleaseAmendmentScope((path, revision) => data[revision][path], changed(), generated);
    return { data, base, candidate, proposed, originalBase, regenerate, changed, generated, verify, observations, profiles, affectedProfiles };
}
test('approved applicability derives seven affected profiles from a seventeen-profile catalog, preserving the other ten', () => {
    const a = sourceFixture(), read = (path: string, revision: 'base' | 'originalBase' | 'proposal' | 'candidate') => a.data[revision][path];
    expect(a.profiles).toHaveLength(17);
    expect(releaseAmendmentProfileIds(read)).toEqual([...a.affectedProfiles].sort());
    expect(a.verify().scopeSha256).toMatch(/^[a-f0-9]{64}$/);
    const catalog = JSON.parse(a.candidate['catalog/catalog.json']);
    catalog.profiles.at(-1).claims = ['unapproved']; a.candidate['catalog/catalog.json'] = sourceJson(catalog);
    expect(a.verify).toThrow('Unapproved source/binding changed');
});
test.each(['missing-registration', 'duplicate-applicability', 'wrong-coverage', 'missing-catalog', 'extra-catalog'] as const)('affected applicability rejects %s', mutation => {
    const a = sourceFixture(), registrations = JSON.parse(a.proposed['sources/official-sources.json']);
    if (mutation === 'missing-registration') registrations.sources.pop();
    if (mutation === 'duplicate-applicability') registrations.sources[0].profiles.push(registrations.sources[0].profiles[0]);
    if (mutation === 'wrong-coverage') registrations.sources[0].profiles.pop();
    a.proposed['sources/official-sources.json'] = sourceJson(registrations);
    const catalog = JSON.parse(a.candidate['catalog/catalog.json']);
    if (mutation === 'missing-catalog') catalog.profiles.shift();
    if (mutation === 'extra-catalog') catalog.profiles.push({ id: 'new' });
    a.candidate['catalog/catalog.json'] = sourceJson(catalog);
    expect(() => releaseAmendmentProfileIds((path, revision) => a.data[revision][path])).toThrow();
});
test('capture-derived amendment ledger corrects historical caption, preserves original rows, and records inventory without impact acceptance', () => {
    const a = sourceFixture(), path = 'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md';
    a.proposed[path] = 'On October 29 the reviewed observations were:\n\nOriginal table rows remain here.\n\n## Claim dispositions\nExisting scoped claims remain here.\n';
    const read = (path: string, revision: 'base' | 'originalBase' | 'proposal' | 'candidate') => a.data[revision][path];
    a.candidate[path] = releaseAmendmentJournal(read);
    expect(a.candidate[path]).toContain('Original table rows remain here.');
    expect(a.candidate[path]).toContain('Existing scoped claims remain here.');
    expect(a.candidate[path]).not.toContain('On October 29 the reviewed observations were:');
    expect(a.candidate[path]).toContain('Their metadata alone does not establish retained same-response body evidence');
    expect(a.candidate[path]).toContain('This ledger does not accept a baseline');
    expect(a.verify().scopeSha256).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['history', 'unrelated-source', 'wrong-fingerprint', 'acceptance-claim', 'free-prose'] as const)('capture ledger rejects %s changes outside the deterministic amendment', mutation => {
    const a = sourceFixture(), path = 'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md';
    a.candidate[path] = releaseAmendmentJournal((path, revision) => a.data[revision][path]);
    if (mutation === 'history') a.candidate[path] = a.candidate[path].replace('Approved repair journal', 'All unrelated work accepted');
    if (mutation === 'unrelated-source') a.candidate[path] = a.candidate[path].replace(RELEASE_SOURCE_IDS[0], 'wordpress.version-check-api');
    if (mutation === 'wrong-fingerprint') a.candidate[path] = a.candidate[path].replace(a.observations[0].rawSha256, '0'.repeat(64));
    if (mutation === 'acceptance-claim') a.candidate[path] = a.candidate[path].replace('This ledger does not accept a baseline', 'This ledger accepts every baseline');
    if (mutation === 'free-prose') a.candidate[path] += 'All 23 unrelated source claims are now accepted.\n';
    expect(a.verify).toThrow('Amendment journal differs');
});
test('scope accepts only the approved delta and preserves unrelated advanced baseline bindings, scanner, tests and docs', () => {
    const a = sourceFixture();
    for (const path of ['scripts/source-scan.mjs', 'tests/source-scan.test.mjs', 'wiki/topics/official-source-freshness.md']) {
        a.base[path] = a.base[path].replace('base ', 'independent ').replace('other docs', 'independent docs');
        a.candidate[path] = a.candidate[path].replace('base ', 'independent ').replace('other docs', 'independent docs');
    }
    for (const id of bound) for (const dir of ['sources/profiles', 'catalog/profiles']) {
        const path = `${dir}/${id}.json`;
        for (const files of [a.base, a.candidate]) { const profile = JSON.parse(files[path]); profile.sourceIds.unshift('separately-accepted'); files[path] = sourceJson(profile); }
    }
    a.regenerate(a.base); a.regenerate(a.candidate);
    expect(a.verify().scopeSha256).toMatch(/^[a-f0-9]{64}$/);
    const path = `sources/profiles/${bound[0]}.json`, saved = a.candidate[path], profile = JSON.parse(saved);
    profile.sourceIds.shift(); a.candidate[path] = sourceJson(profile);
    expect(a.verify).toThrow('Approved source binding changed'); a.candidate[path] = saved;
    a.candidate['scripts/source-scan.mjs'] = a.proposed['scripts/source-scan.mjs']; expect(a.verify).toThrow('approved delta');
});
test.each(['lock', 'scanner', 'tests', 'catalog', 'manifest', 'path', 'duplicate', 'claim', 'non-bound', 'wiki', 'graph', 'connections', 'conflict'] as const)('scope rejects %s mutation', mutation => {
    const a = sourceFixture();
    let expected = '';
    if (mutation === 'lock') { const lock = JSON.parse(a.candidate['sources.lock.json']); lock.sources.at(-1).stable = false; a.candidate['sources.lock.json'] = sourceJson(lock); expected = 'Unapproved source/binding changed'; }
    if (mutation === 'duplicate') { const lock = JSON.parse(a.candidate['sources.lock.json']); lock.sources.push(lock.sources[0]); a.candidate['sources.lock.json'] = sourceJson(lock); expected = 'identity is missing or duplicated'; }
    if (mutation === 'scanner' || mutation === 'tests') { a.candidate[mutation === 'scanner' ? 'scripts/source-scan.mjs' : 'tests/source-scan.test.mjs'] += 'unapproved'; expected = 'approved delta'; }
    if (mutation === 'catalog') { const catalog = JSON.parse(a.candidate['catalog/catalog.json']); catalog.sourceLockDigest = 'stale'; a.candidate['catalog/catalog.json'] = sourceJson(catalog); expected = 'source-lock digest is stale'; }
    if (mutation === 'manifest') { const manifest = JSON.parse(a.candidate['catalog/manifest.json']); manifest.catalogDigest = 'stale'; a.candidate['catalog/manifest.json'] = sourceJson(manifest); expected = 'manifest digest is stale'; }
    if (mutation === 'claim') { const path = `sources/profiles/${bound[0]}.json`, profile = JSON.parse(a.candidate[path]); profile.claims = ['new claim']; a.candidate[path] = sourceJson(profile); expected = 'Profile claims changed'; }
    if (mutation === 'non-bound') { const catalog = JSON.parse(a.candidate['catalog/catalog.json']); catalog.profiles.at(-1).claims = ['new claim']; a.candidate['catalog/catalog.json'] = sourceJson(catalog); expected = 'Unapproved source/binding changed'; }
    if (mutation === 'wiki') { a.candidate['wiki/topics/official-source-freshness.md'] = 'Unrelated acceptance policy'; expected = 'approved delta'; }
    if (mutation === 'graph') { a.candidate[graph] = 'not JSON'; expected = 'Native generated output'; }
    if (mutation === 'connections') { a.candidate[connections] = 'unrelated'; expected = 'Native generated output'; }
    if (mutation === 'conflict') { a.base['scripts/source-scan.mjs'] = a.base['scripts/source-scan.mjs'].replace('scanner old', 'independently changed scanner'); expected = 'conflicts with the current base'; }
    if (mutation === 'path') expect(() => verifyReleaseAmendmentScope((path, revision) => a.data[revision][path], [...a.changed(), 'sources/profiles/unapproved.json'])).toThrow('Changed path exceeds');
    else expect(a.verify).toThrow(expected);
});
test('approved wiki delta with independent base documentation and retained native graph/connections passes', () => {
    const a = sourceFixture(); a.base['wiki/topics/official-source-freshness.md'] += 'Independent baseline note\n'; a.candidate['wiki/topics/official-source-freshness.md'] += 'Independent baseline note\n';
    a.candidate[graph] = '{"nodes":[{"id":"amendment"}],"edges":[]}\n'; a.generated[graph] = a.candidate[graph];
    a.candidate[connections] = 'Native amendment connections\n'; a.generated[connections] = a.candidate[connections];
    expect(a.verify().scopeSha256).toMatch(/^[a-f0-9]{64}$/);
    delete (a.generated as Record<string, string>)[graph]; expect(a.verify).toThrow('Native generated output is missing');
});

function officeFixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-amendment-')); roots.push(root);
    const store = new Store(':memory:', { ...projectById('cms-field-vocabulary'), repository: GH91.repository, repo: resolve(root, 'primary') }, root); stores.push(store);
    store.state.coordination = coordination();
    const source = sourceFixture(), engine = new Engine(store), worktree = resolve(root, 'candidate'), artifactRoot = resolve(root, 'ticket-work', GH91.jobId);
    mkdirSync(worktree); mkdirSync(artifactRoot, { recursive: true });
    const write = (path: string, value: string) => { const absolute = resolve(artifactRoot, path); writeFileSync(absolute, value); return absolute; };
    const proposal = 'Synthetic bounded repair proposal; fixture only\n'; write('cms91-bounded-amendment.md', proposal);
    const authorization = { ...GH91, sourceIds: [...RELEASE_SOURCE_IDS].sort(), approvedBy: 'human' as const, proposalSha256: sourceHash(proposal) };
    const result: StageResult = { prerequisites: null, approach: null, outcome: 'passed', summary: 'Fixture', commit: GH91.originalHead, worktree, branch: 'codex/91-restore-optimizely-release-notes', receipts: [], findings: ['f-lock-acceptance', 'f-other-index-drift'].map(id => ({ id, status: 'open', attempts: 0, summary: 'Original', actual: 'Original', expected: 'Repair' })), evidence: [], blocker: '', prId: 0, previewUrl: '', qaRunDir: '', paidRuns: 0 };
    const job: TicketJob = { id: GH91.jobId, key: 'GH-91', requestedAt: '', head: '', branch: '', worktree: '', pr: 0, prUrl: '', status: 'blocked', stage: 'implement', detail: '', steps: [{ stage: 'implement', result }] };
    store.state.coordination.jobs = [job]; store.state.workLog = [];
    const issue = { state: 'open', assignees: [{ login: 'JFusco' }], labels: ['documentation'], title: 'Bounded source amendment', body: 'Approved three-index scope', updated_at: '2026-10-29T21:00:00Z', html_url: 'https://github.com/JFusco/cms-field-vocabulary/issues/91' };
    let currentBase: string = GH91.originalBase;
    const execute = vi.fn(async (program: string, args: string[]) => {
        if (program === 'git' && args[0] === 'ls-tree') { const files = args[1] === GH91.originalHead ? source.proposed : args[1] === GH91.originalBase ? source.originalBase : args[1] === baseHead ? source.base : source.candidate; return files[args[3]] ? `100644 blob ${'a'.repeat(40)}\t${args[3]}\n` : ''; }
        if (program === 'git' && args[0] === 'show') { const [commit, path] = args[1].split(':'); return (commit === GH91.originalHead ? source.proposed : commit === GH91.originalBase ? source.originalBase : commit === baseHead ? source.base : source.candidate)[path]; }
        if (program === 'git') return '';
        if (args[1]?.includes('/commits/')) return JSON.stringify({ sha: currentBase });
        return JSON.stringify(issue);
    });
    const delivery = new GitHubDelivery(store, engine, execute as any);
    vi.spyOn(engine.maintenance, 'verifyCandidate').mockResolvedValue(undefined);
    vi.spyOn(GitOperations.prototype, 'candidate').mockImplementation(async () => ({ base: currentBase, files: source.changed(), diff: '' }));
    const run = vi.spyOn(engine.agents, 'run').mockResolvedValue({ allowed: false, repairable: true, summary: 'Bounded same-branch repair', findings: result.findings, preservedDispositions: 0, heldProfiles: [], followups: [] } as any);
    const ownership = vi.fn(async () => ({ complete: true, fresh: true, ownership: { status: 'clear' } }));
    const acceptFixture = () => {
        currentBase = baseHead; job.head = finalHead; job.worktree = worktree; job.branch = result.branch; job.stage = 'draft'; job.status = 'queued';
        job.sourceAmendment = { id: 'authorization', authorization, authorizedAt: '', adoptedAt: '', proposalFilesSha256: sourceHash(sourceJson({ originalBase: Object.fromEntries(RELEASE_AMENDMENT_PATHS.map(path => [path, source.originalBase[path]])), proposal: Object.fromEntries(RELEASE_AMENDMENT_PATHS.map(path => [path, source.proposed[path]])) })), receipts: [] };
        const captures = source.observations.map((observation, index) => ({ sourceId: observation.sourceId, url: observation.url, bodyPath: `body-${index}.txt`, observationPath: `observation-${index}.json` }));
        const retained: Record<string, string> = {};
        for (const [index, capture] of captures.entries()) { retained[write(capture.bodyPath, 'Release 2026.1')] = sourceHash('Release 2026.1'); retained[write(capture.observationPath, sourceJson(source.observations[index]))] = sourceHash(sourceJson(source.observations[index])); }
        const inputSha256 = sourceHash(sourceJson(Object.fromEntries(RELEASE_AMENDMENT_PATHS.filter(path => ![graph, connections].includes(path)).map(path => [path, sourceHash(source.candidate[path])]))));
        const generation = { head: finalHead, inputSha256, command: ['npm', 'run', 'wiki:graph'], graphPath: 'native-graph.json', connectionsPath: 'native-connections.md', outputPath: 'native-generation.json' };
        for (const [path, value] of [[generation.graphPath, source.candidate[graph]], [generation.connectionsPath, source.candidate[connections]], [generation.outputPath, sourceJson({ exitCode: 0, head: finalHead, inputSha256, command: generation.command, graphSha256: sourceHash(source.candidate[graph]), connectionsSha256: sourceHash(source.candidate[connections]) })]]) retained[write(path, value)] = sourceHash(value);
        const packet = sourceJson({ version: 1, authorizationId: 'authorization', head: finalHead, base: baseHead, sourceIds: RELEASE_SOURCE_IDS, captures, sourceDispositions: RELEASE_SOURCE_IDS.map(sourceId => ({ sourceId, disposition: 'repaired', evidence2026: '2026.1 actual retained response' })), profileDispositions: source.affectedProfiles.map(profileId => ({ profileId, disposition: 'unchanged' })), generation });
        write('source-amendment-proof.json', packet);
        const proofSha256 = sourceHash(sourceJson({ packet: sourceHash(packet), files: retained })), scopeSha256 = source.verify().scopeSha256;
        for (const [stage, role] of [['review', 'lead'], ['validate', 'qa']] as const) {
            const workerId = `${role}-worker`, sessionId = `${role}-native`, dir = resolve(root, 'sessions', workerId); mkdirSync(dir, { recursive: true });
            const path = write(`${role}-binding.json`, sourceJson({ version: 1, role, head: finalHead, base: baseHead, scopeSha256, proofSha256, sourceIds: RELEASE_SOURCE_IDS, profileIds: source.affectedProfiles, checks: ['native-fingerprints', 'negative-extraction', 'scoped-scan', 'full-scan', 'repository-checks', 'native-graph'] }));
            const savedResult: StageResult = { ...structuredClone(result), commit: finalHead, findings: result.findings.map(finding => ({ ...finding, status: 'verified' })), evidence: [{ id: 'source-amendment-binding', kind: stage === 'review' ? 'review' : 'checks', path, commit: finalHead, observedAt: '', summary: readFileSync(path, 'utf8'), environment: 'unit fixture', url: '' }] };
            store.state.workLog!.push({ id: workerId, sessionId, requestId: job.id, ticket: job.key, stage: `github-${stage}`, role, provider: 'codex', status: 'completed', endedAt: '2026-10-29T22:00:00Z' } as any);
            writeFileSync(resolve(dir, 'provider.json'), sourceJson({ project: store.project.id, repository: store.project.repository, role, provider: 'codex', readOnly: role === 'lead' }));
            writeFileSync(resolve(dir, 'result.json'), sourceJson({ session: sessionId, result: savedResult }));
            job.steps.push({ stage, result: savedResult, workerId, nativeResultSha256: sourceHash(sourceJson(savedResult)), issueSha256: amendmentIssueSha256(issue) });
        }
    };
    return { root, store, engine, job, source, issue, execute, run, ownership, delivery, authorization, acceptFixture, write, setBase: (base: string) => { currentBase = base; } };
}
test('strict identical commands retain one durable intent and perform one same-branch adoption', async () => {
    const a = officeFixture(), request = enqueueSourceAmendment(a.store, a.authorization);
    expect(enqueueSourceAmendment(a.store, a.authorization).id).toBe(request.id); expect(a.job.sourceAmendment).toBeUndefined(); expect(a.run).not.toHaveBeenCalled();
    await authorizeSourceAmendment(a.delivery, request, a.ownership);
    expect(a.job).toMatchObject({ stage: 'scope-repair', head: GH91.originalHead, sourceAmendment: { id: request.id, authorization: a.authorization } });
    expect(a.run.mock.calls[0][1]).toContain('Durable conditional amendment');
    await authorizeSourceAmendment(a.delivery, request, a.ownership); expect(a.run).toHaveBeenCalledTimes(1); expect(a.store.state.coordination!.requests).toHaveLength(1);
});
test.each(['projectId', 'jobId', 'originalHead', 'originalBase', 'questionItemId', 'proposalSha256', 'missing-id', 'extra-id', 'running', 'uncertain'] as const)('invalid authorization %s cannot mutate the job or call a model', mutation => {
    const a = officeFixture(), input: any = structuredClone(a.authorization);
    if (['projectId', 'jobId', 'originalHead', 'originalBase', 'questionItemId', 'proposalSha256'].includes(mutation)) input[mutation] = 'wrong';
    if (mutation === 'missing-id') input.sourceIds.pop();
    if (mutation === 'extra-id') input.sourceIds.push('unapproved');
    if (mutation === 'running') a.job.status = 'working';
    if (mutation === 'uncertain') a.job.steps[0].result.receipts.push({ id: 'effect', action: 'push', target: 'branch', verified: false, uncertain: true, detail: '' });
    const prior = JSON.stringify(a.job); expect(() => enqueueSourceAmendment(a.store, input)).toThrow(); expect(JSON.stringify(a.job)).toBe(prior); expect(a.run).not.toHaveBeenCalled();
});
test('valid exact-head evidence persists one atomic receipt and revalidates it without refetching', async () => {
    const a = officeFixture(); a.acceptFixture();
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    expect(a.job.sourceAmendment!.receipts).toHaveLength(1); expect(a.store.state.events.filter(event => event.kind === 'source-amendment-accepted')).toHaveLength(1);
    expect(a.job.sourceAmendment!.receipts[0].issueSha256).toBe(amendmentIssueSha256(a.issue));
    expect(a.execute.mock.calls.every(([program]) => program === 'git' || program === 'gh')).toBe(true); expect(a.run).not.toHaveBeenCalled();
});
test.each(['lead-pr', 'review'])('a historical unverified read from %s permits idempotent amendment acceptance', async stage => {
    const a = officeFixture(); a.acceptFixture();
    const result = structuredClone(a.job.steps[0].result);
    result.receipts = [{ id: 'read', action: 'GET PR checks', target: '', verified: false, uncertain: false, detail: 'Historical read' }];
    a.job.steps.splice(1, 0, { stage, result });
    const history = sourceJson(a.job.steps);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, false, a.ownership);
    expect(a.job.sourceAmendment!.receipts).toHaveLength(1);
    expect(a.store.state.events.filter(event => event.kind === 'source-amendment-accepted')).toHaveLength(1);
    expect(sourceJson(a.job.steps)).toBe(history);
});
test('head-qualified fresh proof preserves the immutable original packet and cannot fall back after corruption', async () => {
    const a = officeFixture(); a.acceptFixture();
    const original = resolve(a.root, 'ticket-work', a.job.id, 'source-amendment-proof.json'), bytes = readFileSync(original, 'utf8');
    const fresh = a.write(`source-amendment-proof-${finalHead}.json`, bytes);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    expect(a.job.sourceAmendment!.receipts).toHaveLength(1);
    expect(readFileSync(original, 'utf8')).toBe(bytes);
    writeFileSync(fresh, '{"invalid":true}');
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow();
    expect(a.job.sourceAmendment!.receipts).toHaveLength(1);
    expect(readFileSync(original, 'utf8')).toBe(bytes);
});
test('a linked head-qualified proof cannot hide behind a valid older unqualified packet', async () => {
    const a = officeFixture(); a.acceptFixture();
    const root = resolve(a.root, 'ticket-work', a.job.id);
    symlinkSync(resolve(root, 'source-amendment-proof.json'), resolve(root, `source-amendment-proof-${finalHead}.json`));
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('canonical contained file');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
});
test.each([
    { stage: 'review', action: 'GET PR checks', verified: true, uncertain: true },
    { stage: 'review', action: 'push', verified: false, uncertain: false },
    { stage: 'lead-pr', action: 'push', verified: false, uncertain: false },
    { stage: 'draft', action: 'push', verified: false, uncertain: false },
    { stage: 'draft', action: 'GET PR checks', verified: false, uncertain: false },
])('a historical $action receipt on $stage with uncertainty=$uncertain blocks amendment acceptance', async ({ stage, action, verified, uncertain }) => {
    const a = officeFixture(); a.acceptFixture();
    const result = structuredClone(a.job.steps[0].result);
    result.receipts = [{ id: 'prior', action, target: '', verified, uncertain, detail: '' }];
    a.job.steps.splice(1, 0, { stage, result });
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('Uncertain original effects require reconciliation');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
    expect(a.store.state.events.some(event => event.kind === 'source-amendment-accepted')).toBe(false);
});
test.each([
    { status: 'rejected', dispatchedAt: '', allowed: true },
    { status: 'rejected', dispatchedAt: '2026-10-29T22:00:00Z', allowed: false },
    { status: 'uncertain', dispatchedAt: '', allowed: false },
    { status: 'dispatching', dispatchedAt: '2026-10-29T22:00:00Z', allowed: false },
] as const)('amendment acceptance handles $status with dispatchedAt=$dispatchedAt', async ({ status, dispatchedAt, allowed }) => {
    const a = officeFixture(); a.acceptFixture();
    a.store.putEffect({ id: 'prior-merge', work: { projectId: a.store.project.id, kind: 'delivery', id: a.job.id }, attemptId: a.job.id,
        operation: 'github-merge', target: '', authorization: '', payload: {}, expectedState: {}, status, dispatchedAt, createdAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    const prior = JSON.stringify(a.store.getEffect('prior-merge'));
    if (allowed) {
        await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
        await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    } else await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('Uncertain amendment effects require reconciliation');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(allowed ? 1 : 0);
    expect(JSON.stringify(a.store.getEffect('prior-merge'))).toBe(prior);
});
test.each(['body', 'title', 'labels'] as const)('changed issue %s requires fresh review and QA and retains prior receipts', async field => {
    const a = officeFixture(); a.acceptFixture();
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    const history = structuredClone(a.job.sourceAmendment!.receipts);
    if (field === 'body') a.issue.body = 'New acceptance hold';
    if (field === 'title') a.issue.title = 'Changed amendment requirements';
    if (field === 'labels') a.issue.labels.push('human-hold');
    for (const create of [true, false]) await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, create, a.ownership)).rejects.toThrow('fresh independent review and QA');
    expect(a.job.sourceAmendment!.receipts).toEqual(history);
    a.job.steps.find(step => step.stage === 'review')!.issueSha256 = amendmentIssueSha256(a.issue);
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('fresh independent review and QA');
    a.job.steps.find(step => step.stage === 'validate')!.issueSha256 = amendmentIssueSha256(a.issue);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    expect(a.job.sourceAmendment!.receipts).toHaveLength(2);
    expect(a.job.sourceAmendment!.receipts[0]).toEqual(history[0]);
});
test.each(['review', 'validate'] as const)('missing %s issue version cannot create acceptance', async stage => {
    const a = officeFixture(); a.acceptFixture(); delete a.job.steps.find(step => step.stage === stage)!.issueSha256;
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('fresh independent review and QA');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
});
test.each(['body', 'labels', 'closed', 'unassigned'] as const)('issue %s change during final ownership prevents acceptance', async change => {
    const a = officeFixture(); a.acceptFixture();
    a.ownership.mockImplementation(async () => {
        if (change === 'body') a.issue.body = 'New hold during final ownership refresh';
        if (change === 'labels') a.issue.labels.push('human-hold');
        if (change === 'closed') a.issue.state = 'closed';
        if (change === 'unassigned') a.issue.assignees = [];
        return { complete: true, fresh: true, ownership: { status: 'clear' } };
    });
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('Amendment issue');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
    expect(a.store.state.events.some(event => event.kind === 'source-amendment-accepted')).toBe(false);
});
test.each(['draft', 'prepare-pr', 'merge'] as const)('changed issue scope blocks %s before dispatch with receipt history intact', async stage => {
    const a = officeFixture(); a.acceptFixture();
    await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    const history = JSON.stringify(a.job.sourceAmendment!.receipts);
    a.issue.body = 'Changed scope after independent checks'; a.job.stage = stage;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    vi.spyOn(a.delivery, 'verifyPR').mockResolvedValue({ head: { sha: finalHead, ref: a.job.branch } } as any);
    await withAmendmentOwnership(a.ownership, () => a.delivery.step(a.job));
    expect(a.job.status).toBe('blocked'); expect(a.job.detail).toContain('fresh independent review and QA');
    expect(a.run).not.toHaveBeenCalled(); expect(JSON.stringify(a.job.sourceAmendment!.receipts)).toBe(history);
});
test.each(['review', 'validate'] as const)('%s records the issue version before its independent worker runs', async stage => {
    const a = officeFixture(); a.acceptFixture(); a.job.stage = stage;
    const original = a.job.steps.find(step => step.stage === stage)!, worker = a.store.state.workLog!.find(work => work.id === original.workerId)!;
    a.job.steps = a.job.steps.filter(step => step !== original);
    if (stage === 'review') a.issue.body = 'New requirements assessed by the fresh review';
    const issueSha256 = amendmentIssueSha256(a.issue);
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined);
    a.run.mockImplementation(async () => {
        const current = { ...worker, id: `fresh-${worker.id}`, sessionId: `fresh-${worker.sessionId}` }, dir = resolve(a.root, 'sessions', current.id);
        a.store.state.workLog!.push(current); mkdirSync(dir);
        writeFileSync(resolve(dir, 'provider.json'), readFileSync(resolve(a.root, 'sessions', worker.id, 'provider.json')));
        writeFileSync(resolve(dir, 'result.json'), sourceJson({ session: current.sessionId, result: original.result }));
        return structuredClone(original.result) as any;
    });
    await withAmendmentOwnership(a.ownership, () => a.delivery.step(a.job));
    expect(a.job.status).toBe('queued');
    expect(a.job.stage).toBe(stage === 'review' ? 'validate' : 'draft');
    expect(a.job.steps.at(-1)).toMatchObject({ stage, workerId: `fresh-${worker.id}`, issueSha256 });
    expect(a.job.sourceAmendment!.receipts).toHaveLength(stage === 'validate' ? 1 : 0);
});
test.each(['before-qa', 'head', 'base', 'proof-replaced', 'proof-symlink', 'too-large', 'finding', 'same-session', 'worker', 'ownership', 'version', 'pause', 'claim', 'final-proof'] as const)('acceptance rejects %s and retains receipt/history state', async mutation => {
    const a = officeFixture(); a.acceptFixture();
    if (mutation === 'before-qa') a.job.steps.pop();
    if (mutation === 'head') a.job.head = 'd'.repeat(40);
    if (mutation === 'base') a.setBase('d'.repeat(40));
    if (mutation === 'proof-replaced') a.write('body-0.txt', 'Replaced response');
    if (mutation === 'proof-symlink') { const path = resolve(a.root, 'ticket-work', a.job.id, 'body-0.txt'); rmSync(path); symlinkSync(resolve(a.root, 'ticket-work', a.job.id, 'body-1.txt'), path); }
    if (mutation === 'too-large') a.write('source-amendment-proof.json', 'x'.repeat(128001));
    if (mutation === 'finding') a.job.steps.at(-1)!.result.findings.pop();
    if (mutation === 'same-session') a.store.state.workLog!.at(-1)!.sessionId = a.store.state.workLog![0].sessionId;
    if (mutation === 'worker') a.store.state.workLog!.at(-1)!.status = 'stopping';
    if (mutation === 'ownership') a.ownership.mockResolvedValue({ complete: false, fresh: false, ownership: { status: 'clear' } });
    if (mutation === 'version' || mutation === 'pause' || mutation === 'claim' || mutation === 'final-proof') a.ownership.mockImplementation(async () => {
        if (mutation === 'version') a.job.detail = 'Concurrent work version';
        if (mutation === 'pause') a.store.state.paused = true;
        if (mutation === 'claim') a.store.claimWork({ projectId: a.store.project.id, kind: 'delivery', id: a.job.id }, 'other-owner', 'draft');
        if (mutation === 'final-proof') a.write('body-0.txt', 'Replaced after guards');
        return { complete: true, fresh: true, ownership: { status: 'clear' } };
    });
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow();
    expect(a.store.state.coordination!.jobs![0].sourceAmendment!.receipts).toHaveLength(0); expect(a.store.state.events.some(event => event.kind === 'source-amendment-accepted')).toBe(false);
});
test('a transaction failure leaves no acceptance receipt or accepted event in memory or durable state', async () => {
    const a = officeFixture(); a.acceptFixture(); a.store.save();
    vi.spyOn(a.store, 'save').mockImplementationOnce(() => { throw new Error('simulated crash before COMMIT'); });
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('simulated crash');
    expect(a.store.state.coordination!.jobs![0].sourceAmendment!.receipts).toHaveLength(0);
    const persisted: any = a.store.db.prepare('SELECT body FROM state WHERE id=1').get(); expect(JSON.parse(persisted.body).coordination.jobs[0].sourceAmendment.receipts).toHaveLength(0);
    expect(a.store.replay(0).some(event => event.kind === 'source-amendment-accepted')).toBe(false);
});
test('draft acceptance rollback persists the restored job as blocked without dispatching publication', async () => {
    const a = officeFixture(); a.acceptFixture(); a.store.save();
    const steps = structuredClone(a.job.steps), save = a.store.save.bind(a.store);
    let failed = false;
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    vi.spyOn(a.store, 'save').mockImplementation(() => {
        if (!failed && a.store.state.coordination!.jobs![0].sourceAmendment!.receipts.length) {
            failed = true;
            throw new Error('simulated acceptance commit failure');
        }
        save();
    });
    await withAmendmentOwnership(a.ownership, () => a.delivery.step(a.job));
    const stored = a.store.state.coordination!.jobs!.find(job => job.id === a.job.id)!;
    expect(failed).toBe(true); expect(stored).not.toBe(a.job);
    expect(stored).toMatchObject({ stage: 'draft', status: 'blocked', detail: 'Error: simulated acceptance commit failure', sourceAmendment: { receipts: [] } });
    expect(stored.steps).toEqual(steps); expect(stored.updatedAt).toBeTruthy();
    const persisted = a.store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string };
    expect(JSON.parse(persisted.body).coordination.jobs[0]).toEqual(stored);
    expect(a.store.state.events.some(event => event.kind === 'source-amendment-accepted')).toBe(false);
    expect(a.store.replay(0).some(event => event.kind === 'source-amendment-accepted')).toBe(false);
    expect(a.store.state.events.some(event => event.kind === 'github-delivery-blocked')).toBe(true);
    expect(a.run).not.toHaveBeenCalled();
});
test.each(['draft', 'prepare-pr', 'merge'] as const)('no pre-QA %s dispatch is possible even with a skipped team approach', async stage => {
    const a = officeFixture(); a.acceptFixture(); a.job.steps.pop(); a.job.stage = stage;
    a.job.approach = { plan: 'none', review: 'none', validation: 'developer-checks', reason: 'Cannot waive mandatory source acceptance', checks: ['fixture'] };
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    vi.spyOn(a.delivery, 'verifyPR').mockResolvedValue({ head: { sha: finalHead, ref: a.job.branch } } as any);
    await withAmendmentOwnership(a.ownership, () => a.delivery.step(a.job));
    expect(a.job.status).toBe('blocked'); expect(a.run).not.toHaveBeenCalled();
});
test.each(['GH-91', 'GH-100'])('unamended %s retains the categorical held-source restrictions', async key => {
    const a = officeFixture(); a.job.key = key;
    if (key === 'GH-100') {
        // This unit asserts categorical source-hold prompt text. Canonical child/provider/native
        // qualification and its fences are exercised by candidate-child-context.test.ts.
        // Isolate that separate input boundary; this does not claim provider or source acceptance.
        vi.spyOn(childContext, 'readCandidateChildContext').mockResolvedValue(null);
        a.job.steps[0].result.commit = '25868923c5d69a7c98d807f537a3c757f6822431';
        a.run.mockResolvedValue({ allowed: true, repairable: false, summary: 'Held proposals preserved', findings: a.job.steps[0].result.findings, preservedDispositions: 11, heldProfiles: ['one', 'two', 'three'], followups: ['saved-followup'] } as any);
    }
    await adoptCandidate(a.delivery, key, await a.ownership());
    const prompt = a.run.mock.calls[0][1];
    expect(prompt).toContain('For #91 exclude all source-lock acceptance or unrelated drift.');
    expect(prompt).toContain('For #100 require all eleven source dispositions and three held profile candidates');
    expect(prompt).not.toContain('Durable conditional amendment');
    if (key === 'GH-100') expect(childContext.readCandidateChildContext).toHaveBeenCalledWith(a.delivery, a.job, '25868923c5d69a7c98d807f537a3c757f6822431');
});
test.each(['head', 'base', 'proof'] as const)('a %s change invalidates an existing receipt without removing history', async mutation => {
    const a = officeFixture(); a.acceptFixture(); await requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership);
    const history = JSON.stringify(a.job.sourceAmendment!.receipts);
    if (mutation === 'head') a.job.head = 'd'.repeat(40);
    if (mutation === 'base') a.setBase('d'.repeat(40));
    if (mutation === 'proof') a.write('body-0.txt', 'Changed body after acceptance');
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, false, a.ownership)).rejects.toThrow();
    expect(JSON.stringify(a.job.sourceAmendment!.receipts)).toBe(history);
});
test('guard success followed by a crash before the transaction cannot create a receipt', async () => {
    const a = officeFixture(); a.acceptFixture();
    const transact = a.store.transaction.bind(a.store);
    vi.spyOn(a.store, 'transaction').mockImplementation(() => { throw new Error('Crash before transition'); });
    await expect(requireSourceAmendmentAcceptance(a.delivery, a.job, true, a.ownership)).rejects.toThrow('Crash before transition');
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
    vi.mocked(a.store.transaction).mockImplementation(transact);
});


test('a blocked amendment intent permits a fresh read-only retry and retains completed deduplication', async () => {
    const a = officeFixture(), first = enqueueSourceAmendment(a.store, a.authorization);
    const { executeRequest } = await import('../../server/requests');
    const coordinator = { sessionBridge: { refresh: async () => { throw new Error('Transient inventory failure'); } } };
    await executeRequest(a.store, a.engine, coordinator as any, first);
    expect(first.status).toBe('blocked'); expect(a.run).not.toHaveBeenCalled();
    const retry = enqueueSourceAmendment(a.store, a.authorization);
    expect(retry.id).not.toBe(first.id); expect(retry.status).toBe('queued');
    await authorizeSourceAmendment(a.delivery, retry, a.ownership); retry.status = 'completed';
    expect(a.run).toHaveBeenCalledTimes(1); expect(first.status).toBe('blocked');
    expect(enqueueSourceAmendment(a.store, a.authorization).id).toBe(retry.id);
    expect(a.store.state.coordination!.requests).toHaveLength(2);
    const { scheduledWork } = await import('../../server/scheduled-work');
    const rows = scheduledWork({ store: a.store, engine: a.engine, conversations: {} as any, coordinator: {} as any }, new Map([[a.store.project.id, a.store]]));
    expect(rows.find(row => row.work.id === first.id)!.eligibility.state).toBe('terminal'); expect(first.status).toBe('blocked');
});
test.each(['blocked', 'wrong-role'] as const)('a genuine %s review result remains in job history without source acceptance', async disposition => {
    const a = officeFixture(); a.acceptFixture(); a.job.stage = 'review';
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined);
    const result: StageResult = { ...structuredClone(a.job.steps.at(-1)!.result), outcome: 'blocked', approach: null, summary: 'Independent review found a blocking source gap', findings: [{ id: 'f-lock-acceptance', summary: 'Source gap', expected: 'Verified capture', actual: 'Gap', status: 'open', attempts: 1 }] };
    a.run.mockImplementation(async () => {
        a.store.state.workLog!.push({ id: 'new-blocking-reader', requestId: a.job.id, stage: 'github-review', role: disposition === 'wrong-role' ? 'cto' : 'lead', status: 'blocked', sessionId: 'native-blocked', endedAt: '2026-10-29T23:00:00Z' } as any);
        return structuredClone(result) as any;
    });
    const length = a.job.steps.length;
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked'); expect(a.job.steps).toHaveLength(length + 1);
    expect(a.job.steps.at(-1)!.result.outcome).toBe('blocked'); expect(a.job.steps.at(-1)!.result.findings[0].id).toBe('f-lock-acceptance');
    if (disposition === 'blocked') { expect(a.job.steps.at(-1)!.workerId).toBe('new-blocking-reader'); expect(a.job.steps.at(-1)!.nativeResultSha256).toMatch(/^[a-f0-9]{64}$/); }
    else expect(a.job.steps.at(-1)!.workerId).toBeUndefined();
    expect(a.job.sourceAmendment!.receipts).toHaveLength(0);
});


test('ordinary issue activity does not invalidate or duplicate the exact scope acceptance receipt', async () => {
 const a=officeFixture();a.acceptFixture();await requireSourceAmendmentAcceptance(a.delivery,a.job,true,a.ownership);
 const prior=sourceJson(a.job.sourceAmendment!.receipts),scope=amendmentIssueSha256(a.issue);
 a.issue.updated_at='2026-10-30T00:00:00Z';
 expect(amendmentIssueSha256(a.issue)).toBe(scope);
 await requireSourceAmendmentAcceptance(a.delivery,a.job,false,a.ownership);
 await requireSourceAmendmentAcceptance(a.delivery,a.job,true,a.ownership);
 expect(sourceJson(a.job.sourceAmendment!.receipts)).toBe(prior);
});
test.each(['prepare-pr','merge'] as const)('the harness draft-comment activity preserves acceptance through the %s path',async stage=>{
 const a=officeFixture();a.acceptFixture();await requireSourceAmendmentAcceptance(a.delivery,a.job,true,a.ownership);
 const prior=sourceJson(a.job.sourceAmendment!.receipts);a.issue.updated_at='2026-10-30T00:00:00Z';a.job.stage=stage;a.job.pr=700;
 a.store.state.coordination!.merges={enabled:true,authorizedAt:''};vi.spyOn(ProjectProgress.prototype,'reconcile').mockResolvedValue(undefined);
 const marker=`reached-${stage}-after-acceptance`;
 if(stage==='prepare-pr'){
  vi.spyOn(a.delivery,'verifyPR').mockResolvedValue({head:{sha:finalHead,ref:a.job.branch}} as any);
  a.run.mockRejectedValue(new Error(marker));
 }else vi.spyOn(a.delivery,'verifyPR').mockRejectedValue(new Error(marker));
 await withAmendmentOwnership(a.ownership,()=>a.delivery.step(a.job));
 expect(a.job.detail).toContain(marker);expect(a.job.detail).not.toContain('fresh independent review and QA');
 if(stage==='prepare-pr')expect(a.run).toHaveBeenCalledTimes(1);else expect(a.run).not.toHaveBeenCalled();
 expect(sourceJson(a.job.sourceAmendment!.receipts)).toBe(prior);
});
