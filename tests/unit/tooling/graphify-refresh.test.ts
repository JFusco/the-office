import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { refreshNeeded } = require('../../../scripts/graphify/refresh.cjs');
const { mapOnly, isMapInput } = require('../../../scripts/graphify/map-files.cjs');
const { branch, title, body, isRefreshPR } = require('../../../scripts/graphify/refresh-pr.cjs');
const { mergeCheckState } = require('../../../scripts/graphify/refresh-checks.cjs');
const { publish } = require('../../../scripts/graphify/publish-refresh.cjs');

const source = 'a'.repeat(40);
const head = 'b'.repeat(40);
const generated = ['graphify-out/graph.json', 'graphify-out/GRAPH_REPORT.md'];

function check(workflowName: string, name: string, conclusion = 'SUCCESS', startedAt = '2026-11-24T17:30:00Z') {
    return { workflowName, name, status: 'COMPLETED', conclusion, startedAt };
}

function passingChecks() {
    return [
        check('Quality', 'quality'),
        check('Commit message lint', 'commitlint'),
        check('Wiki integrity', 'check'),
        check('Quality', 'build', 'SKIPPED'),
    ];
}

function event() {
    return {
        repository: { full_name: 'JFusco/the-office' },
        pull_request: {
            user: { id: 486049, login: 'JFusco' },
            base: { ref: 'main', sha: source },
            head: { ref: branch, sha: head, repo: { full_name: 'JFusco/the-office' } },
            title,
            body,
        },
    };
}

function publishingFixture() {
    const snapshot = {
        state: 'OPEN', headRefOid: head, headRefName: branch, baseRefName: 'main',
        isCrossRepository: false, title, body, statusCheckRollup: passingChecks(),
    };
    const revisions = [source, head];
    const git = vi.fn((...args: string[]) => {
        if (args[0] === 'rev-parse') return revisions.shift() || '';
        if (args[0] === 'ls-remote') return source + '\trefs/heads/' + branch;
        return '';
    });
    const gh = vi.fn((...args: string[]) => {
        if (args[1] === 'list') return '[{"number":12,"isCrossRepository":false}]';
        if (args[1] === 'view') return JSON.stringify(snapshot);
        return '';
    });
    const paths = vi.fn((range: string) => range === 'HEAD' ? generated : []);
    return { snapshot, git, gh, paths, wait: vi.fn(async () => {}) };
}

describe('Office code-map refresh', () => {
    it('compares the last mapped commit to current main and ignores map-only and wiki merges', () => {
        const git = vi.fn().mockReturnValueOnce('').mockReturnValueOnce('graphify-out/graph.json\0wiki/INDEX.md\0');
        expect(refreshNeeded(source, head, git)).toBe(false);
        expect(git.mock.calls[1][1]).toEqual(['diff', '--name-only', '--no-renames', '-z', source + '..' + head]);
    });

    it('includes source changes, deletions, and changes to the Graphify scope', () => {
        for (const file of ['src/work/timeline/TicketTimeline.tsx', 'server/cec/queue-progress.ts', 'scripts/old.sh', '.graphifyignore']) {
            const git = vi.fn().mockReturnValueOnce('').mockReturnValueOnce(file + '\0');
            expect(refreshNeeded(source, head, git)).toBe(true);
        }
        expect(isMapInput('scripts/wiki/graph/viewer/vendor/sigma.js')).toBe(false);
    });

    it('recovers when there is no valid mapped ancestor', () => {
        expect(refreshNeeded(undefined, head)).toBe(true);
        const git = vi.fn(() => { throw Object.assign(new Error('not reachable'), { status: 1 }); });
        expect(refreshNeeded(source, head, git)).toBe(true);
    });

    it('accepts only the canonical same-repo PR with tracked map output', () => {
        expect(isRefreshPR(event(), () => generated)).toBe(true);
        const fork = event();
        fork.pull_request.head.repo.full_name = 'other/the-office';
        expect(isRefreshPR(fork, () => generated)).toBe(false);
        const otherAuthor = event();
        otherAuthor.pull_request.user.id = 123;
        expect(isRefreshPR(otherAuthor, () => generated)).toBe(false);
        expect(isRefreshPR(event(), () => [...generated, 'src/shared.ts'])).toBe(false);
        expect(mapOnly(['graphify-out/manifest.json'])).toBe(false);
        expect(mapOnly([])).toBe(false);
    });

    it('waits for all named checks and uses the newest restarted check', () => {
        expect(mergeCheckState([])).toBe('pending');
        expect(mergeCheckState(passingChecks().slice(0, 2))).toBe('pending');
        expect(mergeCheckState([
            check('Commit message lint', 'commitlint', 'CANCELLED', '2026-11-24T17:29:00Z'),
            ...passingChecks(),
        ])).toBe('passed');
        expect(mergeCheckState([...passingChecks(), check('Other workflow', 'extra', 'FAILURE')])).toBe('failed');
    });

    it('reuses the bot PR and merges only the generated head after passing checks', async () => {
        const fixture = publishingFixture();
        await publish(fixture);
        expect(fixture.git).toHaveBeenCalledWith('push',
            '--force-with-lease=refs/heads/' + branch + ':' + source,
            'origin', 'HEAD:refs/heads/' + branch);
        expect(fixture.gh).toHaveBeenCalledWith('pr', 'merge', '12', '--merge', '--match-head-commit', head);
        expect(fixture.gh.mock.calls.some(call => call[1] === 'create')).toBe(false);
    });

    it('refuses to merge a failed check, changed head, or new source on main', async () => {
        const failed = publishingFixture();
        failed.snapshot.statusCheckRollup[0].conclusion = 'FAILURE';
        await expect(publish(failed)).rejects.toThrow('checks did not pass');
        const changed = publishingFixture();
        changed.snapshot.headRefOid = source;
        await expect(publish(changed)).rejects.toThrow('no longer matches');
        const moved = publishingFixture();
        moved.paths.mockReturnValueOnce(generated).mockReturnValueOnce([]).mockReturnValueOnce(['src/shared.ts']);
        await expect(publish(moved)).rejects.toThrow('source advanced');
        for (const fixture of [failed, changed, moved]) {
            expect(fixture.gh.mock.calls.some(call => call[1] === 'merge')).toBe(false);
        }
    });
});
