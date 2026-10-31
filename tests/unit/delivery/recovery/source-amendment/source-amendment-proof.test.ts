import { expect, test } from 'vitest';
import { amendmentCaptureObservation, parseAmendmentProof, releaseCapturesCover2026, verifyAmendmentGeneration, verifyLegacyCaptureMetadata, LEGACY_WIKI_INPUT_DEFINITION } from '../../../../../server/delivery/recovery/source-amendment/source-amendment-proof';
import { RELEASE_SOURCE_IDS, sourceHash } from '../../../../../server/delivery/recovery/source-amendment/source-amendment-scope';

function fixture() {
    const head = 'a'.repeat(40), root = '/private/evidence', worktree = '/private/candidate';
    const authority = { questionItemId: 'original-human-question', proposalSha256: 'b'.repeat(64), originalHead: 'c'.repeat(40), root };
    const graphPath = `${worktree}/scripts/wiki/graph/data/graph.json`, connectionsPath = `${worktree}/wiki/connections.md`;
    const files: Record<string, string> = { 'wiki/INDEX.md': 'index\n', 'wiki/journal/2026-repair.md': 'repair\n', 'wiki/connections.md': 'connections\n', 'scripts/wiki/graph/data/graph.json': '{"nodes":[],"edges":[]}\n' };
    const inputs = Object.entries(files).filter(([path]) => path.startsWith('wiki/') && path !== 'wiki/connections.md').map(([path, text]) => ({ path, sha256: sourceHash(text) })).sort((a, b) => a.path.localeCompare(b.path));
    const output = { head, command: 'node scripts/wiki/build-graph.cjs', cwd: worktree, exitCode: 0, stdout: 'PASS wiki graph: 0 nodes, 0 edges\n', stderr: '', observedAt: '2026-10-30T08:02:59.559Z',
        inputDefinition: LEGACY_WIKI_INPUT_DEFINITION, inputCount: inputs.length, inputSha256: sourceHash(JSON.stringify(inputs)), graphPath, connectionsPath,
        graphSha256: sourceHash(files['scripts/wiki/graph/data/graph.json']), connectionsSha256: sourceHash(files['wiki/connections.md']), worktreeCleanAfter: true, inputs };
    const observations = RELEASE_SOURCE_IDS.map(sourceId => ({ sourceId, body: '2026 release', observation: { observedAt: '2026-10-30T08:00:00.000Z', rawSha256: sourceHash('2026 release'), normalizedSha256: 'd'.repeat(64), fragmentSha256: 'e'.repeat(64), identities: ['2026.1'] } }));
    const packet: any = { version: 1, authorizationId: 'original-authorization', head, base: 'f'.repeat(40), sourceIds: [...RELEASE_SOURCE_IDS],
        questionItemId: authority.questionItemId, proposalSha256: authority.proposalSha256, originalHead: authority.originalHead,
        issue: 'https://github.com/JFusco/cms-field-vocabulary/issues/91', repository: 'JFusco/cms-field-vocabulary', branch: 'codex/91-restore-optimizely-release-notes',
        captures: observations.map(({ sourceId, observation }, i) => ({ sourceId, url: `https://docs.optimizely.com/cms-${i}/release-notes`, bodyPath: `body-${i}.html`, observationPath: `observation-${i}.json`, ...observation, identities: undefined, identityCount: 1 })),
        captureCommand: `node --import ${root}/amendment-tools/preload.mjs scripts/source-review.mjs ${RELEASE_SOURCE_IDS.join(' ')}`,
        captureLogPath: `${root}/amendment-review.log`, captureVerificationPath: `${root}/amendment-capture-verify.json`,
        sourceDispositions: RELEASE_SOURCE_IDS.map(sourceId => ({ sourceId, disposition: 'repaired', evidence2026: '2026 claims compared' })),
        profileDispositions: Array.from({ length: 7 }, (_, i) => ({ profileId: `profile-${i}`, disposition: 'unchanged' })),
        generation: { head, inputSha256: output.inputSha256, command: output.command, graphPath, connectionsPath, outputPath: `${root}/amendment-generation.json`, exitCode: 0, graphSha256: output.graphSha256, connectionsSha256: output.connectionsSha256 },
        acceptance: 'not accepted; permission to repair is not acceptance. f-lock-acceptance stays open for maintainer decision.' };
    const retained = new Map<string, string>();
    const context = { head, worktree, inputSha256: '9'.repeat(64), packageJson: {}, retain: (path: string) => {
        const text = path === packet.generation.outputPath ? JSON.stringify(output) : path === packet.captureLogPath ? 'Native capture completed\n' : JSON.stringify({ checks: [{ name: 'captured response', pass: true }] });
        retained.set(path, text); return text;
    }, candidateFile: async (path: string) => { if (!(path in files)) throw new Error('Missing candidate blob'); return files[path]; }, candidateWikiPaths: async () => Object.keys(files).filter(path => path.startsWith('wiki/')) };
    const parse = () => parseAmendmentProof(JSON.stringify(packet), authority);
    return { packet, output, context, authority, observations, retained, files, parse };
}

