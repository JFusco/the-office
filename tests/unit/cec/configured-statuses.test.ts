import { afterEach, expect, test } from 'vitest';
import { PROJECT_BINDINGS, projectById } from '../../../server/office/projects';
import { eligibility } from '../../../server/cec/workflow';
import { resolveBlockedTransition } from '../../../server/cec/parking/blocked-transition';
import { defaultPickupStatus } from '../../../server/delivery/intake/default-pickup';
import type { ProjectBindings } from '../../../server/office/project-bindings-config';

const registry = PROJECT_BINDINGS as Map<string, ProjectBindings>, original = registry.get('cec')!;
afterEach(() => registry.set('cec', original));

/** The cec project with another team's Jira workflow; everything else is unchanged. */
function otherWorkflow() {
    const statuses = {
        intake: [{ name: 'Ready', id: '10042' }],
        stages: { understand: 'Doing', 'code-review': 'Peer Review', 'repair-review': 'Peer Review', preview: 'Ready to Test', qa: 'Testing', retest: 'Testing' },
        readyForStaging: 'Awaiting Release', blocked: 'On Hold',
    };
    const binding = { ...original, jira: { ...original.jira, statuses } };
    registry.set('cec', binding);
    return binding.jira;
}
const ticket = (status: string, statusId: string) => ({ key: 'CEC-7', assignee: original.jira.account, subtask: false, boardMember: true, status, statusId });

test('the legacy workflow keeps CEC\'s intake, pickup default and messages', () => {
    const project = projectById('cec');
    expect(eligibility(project, ticket('To Do', '10000'))).toBe('');
    expect(eligibility(project, ticket('Open', '1'))).toBe('');
    expect(eligibility(project, ticket('To Do', '1'))).toBe('Intake requires exact To Do or Open status');
    expect(defaultPickupStatus(project)).toBe('To Do');
    expect(defaultPickupStatus(projectById('brain'))).toBe('Ready');
});

test('intake and the pickup default follow the configured intake statuses', () => {
    otherWorkflow();
    const project = projectById('cec');
    expect(eligibility(project, ticket('Ready', '10042'))).toBe('');
    expect(eligibility(project, ticket('To Do', '10000'))).toBe('Intake requires exact Ready status');
    expect(eligibility(project, ticket('Ready', '10000'))).toBe('Intake requires exact Ready status');
    expect(defaultPickupStatus(project)).toBe('Ready');
});

test('parking looks for the configured Blocked status, never the literal', async () => {
    const jira = otherWorkflow();
    const offering = (transitions: object[]): any => async () => JSON.stringify({ data: { transitions } });
    expect(await resolveBlockedTransition(offering([{ id: '5', toName: 'On Hold', fields: [] }, { id: '6', toName: 'Blocked', fields: [] }]), jira, 'CEC-7')).toBe('5');
    await expect(resolveBlockedTransition(offering([{ id: '6', toName: 'Blocked', fields: [] }]), jira, 'CEC-7')).rejects.toThrow('0 transitions to On Hold');
});
