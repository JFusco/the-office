import { execFileSync } from 'node:child_process';
import { closeSync, constants, fstatSync, mkdirSync, openSync, readSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ENTRY_MAX_BYTES, ENTRY_MAX_COUNT, loadPlaybook, type PlaybookFiles } from '../../../../server/overseer/playbook/load';
import { tempDir } from '../runner-world';
import { entryText, installation } from './playbook-world';

/** The real calls, but an open without O_NONBLOCK fails at once instead of waiting on a pipe. */
const nonblocking: PlaybookFiles = {
    open: ((path: string, flags: number) => {
        if (!(flags & constants.O_NONBLOCK) || !(flags & constants.O_NOFOLLOW)) throw new Error(`opened ${path} without O_NONBLOCK and O_NOFOLLOW`);
        return openSync(path, flags);
    }) as typeof openSync,
    realpath: path => realpathSync(path), fstat: fstatSync, read: readSync, close: closeSync,
};
const refusal = (root: string, files = nonblocking) => {
    const load = loadPlaybook(root, files);
    if (load.ok) throw new Error('the playbook loaded');
    return load;
};

test('a whole, valid playbook loads sorted by id; a README alone is an empty playbook', () => {
    const { root } = installation({ 'b.md': entryText({ id: 'b' }), 'a-b.md': entryText({ id: 'a-b' }), 'a.md': entryText({ id: 'a' }) });
    const load = loadPlaybook(root, nonblocking);
    expect(load.ok && load.entries.map(entry => entry.id)).toEqual(['a', 'a-b', 'b']);
    expect(loadPlaybook(installation({}).root, nonblocking)).toEqual({ ok: true, entries: [] });
});

test('a missing playbook, a missing README and an unreadable root each refuse for their own reason', () => {
    expect(refusal(tempDir())).toMatchObject({ code: 'missing', reason: 'docs does not exist' });
    const partial = tempDir();
    mkdirSync(join(partial, 'docs', 'overseer'), { recursive: true });
    expect(refusal(partial)).toMatchObject({ code: 'missing', reason: 'docs/overseer/playbook does not exist' });
    const { root, folder } = installation();
    rmSync(join(folder, 'README.md'));
    expect(refusal(root)).toMatchObject({ code: 'malformed', reason: 'README.md is missing' });
    expect(refusal(join(tempDir(), 'absent'))).toMatchObject({ code: 'unreadable' });
});

test('a link at any folder of the path refuses, naming that folder, even when it leads to a valid playbook', () => {
    for (const [index, component] of ['docs', 'docs/overseer', 'docs/overseer/playbook'].entries()) {
        const outside = installation(), root = tempDir();
        const parts = component.split('/');
        mkdirSync(join(root, ...parts.slice(0, -1)), { recursive: true });
        symlinkSync(join(outside.root, ...parts), join(root, ...parts));
        expect(loadPlaybook(outside.root, nonblocking).ok, component).toBe(true);
        expect(refusal(root), component).toMatchObject({ code: 'containment', reason: `${component} must be a directory inside the installation, not a link or a file` });
        expect(index).toBe(['docs', 'docs/overseer', 'docs/overseer/playbook'].indexOf(component));
    }
    const { root } = installation();
    rmSync(join(root, 'docs', 'overseer', 'playbook'), { recursive: true });
    writeFileSync(join(root, 'docs', 'overseer', 'playbook'), 'not a folder');
    expect(refusal(root)).toMatchObject({ code: 'containment', reason: 'docs/overseer/playbook must be a directory inside the installation, not a link or a file' });
});

test('a linked entry or README, a folder and a pipe never load, and a pipe never blocks', () => {
    const target = join(tempDir(), 'elsewhere.md');
    writeFileSync(target, entryText({ id: 'elsewhere' }));
    for (const name of ['linked.md', 'README.md']) {
        const { root, folder } = installation();
        rmSync(join(folder, name), { force: true });
        symlinkSync(target, join(folder, name));
        expect(refusal(root), name).toMatchObject({ code: 'containment', reason: `${name} is a link` });
    }
    for (const name of ['piped.md', 'README.md']) {
        const { root, folder } = installation();
        rmSync(join(folder, name), { force: true });
        execFileSync('mkfifo', [join(folder, name)]);
        expect(refusal(root), name).toMatchObject({ code: 'malformed', reason: `${name} is not a regular file` });
    }
    const { root, folder } = installation();
    mkdirSync(join(folder, 'nested.md'));
    expect(refusal(root)).toMatchObject({ code: 'malformed', reason: 'nested.md is not a regular file' });
});

