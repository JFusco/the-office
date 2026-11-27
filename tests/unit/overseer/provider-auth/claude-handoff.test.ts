import { writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { claudeGeneration, normalizeClaudeToken, readClaudeSignIn } from '../../../../server/overseer/provider-auth/claude-handoff';
import { CLAUDE_TOKEN, enrolledRunner } from './provider-world';

test('the token is one printable line; a final line ending is formatting and keeps its generation', () => {
    for (const text of [CLAUDE_TOKEN, `${CLAUDE_TOKEN}\n`, `${CLAUDE_TOKEN}\r\n`]) expect(normalizeClaudeToken(Buffer.from(text)), JSON.stringify(text)).toBe(CLAUDE_TOKEN);
    for (const bad of ['', '\n', 'two words', `${CLAUDE_TOKEN}\n\n`, `a\nb`, 'tab\tx', 'é-token']) expect(normalizeClaudeToken(Buffer.from(bad)), JSON.stringify(bad)).toBeNull();
    expect(claudeGeneration(CLAUDE_TOKEN)).toMatch(/^[0-9a-f]{64}$/);
    expect(claudeGeneration(CLAUDE_TOKEN)).not.toBe(claudeGeneration(`${CLAUDE_TOKEN}x`));
    expect(claudeGeneration(CLAUDE_TOKEN)).not.toContain(CLAUDE_TOKEN);
});

test('an enrolled token is handed over with its generation; a malformed one is refused without showing it', () => {
    const { paths, where, lock } = enrolledRunner();
    try {
        expect(readClaudeSignIn(paths)).toEqual({ ok: true, token: CLAUDE_TOKEN, generation: claudeGeneration(CLAUDE_TOKEN) });
        writeFileSync(where.claudeToken, `${CLAUDE_TOKEN} extra\n`);
        const refused = readClaudeSignIn(paths);
        expect(refused.ok).toBe(false);
        expect(JSON.stringify(refused)).not.toContain(CLAUDE_TOKEN);
    } finally { lock.release(); }
});
