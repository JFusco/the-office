import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { routeOf, sharedPublishers, WRITE_INVENTORY } from '../../../../server/github/identity/write-inventory';
import { MUTATIONS, routeMutations, WRITE_OPERATIONS } from '../../../../server/github/identity/write-operations';

const root = resolve(__dirname, '../../../..');

test('every checked publisher in the inventory saves its Effect operation in the module it names', () => {
    for (const entry of WRITE_INVENTORY.filter(entry => entry.publisher === 'harness' || entry.publisher === 'direct')) {
        const source = readFileSync(resolve(root, entry.module), 'utf8');
        // Generic publishers build the label from the operation kind; ci repairs from the plan kind.
        const built = [`'feature-' + operation.kind`, '`improvement-${operation.kind}`', '`ci-${plan.kind}`', '`merged-candidate-cleanup-${name}`', 'COST_OPERATION'];
        expect(source.includes(`'${entry.adapter}'`) || built.some(form => source.includes(form)), `${entry.module}: ${entry.adapter}`).toBe(true);
    }
});

test('every route operation has at least one mutation and every mutation one route', () => {
    for (const operation of WRITE_OPERATIONS) expect(routeMutations(operation).length, operation).toBeGreaterThan(0);
    for (const mutation of Object.keys(MUTATIONS) as (keyof typeof MUTATIONS)[]) expect(WRITE_OPERATIONS).toContain(MUTATIONS[mutation].operation);
    expect(routeMutations('branch-delete')).toEqual(['graphql-update-refs', 'rest-delete-ref']);
    expect(routeMutations('comment')).toEqual(['rest-issue-comment', 'rest-pr-comment']);
});

test('fixed adapters map to explicit route labels; non-GitHub projects and unknown operations are not GitHub writes', () => {
    const github = { provider: 'github' } as const;
    expect(routeOf(github, 'git-push')).toEqual({ operation: 'push', mutation: 'git-push' });
    expect(routeOf(github, 'ci-commit-messages')).toEqual({ operation: 'force-push', mutation: 'git-force-push' });
    expect(routeOf(github, 'ci-retry')).toEqual({ operation: 'workflow-rerun', mutation: 'rest-rerun-failed-jobs' });
    expect(routeOf(github, 'feature-board', { operation: { payload: { action: 'add' } } })).toEqual({ operation: 'board-add', mutation: 'graphql-add-project-item' });
    expect(routeOf(github, 'feature-board', { operation: { payload: { action: 'status' } } })).toEqual({ operation: 'board-status', mutation: 'graphql-update-single-select' });
    expect(routeOf({ provider: 'azure' }, 'feature-create')).toBeUndefined();
    expect(routeOf(github, 'deploy-start')).toBeUndefined();
});

test('shared unchecked publishers are recorded per project and operation', () => {
    expect(sharedPublishers({ provider: 'github' as const }, true, 'issue-close')).toEqual([]);
    expect(sharedPublishers({ provider: 'github' as const }, false, 'issue-close').map(entry => entry.module)).toEqual(['server/delivery/pipeline/stage-prompts.ts']);
    expect(sharedPublishers({ provider: 'github' as const }, true, 'comment').map(entry => entry.module)).toContain('server/maintenance/maintenance.ts');
    expect(sharedPublishers({ provider: 'github' as const }, true, 'board-field').map(entry => entry.module)).toEqual(['server/time/time-ledger.ts']);
});
