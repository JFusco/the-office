import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { hasCanonicalWikiBody } = require('../../../scripts/validate_wiki_pr_body.cjs');

function wikiEvent() {
    return {
        repository: { full_name: 'JFusco/the-office' },
        pull_request: {
            user: { id: 486049, login: 'JFusco' },
            base: { ref: 'main', sha: 'a'.repeat(40) },
            head: { ref: 'bot/wiki-sync/553', sha: 'b'.repeat(40), repo: { full_name: 'JFusco/the-office' } },
            title: 'docs(wiki): reconcile PR #553',
            body: 'Automated, reviewable wiki reconciliation for merged PR #553.',
        },
    };
}

describe('canonical wiki pull request body', () => {
    it('checks the immutable diff for a numbered reconciliation', () => {
        const event = wikiEvent();
        event.pull_request.body += '\n\nCloses #554';
        const files = vi.fn(() => ['wiki/journal/entry.md', 'scripts/wiki/graph/data/graph.json']);
        expect(hasCanonicalWikiBody(event, files)).toBe(true);
        expect(files).toHaveBeenCalledWith(event.pull_request.base.sha, event.pull_request.head.sha);
    });

    describe.each([
        ['docs(wiki): reconcile missed merges', 'Automated, reviewable batch wiki reconciliation.'],
        ['docs(wiki): weekly issue and merge reconciliation', 'Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation.'],
    ])('%s', (title, prefix) => {
        it.each([
            ['accepts consistent successful counts', 'Processed 2 merged PRs: 1 changed, 1 unchanged, 0 errors.', true],
            ['rejects nonzero errors', 'Processed 2 merged PRs: 1 changed, 1 unchanged, 1 errors.', false],
            ['rejects inconsistent totals', 'Processed 3 merged PRs: 1 changed, 1 unchanged, 0 errors.', false],
        ])('%s', (_name, counts, expected) => {
            const event = wikiEvent();
            event.pull_request.head.ref = 'bot/wiki-maintenance';
            event.pull_request.title = title;
            event.pull_request.body = prefix + ' ' + counts;
            expect(hasCanonicalWikiBody(event, () => ['wiki/INDEX.md'])).toBe(expected);
        });
    });

    it.each([
        (event: ReturnType<typeof wikiEvent>) => { event.pull_request.user.id = 1; },
        (event: ReturnType<typeof wikiEvent>) => { event.pull_request.head.repo.full_name = 'fork/the-office'; },
        (event: ReturnType<typeof wikiEvent>) => { event.pull_request.head.ref = 'bot/wiki-sync/552'; },
        (event: ReturnType<typeof wikiEvent>) => { event.pull_request.body += '\n\nOpen-ended text'; },
    ])('requires trusted identity and exact metadata before reading the diff', change => {
        const event = wikiEvent();
        change(event);
        const files = vi.fn(() => ['wiki/INDEX.md']);
        expect(hasCanonicalWikiBody(event, files)).toBe(false);
        expect(files).not.toHaveBeenCalled();
    });

    it.each([
        { files: [] },
        { files: ['wiki/INDEX.md', 'server/index.ts'] },
        { files: ['wiki/README.md', 'wiki/.wiki-kit.json'] },
    ])('rejects an empty or out-of-scope diff ($files)', ({ files }) => {
            expect(hasCanonicalWikiBody(wikiEvent(), () => files)).toBe(false);
    });
});
