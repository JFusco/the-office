import { expect, test } from 'vitest';
import { slackDesktopArguments } from '../../../server/workers/slack-desktop-tools';

test('Codex Slack workers disable desktop clients without disabling connected apps or changing auth', () => {
    expect(slackDesktopArguments('codex', 'slack-native')).toEqual([
        '-c', 'features.computer_use=false', '-c', 'features.browser_use=false',
        '-c', 'features.browser_use_external=false', '-c', 'features.in_app_browser=false',
    ]);
});
test.each([['claude', 'slack-native'], ['codex', 'reader'], ['codex', 'github-native'], ['codex', 'qa-native'], ['codex', 'brain-native']])(
    '%s / %s retains its existing tool capabilities', (program, profile) => {
        expect(slackDesktopArguments(program, profile)).toEqual([]);
    });
