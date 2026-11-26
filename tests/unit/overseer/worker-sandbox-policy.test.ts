import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { runnerPaths } from '../../../server/overseer/config';
import { createRunDirectories } from '../../../server/overseer/run-directories';
import { checkPolicyInputs, expandRules, policyDigest, policyPath, relativeRules, sandboxPolicy, serializePolicy, snapshotPath } from '../../../server/overseer/worker-sandbox-policy';
import { tempDir } from './runner-world';
import { sandboxWorld as createSandboxWorld } from './sandbox-world';

const sandboxWorld = () => createSandboxWorld({}, tempDir());

const literal = (path: string) => ({ path, literal: true });

test('a reader run reads only its snapshot, its folders and the reviewed inputs, writes only its folders and has no network', () => {
    const { paths, run, input } = sandboxWorld(), { protectedRoots } = input;
    const working = [run.home, run.tmp, run.provider, run.officeData];
    expect(sandboxPolicy(input)).toEqual({
        filesystem: {
            denyRead: ['/', '/Users', '/Volumes', '/tmp', '/private/tmp', '/var/folders', '/private/var/folders',
                protectedRoots.officeData, protectedRoots.checkoutData, ...protectedRoots.checkouts, ...protectedRoots.sessionStores,
                paths.control, paths.journal, paths.state, paths.code, paths.logs, paths.runs, paths.wrapperTmp, input.installation,
                '/bin/launchctl', '/usr/bin/osascript', '/usr/bin/open'].map(literal),
            allowRead: [snapshotPath(run), ...working, '/bin/bash', '/bin/sh', '/usr/bin/true', '/usr/lib', '/System/Library'].map(literal),
            allowWrite: working.map(literal),
            denyWrite: [snapshotPath(run), policyPath(run), '/tmp/claude', '/private/tmp/claude',
                '/dev/tty', '/dev/dtracehelper', '/dev/autofs_nowait'].map(literal),
        },
        network: { allowedDomains: [], deniedDomains: [], allowUnixSockets: [], allowMachLookup: [], allowLocalBinding: false },
        allowAppleEvents: false, enableWeakerNestedSandbox: false, enableWeakerNetworkIsolation: false, allowPty: false,
        javaAgentJarPath: input.javaAgentJarPath,
    });
    // The same settings are always the same bytes, keys sorted at every level.
    const bytes = serializePolicy(sandboxPolicy(input));
    expect(bytes).toBe(serializePolicy(sandboxPolicy({ ...input })));
    expect(bytes.startsWith('{"allowAppleEvents":false,"allowPty":false,"enableWeakerNestedSandbox":false')).toBe(true);
    expect(policyDigest(bytes)).toMatch(/^[0-9a-f]{64}$/);
});

test('stage scratch strictly inside the run is writable; anything else is refused', () => {
    const { run, input } = sandboxWorld(), scratch = join(run.root, 'scratch');
    expect(sandboxPolicy({ ...input, scratch: [scratch] }).filesystem.allowWrite).toContainEqual(literal(scratch));
    expect(() => sandboxPolicy({ ...input, scratch: [run.root] })).toThrow('strictly beneath the run folder');
    expect(() => sandboxPolicy({ ...input, scratch: [resolve(run.root, '..', 'elsewhere')] })).toThrow('strictly beneath the run folder');
    // Scratch under the snapshot would let the reader edit what it was given.
    expect(() => sandboxPolicy({ ...input, scratch: [join(snapshotPath(run), 'x')] })).toThrow(`overlaps ${snapshotPath(run)}`);
    expect(() => sandboxPolicy({ ...input, scratch: [join(run.root, 'sandbox.json', 'x')] })).toThrow('overlaps');
    expect(() => sandboxPolicy({ ...input, scratch: ['scratch'] })).toThrow('normalized absolute path');
    expect(() => sandboxPolicy({ ...input, scratch: [`${run.root}/a/../b`] })).toThrow('normalized absolute path');
});

test('a readable input that would open a home, a protected store, another run or the installation is refused', () => {
    const { paths, run, input } = sandboxWorld();
    // A narrow file beneath a home is allowed: a provider binary lives there.
    expect(() => sandboxPolicy({ ...input, executables: ['/Users/someone/.local/share/claude/versions/2.1.328'] })).not.toThrow();
    for (const home of ['/', '/Users', '/Users/someone'])
        expect(() => sandboxPolicy({ ...input, runtimeReads: [home] }), home).toThrow('would open a home or more');
    for (const tool of ['/bin/launchctl', '/usr/bin', '/usr/bin/osascript'])
        expect(() => sandboxPolicy({ ...input, runtimeReads: [tool] }), tool).toThrow('would open');
    const other = createRunDirectories(paths, randomUUID());
    for (const path of [join(input.protectedRoots.sessionStores[0], 'settings.json'), input.protectedRoots.checkouts[0], input.protectedRoots.officeData, paths.state, other.home, join(input.installation, 'node_modules'), resolve(input.installation, '..')])
        expect(() => sandboxPolicy({ ...input, runtimeReads: [path] }), path).toThrow('overlaps the protected');
    expect(() => sandboxPolicy({ ...input, executables: [join(run.tmp, 'tool')] })).toThrow('overlaps the protected');
    expect(() => sandboxPolicy({ ...input, runtimeReads: ['relative/path'] })).toThrow('normalized absolute path');
});

