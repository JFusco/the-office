import { expect, test } from 'vitest';
import { createdContentSha256 } from '../../../../server/delivery/publication/created-content';
import { digest } from '../../../../server/store/readback-evidence';

const content = { title: 'feat(optimizely): document SaaS field limits', body: '## Summary\n\nCloses #193\n' };
const url = 'https://github.com/JFusco/cms-field-vocabulary/pull/194';

test('only the printed URL of the linked draft with the exact supplied title and body records content', () => {
    expect(createdContentSha256(`${url}\n`, { url, ...content }, content)).toBe(digest(content));
    for (const [name, printed, readBack] of [
        ['no read-back', `${url}\n`, null],
        ['another pull request printed', 'https://github.com/JFusco/cms-field-vocabulary/pull/196\n', { url, ...content }],
        ['nothing printed after a lost response', '', { url, ...content }],
        ['a different body read back', `${url}\n`, { url, ...content, body: content.body.trim() }],
        ['a different title read back', `${url}\n`, { url, ...content, title: 'feat: other' }],
    ] as const) expect(createdContentSha256(printed, readBack, content), name).toBeUndefined();
});
