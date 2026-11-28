import { expect, test } from 'vitest';
import { claudeEditorTemplate, claudeReaderTemplate } from '../../../server/workers/claude-maintenance-arguments';

test('Claude readers and the editor keep the reader-profiles precedent: safe, restricted, strict empty MCP, no Chrome or hooks', () => {
    for (const template of [claudeReaderTemplate(), claudeEditorTemplate({ officeData: '/d', home: '/h' }, ['registry.npmjs.org:443'])]) {
        for (const flag of ['--safe-mode', '--restricted', '--strict-mcp-config', '--no-chrome', '--permission-prompts']) expect(template.arguments).toContain(flag);
        expect(template.arguments).toContain('{session}');
        expect(template.arguments).toContain('{schema}');
        expect(JSON.parse(template.arguments[template.arguments.indexOf('--settings') + 1]).disableAllHooks).toBe(true);
        const tools = template.arguments[template.arguments.indexOf('--tools') + 1];
        expect(tools).not.toMatch(/Edit|Write|WebFetch|WebSearch/);
        expect(template.arguments).not.toContain('--add-dir');
        expect(template.arguments).not.toContain('bypassPermissions');
    }
    expect(claudeEditorTemplate({ officeData: '/d', home: '/h' }, []).filesystem.denied).toEqual(expect.arrayContaining(['/d', '/h/.config/gh', '/h/.ssh']));
});
