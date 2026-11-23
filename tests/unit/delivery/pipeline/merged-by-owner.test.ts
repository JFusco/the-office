import { expect, test } from 'vitest';
import { mergedByOwner } from '../../../../server/delivery/pipeline/merged-by-owner';

const store = (project: Record<string, unknown>) => ({ store: { project } }) as any;
const merged = (login: string, merged_at: string | null = '2026-11-23T20:00:00Z') => ({ merged_at, merged_by: { login } });

test('the owner is the board owner, else the repository owner, and only a merged pull request counts', () => {
    const board = store({ repository: 'JFusco/cms-field-vocabulary', githubProject: { owner: 'board-owner', number: 6, url: '' } });
    expect(mergedByOwner(board, merged('board-owner'))).toBe(true);
    expect(mergedByOwner(board, merged('JFusco'))).toBe(false);
    const repository = store({ repository: 'JFusco/cms-field-vocabulary' });
    expect(mergedByOwner(repository, merged('JFusco'))).toBe(true);
    expect(mergedByOwner(repository, merged('JFusco', null))).toBe(false);
    expect(mergedByOwner(repository, { merged_at: '2026-11-23T20:00:00Z' })).toBe(false);
});
