import { expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { fileDigest } from '../../../server/release/release-manifest';
import { startService } from '../../../server/release/start-service';
import { make, OP } from './step-fixture';

const stoppedWorld = (behaviour = {}) => { const w = make(behaviour); w.service.loaded = false; return w; };

test('the installed plist is loaded once, and a service already loaded is confirmed without loading again', async () => {
    const w = stoppedWorld(), sha = fileDigest(w.plistPath);
    expect(await startService(w.ctx, OP, 'start', sha)).toEqual({ status: 'verified', receipt: { loaded: true } });
    expect(await startService(w.ctx, OP, 'start', sha)).toMatchObject({ status: 'verified' });
    expect(w.calls).toEqual(['bootstrap']);
});

test('a plist other than the one this operation installed is not loaded', async () => {
    const w = stoppedWorld(), sha = fileDigest(w.plistPath);
    writeFileSync(w.plistPath, '{"Label":"someone else wrote this"}');
    expect(await startService(w.ctx, OP, 'start', sha)).toEqual({ status: 'rejected', reason: expect.stringContaining('not the one this deployment installed') });
    expect(w.calls).toEqual([]);
});

test('a load launchd refuses is uncertain and is not attempted again under the same operation', async () => {
    const w = stoppedWorld({ bootstrap: 'fail' }), sha = fileDigest(w.plistPath);
    expect(await startService(w.ctx, OP, 'start', sha)).toMatchObject({ status: 'uncertain' });
    w.behaviour.bootstrap = undefined;
    expect(await startService(w.ctx, OP, 'start', sha)).toMatchObject({ status: 'uncertain' });
    expect(w.calls).toEqual(['bootstrap']);
});
