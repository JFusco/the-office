import { expect, test } from 'vitest';
import { claudePieces, claudeReader, codexPieces, codexReader, selectReader, CLAUDE_EFFORTS, CLAUDE_TOOLS, CODEX_EFFORTS, CODEX_TOOLS } from '../../../server/overseer/reader-profiles';
import { READER_PROFILES } from '../../../server/overseer/sandbox-qualification';
import { VERDICT_SCHEMA } from '../../../server/overseer/stages/triage';

const program = { path: '/fixture/bin/provider', version: '1.0.0', sha256: 'a'.repeat(64) };

test('the Claude reader runs streamed, schema-bound, safe, restricted and read-only, with hooks, MCP and Chrome off', () => {
    const selection = claudeReader(program, 'claude-fixture', 'high');
    expect(selection.argv).toEqual([
        '-p', '--model', 'claude-fixture', '--effort', 'high', '--output-format', 'stream-json', '--verbose', '--json-schema', VERDICT_SCHEMA,
        '--safe-mode', '--restricted', '--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep', '--add-dir', '../snapshot',
        '--disallowedTools', 'mcp__*', '--strict-mcp-config', '--permission-mode', 'plan', '--permission-prompts', 'none', '--no-chrome',
        '--settings', '{"disableAllHooks":true}',
    ]);
    expect(selection).toMatchObject({ profile: READER_PROFILES.claude, program, tools: ['Read', 'Glob', 'Grep'], authentication: 'claude-token-environment' });
    expect([...selection.restrictionsApplied].sort()).toEqual([...READER_PROFILES.claude.requiredRestrictions].sort());
});

test('the Codex reader runs a fresh exec with its model, effort, no approvals, read-only, no agents and the file sign-in store', () => {
    const selection = codexReader(program, 'gpt-fixture', 'medium');
    expect(selection.argv).toEqual([
        'exec', '--ignore-user-config', '--model', 'gpt-fixture', '-c', 'model_reasoning_effort="medium"', '-c', 'approval_policy="never"',
        '-c', 'sandbox_mode="read-only"', '-c', 'agents.enabled=false', '-c', 'features.multi_agent=false', '-c', 'features.multi_agent_v2=false',
        '-c', 'cli_auth_credentials_store="file"', '--output-schema', '../snapshot/provider-schema.json', '--output-last-message', '../tmp/last-message.json',
        '--json', '--skip-git-repo-check', '-',
    ]);
    expect(selection).toMatchObject({ profile: READER_PROFILES.codex, tools: ['shell'], authentication: 'codex-file-store' });
    expect([...selection.restrictionsApplied].sort()).toEqual([...READER_PROFILES.codex.requiredRestrictions].sort());
});

test('removing any one restriction, or repeating one, makes the builder refuse', () => {
    for (const [profile, pieces, efforts, tools, authentication] of [
        [READER_PROFILES.claude, claudePieces('m', 'high'), CLAUDE_EFFORTS, CLAUDE_TOOLS, 'claude-token-environment'],
        [READER_PROFILES.codex, codexPieces('m', 'high'), CODEX_EFFORTS, CODEX_TOOLS, 'codex-file-store'],
    ] as const) {
        expect(() => selectReader(profile, program, 'm', 'high', efforts, pieces, tools, authentication)).not.toThrow();
        for (const [index, [restriction]] of pieces.entries()) {
            if (restriction === null) continue;
            const without = pieces.filter((_, i) => i !== index);
            expect(() => selectReader(profile, program, 'm', 'high', efforts, without, tools, authentication), restriction).toThrow('not exactly');
            expect(() => selectReader(profile, program, 'm', 'high', efforts, [...pieces, pieces[index]], tools, authentication), restriction).toThrow('not exactly');
        }
    }
});

test('a model or effort that is not explicit and plain is refused', () => {
    for (const model of ['', ' gpt', 'gpt"; x=1', 'a'.repeat(101)]) expect(() => codexReader(program, model, 'high'), model).toThrow('explicit model name');
    expect(() => claudeReader(program, 'm', 'minimal')).toThrow('effort must be one of');
    expect(() => codexReader(program, 'm', 'max')).toThrow('effort must be one of');
});