test('names, encoding, count and one bad entry among good ones each refuse the whole playbook', () => {
    for (const name of ['Upper.md', 'notes.txt', 'a_b.md', '.hidden.md', 'sub']) {
        expect(refusal(installation({ 'a.md': entryText({ id: 'a' }), [name]: entryText() }).root).reason, name).toContain('is not an entry name');
    }
    const { root, folder } = installation({ 'a.md': entryText({ id: 'a' }) });
    writeFileSync(join(folder, 'b.md'), Buffer.from([0x2d, 0x2d, 0x2d, 0x0a, 0xff, 0x0a]));
    expect(refusal(root)).toMatchObject({ code: 'malformed', reason: 'b.md is not UTF-8' });
    // A byte-order mark is kept by the decoder, so the entry's framing refuses it.
    writeFileSync(join(folder, 'b.md'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(entryText({ id: 'b' }))]));
    expect(refusal(root)).toMatchObject({ code: 'malformed', reason: expect.stringMatching(/^b\.md: an entry is frontmatter only/) });
    const many = (count: number) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`e${i}.md`, entryText({ id: `e${i}` })]));
    expect(ENTRY_MAX_COUNT).toBe(64);
    const full = loadPlaybook(installation(many(64)).root, nonblocking);
    expect(full.ok && full.entries).toHaveLength(64);
    expect(refusal(installation(many(65)).root)).toMatchObject({ code: 'malformed', reason: 'the playbook has more than 64 entries' });
    expect(refusal(installation({ 'a.md': entryText({ id: 'a' }), 'b.md': entryText({ id: 'a' }) }).root).reason).toContain('b.md: the id must equal the file name');
    expect(refusal(installation({ 'a.md': entryText({ id: 'a' }), 'b.md': entryText({ id: 'b', revision: 0 }) }).root)).toMatchObject({ code: 'malformed', reason: expect.stringMatching(/^b\.md: revision/) });
});

test('the size check refuses an oversized file before reading it, and the read cap refuses one whose reported size is stale', () => {
    const big = `${entryText({ id: 'big' }).slice(0, -4)}# ${'x'.repeat(ENTRY_MAX_BYTES)}\n---\n`;
    let reads = 0;
    const counted = (files: PlaybookFiles): PlaybookFiles => ({ ...files, read: ((...args: Parameters<typeof readSync>) => { reads++; return (files.read as (...a: unknown[]) => number)(...args); }) as typeof readSync });
    expect(refusal(installation({ 'big.md': big }).root, counted(nonblocking))).toMatchObject({ code: 'malformed', reason: `big.md is larger than ${ENTRY_MAX_BYTES} bytes` });
    expect(reads).toBe(0);
    const stale: PlaybookFiles = { ...nonblocking, fstat: ((fd: number) => Object.assign(fstatSync(fd), { size: 10 })) as typeof fstatSync };
    expect(refusal(installation({ 'big.md': big }).root, counted(stale))).toMatchObject({ code: 'malformed', reason: `big.md is larger than ${ENTRY_MAX_BYTES} bytes` });
    expect(reads).toBeGreaterThan(0);
    // Short reads are accumulated: a reader that returns one byte at a time still yields the whole entry.
    const trickle: PlaybookFiles = { ...nonblocking, read: ((fd: number, buffer: Buffer, offset: number) => readSync(fd, buffer, offset, 1, null)) as typeof readSync };
    const load = loadPlaybook(installation().root, trickle);
    expect(load.ok && load.entries.map(entry => entry.id)).toEqual(['cite-decisive-line']);
});

test('a file that cannot be opened or read refuses as unreadable, and every descriptor opened is closed once', () => {
    const opened: number[] = [], closed: number[] = [];
    const tracking: PlaybookFiles = {
        ...nonblocking,
        open: ((path: string, flags: number) => { const fd = (nonblocking.open as (p: string, f: number) => number)(path, flags); opened.push(fd); return fd; }) as typeof openSync,
        close: ((fd: number) => { closed.push(fd); closeSync(fd); }) as typeof closeSync,
    };
    expect(loadPlaybook(installation({ 'a.md': entryText({ id: 'a' }), 'b.md': entryText({ id: 'b' }) }).root, tracking).ok).toBe(true);
    expect(opened).toHaveLength(3);
    const failing: PlaybookFiles = { ...tracking, read: (() => { throw Object.assign(new Error('EIO'), { code: 'EIO' }); }) as typeof readSync };
    expect(refusal(installation().root, failing)).toMatchObject({ code: 'unreadable', reason: 'cite-decisive-line.md cannot be read (EIO)' });
    const notFile: PlaybookFiles = { ...tracking, fstat: ((fd: number) => Object.assign(fstatSync(fd), { isFile: () => false })) as typeof fstatSync };
    expect(refusal(installation().root, notFile)).toMatchObject({ code: 'malformed', reason: 'README.md is not a regular file' });
    expect(opened).toHaveLength(6);
    expect(closed).toEqual(opened);
    const denied: PlaybookFiles = { ...tracking, open: (() => { throw Object.assign(new Error('EACCES'), { code: 'EACCES' }); }) as typeof openSync };
    expect(refusal(installation().root, denied)).toMatchObject({ code: 'unreadable', reason: 'README.md cannot be opened (EACCES)' });
});

test('a playbook folder that resolves outside the installation after the walk refuses, and an unreadable root is not a missing playbook', () => {
    const { root, folder } = installation(), elsewhere = installation().folder;
    const moved: PlaybookFiles = { ...nonblocking, realpath: path => path === folder ? elsewhere : realpathSync(path) };
    expect(refusal(root, moved)).toMatchObject({ code: 'containment', reason: 'the playbook folder is not inside the installation' });
    const broken: PlaybookFiles = { ...nonblocking, realpath: path => { if (path === root) throw Object.assign(new Error('EACCES'), { code: 'EACCES' }); return realpathSync(path); } };
    expect(refusal(root, broken)).toMatchObject({ code: 'unreadable', reason: 'the installation root cannot be read (EACCES)' });
});
