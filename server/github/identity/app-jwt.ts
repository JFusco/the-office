import { createPrivateKey, createSign, type KeyObject } from 'node:crypto';

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/** The App's RSA signing key, parsed once. A key that is not an RSA private key is refused without repeating it. */
export function signingKey(pem: string): KeyObject {
    let key: KeyObject;
    try { key = createPrivateKey(pem); }
    catch { throw new Error('The App signing key could not be parsed'); }
    if (key.asymmetricKeyType !== 'rsa') throw new Error('The App signing key is not an RSA private key');
    return key;
}

/**
 * The short-lived RS256 JWT that authenticates as the App itself: issued by the App id, `iat` backdated 60 seconds
 * for clock drift and `exp` nine minutes ahead, inside GitHub's ten-minute limit. Never logged, saved or put in argv.
 */
export function appJwt(appId: number, key: KeyObject, now: Date): string {
    const seconds = Math.floor(now.getTime() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64url(JSON.stringify({ iat: seconds - 60, exp: seconds + 9 * 60, iss: String(appId) }));
    const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key);
    return `${header}.${claims}.${base64url(signature)}`;
}
