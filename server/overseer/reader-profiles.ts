import { CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT } from './reader-input';
import { READER_PROFILES, type ReaderProfile } from './sandbox-qualification';
import { VERDICT_SCHEMA } from './stages/triage';

/**
 * The two constrained reader invocations, adapted from the review workflow's `review_cli.py#cli_argv`.
 * Each restriction a profile requires is built from its own arguments, so the list of restrictions a
 * selection says it applies is the list its argv actually carries; a builder that would leave one out
 * throws. Whether the restrictions take effect is the inner receipt's to show, never these labels'.
 */

/** The provider program a reader runs: its physical path, version and content digest, as established by the caller. */
export interface ReaderProgram { path: string; version: string; sha256: string }

/** How the sign-in reaches the CLI; the inner receipt must show the same method in effect. */
export type ReaderAuthentication = 'claude-token-environment' | 'codex-file-store';

export interface ReaderSelection {
    profile: ReaderProfile;
    program: ReaderProgram;
    model: string;
    effort: string;
    argv: readonly string[];
    tools: readonly string[];
    restrictionsApplied: readonly string[];
    authentication: ReaderAuthentication;
}

export const CLAUDE_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export const CODEX_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh'] as const;
const MODEL = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

/** One part of an invocation: the restriction it implements (none for plumbing) and its arguments. */
export type Piece = readonly [restriction: string | null, args: readonly string[]];

/** Builds a selection from its pieces; refuses unless their restrictions are exactly the profile's. */
export function selectReader(profile: ReaderProfile, program: ReaderProgram, model: string, effort: string, efforts: readonly string[], pieces: readonly Piece[], tools: readonly string[], authentication: ReaderAuthentication): ReaderSelection {
    if (typeof model !== 'string' || !MODEL.test(model)) throw new Error(`A reader needs an explicit model name, not ${JSON.stringify(String(model).slice(0, 100))}`);
    if (!efforts.includes(effort)) throw new Error(`A ${profile.id} effort must be one of ${efforts.join(', ')}`);
    const restrictionsApplied = pieces.map(([restriction]) => restriction).filter((restriction): restriction is string => restriction !== null);
    const required = [...profile.requiredRestrictions].sort(), applied = [...restrictionsApplied].sort();
    if (applied.length !== new Set(applied).size || required.join('\n') !== applied.join('\n'))
        throw new Error(`The ${profile.id} invocation applies ${applied.join(', ') || 'nothing'}, not exactly ${required.join(', ')}`);
    return Object.freeze({ profile, program: Object.freeze({ ...program }), model, effort, argv: Object.freeze(pieces.flatMap(([, args]) => args)), tools: Object.freeze([...tools]), restrictionsApplied: Object.freeze(restrictionsApplied), authentication });
}

/** Claude Code 2.1.328, `-p` with streamed JSON so the session is known at start. Read, Glob and Grep only, over the frozen snapshot. */
export const claudePieces = (model: string, effort: string): Piece[] => [
    [null, ['-p', '--model', model, '--effort', effort, '--output-format', 'stream-json', '--verbose', '--json-schema', VERDICT_SCHEMA]],
    ['safe-mode', ['--safe-mode']],
    ['restricted', ['--restricted']],
    ['tools-read-glob-grep', ['--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep', '--add-dir', '../snapshot']],
    ['strict-mcp-config', ['--disallowedTools', 'mcp__*', '--strict-mcp-config']],
    ['permission-prompts-none', ['--permission-mode', 'plan', '--permission-prompts', 'none']],
    ['no-chrome', ['--no-chrome']],
    ['hooks-disabled', ['--settings', JSON.stringify({ disableAllHooks: true })]],
];
export const CLAUDE_TOOLS = ['Read', 'Glob', 'Grep'] as const;
export const claudeReader = (program: ReaderProgram, model: string, effort: string) =>
    selectReader(READER_PROFILES.claude, program, model, effort, CLAUDE_EFFORTS, claudePieces(model, effort), CLAUDE_TOOLS, 'claude-token-environment');

/** Codex 0.167.0-alpha.4.1 `exec`, fresh, its prompt on stdin, its schema and answer at fixed paths from `run.home`. */
export const codexPieces = (model: string, effort: string): Piece[] => [
    [null, ['exec']],
    ['ignore-user-config', ['--ignore-user-config']],
    ['explicit-model-effort', ['--model', model, '-c', `model_reasoning_effort="${effort}"`]],
    ['approval-never', ['-c', 'approval_policy="never"']],
    ['read-only-sandbox', ['-c', 'sandbox_mode="read-only"']],
    ['no-agents-or-customizations', ['-c', 'agents.enabled=false', '-c', 'features.multi_agent=false', '-c', 'features.multi_agent_v2=false']],
    [null, ['-c', 'cli_auth_credentials_store="file"']],
    [null, ['--output-schema', CODEX_SCHEMA_ARGUMENT, '--output-last-message', CODEX_LAST_MESSAGE_ARGUMENT, '--json', '--skip-git-repo-check', '-']],
];
export const CODEX_TOOLS = ['shell'] as const;
export const codexReader = (program: ReaderProgram, model: string, effort: string) =>
    selectReader(READER_PROFILES.codex, program, model, effort, CODEX_EFFORTS, codexPieces(model, effort), CODEX_TOOLS, 'codex-file-store');
