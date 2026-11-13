import { expect, test } from 'vitest';
import { questionUrl } from '../../../../src/features/questions/question-url';
test.each(['cec', 'brain', 'cms-field-vocabulary'])('question submission binds exact feature ID and %s owner', projectId => {
    const url = new URL(questionUrl({ projectId, featureId: 'feature/id' }), 'https://office.test');
    expect(url.pathname).toBe('/api/features/feature%2Fid'); expect(url.searchParams.get('project')).toBe(projectId); expect(url.searchParams.get('officeWide')).toBe('1');
});
