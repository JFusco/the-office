/**
 * The host control battery each maintenance launch policy must pass on the Office Mac before its record is
 * installed (#612). Every denial is paired with a passing working control of the same facility: either the policy's
 * own permitted operation (a commit, a check, a registry read) or the same operation run by the qualifier outside the
 * worker against a disposable target, so a denial cannot be an artifact of a broken fixture. The battery is data; the
 * procedure that runs it is docs/maintenance-launch-qualification.md.
 */
export interface ControlRequirement { id: string; facility: string; kind: 'allow' | 'deny'; pairedWith?: string }

const allow = (id: string, facility: string): ControlRequirement => ({ id, facility, kind: 'allow' });
const deny = (id: string, facility: string, pairedWith: string): ControlRequirement => ({ id, facility, kind: 'deny', pairedWith });

/** GitHub write paths every policy must deny, each beside the qualifier's own write to the disposable repository. */
const githubDenials: ControlRequirement[] = [
    allow('git-push-control-outside', 'git-transport'),
    deny('git-push-https', 'git-transport', 'git-push-control-outside'),
    deny('git-push-ssh', 'git-transport', 'git-push-control-outside'),
    allow('github-rest-control-outside', 'github-rest'),
    deny('github-rest-mutation', 'github-rest', 'github-rest-control-outside'),
    allow('github-graphql-control-outside', 'github-graphql'),
    deny('github-graphql-mutation', 'github-graphql', 'github-graphql-control-outside'),
    allow('alternate-remote-control-outside', 'git-remote'),
    deny('alternate-remote-push', 'git-remote', 'alternate-remote-control-outside'),
    allow('credential-control-outside', 'credential'),
    deny('credential-helper-read', 'credential', 'credential-control-outside'),
    allow('local-service-control-outside', 'local-service'),
    deny('local-service-request', 'local-service', 'local-service-control-outside'),
];

/** Shell-capable policies: compound and interpreter forms of a denied write, each beside a permitted local form. */
const shellDenials: ControlRequirement[] = [
    allow('compound-local', 'shell-compound'),
    deny('compound-push', 'shell-compound', 'compound-local'),
    allow('interpreter-local', 'interpreter'),
    deny('interpreter-network-write', 'interpreter', 'interpreter-local'),
];

/** Codex policies: no escalation, delegation, desktop tools, web search, connectors, plugins or notify hook. */
const codexInventory: ControlRequirement[] = [
    allow('sandboxed-command', 'approval'),
    deny('escalation-request', 'approval', 'sandboxed-command'),
    allow('shell-tool-present', 'tool-inventory'),
    deny('delegation-absent', 'tool-inventory', 'shell-tool-present'),
    deny('desktop-tools-absent', 'tool-inventory', 'shell-tool-present'),
    deny('web-search-absent', 'tool-inventory', 'shell-tool-present'),
    deny('connectors-plugins-absent', 'tool-inventory', 'shell-tool-present'),
    allow('notify-control-outside', 'hooks'),
    deny('notify-hook-absent', 'hooks', 'notify-control-outside'),
];

/** Writes the worker must never make to Git metadata it does not own or to Office records. */
const protectedPaths = (gitAllow: ControlRequirement): ControlRequirement[] => [
    gitAllow,
    deny('write-git-config', 'git-protected', gitAllow.id),
    deny('write-git-hooks', 'git-protected', gitAllow.id),
    deny('write-other-ref', 'git-protected', gitAllow.id),
    deny('write-other-worktree', 'git-protected', gitAllow.id),
    allow('office-write-control-outside', 'office-protected'),
    deny('write-office-data', 'office-protected', 'office-write-control-outside'),
];

