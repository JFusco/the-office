import { afterEach, expect, test } from 'vitest';
import { join } from 'node:path';
import { Store } from '../../../../server/store/store';
import { DATA } from '../../../../server/office/config';
import { PROJECT_BINDINGS, projectById } from '../../../../server/office/projects';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
import { cecIntakePrompt } from '../../../../server/cec/prompts/cec-reads';
import { cecChatPrompt } from '../../../../server/conversations/prompts/conversations';
import type { ProjectBindings } from '../../../../server/office/project-bindings-config';
import type { TeamMessage } from '../../../../src/shared';
import { ticket } from '../parking/fixtures';

const registry = PROJECT_BINDINGS as Map<string, ProjectBindings>, original = registry.get('cec')!;
const stores: Store[] = [];
afterEach(() => { registry.set('cec', original); stores.splice(0).forEach(store => store.close()); });

const AUTHORITY = 'Pat approved the Harbor delivery pilot. Draft PRs to develop only; no merge or deployment.';
const HTML = 'Existing CEC authority allows documented HTML when ADF is unavailable.';

/** The cec project with another team's target branch, workflow and prompt text. */
function otherProject(preview = '') {
    registry.set('cec', {
        ...original,
        jira: { ...original.jira, statuses: {
            intake: [{ name: 'Ready', id: '10042' }, { name: 'Selected', id: '10043' }],
            stages: { understand: 'Doing', 'code-review': 'Peer Review', 'repair-review': 'Peer Review', preview: 'Ready to Test', qa: 'Testing', retest: 'Testing' },
            readyForStaging: 'Awaiting Release', blocked: 'On Hold',
        } },
        prompt: { authority: AUTHORITY, preview, htmlFallback: false, preflightStatuses: ['Doing', 'Peer Review', 'Testing'], repository: { name: 'harbor-web', target: 'develop' } },
    });
    const store = new Store(':memory:', { ...projectById('cec'), target: 'develop' }, join(DATA, 'configured-prompt'));
    stores.push(store);
    return store;
}
const render = (store: Store, stage: Parameters<typeof cecPrompt>[2]) => cecPrompt(store, { ...ticket(), stage }, stage, 'developer', '/artifacts');

test('a delivery prompt takes its authority, branch, statuses and repository from the project binding', () => {
    const store = otherProject();
    for (const stage of ['implement', 'draft-pr', 'ready-for-staging', 'qa'] as const) {
        const prompt = render(store, stage);
        expect(prompt).toContain(`AUTHORITY: ${AUTHORITY}\n`);
        expect(prompt).toContain('REPOSITORY: {"name":"harbor-web","target":"develop"}.');
        expect(prompt).toContain('freshly fetched origin/develop;');
        expect(prompt).toContain('Intake status may move through PM-managed Doing/Peer Review/Testing; reassignment, deletion, another owner, On Hold or unrelated');
        // The shared APPROACH_GUIDANCE carries its own 2026-10-27 delegation; only CEC's dated pilot approval must be gone.
        for (const legacy of ['plan on 2026-10-27', 'LOWER-ENVIRONMENT', 'COS_DEV_PORT', 'origin/staging', HTML, 'BROWSER PREVIEW ONLY'])
            expect(prompt).not.toContain(legacy);
    }
    expect(render(store, 'implement')).toContain('worktree from fresh origin/develop, implement');
    expect(render(store, 'draft-pr')).toContain('one DRAFT Azure DevOps PR to develop;');
    expect(render(store, 'ready-for-staging')).toContain('before transitioning Jira to Awaiting Release.');
    expect(render(store, 'ready-for-staging')).not.toContain('Ready for Staging');
});

test('configured preview guidance renders as its own line', () => {
    const prompt = render(otherProject('Start the Harbor app on an isolated port.'), 'preview');
    expect(prompt).toContain('\nBROWSER PREVIEW ONLY (not needed for focused checks): Start the Harbor app on an isolated port.\n');
});

test('intake and chat prompts follow the configured intake statuses and HTML policy', () => {
    const store = otherProject();
    expect(cecIntakePrompt(store)).toContain(`project = CEC AND assignee = "${original.jira.account}" AND status IN ("Ready", "Selected") AND`);
    const message = { id: 'm-1', requestId: 'm-1', from: 'human', to: 'pm', ticket: '', actionId: '', body: 'Status?', status: 'queued', createdAt: '', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] } as TeamMessage;
    store.state.coordination = undefined;
    const chat = cecChatPrompt(store, 'pm', message, '', null, []);
    expect(chat).toContain('preserve original content/media/metadata. Discover');
    expect(chat).not.toContain('CEC HTML exception');
    expect(chat).toContain('"pickup":{"enabled":true,"status":"Ready"}');
});
