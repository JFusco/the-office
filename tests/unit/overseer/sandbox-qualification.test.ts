import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { claudeReader, codexReader, type ReaderSelection } from '../../../server/overseer/reader-profiles';
import { createRunDirectories } from '../../../server/overseer/run-directories';
import {
    ALLOW_PROBES, collectProbe, DENIAL_CODES, DENY_PROBES, modelDispatchGate, NESTED_PROBE, observe, PROBE_LINE_PREFIX,
    profileEligibility, qualify, READER_PROFILES, RECORD_PROBES, SANDBOX_STATUS,
    type HostFacts, type HostIdentity, type InnerReceipt, type Observation, type OuterReceipt, type ProbeId, type ProviderIdentity,
} from '../../../server/overseer/sandbox-qualification';
import { relativeRules, snapshotPath } from '../../../server/overseer/worker-sandbox-policy';
import { preparePolicy, SandboxRefusal, verifyPrepared, type Executor } from '../../../server/overseer/worker-sandbox-run';
import { sandboxPreparation, sandboxWorld } from './sandbox-world';

const ROOT = '/fixture/runner/runs/run-1';
const EXPECTED = {
    run: { id: 'run-1', root: ROOT, home: join(ROOT, 'home'), tmp: join(ROOT, 'tmp'), provider: join(ROOT, 'provider'), officeData: join(ROOT, 'office-data') },
    policyDigest: 'a'.repeat(64), profile: 'claude-reader', argv: ['test', '', 'two words'],
    javaAgentJar: '/fixture/installation/agent.jar', wrapperTmp: '/fixture/runner/w/run-1', allowedIpc: ['fixture-service'],
};
const bindingFor = (expected = EXPECTED) => ({ run: expected.run.id, policyDigest: expected.policyDigest, profile: expected.profile });
const binding = bindingFor();
const line = (probe: ProbeId, fields: Record<string, unknown>, scope = binding) =>
    PROBE_LINE_PREFIX + JSON.stringify({ ...scope, probe, ...fields });
const control = (probe: ProbeId, scope = binding) => ({ ...scope, probe, result: 'succeeded' as const });
const cleanup = (termination: 'success' | 'failure' | 'interrupted') => ({
    termination, payloadExited: true, groupExited: true, proxyClosed: true,
});
const proxy = { http: 'proxy-allowlist-denied', socks: 'proxy-allowlist-denied', reachableIpc: ['fixture-service'] };

function battery(expected = EXPECTED, nesting: 'refused' | 'restricted' | 'unknown' = 'refused'): Observation[] {
    const scope = bindingFor(expected);
    const record = (probe: ProbeId, outcome: string, details: Record<string, unknown> = {}) => observe(probe, scope, [
        line(probe, { kind: 'start' }, scope),
        line(probe, { kind: 'terminal', outcome, ...details }, scope),
    ], 'exited', control(probe, scope), true);
    const allowed = {
        startup: { cwd: expected.run.home, argv: expected.argv },
        'tmpdir-api': { tmpdir: expected.run.tmp, tempFile: join(expected.run.tmp, 'fixture') },
        'java-agent-reference': { javaAgentJar: expected.javaAgentJar },
    };
    const rows: Observation[] = [
        ...ALLOW_PROBES.map(probe => record(probe, 'allowed', allowed[probe as keyof typeof allowed])),
        ...DENY_PROBES.map(probe => record(probe, 'denied', {
            refusalCode: DENIAL_CODES[probe], ...(probe === 'proxy-forwarding' ? { proxy } : {}),
        })),
        { ...scope, probe: 'parent-footprint', started: false, outcome: 'recorded', writes: [join(expected.wrapperTmp, 'fixture')] },
        ...(['success', 'failure', 'interrupted'] as const).map(termination => ({
            ...scope, probe: `cleanup-${termination}`, started: false, outcome: 'ended' as const, cleanup: cleanup(termination),
        })),
    ];
    if (nesting !== 'unknown') rows.push(record(NESTED_PROBE, nesting, { refusalCode: 'seatbelt-apply-denied' }));
    return rows;
}
const change = (probe: string, edit: Partial<Observation>) => battery().map(row => row.probe === probe ? { ...row, ...edit } : row);
function unqualifiedBy(observations: Observation[], fault: string) {
    const result = qualify(observations, EXPECTED);
    expect(result.status, fault).toBe('unqualified');
    expect(result.failures.join('\n'), fault).toContain(fault);
    return result;
}

