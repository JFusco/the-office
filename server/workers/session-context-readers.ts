import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { claudeScopeParser, claudeSessionScope } from './claude-session-scope';
import { sessionScope, sessionScopeParser } from './session-scope';
import { sessionContextFile, type ContextReader } from './session-context-file';

export type ContextSource = 'codex' | 'claude';
export const CODEX_ROLLOUTS = resolve(homedir(), '.codex/sessions');
export const CLAUDE_TRANSCRIPTS = resolve(homedir(), '.claude/projects');

/**
 * One reader per provider, each with its own cache of derived context. Both read from a captured snapshot in
 * chunks with a checkpoint: a log that is still being written is read at the captured version, and no log is
 * refused for its size.
 */
export function contextReaders(roots: Record<ContextSource, string> = { codex: CODEX_ROLLOUTS, claude: CLAUDE_TRANSCRIPTS }): Record<ContextSource, ContextReader> {
    return {
        codex: sessionContextFile(roots.codex, sessionScope, sessionScopeParser),
        claude: sessionContextFile(roots.claude, claudeSessionScope, claudeScopeParser),
    };
}