test('legacy proof preserves raw provenance and validates the actual compact wiki digest without relabeling it', async () => {
    const a = fixture(), raw = JSON.stringify(a.packet), digest = sourceHash(raw), parsed = a.parse();
    verifyLegacyCaptureMetadata(parsed, a.observations, a.context.retain);
    expect(await verifyAmendmentGeneration(parsed, a.context)).toEqual({ 'scripts/wiki/graph/data/graph.json': a.files['scripts/wiki/graph/data/graph.json'], 'wiki/connections.md': a.files['wiki/connections.md'] });
    expect(parsed.proof.generation.command).toEqual(['node', 'scripts/wiki/build-graph.cjs']);
    expect(parsed.legacy?.generation.command).toBe('node scripts/wiki/build-graph.cjs');
    expect(parsed.proof.generation.inputSha256).toBe(a.output.inputSha256);
    expect(parsed.proof.generation.inputSha256).not.toBe(a.context.inputSha256);
    expect(sourceHash(JSON.stringify(a.packet))).toBe(digest);
    expect(a.retained.get(a.packet.generation.outputPath)).toBe(JSON.stringify(a.output));
    expect(parsed.legacy?.acceptance).toContain('not accepted');
});

test.each(['unknown-field', 'unknown-capture', 'unknown-generation', 'unknown-command', 'claim-accepted', 'wrong-question', 'wrong-proposal', 'wrong-original', 'broader-source', 'duplicate-source', 'broader-capture-command'] as const)('legacy parser rejects %s', mutation => {
    const a = fixture();
    if (mutation === 'unknown-field') a.packet.extra = true;
    if (mutation === 'unknown-capture') a.packet.captures[0].accepted = true;
    if (mutation === 'unknown-generation') a.packet.generation.accepted = true;
    if (mutation === 'unknown-command') a.packet.generation.command += ' --all';
    if (mutation === 'claim-accepted') a.packet.acceptance = 'accepted';
    if (mutation === 'wrong-question') a.packet.questionItemId = 'different';
    if (mutation === 'wrong-proposal') a.packet.proposalSha256 = '0'.repeat(64);
    if (mutation === 'wrong-original') a.packet.originalHead = '0'.repeat(40);
    if (mutation === 'broader-source') a.packet.sourceIds.push('another-source');
    if (mutation === 'duplicate-source') a.packet.sourceIds[0] = a.packet.sourceIds[1];
    if (mutation === 'broader-capture-command') a.packet.captureCommand += ' --all';
    expect(a.parse).toThrow();
});

test.each(['capture-digest', 'observation-time', 'identity-count', 'capture-failed'] as const)('legacy capture metadata rejects %s', mutation => {
    const a = fixture();
    if (mutation === 'capture-digest') a.observations[0].body += 'different';
    if (mutation === 'observation-time') a.observations[0].observation.observedAt = '2026-10-29T08:00:00.000Z';
    if (mutation === 'identity-count') a.observations[0].observation.identities.push('2026.2');
    const retain = mutation === 'capture-failed' ? () => JSON.stringify({ checks: [{ pass: false }] }) : a.context.retain;
    expect(() => verifyLegacyCaptureMetadata(a.parse(), a.observations, retain)).toThrow();
});

