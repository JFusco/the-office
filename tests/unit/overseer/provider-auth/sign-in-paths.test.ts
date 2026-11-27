import { chmodSync, closeSync, fstatSync, linkSync, mkdirSync, openSync, readSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { readOwnedFile, readRunFile, readSignIn, signInPaths, TOKEN_MAX_BYTES, type ReadFiles } from '../../../../server/overseer/provider-auth/sign-in-paths';
import { validateRunnerRoot } from '../../../../server/overseer/runner-root';
import { tempDir } from '../runner-world';

const SECRET = 'sk-synthetic-token-0123456789';

/** A runner root with both enrolled sign-ins, exactly as the runner requires them. */
function enrolled(token = `${SECRET}\n`, auth = '{"synthetic":true}') {
    const paths = validateRunnerRoot(join(tempDir(), 'runner'), {}), where = signInPaths(paths);
    mkdirSync(paths.root, { mode: 0o700, recursive: true });
    for (const folder of [where.providers, where.claude, where.codex]) { mkdirSync(folder, { mode: 0o700 }); chmodSync(folder, 0o700); }
    writeFileSync(where.claudeToken, token, { mode: 0o600 });
    writeFileSync(where.codexAuth, auth, { mode: 0o600 });
    chmodSync(where.claudeToken, 0o600);
    chmodSync(where.codexAuth, 0o600);
    return { paths, where };
}
const fault = (read: ReturnType<typeof readSignIn>) => read.ok ? 'ok' : read.fault;

test('an enrolled sign-in is read whole, and its folders are derived beneath the validated root', () => {
    const { paths, where } = enrolled();
    expect(where).toEqual({
        providers: join(paths.root, 'providers'), claude: join(paths.root, 'providers', 'claude'), claudeToken: join(paths.root, 'providers', 'claude', 'oauth-token'),
        codex: join(paths.root, 'providers', 'codex'), codexAuth: join(paths.root, 'providers', 'codex', 'auth.json'), status: join(paths.state, 'providers.json'),
    });
    const claude = readSignIn(paths, 'claude'), codex = readSignIn(paths, 'codex');
    expect(claude.ok && claude.bytes.toString()).toBe(`${SECRET}\n`);
    expect(codex.ok && codex.bytes.toString()).toBe('{"synthetic":true}');
});

test('a missing, linked, hard-linked, piped or mis-moded sign-in is refused, and no refusal shows its bytes', () => {
    const cases: [string, (where: ReturnType<typeof signInPaths>) => void, string][] = [
        ['missing', where => execFileSync('rm', [where.claudeToken]), 'missing'],
        ['mode 0644', where => chmodSync(where.claudeToken, 0o644), 'wrong-mode'],
        ['linked leaf', where => { const other = join(tempDir(), 'token'); writeFileSync(other, SECRET, { mode: 0o600 }); execFileSync('rm', [where.claudeToken]); symlinkSync(other, where.claudeToken); }, 'linked'],
        ['hard link', where => linkSync(where.claudeToken, join(where.claude, 'second-name')), 'linked'],
        ['pipe', where => { execFileSync('rm', [where.claudeToken]); execFileSync('mkfifo', ['-m', '600', where.claudeToken]); }, 'not-regular'],
        ['open folder', where => chmodSync(where.claude, 0o755), 'not-contained'],
        ['open providers', where => chmodSync(where.providers, 0o750), 'not-contained'],
        ['linked folder', where => { const other = join(tempDir(), 'claude'); mkdirSync(other, { mode: 0o700 }); execFileSync('rm', ['-r', where.claude]); symlinkSync(other, where.claude); }, 'not-contained'],
        ['oversized', where => writeFileSync(where.claudeToken, 'x'.repeat(TOKEN_MAX_BYTES + 1)), 'oversized'],
    ];
    for (const [name, damage, expected] of cases) {
        const { paths, where } = enrolled();
        damage(where);
        const read = readSignIn(paths, 'claude');
        expect(fault(read), name).toBe(expected);
        expect(JSON.stringify(read), name).not.toContain(SECRET);
    }
});

test('a foreign owner is refused, and a stale reported size cannot let a growing file past the limit', () => {
    const { paths } = enrolled('x'.repeat(TOKEN_MAX_BYTES + 10));
    expect(fault(readSignIn(paths, 'claude', { uid: (process.getuid?.() ?? 0) + 1 }))).toBe('not-contained');
    const { paths: other, where } = enrolled();
    const uid = process.getuid?.() ?? 0;
    expect(fault(readSignIn(other, 'claude', { uid }))).toBe('ok');
    writeFileSync(where.claudeToken, 'x'.repeat(TOKEN_MAX_BYTES + 10));
    const stale: ReadFiles = { open: openSync, fstat: (fd => Object.assign(fstatSync(fd), { size: 10 })) as typeof fstatSync, read: readSync, close: closeSync };
    expect(fault(readSignIn(other, 'claude', { files: stale }))).toBe('oversized');
});

test('a run file is read only when physically inside its root and runner-owned', () => {
    const root = tempDir(), inside = join(root, 'provider'), outside = tempDir();
    mkdirSync(inside);
    writeFileSync(join(inside, 'auth.json'), '{}');
    writeFileSync(join(outside, 'auth.json'), '{}');
    expect(readRunFile(join(inside, 'auth.json'), root, 1024).ok).toBe(true);
    expect(fault(readRunFile(join(outside, 'auth.json'), root, 1024))).toBe('not-contained');
    symlinkSync(outside, join(root, 'escape'));
    expect(fault(readRunFile(join(root, 'escape', 'auth.json'), root, 1024))).toBe('not-contained');
    expect(fault(readRunFile(join(inside, 'absent.json'), root, 1024))).toBe('missing');
    expect(fault(readRunFile(join(inside, 'auth.json'), root, 1))).toBe('oversized');
});

test('the paths must be the validated root\'s own, a foreign owner is named as such, and the size check refuses before reading', () => {
    const { paths, where } = enrolled();
    expect(() => signInPaths({ ...paths, providers: '/elsewhere/providers' })).toThrow('is not under the runner root');
    const uid = process.getuid?.() ?? 0;
    expect(readOwnedFile(where.claudeToken, TOKEN_MAX_BYTES, { uid: uid + 1, mode: 0o600 })).toMatchObject({ ok: false, fault: 'wrong-owner' });
    writeFileSync(where.claudeToken, 'x'.repeat(TOKEN_MAX_BYTES + 1));
    let reads = 0;
    const counted: ReadFiles = { open: openSync, fstat: fstatSync, close: closeSync, read: ((...args: Parameters<typeof readSync>) => { reads++; return (readSync as (...a: unknown[]) => number)(...args); }) as typeof readSync };
    expect(readOwnedFile(where.claudeToken, TOKEN_MAX_BYTES, { uid, mode: 0o600, files: counted })).toMatchObject({ ok: false, fault: 'oversized' });
    expect(reads).toBe(0);
});