test('writable folders may not overlap live data, and the run must be this runner\'s allocation', () => {
    const { base, paths, run, input } = sandboxWorld();
    // Live Office data around the runner root would put the run's writes into it.
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, officeData: base } })).toThrow('overlaps');
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, checkouts: [paths.root] } })).toThrow('overlaps');
    expect(() => sandboxPolicy({ ...input, run: { ...run, root: join(base, 'elsewhere') } })).toThrow("is not this runner's allocation");
    expect(() => sandboxPolicy({ ...input, run: { ...run, home: run.tmp } })).toThrow("is not this runner's allocation");
    expect(() => sandboxPolicy({ ...input, allowedDomains: ['api.example.invalid'] })).toThrow('domain allowlist must be empty');
    expect(() => sandboxPolicy({ ...input, installation: 'installation' })).toThrow('normalized absolute path');
    for (const list of ['checkouts', 'sessionStores'] as const) {
        expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, [list]: [] } }), list).toThrow(`The protected ${list} must be named`);
        expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, [list]: undefined as never } }), list).toThrow(`The protected ${list} must be named`);
    }
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, officeData: undefined as never } })).toThrow('The protected officeData');
});

test('the snapshot and writable grants respect independently protected paths', () => {
    const { paths, run, input } = sandboxWorld();
    const inside = join(snapshotPath(run), 'protected-checkout');
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, checkouts: [inside] } }))
        .toThrow(`snapshot overlaps the protected ${inside}`);
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, officeData: paths.runs } }))
        .toThrow(`snapshot overlaps the protected ${paths.runs}`);
    const inHome = join(run.home, 'protected-checkout');
    expect(() => sandboxPolicy({ ...input, protectedRoots: { ...input.protectedRoots, checkouts: [inHome] } }))
        .toThrow(`The writable ${run.home} overlaps ${inHome}`);
});

test('additional read grants cannot reopen protected system locations', () => {
    const paths = { ...runnerPaths('/fixture/runner'), suppliedRoot: '/fixture/runner' };
    const id = randomUUID(), root = join(paths.runs, id);
    const input = {
        paths, run: { id, root, home: join(root, 'home'), tmp: join(root, 'tmp'), provider: join(root, 'provider'), officeData: join(root, 'office-data') },
        installation: '/fixture/install', javaAgentJarPath: '/fixture/install/agent.jar',
        protectedRoots: { officeData: '/fixture/data', checkoutData: '/fixture/checkout-data', checkouts: ['/fixture/checkout'], sessionStores: ['/fixture/session'] },
        executables: ['/Users/someone/bin/provider'], runtimeReads: [],
    };
    expect(sandboxPolicy(input).filesystem.allowRead).toContainEqual(literal(input.executables[0]));
    for (const path of ['/tmp', '/private', '/private/tmp/child', '/var/folders', '/private/var/folders', '/Volumes'])
        expect(() => sandboxPolicy({ ...input, runtimeReads: [path] }), path).toThrow('overlaps the protected');
});

test('the filesystem must show each input where it says it is: no link, no missing snapshot', () => {
    const { base, run, input } = sandboxWorld();
    expect(() => checkPolicyInputs(input)).not.toThrow();
    const real = join(base, 'real-tool'), alias = join(base, 'alias-tool');
    mkdirSync(real); symlinkSync(real, alias);
    expect(() => checkPolicyInputs({ ...input, runtimeReads: [alias] })).toThrow('is a link');
    expect(() => checkPolicyInputs({ ...input, executables: ['/usr/lib'] })).toThrow('must be a regular file');
    expect(() => checkPolicyInputs({ ...input, executables: [join(base, 'missing')] })).toThrow('cannot be read');
    expect(() => checkPolicyInputs({ ...input, scratch: [join(run.root, 'missing')] })).toThrow('cannot be read');
    // A real folder reached through a linked parent is still somewhere else.
    const holder = join(base, 'holder'), linkedHolder = join(base, 'linked-holder');
    mkdirSync(join(holder, 'lib'), { recursive: true }); symlinkSync(holder, linkedHolder);
    expect(() => checkPolicyInputs({ ...input, runtimeReads: [join(linkedHolder, 'lib')] })).toThrow('resolves elsewhere');
    const scratchFile = join(run.root, 'scratch-file');
    writeFileSync(scratchFile, 'not a folder');
    expect(() => checkPolicyInputs({ ...input, scratch: [scratchFile] })).toThrow('must be a directory');
    renameSync(snapshotPath(run), `${snapshotPath(run)}-moved`);
    writeFileSync(snapshotPath(run), 'not a folder');
    expect(() => checkPolicyInputs(input)).toThrow(`${snapshotPath(run)} must be a directory`);
    unlinkSync(snapshotPath(run));
    symlinkSync(`${snapshotPath(run)}-moved`, snapshotPath(run));
    expect(() => checkPolicyInputs(input)).toThrow('is a link');
});

