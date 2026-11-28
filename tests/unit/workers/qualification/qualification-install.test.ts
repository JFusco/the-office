import { afterEach, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { templateMismatch } from '../../../../server/workers/launch-qualification';
import { installRecord, installRefusal, recordSkeleton } from '../../../../server/workers/qualification/qualification-install';
import { qualificationFile } from '../../../../server/workers/launch-qualification';
import { claudeEditorTemplate } from '../../../../server/workers/claude-maintenance-arguments';
import { dataRoot, fakeEnvironment, passingRecord } from './support';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const template = claudeEditorTemplate({ officeData: '/office/data', home: '/home/joe' }, ['registry.npmjs.org:443']);

test('the skeleton lists the exact template, the current pin and every control still to run', () => {
    const skeleton = recordSkeleton(template, ['proposal'], fakeEnvironment());
    expect(skeleton).toMatchObject({ policy: 'claude-editor', provider: 'claude', arguments: template.arguments, executable: { version: '2.1.332' } });
    expect(skeleton.controls.every(control => control.result === 'unavailable')).toBe(true);
    expect(skeleton.controls.map(control => control.id)).toEqual(expect.arrayContaining(['local-commit-with-hooks', 'git-push-https', 'write-git-config', 'write-office-data']));
});

test('only a passing record of this template, pin, binary and host installs; the replaced record is kept', () => {
    const record = passingRecord(template, ['proposal']);
    expect(installRefusal(record, template, fakeEnvironment())).toBeUndefined();
    expect(installRefusal({ ...record, arguments: [...record.arguments, '--dangerously-skip-permissions'] }, template, fakeEnvironment())).toMatch(/arguments differ/);
    expect(installRefusal(record, template, fakeEnvironment({ sha256: 'e'.repeat(64) }))).toMatch(/installed binary/);
    expect(installRefusal({ ...record, controls: record.controls.slice(1) }, template, fakeEnvironment())).toMatch(/missing/);
    const root = dataRoot(cleanup);
    installRecord(root, record, '2026-11-28T01:00:00.000Z');
    installRecord(root, { ...record, qualifiedBy: 'requalified' }, '2026-11-28T02:00:00.000Z');
    expect(JSON.parse(readFileSync(qualificationFile(root, 'claude-editor'), 'utf8')).qualifiedBy).toBe('requalified');
    expect(readdirSync(dirname(qualificationFile(root, 'claude-editor'))).filter(name => name.endsWith('.replaced'))).toHaveLength(1);
});

test('a record binding a canonical executable that is not registered for its provider is not installed', () => {
    const record = passingRecord(template, ['proposal']);
    const elsewhere = { ...record, executable: { ...record.executable, realpath: '/opt/elsewhere/claude' } };
    expect(installRefusal(elsewhere, template, fakeEnvironment({ realpath: '/opt/elsewhere/claude' }))).toMatch(/not a registered canonical path for claude/);
});

test('the one template comparison names the first field a record no longer shares with this build', () => {
    const record = passingRecord(template, ['proposal']);
    expect(templateMismatch(record, template)).toBeUndefined();
    expect(templateMismatch({ ...record, tools: ['Read'] }, template)).toMatch(/tools differ/);
    expect(templateMismatch({ ...record, network: { allowed: [] } }, template)).toMatch(/network differ/);
    expect(templateMismatch({ ...record, policy: 'claude-reader' }, template)).toMatch(/another policy/);
});
