import { createHash, randomUUID } from 'node:crypto';
import type { Feature } from '../../src/contracts/features';
import type { OfficeSnapshot } from '../../src/shared';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export function featureFixture(snapshot: OfficeSnapshot, path: string, body?: Record<string, any>) {
    const id = path.split('/')[3], features = snapshot.features ??= [];
    if (!body) return id ? features.find(f => f.id === id) : { features };
    const now = new Date().toISOString();
    if (body.action === 'create') {
        const feature: Feature = { id: randomUUID(), projectId: snapshot.project!.id, title: body.title, intent: body.intent, sourceGoalId: body.sourceGoalId || '', sourceTicket: body.sourceTicket || '', revision: 1, phase: 'discovery', status: 'waiting', paused: false, detail: 'Casey is waiting for your answer.', createdAt: now, updatedAt: now, enqueuedAt: now, rounds: [{ id: 'audience', revision: 1, questions: [{ id: 'audience', question: 'Who should use this feature?', recommendation: 'Editors', choices: ['Editors', 'Everyone'] }], answers: {}, createdAt: now }], briefs: [], plans: [], conversation: [{ id: 'intro', role: 'analyst', text: 'I researched the synthetic project. Please settle the audience.', at: now }], approvals: [], publication: [], attempts: [], timing: [], requests: {}, reviewHistory: [] };
        features.push(feature); return feature;
    }
    const feature = features.find(f => f.id === id);
    if (!feature || body.expectedRevision !== feature.revision) throw new Error('Feature revision changed');
    const doc = (markdown: string) => ({ id: randomUUID(), revision: feature.revision, digest: hash(markdown), markdown, path: '', createdAt: now });
    if (body.action === 'answer') {
        const round = feature.rounds.at(-1)!;
        if (round.id !== body.roundId) throw new Error('Round changed');
        round.answers = body.answers; feature.revision++;
        feature.briefs.push(doc('Fixture brief: editors can find content. Acceptance: keyboard access and useful results.'));
        feature.conversation.push({ id: randomUUID(), role: 'human', text: Object.values(body.answers).join('\n'), at: now });
        feature.detail = 'Review the brief, then create the plan.';
    }
    if (body.action === 'create-plan') {
        feature.manifest = { provider: snapshot.project!.provider, destination: snapshot.project!.repository, items: [{ id: 'search', title: 'Implement editor search', key: '', action: 'create', predecessor: '', criteria: ['Editors can search content with a keyboard.'], operations: [{ id: 'create', kind: 'create', payload: { title: 'Implement editor search', body: 'Exact fixture ticket content' }, expected: {} }] }] };
        feature.plans.push(doc('Full synthetic implementation plan. Add search and verify keyboard access.\n\x60\x60\x60feature-manifest\n' + JSON.stringify(feature.manifest) + '\n\x60\x60\x60'));
        feature.review = { attemptDir: '', run: 'synthetic-review', helper: 'fixture', helperCommit: 'fixture', revision: 3, fingerprint: 'fixture', researchDigest: 'fixture-research', status: 'complete', stage: 'finalize', processes: [], acceptedArtifact: 'fixture', acceptedDigest: feature.plans[0].digest };
        feature.phase = 'approval'; feature.detail = 'Synthetic review complete; inspect the exact ticket preview.';
    }
    if (body.action === 'approve') {
        if (body.planDigest !== feature.plans.at(-1)!.digest || body.manifestDigest !== hash(JSON.stringify(feature.manifest))) throw new Error('Approval differs from preview');
        feature.phase = 'delivery'; feature.detail = 'Fixture ticket publication verified.';
        feature.publication = [{ id: 'search', key: 'GH-999', url: 'https://example.test/issues/999', approvalId: 'fixture', verified: true, queued: true, effects: [], fence: false }];
    }
    if (body.action === 'pause') feature.paused = true;
    if (body.action === 'resume') feature.paused = false;
    if (body.action === 'revise') {
        feature.revision++; feature.phase = 'discovery'; feature.manifest = undefined; feature.review = undefined;
        feature.conversation.push({ id: randomUUID(), role: 'human', text: body.instruction, at: now });
        feature.detail = 'Updated decision saved.';
    }
    return feature;
}
