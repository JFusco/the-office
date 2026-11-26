import { generateKeyPairSync } from 'node:crypto';
import { expect, test } from 'vitest';
import { keychainKeySource } from '../../../../server/github/identity/app-key';
import { CommandFailure } from '../../../../server/workers/process';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const selector = { kind: 'keychain' as const, service: 'the-office-github-app', account: 'service' };

test('the Keychain item is selected exactly by service and account, read once per call, without output hooks', async () => {
    const calls: { program: string; args: string[]; options: unknown }[] = [];
    const source = keychainKeySource(async (program, args, options) => { calls.push({ program, args, options }); return `${privateKey}\n`; }, selector);
    expect(calls).toEqual([]);
    expect(await source.read()).toBe(privateKey.trim());
    expect(calls).toEqual([{ program: 'security', args: ['find-generic-password', '-s', 'the-office-github-app', '-a', 'service', '-w'], options: { readOnly: true, timeout: 10000 } }]);
});

test('a key the Keychain prints as hex is decoded', async () => {
    const source = keychainKeySource(async () => Buffer.from(privateKey).toString('hex'), selector);
    expect(await source.read()).toBe(privateKey.trim());
});

test.each([
    ['a timeout', new CommandFailure('security read timed out', 'transient-read', true), 'the read timed out'],
    ['an exit code', new Error(`security exited 44: ${privateKey}`), 'security exited 44'],
    ['an unknown failure', new Error(privateKey), 'the read failed'],
])('%s names only a bounded reason, never what the tool printed', async (_, failure, reason) => {
    const error = await keychainKeySource(async () => { throw failure; }, selector).read().catch((caught: Error) => caught) as Error;
    expect(error.message).toBe(`The App signing key is not available in the Keychain (service the-office-github-app): ${reason}`);
});

test('an item that is not a private key is refused without repeating it', async () => {
    const error = await keychainKeySource(async () => 'ghp_NotAKeyButSomethingElse0000', selector).read().catch((caught: Error) => caught) as Error;
    expect(error.message).toBe('The App signing key is not available in the Keychain (service the-office-github-app): the item is not a private key');
});
