import { resolve } from 'node:path';
import { DEVELOPER_EFFORT, DEVELOPER_MODEL } from './claude';
import type { LaunchTemplate } from './maintenance-template';

/** Host paths a maintenance worker never reads or writes: Office data and the operator's provider credentials. */
export interface ProtectedRoots { officeData: string; home: string }
const credentialPaths = (home: string) => ['.config/gh', '.ssh', '.netrc', '.git-credentials', '.codex', '.config/git/credentials'].map(path => resolve(home, path));

const common = (settings: object): string[] => ['--print', '--model', DEVELOPER_MODEL, '--effort', DEVELOPER_EFFORT, '--output-format', 'stream-json', '--verbose',
    '--json-schema', '{schema}', '--session-id', '{session}',
    // The `reader-profiles.ts` precedent: safe and restricted modes, strict empty MCP, no Chrome, no Claude hooks.
    '--safe-mode', '--restricted', '--strict-mcp-config', '--no-chrome', '--settings', JSON.stringify(settings)];

/**
 * Claude reader for `proposal-issue`, `proposal-plan` and `draft-pr`: Read, Glob and Grep over its cwd, plan mode, no
 * permission prompts, no MCP, Chrome or hooks. The assignment arrives on stdin and the schema inline.
 */
export function claudeReaderTemplate(): LaunchTemplate {
    const settings = { disableAllHooks: true };
    return {
        provider: 'claude', policy: 'claude-reader',
        arguments: [...common(settings), '--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep', '--disallowedTools', 'mcp__*',
            '--permission-mode', 'plan', '--permission-prompts', 'none'],
        settings, tools: ['Read', 'Glob', 'Grep'],
        filesystem: { readable: ['{cwd}'], writable: [], denied: [] }, network: { allowed: [] },
    };
}

/**
 * Claude editor for `proposal`: Read, Glob, Grep and Bash in the owned worktree. Edits, commits and checks run through
 * Bash inside the sandbox, which fails closed, never runs a command unsandboxed and reaches only the registry. Writes
 * are limited to the checkout, private scratch, the worktree's own Git administrative directory (`{gitDir}`, under
 * `{gitCommonDir}/worktrees`: its index, HEAD, logs and ORIG_HEAD), the shared objects and the owned branch's ref,
 * lock and reflog. Writes are allow-only, so other worktrees' administrative directories, other refs and the primary
 * checkout stay unwritable without a denial; Git configuration, hooks and pointers, Office records and credentials are also
 * denied explicitly. No denied path contains an allowed one, because a denial takes precedence over an allowance.
 * No primary checkout, Office data or skill directory is added.
 */
export function claudeEditorTemplate(roots: ProtectedRoots, registry: readonly string[]): LaunchTemplate {
    const writable = ['{cwd}', '{scratch}', '{gitDir}', '{gitCommonDir}/objects', '{gitCommonDir}/{branchRef}', '{gitCommonDir}/{branchRef}.lock', '{gitCommonDir}/logs/{branchRef}'];
    const denied = [roots.officeData, ...credentialPaths(roots.home), '{gitCommonDir}/config', '{gitCommonDir}/hooks',
        '{gitDir}/commondir', '{gitDir}/gitdir', '{gitDir}/config.worktree', '{cwd}/.git'];
    const hosts = registry.map(entry => entry.replace(/:\d+$/, ''));
    const settings = {
        disableAllHooks: true,
        permissions: { allow: ['Read', 'Glob', 'Grep', 'Bash'], deny: ['Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Task', 'mcp__*'], defaultMode: 'default', disableBypassPermissionsMode: 'disable' },
        sandbox: {
            enabled: true, failIfUnavailable: true, autoAllowBashIfSandboxed: true, allowUnsandboxedCommands: false, excludedCommands: [],
            filesystem: { allowWrite: writable, denyWrite: denied, denyRead: [roots.officeData, ...credentialPaths(roots.home)] },
            network: { strictAllowlist: true, allowedDomains: hosts, allowUnixSockets: [], allowLocalBinding: false },
        },
    };
    return {
        provider: 'claude', policy: 'claude-editor',
        arguments: [...common(settings), '--tools', 'Read,Glob,Grep,Bash', '--allowedTools', 'Read,Glob,Grep,Bash',
            '--disallowedTools', 'mcp__*,Edit,Write,NotebookEdit,WebFetch,WebSearch,Task', '--permission-mode', 'default', '--permission-prompts', 'none'],
        settings, tools: ['Read', 'Glob', 'Grep', 'Bash'],
        filesystem: { readable: ['{cwd}', '{gitCommonDir}'], writable, denied }, network: { allowed: [...registry] },
    };
}
