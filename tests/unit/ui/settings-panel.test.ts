import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { SettingsPanel } from '../../../src/office/settings/SettingsPanel';
import { PickupForm } from '../../../src/office/settings/PickupForm';
import { MergeCloseoutForm } from '../../../src/office/settings/MergeCloseoutForm';
import { SlackNoticesForm } from '../../../src/office/settings/SlackNoticesForm';
import { TimeForm } from '../../../src/office/settings/TimeForm';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../src/shared';

const coordination = { enabled: true, checkpoints: [], listener: { lastCheckedAt: '', nextCheckAt: '', error: '', assigned: [], reviews: [] } };
const snap = (provider: 'azure' | 'github', mode: 'live' | 'demo' = 'live', extra: object = {}) => ({ mode, project: { id: provider === 'azure' ? 'cec' : 'brain', name: provider === 'azure' ? 'CEC' : 'Brain', provider }, coordination: { ...coordination, ...extra }, github: { board: { lanes: ['Ready', 'Approved'] } } }) as any;
const controller = { preferences: { ...OFFICE_PREFERENCE_DEFAULTS }, displayed: { ...OFFICE_PREFERENCE_DEFAULTS }, pending: '' as const, feedback: null, writable: true, save: async () => { } };
const panel = (snapshot: any) => renderToStaticMarkup(createElement(SettingsPanel, { snapshot, preferences: controller, osReduced: false }));

test('orders the Office, configuration and project blocks and shows PR closeout only for GitHub', () => {
    const github = panel(snap('github')), azure = panel(snap('azure'));
    const order = ['data-settings-block="office"', 'data-settings-block="configuration"', 'data-settings-block="project"'].map(marker => github.indexOf(marker));
    expect(order.every((index, i) => index > 0 && (i === 0 || index > order[i - 1]))).toBe(true);
    expect(github).toContain('Project · Brain'); expect(github).toContain('Office PR closeout');
    expect(azure).toContain('Project · CEC'); expect(azure).not.toContain('Office PR closeout');
    for (const html of [github, azure]) for (const label of ['Save pickup rule', 'Save Slack notifications', 'Save goal notifications', 'Save time settings']) expect(html).toContain(label);
});
test('replaces project forms with a tour notice while Office preferences stay present', () => {
    const html = panel(snap('azure', 'demo'));
    expect(html).toContain('Project settings are unavailable during the illustrative tour');
    expect(html).not.toContain('Save pickup rule');
    expect(html).toContain('Reduced motion');
});
test('project forms keep provider defaults, saved values, explanations and demo guards', () => {
    expect(renderToStaticMarkup(createElement(PickupForm, { snapshot: snap('github') }))).toContain('value="Ready"');
    expect(renderToStaticMarkup(createElement(PickupForm, { snapshot: snap('azure') }))).toContain('value="To Do"');
    expect(renderToStaticMarkup(createElement(PickupForm, { snapshot: snap('azure', 'live', { pickup: { enabled: false, status: 'Approved' } }) }))).toContain('value="Approved"');
    expect(renderToStaticMarkup(createElement(MergeCloseoutForm, { snapshot: snap('github') }))).toContain('No release or deployment is authorized');
    const slack = renderToStaticMarkup(createElement(SlackNoticesForm, { snapshot: snap('github', 'live', { notices: { policy: { enabled: true, recipients: 'assignee', workspace: 'Fixture workspace', mappings: '' }, entries: [] } }) }));
    expect(slack).toContain('value="Fixture workspace"'); expect(slack).toContain('No historical messages are sent');
    expect(renderToStaticMarkup(createElement(TimeForm, { snapshot: snap('github') }))).toContain('Update Time Spent (Hours) on this board');
    expect(renderToStaticMarkup(createElement(TimeForm, { snapshot: snap('azure') }))).toContain('Publish confirmed Jira effort');
    const demo = renderToStaticMarkup(createElement(TimeForm, { snapshot: snap('azure', 'demo') }));
    expect(demo.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(3);
});
