import { expect, test } from 'vitest';
import { renderPlist } from '../../../server/release/render-plist';

const DATA = '/Users/x/office/.local', FROM = 'a'.repeat(40), TO = 'b'.repeat(40), dir = (commit: string) => `${DATA}/releases/${commit}`;
const plist = (over: Record<string, unknown> = {}) => ({
    KeepAlive: true, Label: 'com.jfusco.living-office', RunAtLoad: true, ThrottleInterval: 30,
    StandardOutPath: `${DATA}/service/stdout.log`, StandardErrorPath: `${DATA}/service/stderr.log`,
    WorkingDirectory: dir(FROM),
    ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', `${dir(FROM)}/server/index.ts`],
    EnvironmentVariables: { OFFICE_DATA_ROOT: DATA, PATH: `${dir(FROM)}/node_modules/.bin:/Users/x/office/node_modules/.bin:/usr/bin`, OTHER: 'kept' },
    ...over,
});

test('only the working directory, the entry and the release PATH entry move to the target', () => {
    const current = plist(), rendered = renderPlist(current, TO);
    expect(rendered).toEqual(plist({
        WorkingDirectory: dir(TO),
        ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', `${dir(TO)}/server/index.ts`],
        EnvironmentVariables: { OFFICE_DATA_ROOT: DATA, PATH: `${dir(TO)}/node_modules/.bin:/Users/x/office/node_modules/.bin:/usr/bin`, OTHER: 'kept' },
    }));
    expect(current).toEqual(plist());
});

test('rendering the release already running returns an equal plist', () => {
    expect(renderPlist(plist(), FROM)).toEqual(plist());
});

test('a plain `node SCRIPT` service and one without PATH render too', () => {
    const rendered = renderPlist(plist({ ProgramArguments: ['/usr/local/bin/node', `${dir(FROM)}/server/index.ts`], EnvironmentVariables: { OFFICE_DATA_ROOT: DATA } }), TO);
    expect(rendered.ProgramArguments).toEqual(['/usr/local/bin/node', `${dir(TO)}/server/index.ts`]);
    expect(rendered.EnvironmentVariables).toEqual({ OFFICE_DATA_ROOT: DATA });
});

test('an explicit Node Program stays in the rendered plist', () => {
    const current = plist({ Program: '/usr/local/bin/node' });
    expect(renderPlist(current, TO).Program).toBe('/usr/local/bin/node');
});

test.each([
    ['runs from the checkout', { WorkingDirectory: '/Users/x/office' }],
    ['sets no data root', { EnvironmentVariables: { PATH: '/usr/bin' } }],
    ['carries extra arguments', { ProgramArguments: ['/usr/local/bin/node', `${dir(FROM)}/server/index.ts`, '--flag'] }],
    ['has another label', { Label: 'com.example.other' }],
    ['runs a different executable', { ProgramArguments: ['/bin/echo', '--import', 'tsx', `${dir(FROM)}/server/index.ts`] }],
    ['selects a different executable via Program', { Program: '/bin/echo' }],
])('a service that %s is refused', (_, over) => {
    expect(() => renderPlist(plist(over), TO)).toThrow('does not run a release');
});

test.each([
    ['another path into the release', { StandardOutPath: `${dir(FROM)}/stdout.log` }],
    ['a differently spelled path into the release', { StandardOutPath: `${DATA}//releases/${FROM}/stdout.log` }],
    ['a relative path into the release', { StandardErrorPath: `.local/releases/${FROM}/stderr.log` }],
])('%s is refused, because the commit would stay behind', (_, over) => {
    expect(() => renderPlist(plist(over), TO)).toThrow('does not know how to move');
});

test('the release commit in another environment value, or a second release PATH entry, is refused', () => {
    const env = (extra: Record<string, string>) => plist({ EnvironmentVariables: { OFFICE_DATA_ROOT: DATA, PATH: `${dir(FROM)}/node_modules/.bin:/usr/bin`, ...extra } });
    expect(() => renderPlist(env({ OFFICE_RELEASE_COMMIT: FROM }), TO)).toThrow('does not know how to move');
    expect(() => renderPlist(env({ OFFICE_RELEASE_COMMIT: FROM }), FROM)).toThrow('does not know how to move');
    expect(() => renderPlist(env({ NODE_PATH: `${dir(FROM)}/node_modules` }), TO)).toThrow('does not know how to move');
    expect(() => renderPlist(env({ PATH: `${dir(FROM)}/node_modules/.bin:${dir(FROM)}/bin` }), TO)).toThrow('does not know how to move');
});

test('a PATH segment relative to the controller is not the service bin entry', () => {
    const dataRoot = process.cwd(), from = `${dataRoot}/releases/${FROM}`;
    const current = plist({
        WorkingDirectory: from,
        ProgramArguments: ['/usr/local/bin/node', `${from}/server/index.ts`],
        EnvironmentVariables: { OFFICE_DATA_ROOT: dataRoot, PATH: `releases/${FROM}/node_modules/.bin:/usr/bin` },
    });
    expect(() => renderPlist(current, TO)).toThrow('does not know how to move');
});

test('a PATH segment relative to the service can be its own bin entry', () => {
    const current = plist({ EnvironmentVariables: { OFFICE_DATA_ROOT: DATA, PATH: 'node_modules/.bin:/usr/bin' } });
    expect(renderPlist(current, TO).EnvironmentVariables).toEqual({ OFFICE_DATA_ROOT: DATA, PATH: `${dir(TO)}/node_modules/.bin:/usr/bin` });
});

test('a relative data root or working directory is refused', () => {
    expect(() => renderPlist(plist({ WorkingDirectory: `.local/releases/${FROM}`, ProgramArguments: ['/usr/local/bin/node', 'server/index.ts'], EnvironmentVariables: { OFFICE_DATA_ROOT: '.local' } }), TO)).toThrow('must be absolute');
});

test('an abbreviated target commit is refused', () => {
    expect(() => renderPlist(plist(), 'b'.repeat(7))).toThrow('full 40-character commit SHA');
});
