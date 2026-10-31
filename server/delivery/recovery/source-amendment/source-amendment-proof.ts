import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { RELEASE_SOURCE_IDS, sourceHash } from './source-amendment-scope';

const sha = z.string().regex(/^[a-f0-9]{64}$/), head = z.string().regex(/^[a-f0-9]{40}$/);
const ids = z.array(z.enum(RELEASE_SOURCE_IDS)).length(3).refine(value => new Set(value).size === 3);
const capture = z.object({ sourceId: z.enum(RELEASE_SOURCE_IDS), url: z.string().url(), bodyPath: z.string().min(1), observationPath: z.string().min(1) }).strict();
const generation = z.object({ head, inputSha256: sha, command: z.array(z.string().min(1)).min(2).max(8), graphPath: z.string(), connectionsPath: z.string(), outputPath: z.string() }).strict();
const Proof = z.object({
    version: z.literal(1), authorizationId: z.string().min(1), head, base: head, sourceIds: ids,
    captures: z.array(capture).length(3),
    sourceDispositions: z.array(z.object({ sourceId: z.enum(RELEASE_SOURCE_IDS), disposition: z.literal('repaired'), evidence2026: z.string().min(1).max(4000) }).strict()).length(3),
    profileDispositions: z.array(z.object({ profileId: z.string().min(1), disposition: z.literal('unchanged') }).strict()).length(7),
    generation,
}).strict();
const Legacy = Proof.extend({
    questionItemId: z.string().min(1), proposalSha256: sha,
    issue: z.literal('https://github.com/JFusco/cms-field-vocabulary/issues/91'), repository: z.literal('JFusco/cms-field-vocabulary'),
    branch: z.literal('codex/91-restore-optimizely-release-notes'), originalHead: head,
    captures: z.array(capture.extend({ observedAt: z.string().datetime(), rawSha256: sha, normalizedSha256: sha, fragmentSha256: sha, identityCount: z.number().int().positive() }).strict()).length(3),
    captureCommand: z.string(), captureLogPath: z.string(), captureVerificationPath: z.string(),
    generation: generation.extend({ command: z.literal('node scripts/wiki/build-graph.cjs'), exitCode: z.literal(0), graphSha256: sha, connectionsSha256: sha }).strict(),
    acceptance: z.literal('not accepted; permission to repair is not acceptance. f-lock-acceptance stays open for maintainer decision.'),
}).strict();
type Parsed = { proof: z.infer<typeof Proof>; legacy?: z.infer<typeof Legacy> };
function requireThat(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

/** Recognize one historical spelling explicitly. Raw packet bytes remain the acceptance hash input. */
export function parseAmendmentProof(packet: string, authority: { questionItemId: string; proposalSha256: string; originalHead: string; root: string }): Parsed {
    const raw: unknown = JSON.parse(packet), current = Proof.safeParse(raw);
    if (current.success) return { proof: current.data };
    const legacy = Legacy.parse(raw);
    requireThat(legacy.questionItemId === authority.questionItemId && legacy.proposalSha256 === authority.proposalSha256 && legacy.originalHead === authority.originalHead,
        'Legacy amendment provenance differs from the durable authorization');
    requireThat(legacy.captureCommand === `node --import ${resolve(authority.root, 'amendment-tools/preload.mjs')} scripts/source-review.mjs ${RELEASE_SOURCE_IDS.join(' ')}`,
        'Legacy amendment capture command is not the recognized bounded observer');
    const { version, authorizationId, head, base, sourceIds, sourceDispositions, profileDispositions } = legacy;
    return { legacy, proof: Proof.parse({ version, authorizationId, head, base, sourceIds, sourceDispositions, profileDispositions,
        captures: legacy.captures.map(({ sourceId, url, bodyPath, observationPath }) => ({ sourceId, url, bodyPath, observationPath })),
        generation: { head: legacy.generation.head, inputSha256: legacy.generation.inputSha256, command: ['node', 'scripts/wiki/build-graph.cjs'],
            graphPath: legacy.generation.graphPath, connectionsPath: legacy.generation.connectionsPath, outputPath: legacy.generation.outputPath } }) };
}

const NativeObservation = z.object({ sourceId: z.enum(RELEASE_SOURCE_IDS), url: z.string().url(), observedAt: z.string().datetime(), reviewStatus: z.literal('reviewed'),
    rawSha256: sha, normalizedSha256: sha, fragmentSha256: sha, requiredTokenSetSha256: sha, requiredTokens: z.array(z.string()),
    observedTokenSetSha256: sha.nullable(), observedTokens: z.array(z.string()).nullable(), identities: z.array(z.string()),
    missingRequiredTokens: z.array(z.string()), missingObservedTokens: z.array(z.string()),
}).strict();
const WrappedObservation = z.object({ sourceId: z.enum(RELEASE_SOURCE_IDS),
    capture: z.object({ bodyPath: z.string(), bodyBytes: z.number().int().positive().max(16000000), bodySha256: sha, bytesSha256: sha,
        status: z.literal(200), requestedAt: z.string().datetime(), receivedAt: z.string().datetime(), headers: z.record(z.string(), z.string()), attempts: z.literal(1) }).strict(),
    nativeObservation: NativeObservation,
}).strict();

/** The historical native observer retained its HTTP envelope; unwrapping never erases its raw proof. */
export function amendmentCaptureObservation(parsed: Parsed, item: z.infer<typeof capture>, raw: unknown, body: string): Record<string, any> {
    if (!parsed.legacy && !(raw && typeof raw === 'object' && 'nativeObservation' in raw)) return raw as Record<string, any>;
    const wrapped = WrappedObservation.parse(raw), transport = wrapped.capture, observation = wrapped.nativeObservation;
    requireThat(wrapped.sourceId === item.sourceId && observation.sourceId === item.sourceId && observation.url === item.url &&
        transport.bodyPath === item.bodyPath && transport.bodyBytes === Buffer.byteLength(body) &&
        transport.bodySha256 === sourceHash(body) && transport.bytesSha256 === sourceHash(body) && observation.rawSha256 === sourceHash(body) &&
        transport.requestedAt === observation.observedAt && Date.parse(transport.receivedAt) >= Date.parse(transport.requestedAt),
    'Legacy native capture transport or body identity disagrees');
    return observation;
}

/** Native date-only heading IDs inherit their year from the exact same verified official page. */
export function releaseCapturesCover2026(captures: { sourceId: string; body: string; observation: Record<string, any> }[]): boolean {
    const titles: Record<string, string> = {
        'optimizely-saas.release-notes-index': '2026 CMS (SaaS) release notes - Release notes for CMS (SaaS)',
        'optimizely-paas.release-notes-index': '2026 Optimizely CMS 12 release notes - Release notes for CMS 12',
        'optimizely-paas.cms13-release-notes-index': '2026 Optimizely CMS 13 release notes - Release notes for CMS 13',
    };
    return captures.length === 3 && new Set(captures.map(item => item.sourceId)).size === 3 && captures.every(item => {
        if (!titles[item.sourceId] || !Array.isArray(item.observation.identities) || item.observation.identities.length === 0) return false;
        if (item.observation.identities.some((identity: unknown) => typeof identity === 'string' && /2026/.test(identity))) return true;
        const found = [...item.body.matchAll(/<title\b[^>]*>([^<]*)<\/title>/gi)];
        return found.length === 1 && found[0][1].replace(/\s+/g, ' ').trim() === titles[item.sourceId];
    });
}

/** Redundant legacy metadata is checked, not dropped as irrelevant extra fields. */
export function verifyLegacyCaptureMetadata(parsed: Parsed, observations: { sourceId: string; body: string; observation: any }[], retain: (path: string, limit?: number) => string) {
    if (!parsed.legacy) return;
    for (const item of parsed.legacy.captures) {
        const capture = observations.find(observation => observation.sourceId === item.sourceId);
        requireThat(capture && sourceHash(capture.body) === item.rawSha256 &&
            ['observedAt', 'rawSha256', 'normalizedSha256', 'fragmentSha256'].every(key => (item as any)[key] === capture.observation[key]) && item.identityCount === capture.observation.identities?.length,
        'Legacy capture provenance disagrees with the retained response');
    }
    // These are provenance, never substitutes for deterministic capture re-derivation or Sam/Riley.
    retain(parsed.legacy.captureLogPath, 1000000);
    const verification = JSON.parse(retain(parsed.legacy.captureVerificationPath, 1000000));
    requireThat(Array.isArray(verification.checks) && verification.checks.length > 0 && verification.checks.every((item: any) => item?.pass === true),
        'Legacy capture verification contains a failed or missing check');
}

const GRAPH = 'scripts/wiki/graph/data/graph.json', CONNECTIONS = 'wiki/connections.md';
export const LEGACY_WIKI_INPUT_DEFINITION = 'sha256 of JSON [{path,sha256}] for wiki/**/*.md excluding wiki/connections.md, sorted by path';
const LegacyGeneration = z.object({
    head, command: z.literal('node scripts/wiki/build-graph.cjs'), cwd: z.string(), exitCode: z.literal(0), stdout: z.string(), stderr: z.literal(''),
    observedAt: z.string().datetime(), inputDefinition: z.literal(LEGACY_WIKI_INPUT_DEFINITION), inputCount: z.number().int().positive(), inputSha256: sha,
    graphPath: z.string(), connectionsPath: z.string(), graphSha256: sha, connectionsSha256: sha, worktreeCleanAfter: z.literal(true),
    inputs: z.array(z.object({ path: z.string().regex(/^wiki\/(?!\.\.?\/)(?!.*\/\.\.?\/)[a-zA-Z0-9_./-]+\.md$/), sha256: sha }).strict()).min(1).max(10000),
}).strict();
type GenerationContext = {
    head: string; worktree: string; inputSha256: string; packageJson: any;
    retain: (path: string, limit?: number) => string;
    candidateFile: (path: string) => Promise<string>;
    candidateWikiPaths: () => Promise<string[]>;
};

/** Compare immutable native inputs/outputs without rerunning generators or rewriting their receipts. */
export async function verifyAmendmentGeneration(parsed: Parsed, context: GenerationContext): Promise<Record<string, string>> {
    const gen = parsed.proof.generation;
    requireThat(gen.head === context.head, 'Native generation belongs to a different candidate head');
    const outputContents = context.retain(gen.outputPath, 2000000), output = JSON.parse(outputContents);
    if (!parsed.legacy) {
        requireThat(gen.inputSha256 === context.inputSha256, 'Native generation belongs to different candidate inputs');
        const direct = isDeepStrictEqual(gen.command, ['node', 'scripts/wiki/build-graph.cjs']);
        const registered = gen.command.length === 3 && ['npm', 'pnpm'].includes(gen.command[0]) && gen.command[1] === 'run' &&
            typeof context.packageJson.scripts?.[gen.command[2]] === 'string' && /build-graph/.test(context.packageJson.scripts[gen.command[2]]);
        requireThat(direct || registered, 'Required native graph generation command is unverified');
        requireThat(output.exitCode === 0 && output.head === context.head && output.inputSha256 === gen.inputSha256 && isDeepStrictEqual(output.command, gen.command), 'Successful native generation output is incomplete');
        const generated = { [GRAPH]: context.retain(gen.graphPath), [CONNECTIONS]: context.retain(gen.connectionsPath) };
        requireThat(output.graphSha256 === sourceHash(generated[GRAPH]) && output.connectionsSha256 === sourceHash(generated[CONNECTIONS]), 'Retained native generation fingerprints disagree');
        return generated;
    }
    const native = LegacyGeneration.parse(output), legacy = parsed.legacy.generation;
    requireThat(native.head === context.head && native.inputSha256 === gen.inputSha256 && native.cwd === context.worktree &&
        native.command === legacy.command && native.graphPath === legacy.graphPath && native.connectionsPath === legacy.connectionsPath &&
        native.graphPath === resolve(context.worktree, GRAPH) && native.connectionsPath === resolve(context.worktree, CONNECTIONS) &&
        native.graphSha256 === legacy.graphSha256 && native.connectionsSha256 === legacy.connectionsSha256,
    'Legacy native generation identity or fingerprints disagree');
    const paths = (await context.candidateWikiPaths()).filter(path => path.endsWith('.md') && path !== CONNECTIONS).sort((a, b) => a.localeCompare(b));
    requireThat(paths.length === native.inputCount && new Set(paths).size === paths.length && isDeepStrictEqual(native.inputs.map(item => item.path), paths),
        'Legacy native generation input inventory is incomplete or duplicated');
    const inputs = [];
    for (const path of paths) inputs.push({ path, sha256: sourceHash(await context.candidateFile(path)) });
    requireThat(isDeepStrictEqual(native.inputs, inputs) && sourceHash(JSON.stringify(inputs)) === native.inputSha256,
        'Legacy native generation belongs to different immutable wiki inputs');
    const generated = { [GRAPH]: await context.candidateFile(GRAPH), [CONNECTIONS]: await context.candidateFile(CONNECTIONS) };
    requireThat(sourceHash(generated[GRAPH]) === native.graphSha256 && sourceHash(generated[CONNECTIONS]) === native.connectionsSha256,
        'Legacy native generation outputs differ from candidate Git blobs');
    const graph = JSON.parse(generated[GRAPH]);
    requireThat(Array.isArray(graph.nodes) && Array.isArray(graph.edges) && native.stdout === `PASS wiki graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges\n`,
        'Legacy native generation success output does not match the retained graph');
    // The raw receipt's compact wiki-input digest is intentionally never replaced by the current input-map digest.
    // Existing independent native-graph review and QA bindings remain mandatory after this compatibility check.
    return generated;
}
