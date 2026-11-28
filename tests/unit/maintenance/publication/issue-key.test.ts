import { expect, test } from 'vitest';
import { brainIssueKey, cmsIssueKey, identityGrounded } from '../../../../server/maintenance/publication/issue-key';

const identity = { source: 'contentstack-docs', locator: 'https://example.test/docs#fields', change: 'field x added', profile: 'contentstack' };

test('the same evidenced change keys the same issue whatever run finds it; another change keys another', () => {
    expect(cmsIssueKey('JFusco/cms-field-vocabulary', identity)).toBe(cmsIssueKey('jfusco/cms-field-vocabulary', { ...identity, change: ' field  x added ' }));
    expect(cmsIssueKey('JFusco/cms-field-vocabulary', identity)).not.toBe(cmsIssueKey('JFusco/cms-field-vocabulary', { ...identity, profile: 'sitecore' }));
    expect(() => cmsIssueKey('JFusco/cms-field-vocabulary', { ...identity, locator: ' ' })).toThrow(/locator/);
    expect(brainIssueKey('JFusco/brain', { source: 'content-hub', defect: 'sitemap coverage lost' })).toMatch(/^brain-[a-f0-9]{32}$/);
});

test('every distinguishing part of an identity must appear in the retained evidence', () => {
    const evidence = JSON.stringify({ summary: 'contentstack-docs https://example.test/docs#fields: field x added (contentstack)' });
    expect(identityGrounded(identity, evidence)).toBe(true);
    expect(identityGrounded({ ...identity, source: 'invented-source' }, evidence)).toBe(false);
    // The same page with another change or profile is not this identity.
    expect(identityGrounded({ ...identity, change: 'field y removed' }, evidence)).toBe(false);
    expect(identityGrounded({ ...identity, profile: 'sitecore' }, evidence)).toBe(false);
    expect(identityGrounded({ source: 'Content Hub', defect: 'lost sitemap coverage' }, 'Content Hub catalog lost sitemap coverage')).toBe(true);
    expect(identityGrounded({ source: 'Content Hub', defect: 'search index stale' }, 'Content Hub catalog lost sitemap coverage')).toBe(false);
});
