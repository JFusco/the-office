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
