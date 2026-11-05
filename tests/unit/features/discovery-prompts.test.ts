import { expect, test } from 'vitest';
import { discoveryPrompt, planPrompt } from '../../../server/features/discovery-prompts';
import { workerProfile } from '../../../server/workers/worker-profiles';
import { assertWorkerLane } from '../../../server/workers/worker-lanes';
test('Casey asks bounded decisions and remains a reader; Alex receives the recorded baseline', () => {
    const feature = { id: 'f', intent: 'Search', sourceTicket: '', baseline: { path: '/snapshot', sha: 'frozen' }, conversation: [], briefs: [], publication: [], approvals: [] } as any;
    expect(discoveryPrompt(feature)).toContain('at most three');
    expect(discoveryPrompt(feature)).toContain('4ae2317ddb22b046e26455e4f9c9b3aaaf62212d');
    expect(planPrompt(feature, 'Provider contract')).toContain('/snapshot');
    for (const stage of ['feature-research', 'feature-question-round', 'feature-plan']) expect(workerProfile(stage, false).readOnly).toBe(true);
    expect(() => assertWorkerLane('analyst', 'feature-research', true)).not.toThrow();
    expect(() => assertWorkerLane('analyst', 'github-implement', false)).toThrow();
});
