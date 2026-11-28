import { afterEach, expect, test } from 'vitest';
import { commitOid, readSuffix } from '../../../../server/delivery/publication/commit-object';
import { localGitRunner, originalGit } from '../../../../server/delivery/publication/original-git';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { verifyReword } from '../../../../server/delivery/publication/verify-reword';
import { rewordCommits } from '../../../../server/delivery/repairs/reword-commits';
import { command } from '../../../../server/workers/process';
import { cleanupMarkerRepos, markerRepo } from '../support/marker-repo';

afterEach(cleanupMarkerRepos);

/** A base, then an unaffected prefix commit, a marked commit and a descendant. */
async function suffix() {
    const r = markerRepo(), base = r.commit({ 'a.md': 'a\n' }, 'chore(repo): base');
    r.commit({ 'b.md': 'b\n' }, 'docs(b): prefix');
    const marked = r.commit({ 'README.md': 'r\n' }, 'docs(readme): r [skip release]');
    const head = r.commit({ 'c.md': 'c\n' }, 'docs(c): after');
    const git = originalGit(command, r.repo), originals = await readSuffix(git, base, head);
    const approved = new Map([[marked, 'docs(readme): r']]);
    const offered = await rewordCommits(localGitRunner(command), r.repo, base, head, [{ sha: marked, message: 'docs(readme): r' }]);
    return { r, base, marked, head, git, originals, approved, offered };
}
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence.diagnostic ?? ''; throw error; } throw new Error('expected a refusal'); };

test('the helper\'s rewrite is verified commit by commit: same prefix, mapped parents, same trees, the approved message with one final LF', async () => {
    const s = await suffix();
    const verified = await verifyReword(s.git, s.base, s.originals, s.approved, s.offered);
    expect(verified).toMatchObject({ boundary: s.base, refusedHead: s.head, newHead: s.offered.head });
    expect(verified.mapping.map(item => item.oldHead)).toEqual(s.originals.map(commit => commit.sha));
    expect(verified.mapping[0].newHead).toBe(s.originals[0].sha);
    expect(verified.mapping.map(item => item.tree)).toEqual(s.originals.map(commit => commit.tree));
    expect(s.r.git(['cat-file', 'commit', verified.mapping[1].newHead])).toBe(s.originals[1].raw.replace('docs(readme): r [skip release]\n', 'docs(readme): r\n'));
});

test('a short, reordered or retargeted mapping, a different approved message, a wrong tip or an unwritten object stops before anything moves', async () => {
    const s = await suffix(), mapping = s.offered.mapping;
    expect(await refusal(verifyReword(s.git, s.base, s.originals, s.approved, { head: s.offered.head, mapping: mapping.slice(1) }))).toContain('mapped 2 commits for 3');
    expect(await refusal(verifyReword(s.git, s.base, s.originals, s.approved, { head: s.offered.head, mapping: [mapping[1], mapping[0], mapping[2]] }))).toContain('does not name');
    expect(await refusal(verifyReword(s.git, s.base, s.originals, s.approved, { head: s.offered.head, mapping: [mapping[0], { ...mapping[1], newHead: s.marked }, mapping[2]] }))).toContain('is not the expected rewrite');
    expect(await refusal(verifyReword(s.git, s.base, s.originals, new Map([[s.marked, 'docs(readme): something else']]), s.offered))).toContain('is not the expected rewrite');
    expect(await refusal(verifyReword(s.git, s.base, s.originals, s.approved, { ...s.offered, head: s.head }))).toContain('offered tip');
    // A prefix commit "rewritten" to another object is refused even though its expected bytes are unchanged.
    expect(await refusal(verifyReword(s.git, s.base, s.originals, s.approved, { head: s.offered.head, mapping: [{ ...mapping[0], newHead: s.base }, mapping[1], mapping[2]] }))).toContain(s.originals[0].sha);
    // The expected identity of an object the repository does not hold cannot be read back.
    const oid = commitOid(`${s.originals[0].headers}\n\nchore: never written\n`);
    expect(await refusal(verifyReword(s.git, s.base, s.originals, new Map([[s.originals[0].sha, 'chore: never written']]), { head: oid, mapping: [{ oldHead: s.originals[0].sha, newHead: oid }, mapping[1], mapping[2]] })))
        .toContain(`commit ${oid} is unreadable`);
});
