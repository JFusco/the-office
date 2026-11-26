import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { afterEach, expect, test, vi } from 'vitest';
import { createRunDirectories, type RunDirectories } from '../../../server/overseer/run-directories';
import { validateRunnerRoot } from '../../../server/overseer/runner-root';
import { PROVIDER_DIRECTORY, PROVIDER_SETTINGS, RESERVED_NAMES, workerEnvironment } from '../../../server/overseer/worker-environment';
import { command } from '../../../server/workers/process';
import { tempDir } from './runner-world';

afterEach(() => vi.unstubAllEnvs());

const SYNTHETIC = {
    GITHUB_TOKEN: 'synthetic-github', GH_TOKEN: 'synthetic-gh', JIRA_API_TOKEN: 'synthetic-jira', AZURE_DEVOPS_EXT_PAT: 'synthetic-azure',
    SLACK_BOT_TOKEN: 'synthetic-slack', SSH_AUTH_SOCK: '/synthetic/agent.sock', AWS_ACCESS_KEY_ID: 'synthetic-aws', OFFICE_DATA_ROOT: '/synthetic/office',
    ANTHROPIC_API_KEY: 'synthetic-anthropic', OPENAI_API_KEY: 'synthetic-openai', CLAUDE_CONFIG_DIR: '/synthetic/claude', CODEX_HOME: '/synthetic/codex',
};
const allocate = () => {
    const paths = validateRunnerRoot(join(tempDir(), 'runner'), {});
    return { paths, run: createRunDirectories(paths, randomUUID()) };
};
const expectedEnvironments = (run: RunDirectories) => {
    const base = {
        PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8',
        HOME: run.home, TMPDIR: run.tmp, OFFICE_DATA_ROOT: run.officeData, OFFICE_NO_POLL: '1',
    };
    return {
        claude: { ...base, CLAUDE_CONFIG_DIR: run.provider },
        codex: { ...base, CODEX_HOME: run.provider },
    };
};

test('a worker environment is exactly its fixed and run-owned variables, whatever the runner holds', () => {
    for (const [name, value] of Object.entries(SYNTHETIC)) vi.stubEnv(name, value);
    const { paths, run } = allocate();
    const expected = expectedEnvironments(run);
    for (const provider of ['claude', 'codex'] as const) {
        const actual = workerEnvironment({ paths, provider, run });
        expect(isDeepStrictEqual(actual, expected[provider]), provider).toBe(true);
    }
    expect(() => workerEnvironment({ paths, provider: 'gemini' as never, run })).toThrow('Unknown worker provider');
});

test('only a setting in the provider table is accepted, and the table never names a variable the environment sets', () => {
    const { paths, run } = allocate();
    for (const provider of ['claude', 'codex'] as const) {
        expect(() => workerEnvironment({ paths, provider, run, settings: { DISABLE_AUTOUPDATER: '1' } })).toThrow('is not a setting');
        expect(() => workerEnvironment({ paths, provider, run, settings: { HOME: '/Users/someone' } })).toThrow('is not a setting');
        expect(PROVIDER_SETTINGS[provider].filter(name => (RESERVED_NAMES as readonly string[]).includes(name))).toEqual([]);
    }
    expect(RESERVED_NAMES).toEqual(expect.arrayContaining([...Object.values(PROVIDER_DIRECTORY), 'CLAUDE_CODE_TMPDIR']));
});

test('a run that is not this runner\'s allocation is refused', () => {
    const { paths, run } = allocate();
    // A correct layout under a folder that is not the runner's runs folder.
    const foreign = join(tempDir(), run.id);
    for (const child of ['home', 'tmp', 'provider', 'office-data']) mkdirSync(join(foreign, child), { recursive: true, mode: 0o700 });
    const forged = { id: run.id, root: foreign, home: join(foreign, 'home'), tmp: join(foreign, 'tmp'), provider: join(foreign, 'provider'), officeData: join(foreign, 'office-data') };
    expect(() => workerEnvironment({ paths, provider: 'claude', run: forged })).toThrow('root is');
    expect(() => workerEnvironment({ paths, provider: 'claude', run: { ...run, id: randomUUID() } })).toThrow('root is');
    expect(() => workerEnvironment({ paths, provider: 'claude', run: { ...run, home: 'home' } })).toThrow('home is');
    expect(() => workerEnvironment({ paths, provider: 'claude', run: { ...run, officeData: run.provider } })).toThrow('officeData is');
    renameSync(run.home, `${run.home}-moved`);
    symlinkSync(`${run.home}-moved`, run.home);
    expect(() => workerEnvironment({ paths, provider: 'claude', run })).toThrow(`${run.home} must be a directory, not a link or a file`);
});

/** Compares inside the child and prints only the answer, so a broken replacement cannot print the runner's variables. */
const MATCH = `
    const { isDeepStrictEqual } = require('node:util');
    const want = JSON.parse(process.argv[1]);
    const got = { ...process.env };
    const { __CF_USER_TEXT_ENCODING: selfSet, ...rest } = got;
    const match = isDeepStrictEqual(got, want) ||
        (process.platform === 'darwin' && /^0x[0-9A-F]+:0x[0-9A-F]+:0x[0-9A-F]+$/.test(selfSet ?? '') &&
            isDeepStrictEqual(rest, want));
    process.stdout.write(match ? 'match' : 'mismatch');
`;

test('a child started with a worker environment sees exactly that environment', async () => {
    for (const [name, value] of Object.entries(SYNTHETIC)) vi.stubEnv(name, value);
    const { paths, run } = allocate();
    const expected = expectedEnvironments(run);
    for (const provider of ['claude', 'codex'] as const) {
        const replaceEnv = workerEnvironment({ paths, provider, run });
        const args = ['-e', MATCH, JSON.stringify(expected[provider])];
        expect(await command(process.execPath, args, { replaceEnv, readOnly: true }), provider).toBe('match');
        // The same child under the service's own environment does not match: the probe can tell.
        expect(await command(process.execPath, args, { readOnly: true }), provider).toBe('mismatch');
    }
});
