import { expect, it } from 'vitest';
import { knowledgeStore } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { sourceCommand } from '../../../../server/knowledge/sources/commands';

it('a new source is shared with every configured project, and one project can still leave', () => {
    const fixture = knowledgeStore('brain');
    try {
        const registry = new SourceRegistry(fixture.store.db, fixture.store.clock), projects = ['brain', 'cec', 'cms-field-vocabulary'];
        const { id } = sourceCommand(registry, projects, 'brain', { operation: 'add', source: { kind: 'artifact', title: 'Plan', homeProjectId: 'brain' } });
        expect(projects.map(project => registry.authorized(id, project))).toEqual([true, true, true]);
        sourceCommand(registry, projects, 'cec', { operation: 'unsubscribe', id, projectId: 'cec', revision: registry.get(id)!.revision });
        expect(projects.map(project => registry.authorized(id, project))).toEqual([true, false, true]);
    } finally { fixture.close(); }
});
