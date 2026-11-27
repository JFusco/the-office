import { randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { CODEX_LAST_MESSAGE_ARGUMENT, CODEX_SCHEMA_ARGUMENT, prepareReaderInput, readerFiles } from '../../../server/overseer/reader-input';
import { createRunDirectories } from '../../../server/overseer/run-directories';
import { validateRunnerRoot } from '../../../server/overseer/runner-root';
import { VERDICT_SCHEMA } from '../../../server/overseer/stages/triage';
import { checkPolicyDirectories } from '../../../server/overseer/worker-sandbox-policy';
import { tempDir } from './runner-world';
import { frozen } from './triage-world';

const allocate = () => createRunDirectories(validateRunnerRoot(join(tempDir(), 'runner'), {}), randomUUID());

test('a fresh allocation gets its snapshot, the identified evidence and the schema, ready for its policy', () => {
    const run = allocate(), input = frozen();
    expect(() => checkPolicyDirectories(run, [])).toThrow();
    const files = prepareReaderInput(run, input);
    expect(files).toEqual(readerFiles(run));
    expect(readFileSync(files.evidence, 'utf8')).toBe(input.serialized);
    expect(readFileSync(files.schema, 'utf8')).toBe(VERDICT_SCHEMA);
    expect(lstatSync(files.snapshot).mode & 0o777).toBe(0o700);
    expect(lstatSync(files.evidence).mode & 0o777).toBe(0o600);
    expect(() => checkPolicyDirectories(run, [])).not.toThrow();
});

test('the Codex arguments are the same for every allocation and resolve inside each one', () => {
    const a = allocate(), b = allocate();
    for (const run of [a, b]) {
        const files = readerFiles(run);
        expect(resolve(run.home, CODEX_SCHEMA_ARGUMENT)).toBe(files.schema);
        expect(resolve(run.home, CODEX_LAST_MESSAGE_ARGUMENT)).toBe(files.lastMessage);
    }
    expect(readerFiles(a).schema).not.toBe(readerFiles(b).schema);
});

test('evidence that does not match its identity, a second staging and a stale answer file are each refused', () => {
    const input = frozen();
    expect(() => prepareReaderInput(allocate(), { ...input, identity: 'f'.repeat(64) })).toThrow('does not match its identity');
    const run = allocate();
    prepareReaderInput(run, input);
    expect(() => prepareReaderInput(run, input)).toThrow('already has a snapshot');
    const stale = allocate();
    writeFileSync(readerFiles(stale).lastMessage, '{}');
    expect(() => prepareReaderInput(stale, input)).toThrow('already exists');
});
