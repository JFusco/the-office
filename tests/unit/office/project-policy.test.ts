import { expect, test } from 'vitest';
import { projectPolicy, resolveProjectPolicy } from '../../../server/office/project-policy';
import { handsOff } from '../../../server/delivery/harness/scope';

const github = (id: string) => ({ id, provider: 'github' as const });
const azure = (id: string) => ({ id, provider: 'azure' as const });

test('a config without policy blocks keeps what each existing project did before', () => {
    expect(resolveProjectPolicy(azure('cec'))).toEqual({ merge: 'human', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 9, weekends: false }, holds: {} });
    expect(resolveProjectPolicy(github('cms-field-vocabulary'))).toEqual({ merge: 'harness', handsOff: true, releaseMarkerCheck: true, checkpoint: { hour: 15, weekends: true }, holds: {} });
    expect(resolveProjectPolicy(github('brain'))).toEqual({ merge: 'harness', handsOff: true, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true }, holds: {} });
});

test('a new project defaults by provider and opts in to harness mechanics explicitly', () => {
    expect(resolveProjectPolicy(github('web'))).toEqual({ merge: 'harness', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true }, holds: {} });
    expect(resolveProjectPolicy(azure('acme'))).toEqual({ merge: 'human', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true }, holds: {} });
    expect(resolveProjectPolicy(github('web'), { handsOff: true }).handsOff).toBe(true);
    // An id that is also an Object.prototype key must not pick up inherited values.
    expect(resolveProjectPolicy(github('constructor')).handsOff).toBe(false);
});

test('each configured key overrides its own default and nothing else', () => {
    expect(resolveProjectPolicy(github('brain'), { merge: 'human', handsOff: false })).toEqual({ merge: 'human', handsOff: false, releaseMarkerCheck: false, checkpoint: { hour: 17, weekends: true }, holds: {} });
    expect(resolveProjectPolicy(azure('cec'), { checkpoint: { hour: 11 } }).checkpoint).toEqual({ hour: 11, weekends: false });
    expect(resolveProjectPolicy(azure('cec'), { checkpoint: { weekends: true } }).checkpoint).toEqual({ hour: 9, weekends: true });
    expect(resolveProjectPolicy(github('web'), { checkpoint: { hour: 0 } }).checkpoint).toEqual({ hour: 0, weekends: true });
});

test('lookup reads the start-up registry by project id and the result cannot be mutated', () => {
    const inputs = new Map([['web', { merge: 'human' as const }]]);
    expect(projectPolicy(github('web'), inputs).merge).toBe('human');
    expect(projectPolicy(github('other'), inputs).merge).toBe('harness');
    const policy = projectPolicy(github('web'), inputs);
    expect(() => { (policy as { merge: string }).merge = 'harness'; }).toThrow();
    expect(() => { (policy.checkpoint as { hour: number }).hour = 1; }).toThrow();
});

test('hands-off scope follows the resolved policy', () => {
    expect(handsOff({ project: github('brain') } as never)).toBe(true);
    expect(handsOff({ project: github('cms-field-vocabulary') } as never)).toBe(true);
    expect(handsOff({ project: azure('cec') } as never)).toBe(false);
    expect(handsOff({ project: github('web') } as never)).toBe(false);
});

test('the release-marker check is on by default for CMS only; explicit false turns it off and other projects opt in explicitly', async () => {
    const { releaseMarkerApplies } = await import('../../../server/delivery/publication/release-marker-check');
    expect(resolveProjectPolicy(github('cms-field-vocabulary')).releaseMarkerCheck).toBe(true);
    expect(resolveProjectPolicy(github('cms-field-vocabulary'), { releaseMarkerCheck: false }).releaseMarkerCheck).toBe(false);
    expect(resolveProjectPolicy(github('cms-field-vocabulary'), { handsOff: true }).releaseMarkerCheck).toBe(true);
    for (const id of ['brain', 'accessibility-standards', 'web']) expect(resolveProjectPolicy(github(id)).releaseMarkerCheck).toBe(false);
    expect(resolveProjectPolicy(azure('cec')).releaseMarkerCheck).toBe(false);
    expect(resolveProjectPolicy(github('web'), { releaseMarkerCheck: true }).releaseMarkerCheck).toBe(true);
    // Enforcement also needs hands-off GitHub delivery.
    expect(releaseMarkerApplies({ project: github('cms-field-vocabulary') } as never)).toBe(true);
    expect(releaseMarkerApplies({ project: github('brain') } as never)).toBe(false);
    expect(releaseMarkerApplies({ project: azure('cec') } as never)).toBe(false);
});