test.each(['valid', 'hash', 'path', 'bytes', 'status', 'attempts', 'time', 'unknown-envelope', 'unknown-native'] as const)('historical native observation wrapper: %s', mutation => {
    const a = fixture(), item = a.parse().proof.captures[0], body = a.observations[0].body;
    const nativeObservation: any = { sourceId: item.sourceId, url: item.url, ...a.observations[0].observation, reviewStatus: 'reviewed', requiredTokenSetSha256: 'f'.repeat(64), requiredTokens: [], observedTokenSetSha256: null, observedTokens: null, missingRequiredTokens: [], missingObservedTokens: [] };
    const wrapped: any = { sourceId: item.sourceId, nativeObservation, capture: { bodyPath: item.bodyPath, bodyBytes: Buffer.byteLength(body), bodySha256: sourceHash(body), bytesSha256: sourceHash(body), status: 200, requestedAt: nativeObservation.observedAt, receivedAt: '2026-10-30T08:00:01.000Z', headers: { 'content-type': 'text/html' }, attempts: 1 } };
    if (mutation === 'hash') wrapped.capture.bytesSha256 = '0'.repeat(64);
    if (mutation === 'path') wrapped.capture.bodyPath = '/outside';
    if (mutation === 'bytes') wrapped.capture.bodyBytes++;
    if (mutation === 'status') wrapped.capture.status = 429;
    if (mutation === 'attempts') wrapped.capture.attempts = 2;
    if (mutation === 'time') wrapped.capture.receivedAt = '2026-10-29T08:00:01.000Z';
    if (mutation === 'unknown-envelope') wrapped.accepted = true;
    if (mutation === 'unknown-native') nativeObservation.accepted = true;
    const bytes = JSON.stringify(wrapped);
    if (mutation === 'valid') {
        expect(amendmentCaptureObservation(a.parse(), item, wrapped, body)).toEqual(nativeObservation);
        const canonical = parseAmendmentProof(JSON.stringify(a.parse().proof), a.authority);
        expect(canonical.legacy).toBeUndefined();
        expect(amendmentCaptureObservation(canonical, item, wrapped, body)).toEqual(nativeObservation);
    }
    else expect(() => amendmentCaptureObservation(a.parse(), item, wrapped, body)).toThrow();
    expect(JSON.stringify(wrapped)).toBe(bytes);
});

test.each(['head', 'cwd', 'exit', 'unknown-output', 'digest', 'different-wiki', 'missing-input', 'duplicate-input', 'extra-input', 'inventory', 'path-escape', 'graph-path', 'graph-bytes', 'connections-bytes', 'false-success', 'dirty'] as const)('legacy generation rejects %s without regenerating or rewriting evidence', async mutation => {
    const a = fixture();
    if (mutation === 'head') a.output.head = '0'.repeat(40);
    if (mutation === 'cwd') a.output.cwd = '/another';
    if (mutation === 'exit') a.output.exitCode = 1;
    if (mutation === 'unknown-output') (a.output as any).accepted = true;
    if (mutation === 'digest') a.output.inputSha256 = '0'.repeat(64);
    if (mutation === 'different-wiki') a.files['wiki/INDEX.md'] += 'changed';
    if (mutation === 'missing-input') a.output.inputs.pop();
    if (mutation === 'duplicate-input') a.output.inputs[0] = a.output.inputs[1];
    if (mutation === 'extra-input') a.output.inputs.push({ path: 'wiki/extra.md', sha256: '0'.repeat(64) });
    if (mutation === 'inventory') a.files['wiki/another.md'] = 'new input';
    if (mutation === 'path-escape') a.output.inputs[0].path = 'wiki/../outside.md';
    if (mutation === 'graph-path') a.output.graphPath = '/private/outside';
    if (mutation === 'graph-bytes') a.files['scripts/wiki/graph/data/graph.json'] += 'different';
    if (mutation === 'connections-bytes') a.files['wiki/connections.md'] += 'different';
    if (mutation === 'false-success') a.output.stdout = 'PASS';
    if (mutation === 'dirty') a.output.worktreeCleanAfter = false;
    const packetBefore = JSON.stringify(a.packet), receiptBefore = JSON.stringify(a.output);
    await expect(verifyAmendmentGeneration(a.parse(), a.context)).rejects.toThrow();
    expect(JSON.stringify(a.packet)).toBe(packetBefore); expect(JSON.stringify(a.output)).toBe(receiptBefore);
});

