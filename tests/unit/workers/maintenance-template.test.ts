import { expect, test } from 'vitest';
import { PLACEHOLDERS } from '../../../server/workers/launch-qualification';
import { POLICIES, policyTemplate } from '../../../server/workers/qualification/policy-templates';
import type { LaunchTemplate } from '../../../server/workers/maintenance-template';

const strings = (value: unknown): string[] => typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

test('every launch template has the record shape and uses only the per-assignment placeholders', () => {
    for (const policy of Object.keys(POLICIES)) {
        const template: LaunchTemplate = policyTemplate(policy);
        expect(Object.keys(template).sort(), policy).toEqual(['arguments', 'filesystem', 'network', 'policy', 'provider', 'settings', 'tools']);
        expect(Object.keys(template.filesystem).sort(), policy).toEqual(['denied', 'readable', 'writable']);
        expect(Object.keys(template.network), policy).toEqual(['allowed']);
        const used = [...new Set([...strings(template.arguments), ...strings(template.settings), ...strings(template.filesystem)].flatMap(text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1])))];
        for (const name of used) expect(PLACEHOLDERS as readonly string[], `${policy} {${name}}`).toContain(name);
    }
});
