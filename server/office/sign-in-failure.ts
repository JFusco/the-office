import { sanitize } from './security';

/** The provider's own words for a refused sign-in check: secrets removed, on one line, at most 400 characters. */
export function signInFailure(error: unknown): string {
    return sanitize(String(error)).replace(/\s+/g, ' ').trim().slice(0, 400);
}
