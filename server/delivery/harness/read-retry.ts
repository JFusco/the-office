/** GitHub reflects pushes and PR metadata asynchronously; retry a read a bounded number of times. */
export async function retryRead<T>(read: () => Promise<T | null>, attempts = 5, delayMs = 2000): Promise<T | null> {
    for (let attempt = 0; attempt < attempts; attempt++) {
        const value = await read();
        if (value !== null)
            return value;
        if (attempt < attempts - 1)
            await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return null;
}

/** A write's own read-back: an unobserved write is left uncertain for reconciliation, never resent. */
export async function readBackOrThrow<T>(read: () => Promise<T | null>, what: string): Promise<T> {
    const value = await retryRead(read);
    if (value === null)
        throw new Error(`${what} was not observable after the write`);
    return value;
}
