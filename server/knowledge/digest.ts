import { createHash } from 'node:crypto';

/** SHA-256 hex of text or bytes: the one content identity used across knowledge records. */
export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
