import { CommandFailure } from './process';
import { providerLimit } from './provider-limit';

/**
 * The failure of a process that exited non-zero. A read-only stage the provider refused at its usage limit is a
 * `provider-limit`, which nothing investigates, with the time the provider said to try again. A writer keeps
 * `uncertain-effect`: it can reach the limit after it has written, and the exit alone cannot tell that from a
 * refusal before any work.
 */
export function exitFailure(program: string, message: string, readOnly: boolean): CommandFailure {
    const limit = readOnly ? providerLimit(program, message) : undefined;
    const failure = new CommandFailure(message, limit ? 'provider-limit' : readOnly ? 'other' : 'uncertain-effect', true);
    if (limit?.retryAt) failure.retryAt = limit.retryAt;
    return failure;
}