test('a complete battery qualifies the outer sandbox and keeps its run, digest and profile', () => {
    expect(qualify(battery(), EXPECTED)).toEqual({
        run: EXPECTED.run, policyDigest: EXPECTED.policyDigest, profile: EXPECTED.profile,
        status: 'qualified', failures: [], innerSeatbelt: 'unsupported',
    });
    expect(qualify(battery(EXPECTED, 'restricted'), EXPECTED).innerSeatbelt).toBe('supported');
    expect(qualify(change(NESTED_PROBE, { control: 'failed' }), EXPECTED)).toMatchObject({ status: 'qualified', innerSeatbelt: 'unknown' });
    expect(qualify(battery(EXPECTED, 'unknown'), EXPECTED).innerSeatbelt).toBe('unknown');
});

test('nested Seatbelt requires unique evidence from the same run, policy and profile', () => {
    for (const field of ['run', 'policyDigest', 'profile'] as const) {
        expect(unqualifiedBy(change(NESTED_PROBE, { [field]: 'another' }),
            'nested-seatbelt: recorded for another run, policy or profile').innerSeatbelt).toBe('unknown');
    }
    const rows = battery(EXPECTED, 'unknown'), refused = battery().at(-1)!, supported = battery(EXPECTED, 'restricted').at(-1)!;
    for (const evidence of [[refused, supported], [supported, refused]]) {
        expect(unqualifiedBy([...rows, ...evidence], 'nested-seatbelt: recorded more than once').innerSeatbelt).toBe('unknown');
    }
});

test('credential and protected configuration access need evidence of enforcement and a working control', () => {
    for (const probe of ['credential-store', 'read-claude-config', 'read-codex-config']) {
        unqualifiedBy(change(probe, { outcome: 'allowed' }), `${probe}: expected denied, saw allowed`);
        unqualifiedBy(change(probe, { outcome: 'inconclusive' }), `${probe}: expected denied, saw inconclusive`);
        unqualifiedBy(change(probe, { control: 'unavailable' }), `${probe}: its positive control unavailable`);
        unqualifiedBy(change(probe, { control: undefined }), `${probe}: its positive control is missing`);
        unqualifiedBy(change(probe, { refusalCode: undefined }), `${probe}: operation-specific enforcement was not confirmed`);
        unqualifiedBy(battery().filter(o => o.probe !== probe), `${probe}: missing`);
    }
});

test('rejection preserves a start marker while incomplete and contradictory output cannot qualify', async () => {
    const probe = 'startup', start = line(probe, { kind: 'start' });
    const terminal = line(probe, { kind: 'terminal', outcome: 'allowed', cwd: EXPECTED.run.home, argv: EXPECTED.argv });
    const failure: Executor = async (_program, _args, options) => {
        options?.onLine?.(start);
        throw new Error('fixture command failed');
    };
    const rejected = await collectProbe(probe, binding, onLine => failure('/fixture/program', [], { onLine }));
    const zero: Executor = async (_program, _args, options) => { options?.onLine?.(start); return start; };
    const incomplete = await collectProbe(probe, binding, onLine => zero('/fixture/program', [], { onLine }));
    for (const row of [rejected, incomplete,
        observe(probe, binding, [start, terminal, terminal], 'exited'),
        observe(probe, binding, [start, terminal], 'rejected'),
        observe(probe, binding, [start, terminal], 'signalled'),
        observe(probe, binding, [start, terminal], 'cancelled'),
        observe(probe, binding, [start, line('snapshot-read', { kind: 'terminal', outcome: 'allowed' })], 'exited'),
    ]) {
        expect(row).toMatchObject({ started: true, outcome: 'inconclusive' });
        unqualifiedBy(change(probe, row), 'startup: expected allowed, saw inconclusive');
    }
    expect(observe(probe, binding, [terminal], 'exited')).toMatchObject({ started: false, outcome: 'inconclusive' });
    expect(observe(probe, binding, [terminal, start], 'exited')).toMatchObject({ started: false, outcome: 'inconclusive' });
    expect(await collectProbe(probe, binding, async () => { throw new SandboxRefusal('fixture setup failed'); }))
        .toMatchObject({ started: false, outcome: 'sandbox-failed' });
    expect(observe(probe, binding, [], 'rejected')).toMatchObject({ started: false, outcome: 'inconclusive' });
});

