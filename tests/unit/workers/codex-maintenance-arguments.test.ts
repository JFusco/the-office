import { expect, test } from 'vitest';
import { codexChecksTemplate, codexReaderTemplate } from '../../../server/workers/codex-maintenance-arguments';

test('Codex readers and checks never escalate and run with delegation, desktop tools, web, connectors, plugins and notify off', () => {
    for (const template of [codexReaderTemplate(), codexChecksTemplate(false), codexChecksTemplate(true)]) {
        const args = template.arguments.join(' ');
        for (const part of ['--ignore-user-config', '--ignore-rules', 'approval_policy="never"', 'agents.enabled=false', 'features.multi_agent=false', 'web_search="disabled"', 'features.computer_use=false', 'features.plugins=false', 'notify=[]', '--model {model}', 'model_reasoning_effort="{effort}"'])
            expect(args, `${template.policy}: ${part}`).toContain(part);
        expect(args).not.toMatch(/approvals_reviewer|auto_review|--approve-for-me|on-request/);
        expect(template.arguments.at(-1)).toBe('-');
    }
    expect(codexReaderTemplate().arguments.join(' ')).toContain('--sandbox read-only');
    expect(codexChecksTemplate(false).arguments.join(' ')).toContain('--cd {scratch}');
    expect(codexChecksTemplate(false).settings).toMatchObject({ sandbox: 'workspace-write', 'sandbox_workspace_write.writable_roots': [], 'sandbox_workspace_write.network_access': false });
});
