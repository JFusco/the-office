import { expect, test } from 'vitest';
import { channelSettingsProblem } from '../../../src/office/settings/SlackChannelForm';

const valid = { channelId: 'C0DELIVER', channelName: 'delivery', workspaceId: 'T09KF5BJR', mentionIds: ['U111AAA', 'W222BBB'] };
test('channel settings get a plain message for each typo the server would reject', () => {
    expect(channelSettingsProblem(valid)).toBe('');
    expect(channelSettingsProblem({ ...valid, channelId: 'delivery' })).toContain('starts with C or G');
    expect(channelSettingsProblem({ ...valid, channelName: '' })).toBe('Add the channel name.');
    expect(channelSettingsProblem({ ...valid, workspaceId: 'verndale' })).toContain('starts with T');
    expect(channelSettingsProblem({ ...valid, mentionIds: ['U111AAA', '@JOE'] })).toBe('These are not Slack member IDs: @JOE. Member IDs start with U or W.');
    expect(channelSettingsProblem({ ...valid, mentionIds: Array.from({ length: 21 }, (_, i) => `U${i}`) })).toBe('Tag at most 20 people.');
});