test('a deny terminal must include the enforcement code for its operation and a separate matching control', () => {
    const probe = 'network-proxied';
    const lines = (refusalCode?: string) => [
        line(probe, { kind: 'start' }),
        line(probe, { kind: 'terminal', outcome: 'denied', refusalCode, control: 'succeeded' }),
    ];
    const known = lines(DENIAL_CODES[probe]);
    for (const row of [
        observe(probe, binding, known, 'exited'),
        observe(probe, binding, known, 'exited', control('network-direct')),
        observe(probe, binding, known, 'exited', control(probe, { ...binding, policyDigest: 'another' })),
        observe(probe, binding, lines(), 'exited', control(probe)),
        observe(probe, binding, lines('dns-failed'), 'exited', control(probe)),
    ]) {
        expect(row.outcome).toBe('inconclusive');
        unqualifiedBy(change(probe, row), 'network-proxied: expected denied, saw inconclusive');
    }
    expect(observe(probe, binding, known, 'exited', control(probe))).toMatchObject({ started: true, outcome: 'denied' });
});

test('each observation must be present once, bound to this battery and confirmed', () => {
    unqualifiedBy(change('startup', { started: false }), 'startup: payload start not confirmed');
    unqualifiedBy(change('snapshot-read', { outcome: 'sandbox-failed' }), 'snapshot-read: the sandbox failed before the payload started');
    unqualifiedBy(change('tmp-write', { outcome: 'denied' }), 'tmp-write: expected allowed, saw denied');
    unqualifiedBy(change('write-snapshot', { intact: false }), 'write-snapshot: the sentinel was not verified intact');
    unqualifiedBy(change('replace-policy', { intact: undefined }), 'replace-policy: the sentinel was not verified intact');
    unqualifiedBy([...battery(), ...battery().filter(o => o.probe === 'unix-socket')], 'unix-socket: recorded more than once');
    unqualifiedBy([...battery(), { ...binding, started: true, probe: 'telepathy', outcome: 'denied' }], 'telepathy: not a probe of this battery');
    for (const field of ['run', 'policyDigest', 'profile'] as const)
        unqualifiedBy(change('launchd-ipc', { [field]: 'other' }), 'launchd-ipc: recorded for another run, policy or profile');
});

test('startup, temporary files, the Java agent, proxy, parent writes and each cleanup case need their own evidence', () => {
    for (const probe of ['java-agent-reference', 'proxy-forwarding', ...RECORD_PROBES])
        unqualifiedBy(battery().filter(o => o.probe !== probe), `${probe}: missing`);
    unqualifiedBy(change('startup', { cwd: ROOT }), 'startup: cwd or argv differs');
    unqualifiedBy(change('startup', { argv: ['test'] }), 'startup: cwd or argv differs');
    unqualifiedBy(change('tmpdir-api', { tmpdir: EXPECTED.wrapperTmp }), 'tmpdir-api: effective TMPDIR');
    unqualifiedBy(change('tmpdir-api', { tempFile: EXPECTED.run.tmp + '-outside/fixture' }), 'tmpdir-api: effective TMPDIR');
    unqualifiedBy(change('java-agent-reference', { javaAgentJar: '/fixture/wrong.jar' }), 'java-agent-reference: expected the verified Java agent path');
    unqualifiedBy(change('proxy-forwarding', { proxy: { ...proxy, socks: 'forwarded' } }), 'proxy-forwarding: HTTP or SOCKS forwarding');
    unqualifiedBy(change('proxy-forwarding', { proxy: { ...proxy, reachableIpc: ['unexpected-service'] } }), 'proxy-forwarding: HTTP or SOCKS forwarding');
    unqualifiedBy(change('parent-footprint', { writes: ['/fixture/outside'] }), 'parent-footprint: parent writes');
    unqualifiedBy(change('cleanup-failure', { cleanup: cleanup('success') }), 'cleanup-failure: payload, process group and proxy exit');
    unqualifiedBy(change('cleanup-interrupted', { cleanup: { ...cleanup('interrupted'), proxyClosed: false } }), 'cleanup-interrupted: payload, process group and proxy exit');
});