test('current canonical packet stays strict and cannot inherit a legacy digest exception', async () => {
    const a = fixture(), parsed = a.parse(), canonical = parsed.proof;
    canonical.generation.command = ['npm', 'run', 'wiki:graph'];
    const current = parseAmendmentProof(JSON.stringify(canonical), a.authority);
    expect(current.legacy).toBeUndefined();
    await expect(verifyAmendmentGeneration(current, a.context)).rejects.toThrow('different candidate inputs');
    expect(() => parseAmendmentProof(JSON.stringify({ ...canonical, extra: true }), a.authority)).toThrow();
});

test('a fresh canonical proof can retain the original native capture envelope and record a real direct Node graph run', async () => {
    const a = fixture(), proof = a.parse().proof;
    proof.generation.inputSha256 = a.context.inputSha256;
    proof.generation.graphPath = 'retained-graph.json'; proof.generation.connectionsPath = 'retained-connections.md';
    const parsed = parseAmendmentProof(JSON.stringify(proof), a.authority);
    const output = { head: a.context.head, inputSha256: a.context.inputSha256, command: ['node', 'scripts/wiki/build-graph.cjs'], exitCode: 0, graphSha256: a.output.graphSha256, connectionsSha256: a.output.connectionsSha256 };
    const retained: Record<string, string> = { [proof.generation.outputPath]: JSON.stringify(output), 'retained-graph.json': a.files['scripts/wiki/graph/data/graph.json'], 'retained-connections.md': a.files['wiki/connections.md'] };
    expect(await verifyAmendmentGeneration(parsed, { ...a.context, retain: path => retained[path] })).toEqual({ 'scripts/wiki/graph/data/graph.json': retained['retained-graph.json'], 'wiki/connections.md': retained['retained-connections.md'] });
    proof.generation.command.push('--unregistered');
    await expect(verifyAmendmentGeneration(parseAmendmentProof(JSON.stringify(proof), a.authority), { ...a.context, retain: path => retained[path] })).rejects.toThrow('command is unverified');
});

test.each(['valid', 'wrong-product', 'wrong-year', 'footer-only', 'duplicate-title', 'no-identities', 'duplicate-source'] as const)('date-only native release IDs require exact same-page product/year evidence: %s', mutation => {
    const a = fixture(), captures = a.observations;
    const titles = ['2026 CMS (SaaS) release notes - Release notes for CMS (SaaS)', '2026 Optimizely CMS 12 release notes - Release notes for CMS 12', '2026 Optimizely CMS 13 release notes - Release notes for CMS 13'];
    for (const [i, capture] of captures.entries()) { capture.observation.identities = ['october-21']; capture.body = `<title data-next-head="">${titles[i]}</title>`; }
    if (mutation === 'wrong-product') captures[0].body = captures[1].body;
    if (mutation === 'wrong-year') captures[0].body = captures[0].body.replace('2026', '2025');
    if (mutation === 'footer-only') captures[0].body = '<title>Login</title><footer>2026 CMS (SaaS) release notes</footer>';
    if (mutation === 'duplicate-title') captures[0].body += captures[0].body;
    if (mutation === 'no-identities') captures[0].observation.identities = [];
    if (mutation === 'duplicate-source') captures[0].sourceId = captures[1].sourceId;
    expect(releaseCapturesCover2026(captures)).toBe(mutation === 'valid');
});
