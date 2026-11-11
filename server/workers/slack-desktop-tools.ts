/** Native Slack delivery uses connected tools; desktop/browser clients are unnecessary. */
export const SLACK_DESKTOP_FEATURES = ['computer_use', 'browser_use', 'browser_use_external', 'in_app_browser'] as const;

/** Child-only restrictions: leave connected apps, authentication and effect policy unchanged. */
export function slackDesktopArguments(program: string, profile: string): string[] {
    return program === 'codex' && profile === 'slack-native'
        ? SLACK_DESKTOP_FEATURES.flatMap(feature => ['-c', `features.${feature}=false`]) : [];
}