function receipts(providerName: ProviderIdentity['provider'] = 'claude', nesting: 'refused' | 'restricted' | 'unknown' = 'refused') {
    const profile = READER_PROFILES[providerName];
    const path = providerName === 'codex' ? '/usr/bin/false' : '/usr/bin/true';
    const world = sandboxWorld({ executables: [path] });
    const programs = { [profile.id]: path };
    const prepared = preparePolicy(sandboxPreparation(world.input, { provider: providerName, programs }));
    const facts: HostFacts = {
        os: { build: '24D60', arch: 'arm64' }, node: { path: prepared.runtime.node, sha256: 'b'.repeat(64) },
        runtime: { version: prepared.runtime.version, contentSha256: 'c'.repeat(64) },
    };
    const host: HostIdentity = { ...facts, rules: relativeRules(prepared.settings, prepared.run, prepared.scratch) };
    const program = { path, version: providerName === 'codex' ? '0.167.0-alpha.4.1' : '2.1.328', sha256: createHash('sha256').update(readFileSync(path)).digest('hex') };
    const selection = providerName === 'codex' ? codexReader(program, 'gpt-fixture', 'high') : claudeReader(program, 'claude-fixture', 'high');
    const provider: ProviderIdentity = { provider: providerName, path, version: program.version, sha256: program.sha256, argv: [...selection.argv], tools: [...selection.tools] };
    const observed = {
        ...EXPECTED, run: prepared.run, policyDigest: prepared.digest, profile: profile.id, argv: [...provider.argv],
        javaAgentJar: prepared.runtime.javaAgentJar, wrapperTmp: prepared.wrapperTmp,
    };
    const outerExpected = { ...observed, profile: 'outer' };
    const outer: OuterReceipt = { identity: host, qualification: qualify(battery(outerExpected, 'unknown'), outerExpected) };
    const current = { ...host, provider };
    const inner: InnerReceipt = {
        profile: profile.id, identity: current, restrictionsApplied: profile.requiredRestrictions, battery: qualify(battery(observed, nesting), observed),
        effective: { restrictions: [...profile.requiredRestrictions], authentication: selection.authentication, externalMcp: [] },
    };
    const allocate = (extra: Partial<typeof world.input> = {}) => {
        const run = createRunDirectories(world.paths, randomUUID());
        mkdirSync(snapshotPath(run), { mode: 0o700 });
        return preparePolicy(sandboxPreparation({ ...world.input, ...extra, run }, { provider: providerName, programs }));
    };
    return { profile, selection, facts, prepared, outer, inner, current, allocate };
}

test('a reader profile needs matching outer and inner receipts and all its restrictions', () => {
    const { selection, facts, prepared, outer, inner } = receipts();
    expect(profileEligibility(selection, facts, prepared, outer, inner)).toEqual({ eligible: true });
    expect(profileEligibility(selection, facts, prepared, null, inner)).toEqual({ eligible: false, reason: 'outer-unqualified' });
    expect(profileEligibility(selection, facts, prepared, { ...outer, qualification: { ...outer.qualification, status: 'unqualified' } }, inner))
        .toEqual({ eligible: false, reason: 'outer-unqualified' });
    for (const badInner of [null, { ...inner, restrictionsApplied: inner.restrictionsApplied.slice(1) },
        { ...inner, battery: { ...inner.battery, status: 'unqualified' as const } },
        { ...inner, profile: 'codex-reader' }, { ...inner, battery: { ...inner.battery, profile: 'codex-reader' } },
    ]) {
        expect(profileEligibility(selection, facts, prepared, outer, badInner)).toEqual({ eligible: false, reason: 'inner-restriction-unverified' });
    }
});

