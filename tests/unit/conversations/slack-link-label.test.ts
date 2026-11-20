import { expect, test } from 'vitest';
import { labelIsUrl } from '../../../server/conversations/slack-link-label';
import { comparableSlackText } from '../../../server/conversations/slack';

const URL = 'https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_git/cumulative_operating_system.monorepo/pullrequest/41448';

test('a label that is the URL, the URL without its scheme, or Slack\'s shortened form of it stands for the URL', () => {
    expect(labelIsUrl(URL, URL)).toBe(true);
    expect(labelIsUrl(URL.replace('https://', ''), URL)).toBe(true);
    expect(labelIsUrl('dev.azure.com/verndale/…/41448', URL)).toBe(true);
    expect(labelIsUrl('https://dev.azure.com/…/pullrequest/41448', URL)).toBe(true);
});

test('a label that is the author\'s own text, another address, or an ellipsis that does not bracket the URL is not', () => {
    for (const label of ['the pull request', 'dev.azure.com/other/…/41448', 'dev.azure.com/verndale/…/41449', '…/41448', 'dev.azure.com/…', 'dev.azure.com/…/x/…/41448', `${URL.replace('https://', '')}…`])
        expect(labelIsUrl(label, URL), label).toBe(false);
});

test('a sent notice whose link Slack shortened reads back as the saved text', () => {
    const saved = `CEC · CEC-154 shipped: feat(functional-spec): apply comment feedback (CEC-154)\n\nPR: ${URL} · merge 9e4c06b\nAzure build and deployment results are monitored separately in the Office.`;
    const readBack = `CEC · CEC-154 shipped: feat(functional-spec): apply comment feedback (CEC-154)\n\nPR: <${URL}|dev.azure.com/verndale/…/41448> · merge 9e4c06b\nAzure build and deployment results are monitored separately in the Office.\n*Sent using* <@U0A3Q4JJX17|ChatGPT>`;
    expect(comparableSlackText(readBack)).toBe(comparableSlackText(saved));
    // A link given other text is still a different message.
    expect(comparableSlackText(readBack.replace('dev.azure.com/verndale/…/41448', 'the pull request'))).not.toBe(comparableSlackText(saved));
});

test('name@version text that Slack stores as a mailto link compares equal to what was sent', () => {
    // The GH-415 merge notice as Slack returned it, and as the Office saved it.
    const saved = '- pnpm-lock.yaml: refreshed. minimatch@10.2.6 is replaced by minimatch@11.0.9 for eslint@10.14.0 and…\n\nPR: https://github.com/JFusco/brain/pull/416 · merge ff53e0d';
    const readBack = '• pnpm-lock.yaml: refreshed. <mailto:minimatch@10.2.6|minimatch@10.2.6> is replaced by <mailto:minimatch@11.0.9|minimatch@11.0.9> for <mailto:eslint@10.14.0|eslint@10.14.0> and…\nPR: <https://github.com/JFusco/brain/pull/416|github.com/JFusco/brain/pull/416> · merge ff53e0d\n*Sent using* <@U0A3Q4JJX17|ChatGPT>';
    expect(comparableSlackText(readBack)).toBe(comparableSlackText(saved));
    expect(comparableSlackText('Ask <mailto:a@example.test>')).toBe('Ask a@example.test');
    // A label that is not the address is other text, and stays different from the plain address.
    expect(comparableSlackText('Ask <mailto:a@example.test|the owner>')).not.toBe('Ask a@example.test');
    expect(comparableSlackText('Ask <mailto:a@example.test|b@example.test>')).not.toBe(comparableSlackText('Ask b@example.test'));
});
