import { afterEach, expect, test } from 'vitest';
import { appendFileSync, copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { deployJournalPath, readDeployJournal, recordDeployStep, startDeployJournal } from '../../../server/release/deploy-journal';

const OP = 'deploy-20261120-a', STEPS = ['acquire-fence', 'wait-idle', 'stop-service'];
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function started() { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-journal-')); roots.push(dir); startDeployJournal(dir, OP, STEPS, { target: 'c'.repeat(40) }); return dir; }

test('a new journal holds the plan and no step; starting the same operation twice is refused', () => {
    const dir = started();
    expect(readDeployJournal(dir, OP)).toEqual({ operation: OP, steps: STEPS, facts: { target: 'c'.repeat(40) }, receipts: {}, last: null, torn: false });
    expect(() => startDeployJournal(dir, OP, STEPS, {})).toThrow();
    expect(() => readDeployJournal(dir, 'deploy-20261120-b')).toThrow('has no journal');
});

test('reopening reports the last step, its state and its receipt', () => {
    const dir = started();
    recordDeployStep(dir, OP, 'acquire-fence', 'intended');
    recordDeployStep(dir, OP, 'acquire-fence', 'done', { tokenDigest: 'abc' });
    recordDeployStep(dir, OP, 'wait-idle', 'intended');
    expect(readDeployJournal(dir, OP).last).toMatchObject({ step: 'wait-idle', state: 'intended' });
    expect(recordDeployStep(dir, OP, 'wait-idle', 'uncertain', { reason: 'lost response' }).last).toMatchObject({ step: 'wait-idle', state: 'uncertain', receipt: { reason: 'lost response' } });
});

test('a step out of order, unknown, unsettled or settled without being intended is refused and writes nothing', () => {
    const dir = started(), path = deployJournalPath(dir, OP);
    const refused = (step: string, state: Parameters<typeof recordDeployStep>[3], message: string) => {
        const before = readFileSync(path, 'utf8');
        expect(() => recordDeployStep(dir, OP, step, state)).toThrow(message);
        expect(readFileSync(path, 'utf8')).toBe(before);
    };
    refused('wait-idle', 'intended', 'out of order');
    refused('acquire-fence', 'done', 'not the intended step');
    refused('restart-everything', 'intended', 'not part of deployment');
    recordDeployStep(dir, OP, 'acquire-fence', 'intended');
    refused('wait-idle', 'intended', 'acquire-fence is intended');
    refused('acquire-fence', 'intended', 'acquire-fence is intended');
    recordDeployStep(dir, OP, 'acquire-fence', 'failed');
    refused('wait-idle', 'intended', 'acquire-fence is failed');
    refused('acquire-fence', 'done', 'not the intended step');
});

test('an entry written under another operation ID makes the journal unreadable', () => {
    const dir = started();
    appendFileSync(deployJournalPath(dir, OP), `${JSON.stringify({ type: 'step', operation: 'deploy-20261120-b', at: '2026-11-20T00:00:00.000Z', step: 'acquire-fence', state: 'intended' })}\n`);
    expect(() => readDeployJournal(dir, OP)).toThrow('belongs to deployment deploy-20261120-b');
});

test('a journal whose header names another operation is unreadable', () => {
    const dir = started();
    copyFileSync(deployJournalPath(dir, OP), deployJournalPath(dir, 'deploy-20261120-b'));
    expect(() => readDeployJournal(dir, 'deploy-20261120-b')).toThrow(`names ${OP}`);
});

test('facts that cannot be saved create no journal, so the operation can start again', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-journal-')); roots.push(dir);
    expect(() => startDeployJournal(dir, OP, STEPS, { size: 1n })).toThrow();
    expect(existsSync(deployJournalPath(dir, OP))).toBe(false);
    expect(startDeployJournal(dir, OP, STEPS, {}).last).toBeNull();
});

test('a cut-short final line is reported as torn and nothing more is appended', () => {
    const dir = started();
    recordDeployStep(dir, OP, 'acquire-fence', 'intended');
    appendFileSync(deployJournalPath(dir, OP), '{"type":"step","operation":"deploy-2026');
    expect(readDeployJournal(dir, OP)).toMatchObject({ torn: true, last: { step: 'acquire-fence', state: 'intended' } });
    expect(() => recordDeployStep(dir, OP, 'acquire-fence', 'done')).toThrow('cut-short line');
});

test('after the last step is done nothing further can start', () => {
    const dir = started();
    for (const step of STEPS) { recordDeployStep(dir, OP, step, 'intended'); recordDeployStep(dir, OP, step, 'done'); }
    expect(() => recordDeployStep(dir, OP, 'acquire-fence', 'intended')).toThrow('out of order; nothing is next');
});

test('the receipts of completed steps are kept by step for a restarted controller', () => {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-deploy-journal-')); roots.push(dataRoot);
    const operation = 'deploy-20261120t030000z-0a0b0c0d';
    startDeployJournal(dataRoot, operation, ['fence', 'stop', 'start'], {});
    recordDeployStep(dataRoot, operation, 'fence', 'intended'); recordDeployStep(dataRoot, operation, 'fence', 'done', { tokenDigest: 'd' });
    recordDeployStep(dataRoot, operation, 'stop', 'intended'); recordDeployStep(dataRoot, operation, 'stop', 'done');
    recordDeployStep(dataRoot, operation, 'start', 'intended'); recordDeployStep(dataRoot, operation, 'start', 'failed', { reason: 'no' });
    expect(readDeployJournal(dataRoot, operation).receipts).toEqual({ fence: { tokenDigest: 'd' }, stop: {} });
});
