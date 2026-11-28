import { afterEach, expect, test } from 'vitest';
import { assertQualifiedLaunch, controlCoverage, currentPin, HOST_ENVIRONMENT, LaunchQualificationRefusal, MAINTENANCE_PROVIDER_PINS, policiesQualified, registeredPinPaths, substitute } from '../../../server/workers/launch-qualification';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { installRefusal } from '../../../server/workers/qualification/qualification-install';
import { codexReaderTemplate } from '../../../server/workers/codex-maintenance-arguments';
import { REQUIRED_CONTROLS } from '../../../server/workers/qualification/required-controls';
import { liveReach } from '../../../server/workers/live-reach';
import { dataRoot, fakeEnvironment, install, passingRecord } from './qualification/support';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const SESSION = '0f8fad5b-d9cb-469f-a165-70867728950e';

function launch(root: string, overrides: Partial<Parameters<typeof assertQualifiedLaunch>[0]> = {}) {
    const template = codexReaderTemplate(), bindings = { session: SESSION, schemaPath: `${root}/schema.json`, cwd: '/repo', model: 'gpt', effort: 'high' };
    return { dataRoot: root, stage: 'vendor-review', policy: 'codex-reader', provider: 'codex' as const, executablePath: currentPin('codex').path,
        template, args: template.arguments.map(arg => substitute(arg, bindings)), settings: template.settings, bindings,
        harness: { session: SESSION, schemaPath: `${root}/schema.json`, cwd: '/repo' }, ...overrides };
}
const refusal = (fn: () => unknown) => { try { fn(); } catch (error) { return error as LaunchQualificationRefusal; } throw new Error('not refused'); };

test('the pin table names both exact paths, one current per provider, and feeds the guard', () => {
    expect(MAINTENANCE_PROVIDER_PINS.map(pin => pin.path)).toEqual(['/Users/joe.fusco/.local/share/claude/versions/2.1.332', '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex']);
    expect(currentPin('claude').version).toBe('2.1.332');
    expect(currentPin('codex').version).toBe('0.171.0-alpha.13.2');
    expect(registeredPinPaths()).toEqual(MAINTENANCE_PROVIDER_PINS.map(pin => pin.path));
});

test('every canonical executable a record can authorize is a literal guard default, independent of what is installed', () => {
    for (const pin of MAINTENANCE_PROVIDER_PINS) {
        expect(pin.canonical.length, pin.provider).toBeGreaterThan(0);
        for (const path of pin.canonical) {
            expect(registeredPinPaths()).toContain(path);
            expect(liveReach(path, ['--version'])).toMatch(/live provider CLI/);
        }
    }
});

test('a record whose verified realpath is not a registered canonical path for its provider is refused at launch', () => {
    const root = dataRoot(cleanup), record = passingRecord(codexReaderTemplate(), ['vendor-review']);
    // The host resolves the pin to an unregistered binary and the record binds exactly that binary and digest.
    install(root, { ...record, executable: { ...record.executable, realpath: '/opt/elsewhere/codex' } }, 'codex-reader');
    const failure = refusal(() => assertQualifiedLaunch(launch(root), fakeEnvironment({ realpath: '/opt/elsewhere/codex' })));
    expect(failure).toBeInstanceOf(LaunchQualificationRefusal);
    expect(failure.mismatch).toMatch(/not a registered canonical path for codex/);
    expect(policiesQualified(root, [{ policy: 'codex-reader', stage: 'vendor-review' }], fakeEnvironment({ realpath: '/opt/elsewhere/codex' }))?.mismatch).toMatch(/not a registered canonical path/);
});

