import { expect, test } from 'vitest';
import { boundedCTOContext } from '../../../server/leadership/chat-context';
import { ctoChatPrompt } from '../../../server/conversations/prompts/conversations';

test('large CTO history/provider payload stays bounded without changing goals, versions or the human request', () => {
    const goal = { id: 'design-passport', projectId: 'cec', title: 'Design Passport walkthrough', status: 'active', updatedAt: 'version', detail: 'scope'.repeat(10000) };
    const context = { viewedProject: 'CEC', projects: Array.from({ length: 8 }, (_, i) => ({ project: { id: `p${i}`, name: `Project ${i}` }, goals: [goal], github: { runs: 'x'.repeat(200000) }, azure: { builds: 'x'.repeat(200000) }, goalEvidence: { prs: Array.from({ length: 100 }, (_, n) => ({ id: n, body: 'scope'.repeat(10000) })) } })), history: Array.from({ length: 30 }, () => ({ body: 'history'.repeat(10000) })) };
    const original = JSON.stringify(context), message = { body: 'The videos are here: https://example.test/videos. Mark this goal complete.' };
    const bounded = boundedCTOContext(context);
    expect(JSON.stringify(bounded).length).toBeLessThanOrEqual(180000);
    expect(bounded.directory[0].goals[0]).toEqual({ id: goal.id, projectId: 'cec', title: goal.title, status: 'active', updatedAt: 'version' });
    expect(bounded.coverage.omittedSections).toBeGreaterThan(0);
    expect(bounded.coverage.instruction).toContain('never acceptance');
    expect(JSON.stringify(context)).toBe(original);
    const prompt = ctoChatPrompt({} as any, message as any, context, '');
    expect(prompt.length).toBeLessThan(200000);
    expect(prompt).toContain(JSON.stringify(message.body));
});

test('small context retains exact evidence and reports no omissions', () => {
    const context = { projects: [{ project: { id: 'cec' }, goals: [], goalEvidence: { observedAt: 'now', accepted: false } }], history: [] };
    const result = boundedCTOContext(context);
    expect(result.evidence).toEqual(context); expect(result.coverage.omittedSections).toBe(0);
});