test('an inner receipt without evidence of its restrictions and sign-in method in effect qualifies nothing', () => {
    const { selection, facts, prepared, outer, inner } = receipts();
    const { effective: _effective, ...older } = inner;
    for (const badInner of [older, { ...inner, effective: { ...inner.effective!, authentication: 'codex-file-store' as const } },
        { ...inner, effective: { ...inner.effective!, restrictions: inner.effective!.restrictions.slice(1) } }]) {
        expect(profileEligibility(selection, facts, prepared, outer, badInner)).toEqual({ eligible: false, reason: 'inner-evidence-missing' });
    }
});

test('a command-capable Codex reader needs affirmative inner Seatbelt evidence, and an outer refusal stands', () => {
    const { selection, facts, prepared, outer, inner } = receipts('codex');
    const supported: InnerReceipt = { ...inner, battery: { ...inner.battery, innerSeatbelt: 'supported' } };
    expect(profileEligibility(selection, facts, prepared, outer, supported)).toEqual({ eligible: true });
    expect(profileEligibility(selection, facts, prepared, outer, inner)).toEqual({ eligible: false, reason: 'inner-seatbelt-unsupported' });
    expect(profileEligibility(selection, facts, prepared, outer, { ...inner, battery: { ...inner.battery, innerSeatbelt: 'unknown' } }))
        .toEqual({ eligible: false, reason: 'inner-seatbelt-unsupported' });
    const outerRefusal: OuterReceipt = { ...outer, qualification: { ...outer.qualification, innerSeatbelt: 'unsupported' } };
    expect(profileEligibility(selection, facts, prepared, outerRefusal, supported)).toEqual({ eligible: false, reason: 'inner-seatbelt-unsupported' });
    const claudeIdentity = { ...supported.identity, provider: { ...supported.identity.provider, provider: 'claude' as const } };
    expect(profileEligibility(selection, facts, prepared, outer, { ...supported, identity: claudeIdentity })).toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
    const wrongProgram = { ...selection, program: { ...selection.program, path: '/usr/bin/true' } };
    expect(profileEligibility(wrongProgram, facts, prepared, outer, supported)).toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
});

test('the receipt must match both its originating policy and the verified policy for a fresh run', () => {
    const { selection, facts, prepared, current, outer, inner, allocate } = receipts();
    const second = allocate();
    expect(second.digest).not.toBe(prepared.digest);
    expect(relativeRules(second.settings, second.run)).toBe(current.rules);
    expect(profileEligibility(selection, facts, second, outer, inner)).toEqual({ eligible: true });
    const changed = allocate({ runtimeReads: ['/usr/share'] });
    expect(() => verifyPrepared(changed)).not.toThrow();
    expect(profileEligibility(selection, facts, changed, outer, inner)).toEqual({ eligible: false, reason: 'outer-identity-mismatch' });
    expect(profileEligibility(selection, facts, second, { ...outer, qualification: { ...outer.qualification, run: second.run } }, inner))
        .toEqual({ eligible: false, reason: 'outer-identity-mismatch' });
    expect(profileEligibility(selection, facts, second, outer, { ...inner, battery: { ...inner.battery, policyDigest: second.digest } }))
        .toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
    // The rules are the policy file's own: a description of it the file does not hold changes nothing.
    expect(profileEligibility(selection, facts, { ...second, bytes: '{}', settings: {} as never }, outer, inner)).toEqual({ eligible: true });
    writeFileSync(second.file, '{}\n');
    expect(profileEligibility(selection, facts, second, outer, inner)).toEqual({ eligible: false, reason: 'outer-identity-mismatch' });
});