test('a matching record admits the exact invocation for any fresh session; nothing else does', () => {
    const root = dataRoot(cleanup); install(root, passingRecord(codexReaderTemplate(), ['vendor-review']), 'codex-reader');
    expect(assertQualifiedLaunch(launch(root), fakeEnvironment()).policy).toBe('codex-reader');
    const other = '6f9619ff-8b86-4d01-b42d-00cf4fc964ff';
    const second = launch(root); second.bindings = { ...second.bindings, session: other }; second.harness = { ...second.harness, session: other };
    expect(assertQualifiedLaunch(second, fakeEnvironment()).policy).toBe('codex-reader');
    const cases: [string, () => unknown][] = [
        ['no qualification record', () => assertQualifiedLaunch(launch(dataRoot(cleanup)), fakeEnvironment())],
        ['binary digest changed', () => assertQualifiedLaunch(launch(root), fakeEnvironment({ sha256: 'e'.repeat(64) }))],
        ['resolves to', () => assertQualifiedLaunch(launch(root), fakeEnvironment({ realpath: '/elsewhere/codex' }))],
        ['managed configuration', () => assertQualifiedLaunch(launch(root), fakeEnvironment({ managed: 'd'.repeat(64) }))],
        ['another host', () => assertQualifiedLaunch(launch(root), fakeEnvironment({ host: { hostname: 'x', platform: 'darwin', arch: 'arm64', release: '24.3.0' } }))],
        ['ordered arguments', () => assertQualifiedLaunch({ ...launch(root), args: [...launch(root).args.slice(0, -1), '--dangerously-bypass-approvals-and-sandbox', '-'] }, fakeEnvironment())],
        ['effective settings', () => assertQualifiedLaunch({ ...launch(root), settings: { sandbox: 'danger-full-access' } }, fakeEnvironment())],
        ['harness-bound cwd', () => assertQualifiedLaunch({ ...launch(root), harness: { ...launch(root).harness, cwd: '/somewhere-else' } }, fakeEnvironment())],
        ['partial qualification', () => assertQualifiedLaunch({ ...launch(root), stage: 'proposal-review' }, fakeEnvironment())],
    ];
    for (const [mismatch, call] of cases) {
        const failure = refusal(call);
        expect(failure, mismatch).toBeInstanceOf(LaunchQualificationRefusal);
        expect(failure.mismatch, mismatch).toContain(mismatch);
        expect(failure.stage).toBeTruthy();
    }
});

test('a failed or unpaired control leaves the policy unqualified; requalification installs a new matching record', () => {
    const root = dataRoot(cleanup), record = passingRecord(codexReaderTemplate(), ['vendor-review']);
    install(root, { ...record, controls: record.controls.map(control => control.id === 'github-rest-mutation' ? { ...control, result: 'failed' } : control) }, 'codex-reader');
    expect(policiesQualified(root, [{ policy: 'codex-reader', stage: 'vendor-review' }], fakeEnvironment())?.mismatch).toMatch(/github-rest-mutation failed/);
    install(root, { ...record, controls: record.controls.filter(control => control.id !== 'git-push-control-outside') }, 'codex-reader');
    expect(policiesQualified(root, [{ policy: 'codex-reader', stage: 'vendor-review' }], fakeEnvironment())?.mismatch).toMatch(/git-push-control-outside is missing/);
    install(root, record, 'codex-reader');
    expect(policiesQualified(root, [{ policy: 'codex-reader', stage: 'vendor-review' }], fakeEnvironment())).toBeUndefined();
});

test('every denial in every battery is paired with a working control of its facility', () => {
    for (const [policy, controls] of Object.entries(REQUIRED_CONTROLS)) {
        expect(new Set(controls.map(control => control.id)).size, policy).toBe(controls.length);
        expect(controlCoverage(policy, controls.map(control => ({ ...control, result: 'passed' as const, evidence: 'x' }))), policy).toBeUndefined();
    }
});

test('a null managed digest requires confirmed absence at status, install and launch', () => {
    const root = dataRoot(cleanup), template = codexReaderTemplate(), record = passingRecord(template, ['vendor-review']);
    install(root, record, 'codex-reader');
    const managed = record.managedConfiguration[0].path, localFile = resolve(root, 'managed.toml');
    const env = fakeEnvironment(), environment = { ...env, sha256: (path: string) => path === managed ? HOST_ENVIRONMENT.sha256(localFile) : env.sha256(path) };
    const status = () => policiesQualified(root, [{ policy: 'codex-reader', stage: 'vendor-review' }], environment);
    expect(environment.sha256(managed)).toBeNull();
    expect(status()).toBeUndefined();
    expect(installRefusal(record, template, environment)).toBeUndefined();
    expect(assertQualifiedLaunch(launch(root), environment).policy).toBe('codex-reader');
    // Reading a directory as a managed config produces a real I/O error on the disposable fixture.
    mkdirSync(localFile);
    const mismatch = `managed configuration ${managed} could not be read`;
    expect(status()).toMatchObject({ mismatch });
    expect(installRefusal(record, template, environment)).toBe(mismatch);
    expect(refusal(() => assertQualifiedLaunch(launch(root), environment))).toMatchObject({ name: 'LaunchQualificationRefusal', mismatch });
});
