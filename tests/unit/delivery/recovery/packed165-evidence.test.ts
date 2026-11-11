import { afterEach, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { packed165Admitted } from '../../../../server/delivery/recovery/packed165-evidence';
import { assertAutomationEffects } from '../../../../server/delivery/readiness/automation-effects';

afterEach(cleanupFakes);
test('only the exact retained original Effect is exempt, and every other unknown write still blocks', async () => {
    const f = packed165Fixture(); await f.run();
    expect(() => assertAutomationEffects(f.store, f.job)).not.toThrow();
    f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unresolved', `${f.store.project.id}:delivery:${f.job.id}`, 'uncertain', JSON.stringify({ id: 'unresolved', status: 'uncertain' }));
    expect(() => assertAutomationEffects(f.store, f.job)).toThrow('Unresolved external writes');
    expect(f.store.getEffect(f.effect.id)).toEqual(f.effect);
});
test.each(['head', 'branch', 'worktree', 'metadata-root', 'metadata-bytes', 'proof', 'effect', 'request', 'claim'])('tampered %s cannot retain a green-only admission', async scenario => {
    const f = packed165Fixture(); await f.run(); const r = f.job.packedPublicationRepair!;
    if (scenario === 'head') f.job.head = 'd'.repeat(40);
    if (scenario === 'branch') f.job.branch += '-other';
    if (scenario === 'worktree') f.job.worktree += '-other';
    if (scenario === 'metadata-root') r.contentRoot += '-other';
    if (scenario === 'metadata-bytes') writeFileSync(resolve(r.contentRoot, 'pr.json'), '{}');
    if (scenario === 'proof') writeFileSync(r.proofPath, '{}');
    if (scenario === 'effect') f.store.db.prepare('UPDATE effects SET body=? WHERE id=?').run(JSON.stringify({ ...f.effect, status: 'verified' }), f.effect.id);
    if (scenario === 'request') f.request.action = 'other';
    if (scenario === 'claim') f.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify({ ...f.claim, stage: 'other' }), f.claim.id);
    expect(packed165Admitted(f.store, f.job)).toBe(false);
});