test('changes to host facts, rules, the program bytes or the exact invocation invalidate the receipts', () => {
    const { selection, facts, prepared, outer, inner } = receipts();
    const hostVariants: HostFacts[] = [
        { ...facts, os: { ...facts.os, build: '24D70' } }, { ...facts, os: { ...facts.os, arch: 'x86_64' } },
        { ...facts, node: { ...facts.node, sha256: 'f'.repeat(64) } }, { ...facts, runtime: { ...facts.runtime, version: '0.0.84' } },
        { ...facts, runtime: { ...facts.runtime, contentSha256: 'f'.repeat(64) } },
    ];
    for (const changed of hostVariants) expect(profileEligibility(selection, changed, prepared, outer, inner)).toEqual({ eligible: false, reason: 'outer-identity-mismatch' });
    const selectionVariants: ReaderSelection[] = [
        { ...selection, program: { ...selection.program, version: '2.1.329' } },
        { ...selection, program: { ...selection.program, sha256: 'f'.repeat(64) } },
        // Labels intact, argv altered: the receipt binds the exact arguments.
        { ...selection, argv: [...selection.argv, '--verbose'] },
        { ...selection, tools: [...selection.tools, 'Bash'] },
    ];
    for (const changed of selectionVariants) expect(profileEligibility(changed, facts, prepared, outer, inner)).toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
    // A receipt made for a claimed digest the program's bytes do not have, or for a program the policy was not prepared for, is refused on its own.
    const claimed = { ...selection, program: { ...selection.program, sha256: 'f'.repeat(64) } };
    const forClaimed = { ...inner, identity: { ...inner.identity, provider: { ...inner.identity.provider, sha256: 'f'.repeat(64) } } };
    expect(profileEligibility(claimed, facts, prepared, outer, forClaimed)).toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
    const unprepared = { ...selection, program: { ...selection.program, path: '/usr/bin/false', sha256: createHash('sha256').update(readFileSync('/usr/bin/false')).digest('hex') } };
    const forUnprepared = { ...inner, identity: { ...inner.identity, provider: { ...inner.identity.provider, path: unprepared.program.path, sha256: unprepared.program.sha256 } } };
    expect(profileEligibility(unprepared, facts, prepared, outer, forUnprepared)).toEqual({ eligible: false, reason: 'inner-identity-mismatch' });
});

test('simulated qualification leaves the shipped model gate closed', () => {
    expect(qualify(battery(), EXPECTED).status).toBe('qualified');
    expect(modelDispatchGate()).toEqual({ open: false, reason: SANDBOX_STATUS.reason });
    expect(SANDBOX_STATUS).toMatchObject({
        status: 'unqualified', runtime: { name: '@anthropic-ai/sandbox-runtime', version: '0.0.83' },
        profiles: { 'claude-reader': 'outer-unqualified', 'codex-reader': 'outer-unqualified' },
    });
});

test('a malformed or mis-bound record makes an observation inconclusive, and a mis-bound row is reported once and judged no further', () => {
    const probe = 'startup', start = line(probe, { kind: 'start' });
    const terminal = line(probe, { kind: 'terminal', outcome: 'allowed', cwd: EXPECTED.run.home, argv: EXPECTED.argv });
    for (const bad of [`${PROBE_LINE_PREFIX}"not an object"`, `${PROBE_LINE_PREFIX}{ not json`, line(probe, { kind: 'terminal', outcome: 'allowed' }, { ...binding, run: 'run-2' })])
        expect(observe(probe, binding, [start, terminal, bad], 'exited'), bad).toMatchObject({ started: true, outcome: 'inconclusive' });
    // A single otherwise valid terminal from another run: only its binding makes it inconclusive.
    const foreign = line(probe, { kind: 'terminal', outcome: 'allowed', cwd: EXPECTED.run.home, argv: EXPECTED.argv }, { ...binding, run: 'run-2' });
    expect(observe(probe, binding, [start, foreign], 'exited')).toMatchObject({ started: true, outcome: 'inconclusive' });
    // Mis-bound and also wrong: only the binding is reported, because nothing else about that row is read.
    const misbound = battery().map(row => row.probe === 'snapshot-read' ? { ...row, run: 'run-2', outcome: 'denied' as const } : row);
    expect(qualify(misbound, EXPECTED).failures).toEqual(['snapshot-read: recorded for another run, policy or profile']);
});

test('Claude qualification requires an observed empty external MCP inventory', () => {
    const { selection, facts, prepared, outer, inner } = receipts('claude');
    for (const externalMcp of [undefined, ['fixture-mcp']]) {
        const receipt = { ...inner, effective: { ...inner.effective!, externalMcp } };
        expect(profileEligibility(selection, facts, prepared, outer, receipt)).toEqual({ eligible: false, reason: 'inner-evidence-missing' });
    }
    expect(profileEligibility(selection, facts, prepared, outer, inner)).toEqual({ eligible: true });
});
