import { expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { retainLaunchPolicy, launchPolicyFacts, type LaunchPolicyReceipt } from '../../../server/workers/launch-policy';

const receipt: LaunchPolicyReceipt = { version: 1, workerId: 'sender', stage: 'slack-send', program: 'codex', profile: { name: 'slack-native', readOnly: true }, effective: { readOnly: false, terminateStragglers: false }, at: '2026-11-09T21:00:00Z' };
test('effective policy is immutable private metadata, never a prompt, command or effect receipt', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-policy-'));
    try {
        expect(retainLaunchPolicy(dir, receipt)).toBe(true);
        const path = resolve(dir, 'launch-policy.json'), original = readFileSync(path, 'utf8');
        expect(statSync(path).mode & 0o777).toBe(0o600);
        expect(retainLaunchPolicy(dir, { ...receipt, effective: { readOnly: true, terminateStragglers: true } })).toBe(false);
        expect(readFileSync(path, 'utf8')).toBe(original);
        expect(launchPolicyFacts(JSON.parse(original), 'sender', 'slack-send', 'codex')).toEqual(receipt);
        for (const [id, stage, provider] of [['other', 'slack-send', 'codex'], ['sender', 'slack-verify', 'codex'], ['sender', 'slack-send', 'claude']])
            expect(launchPolicyFacts(receipt, id, stage, provider)).toBeUndefined();
        expect(launchPolicyFacts({ ...receipt, input: 'PRIVATE_PROMPT' }, 'sender', 'slack-send', 'codex')).toBeUndefined();
        expect(launchPolicyFacts({ ...receipt, desktopToolsDisabled: true }, 'sender', 'slack-send', 'codex')).toEqual({ ...receipt, desktopToolsDisabled: true });
        expect(launchPolicyFacts({ ...receipt, desktopToolsDisabled: false }, 'sender', 'slack-send', 'codex')).toBeUndefined();
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
