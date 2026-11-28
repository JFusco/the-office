import { expect, test } from 'vitest';
import { homedir } from 'node:os';
import { DATA } from '../../../../server/office/config';
import { maintenanceRoots, POLICIES, policyTemplate } from '../../../../server/workers/qualification/policy-templates';
import { templateFor } from '../../../../server/workers/maintenance-invocation';
import { DEFAULT_REGISTRY } from '../../../../server/workers/maintenance-launch';

test('each policy maps to the one template the runtime launches, with the live Office data root and home protected', () => {
    expect(maintenanceRoots()).toEqual({ officeData: DATA, home: homedir() });
    for (const [policy, entry] of Object.entries(POLICIES)) {
        const template = policyTemplate(policy);
        expect(template).toEqual(templateFor(entry.provider, { kind: entry.kind, browser: entry.browser, registry: DEFAULT_REGISTRY }, maintenanceRoots()));
        expect([template.policy, template.provider], policy).toEqual([policy, entry.provider]);
    }
    expect(() => policyTemplate('codex-editor')).toThrow(/Unknown policy/);
});
