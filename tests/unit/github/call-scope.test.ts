import { expect, test } from 'vitest';
import { setTimeout as wait } from 'node:timers/promises';
import { bindGitHubRunner, boundGitHubRunner, currentGitHubSource, deliverySource, withGitHubSource, type Runner } from '../../../server/github/call-scope';

const runner: Runner = async () => '';

test('outside any scope a call is `other` and no runner is bound', () => {
    expect(currentGitHubSource()).toBe('other');
    expect(boundGitHubRunner('gh')).toBeUndefined();
});

test('a bound runner is offered only for the GitHub CLI, by any path, and survives awaits and timers', async () => {
    await bindGitHubRunner(runner, async () => {
        expect(boundGitHubRunner('gh')).toBe(runner);
        expect(boundGitHubRunner('/opt/homebrew/bin/gh')).toBe(runner);
        expect(boundGitHubRunner('git')).toBeUndefined();
        await wait(1);
        expect(await new Promise(resolve => setTimeout(() => resolve(boundGitHubRunner('gh')), 0))).toBe(runner);
        expect(currentGitHubSource()).toBe('other');
        // A source scope keeps the binding.
        await withGitHubSource('monitor', async () => { await wait(1); expect(boundGitHubRunner('gh')).toBe(runner); });
    });
});

test('the innermost scope names the source, and concurrent work keeps its own', async () => {
    const seen: string[] = [];
    const observe = (source: 'monitor' | 'pipelines', delay: number) => withGitHubSource(source, async () => { await wait(delay); seen.push(`${source}:${currentGitHubSource()}`); });
    await Promise.all([observe('monitor', 15), observe('pipelines', 1)]);
    expect(seen).toEqual(['pipelines:pipelines', 'monitor:monitor']);
    await withGitHubSource('assignments', async () => {
        await withGitHubSource('discovery', async () => { await wait(1); expect(currentGitHubSource()).toBe('discovery'); });
        expect(currentGitHubSource()).toBe('assignments');
    });
});

test('a pinned owner keeps its label through nested scopes', async () => {
    await withGitHubSource('it', async () => {
        await withGitHubSource('monitor', async () => { await wait(1); expect(currentGitHubSource()).toBe('it'); });
    }, true);
});

test('a delivery step is labelled by a known stage only', () => {
    expect([deliverySource('review'), deliverySource('lead-pr'), deliverySource('toString'), deliverySource('')]).toEqual(['delivery:review', 'delivery:lead-pr', 'delivery', 'delivery']);
});
