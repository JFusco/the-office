/**
 * Each provider CLI's own output for the status command the Office runs, recorded signed out on 2026-11-24 with
 * empty configuration directories and no token in the environment (#495): Claude Code 2.1.328, az 2.87.0 with
 * azure-devops 1.0.6, gh 2.100.0. Only the two local paths in Claude's output are replaced.
 */
export type RecordedRun = { code: number; stdout: string; stderr: string };

export const CLAUDE_SIGNED_OUT: RecordedRun = {
    code: 1,
    stdout: `{
  "loggedIn": false,
  "authMethod": "none",
  "apiProvider": "firstParty",
  "analyticsDisabled": false,
  "projectsDirectory": "/Users/office/.claude/projects",
  "configDirectory": "/Users/office/.claude",
  "loginExpiresAt": null,
  "consoleProfileSignInOffered": true
}
`,
    stderr: '',
};

export const AZURE_SIGNED_OUT: RecordedRun = {
    code: 1,
    stdout: '',
    stderr: 'ERROR: Before you can run Azure DevOps commands, you need to run the login command(az login if using AAD/MSA identity else az devops login if using PAT token) to setup credentials.  Please see https://aka.ms/azure-devops-cli-auth for more information.\n',
};

/** `gh auth status --json` exits 0 in both cases; the sign-out is in its output. */
export const GITHUB_NO_ACCOUNT: RecordedRun = {
    code: 0,
    stdout: '{"hosts":{}}\n',
    stderr: 'You are not logged into any GitHub hosts. To log in, run: gh auth login\n',
};

export const GITHUB_BAD_TOKEN: RecordedRun = {
    code: 0,
    stdout: String.raw`{"hosts":{"github.com":[{"state":"error","error":"non-200 OK status code: 401 Unauthorized body: \"{\\r\\n  \\\"message\\\": \\\"Bad credentials\\\",\\r\\n  \\\"documentation_url\\\": \\\"https://docs.github.com/rest\\\",\\r\\n  \\\"status\\\": \\\"401\\\"\\r\\n}\"","active":true,"host":"github.com","login":"","tokenSource":"GH_TOKEN","gitProtocol":"https"}]}}` + '\n',
    stderr: '',
};

/** The runner's own message when a read-only command reaches its deadline. */
export const READ_TIMED_OUT = (program: string) => `${program} read timed out; saved observations retained; safe to retry the read`;