test('two runs under the same policy share their rules and differ in their concrete files', () => {
    const first = sandboxWorld();
    const second = createRunDirectories(first.paths, randomUUID());
    mkdirSync(snapshotPath(second), { mode: 0o700 });
    const a = sandboxPolicy(first.input), b = sandboxPolicy({ ...first.input, run: second });
    expect(relativeRules(a, first.run)).toBe(relativeRules(b, second));
    expect(serializePolicy(a)).not.toBe(serializePolicy(b));
    // Any change outside the run's own paths changes the rules.
    expect(relativeRules(sandboxPolicy({ ...first.input, runtimeReads: ['/usr/share'] }), first.run)).not.toBe(relativeRules(a, first.run));
});

test('protected paths stay fixed even under one allocation, while approved scratch moves', () => {
    const { paths, run, input } = sandboxWorld(), second = createRunDirectories(paths, randomUUID());
    const fixed = join(run.root, 'protected', '<run>');
    const protectedRoots = { ...input.protectedRoots, checkouts: [fixed] };
    const scratch = [join(run.root, 'scratch')], secondScratch = [join(second.root, 'scratch')];
    const a = sandboxPolicy({ ...input, protectedRoots, scratch });
    const b = sandboxPolicy({ ...input, protectedRoots, run: second, scratch: secondScratch });
    const rules = relativeRules(a, run, scratch);
    expect(JSON.parse(rules).filesystem.denyRead).toContainEqual(literal(fixed));
    expect(rules).toBe(relativeRules(b, second, secondScratch));
    expect(expandRules(rules, run)).toBe(serializePolicy(a));
    expect(expandRules(rules, second)).toBe(serializePolicy(b));
    const moved = { ...protectedRoots, checkouts: [join(second.root, 'protected', '<run>')] };
    expect(relativeRules(sandboxPolicy({ ...input, protectedRoots: moved, run: second, scratch: secondScratch }), second, secondScratch)).not.toBe(rules);
});

test('protected paths must have physical spellings, even when the final component is absent', () => {
    const { base, input } = sandboxWorld();
    const target = join(base, 'protected'), alias = join(base, 'protected-link');
    mkdirSync(target);
    symlinkSync(target, alias);
    const missing = join(target, 'missing');
    expect(() => checkPolicyInputs({ ...input, protectedRoots: { ...input.protectedRoots, sessionStores: [missing] } })).not.toThrow();
    const linked = join(alias, 'missing');
    for (const edit of [{ officeData: linked }, { checkoutData: linked }, { checkouts: [linked] }, { sessionStores: [linked] }])
        expect(() => checkPolicyInputs({ ...input, protectedRoots: { ...input.protectedRoots, ...edit } })).toThrow(`The protected ${linked} resolves elsewhere`);
});

test('a readable path inside a protected store beneath a home is refused, though a narrow file beneath a home may be opened', () => {
    const { input } = sandboxWorld();
    const protectedRoots = { ...input.protectedRoots, sessionStores: ['/Users/someone/.claude', '/Users/someone/.codex'] };
    expect(() => sandboxPolicy({ ...input, protectedRoots, runtimeReads: ['/Users/someone/.local/share/claude/versions/2.1.328'] })).not.toThrow();
    expect(() => sandboxPolicy({ ...input, protectedRoots, runtimeReads: ['/Users/someone/.claude/settings.json'] })).toThrow('overlaps the protected /Users/someone/.claude');
});

test('expanding rules moves only allocation-relative entries; anything else in them stays as written', () => {
    const { run, input } = sandboxWorld();
    const rules = JSON.parse(relativeRules(sandboxPolicy(input), run));
    rules.filesystem.allowWrite.push({ path: '/elsewhere/absolute', literal: true });
    expect(JSON.parse(expandRules(JSON.stringify(rules), run)).filesystem.allowWrite).toContainEqual({ path: '/elsewhere/absolute', literal: true });
});
