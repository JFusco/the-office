import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { readSignInWait, SIGN_IN_WAIT_FILE, SIGN_IN_WAIT_RULE } from '../../../server/qa/sign-in-wait';
import { officeQAGuidance } from '../../../server/qa/assignment';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const RECORD = { port: 58321, signInUrl: 'https://login.example.test/authorize', appUrl: 'https://app.example.test/' };
function run(content?: unknown) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-sign-in-')); roots.push(root);
    const qaRunDir = resolve(root, 'office-qa', 'qa-1'); mkdirSync(qaRunDir, { recursive: true });
    if (content !== undefined) writeFileSync(resolve(qaRunDir, SIGN_IN_WAIT_FILE), typeof content === 'string' ? content : JSON.stringify(content));
    return { root, qaRunDir };
}

test('reads the three fields a worker left in its run directory', () => {
    const { root, qaRunDir } = run(RECORD);
    expect(readSignInWait({ qaRunDir }, root)).toEqual(RECORD);
});

test.each<[string, unknown]>([
    ['there is no file', undefined],
    ['the file is not JSON', 'port 58321'],
    ['a field is missing', { port: 58321, signInUrl: RECORD.signInUrl }],
    ['there is a further field', { ...RECORD, cookie: 'x' }],
    ['the port is text', { ...RECORD, port: '58321' }],
    ['the port is a system port', { ...RECORD, port: 80 }],
    ['the port is out of range', { ...RECORD, port: 70000 }],
    ['the sign-in URL is not a web URL', { ...RECORD, signInUrl: 'file:///etc/passwd' }],
    ['the application URL is plain http on another host', { ...RECORD, appUrl: 'http://app.example.test/' }],
])('nothing is read when %s', (_name, content) => {
    const { root, qaRunDir } = run(content);
    expect(readSignInWait({ qaRunDir }, root)).toBeUndefined();
});

test('nothing is read without a run directory, or from outside the artifact root', () => {
    const { root, qaRunDir } = run(RECORD), other = run(RECORD);
    expect(readSignInWait(undefined, root)).toBeUndefined();
    expect(readSignInWait({ qaRunDir: '' }, root)).toBeUndefined();
    expect(readSignInWait({ qaRunDir: other.qaRunDir }, root)).toBeUndefined();
    // A file that is a link out of the root is not followed.
    const linked = run();
    symlinkSync(resolve(other.qaRunDir, SIGN_IN_WAIT_FILE), resolve(linked.qaRunDir, SIGN_IN_WAIT_FILE));
    expect(readSignInWait({ qaRunDir: linked.qaRunDir }, linked.root)).toBeUndefined();
    expect(readSignInWait({ qaRunDir }, root)).toEqual(RECORD);
});

test('the QA assignment tells the worker to write the record', () => {
    expect(SIGN_IN_WAIT_RULE).toContain(SIGN_IN_WAIT_FILE);
    expect(officeQAGuidance('CEC-900', 'a'.repeat(40), 'qa', '/tmp/run')).toContain(SIGN_IN_WAIT_RULE);
});
