import { afterEach, expect, test } from 'vitest';
import { mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { saveStoppedBaseArtifact, stoppedBaseUpdateResolved } from '../../../../server/delivery/recovery/stopped-base-disposition';
afterEach(cleanupFakes);
test('immutable disposition preparation may reuse identical bytes after a lost tail, but never replace them', () => {
    const f = fakeGitHub(), job = f.candidate({}); mkdirSync(resolve(f.store.dataRoot,'ticket-work',job.id),{recursive:true});
    const first = saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: true });
    expect(saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: true }, true)).toEqual(first);
    expect(() => saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: false }, true)).toThrow('differs');
    expect(() => saveStoppedBaseArtifact(f.store, job, '../escape.json', {})).toThrow();
});
test('queued stages and completed flags alone never resolve the original recovery', () => {
    const f = fakeGitHub(), job = f.candidate({stage:'lead-pr'});
    job.stoppedBaseUpdate = { originalWorkId:'original', phase:'lead', audit:{state:'completed'}, disposition:{path:'/missing',sha256:'a'} } as any;
    expect(stoppedBaseUpdateResolved(f.store,{key:job.key,head:'original'})).toBe(false);
    expect(stoppedBaseUpdateResolved(f.store,{key:job.key,head:job.head})).toBe(false);
});
