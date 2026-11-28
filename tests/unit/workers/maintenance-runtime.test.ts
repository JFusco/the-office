import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { maintenanceAssignment, qualifiedLaunch } from '../../../server/workers/maintenance-runtime';
import { readerPolicy } from '../../../server/workers/maintenance-launch';
import { templateFor } from '../../../server/workers/maintenance-invocation';
import { LaunchQualificationRefusal } from '../../../server/workers/launch-qualification';
import { fakeEnvironment, install, passingRecord } from './qualification/support';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const SESSION = '0f8fad5b-d9cb-469f-a165-70867728950e';

test('the assignment records the explicit policy beside the historical profile; nothing for other launches', () => {
    expect(maintenanceAssignment(undefined, true)).toEqual({});
    expect(maintenanceAssignment({ policy: readerPolicy('/repo') }, true)).toEqual({ maintenancePolicy: { version: 1, kind: 'reader', cwd: '/repo', id: 'claude-reader', scratch: null } });
});

test('a qualified launch is retained in the session directory; an unqualified one leaves nothing and refuses', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-maintenance-runtime-')); roots.push(root);
    const store: any = { dataRoot: root, clock: { now: () => new Date('2026-11-28T00:00:00Z') } }, schemaPath = resolve(root, 'schema.json');
    writeFileSync(schemaPath, '{}');
    const input = { store, dir: root, id: SESSION, stage: 'draft-pr', claude: true, maintenance: { policy: readerPolicy('/repo') }, schema: '{}', schemaPath, environment: fakeEnvironment() };
    expect(() => qualifiedLaunch(input)).toThrow(LaunchQualificationRefusal);
    install(root, passingRecord(templateFor('claude', { kind: 'reader' }, { officeData: '', home: '' }), ['draft-pr']), 'claude-reader');
    const invocation = qualifiedLaunch(input);
    expect(JSON.parse(readFileSync(resolve(root, 'maintenance-launch.json'), 'utf8'))).toMatchObject({ workerId: SESSION, stage: 'draft-pr', policy: 'claude-reader', args: invocation.args, cwd: '/repo' });
});
