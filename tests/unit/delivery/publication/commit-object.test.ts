import { expect, test } from 'vitest';
import { commitOid, parseCommit, withFinalLF } from '../../../../server/delivery/publication/commit-object';

const RAW = 'tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\nparent 1111111111111111111111111111111111111111\nauthor A <a@x> 1700000000 +0000\ncommitter A <a@x> 1700000000 +0000\n\ndocs: x [skip release]\n';

test('a commit identity is SHA-1 over its framed bytes, and parsing keeps every byte', () => {
    // `git hash-object -t commit --stdin` of RAW.
    expect(commitOid(RAW)).toBe('f87fec137062d4178b0dd9d1355d2622160a3cf7');
    // A lossy read of non-UTF-8 bytes cannot reproduce the identity of the object Git stored.
    expect(commitOid(Buffer.from(RAW.replace('A <a@x>', 'Jos\u00e9 <a@x>'), 'latin1').toString('utf8'))).not.toBe(commitOid(RAW.replace('A <a@x>', 'Jos\u00e9 <a@x>')));
    const commit = parseCommit(commitOid(RAW), RAW);
    expect(commit).toMatchObject({ tree: '4b825dc642cb6eb9a060e54bf8d69288fbee4904', parents: ['1'.repeat(40)], message: 'docs: x [skip release]\n', signed: false });
    expect(`${commit.headers}\n\n${commit.message}`).toBe(RAW);
    expect(parseCommit('x', RAW.replace('committer', 'gpgsig -----BEGIN-----\n -----END-----\ncommitter')).signed).toBe(true);
    expect(withFinalLF('a')).toBe('a\n');
    expect(withFinalLF('a\n')).toBe('a\n');
});
