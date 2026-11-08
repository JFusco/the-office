import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { investigationFixture } from './fixture';
import { diagnostic } from '../../workers/lifecycle/fixture';
export const sourceRef = 'office-source:server/workers/process.ts';
export const officeFix = { status: 'proposed' as const, title: 'Synthetic fixture fix for helper lifecycle', changes: [{ sourceRef, change: 'Synthetic scoped change to helper shutdown ownership.' }], tests: ['An isolated owned-child fixture verifies rejection and cleanup before settlement.'], evidenceRefs: ['artifact:sender/process-lifecycle.json'] };
export function subprocessFixture(retain = true) {
    const f = investigationFixture(); f.worker.failure!.code = 'surviving-subprocesses';
    Object.assign(f.delivery, { status: 'confirmed', channelId: 'D123', messageTs: '1794105786.541999', permalink: 'https://fixture.slack.com/archives/D123/p1794105786541999' });
    if (retain) { const dir = resolve(f.root, 'sessions/sender'); mkdirSync(dir, { recursive: true }); writeFileSync(resolve(dir, 'process-lifecycle.json'), JSON.stringify({ ...diagnostic(), processGroup: f.worker.processId })); }
    return f;
}