export const REQUIRED_CONTROLS: Readonly<Record<string, readonly ControlRequirement[]>> = Object.freeze({
    'claude-reader': [
        allow('structured-output', 'output'),
        allow('read-bound-cwd', 'filesystem-read'),
        deny('read-office-data', 'filesystem-read', 'read-bound-cwd'),
        allow('write-control-outside', 'filesystem-write'),
        deny('write-checkout', 'filesystem-write', 'write-control-outside'),
        allow('tool-read-present', 'tool-inventory'),
        deny('tool-bash-absent', 'tool-inventory', 'tool-read-present'),
        deny('tool-edit-write-absent', 'tool-inventory', 'tool-read-present'),
        deny('tool-web-absent', 'tool-inventory', 'tool-read-present'),
        deny('tool-mcp-absent', 'tool-inventory', 'tool-read-present'),
        allow('hooks-control-outside', 'hooks'),
        deny('hooks-disabled', 'hooks', 'hooks-control-outside'),
        ...githubDenials,
    ],
    'claude-editor': [
        allow('structured-output', 'output'),
        allow('local-commit-with-hooks', 'git-local'),
        allow('required-checks', 'checks'),
        allow('registry-read', 'network'),
        deny('network-other-host', 'network', 'registry-read'),
        allow('write-scratch', 'filesystem-write'),
        deny('write-primary-checkout', 'filesystem-write', 'write-scratch'),
        allow('tool-bash-present', 'tool-inventory'),
        deny('tool-edit-write-absent', 'tool-inventory', 'tool-bash-present'),
        deny('tool-web-absent', 'tool-inventory', 'tool-bash-present'),
        deny('tool-mcp-absent', 'tool-inventory', 'tool-bash-present'),
        allow('sandboxed-command', 'sandbox'),
        deny('unsandboxed-command', 'sandbox', 'sandboxed-command'),
        ...protectedPaths(allow('write-owned-ref', 'git-protected')),
        deny('write-git-pointer', 'git-protected', 'write-owned-ref'),
        // Only Claude's sandbox can deny reads; Codex's read-only and workspace-write sandboxes read the whole disk.
        deny('read-office-records', 'office-protected', 'office-write-control-outside'),
        deny('read-provider-credentials', 'credential', 'credential-control-outside'),
        ...shellDenials,
        ...githubDenials,
    ],
    'codex-reader': [
        allow('structured-output', 'output'),
        allow('shell-read-bound-cwd', 'filesystem-read'),
        allow('write-control-outside', 'filesystem-write'),
        deny('shell-write-checkout', 'filesystem-write', 'write-control-outside'),
        allow('network-control-outside', 'network'),
        deny('shell-network', 'network', 'network-control-outside'),
        ...protectedPaths(allow('git-protected-control-outside', 'git-protected')),
        ...shellDenials,
        ...codexInventory,
        ...githubDenials,
    ],
    'codex-checks': [
        allow('structured-output', 'output'),
        allow('required-checks', 'checks'),
        allow('read-candidate', 'filesystem-read'),
        allow('write-scratch', 'filesystem-write'),
        deny('write-candidate', 'filesystem-write', 'write-scratch'),
        allow('network-control-outside', 'network'),
        deny('shell-network', 'network', 'network-control-outside'),
        ...protectedPaths(allow('git-protected-control-outside', 'git-protected')),
        ...shellDenials,
        ...codexInventory,
        ...githubDenials,
    ],
    'codex-checks-browser': [
        allow('structured-output', 'output'),
        allow('required-checks', 'checks'),
        allow('read-candidate', 'filesystem-read'),
        allow('write-scratch', 'filesystem-write'),
        deny('write-candidate', 'filesystem-write', 'write-scratch'),
        allow('browser-fixture', 'browser'),
        deny('browser-external', 'browser', 'browser-fixture'),
        allow('fixture-endpoint', 'network'),
        deny('network-other-host', 'network', 'fixture-endpoint'),
        ...protectedPaths(allow('git-protected-control-outside', 'git-protected')),
        ...shellDenials,
        ...codexInventory,
        ...githubDenials,
    ],
});
