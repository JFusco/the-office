/**
 * The environment one child process starts with, less any names the caller removes (`envRemove`). It composes with
 * both environment forms without changing them: a merged environment (the service's own plus the caller's `env`)
 * has the names removed from what it inherits before `env` applies, and a replacement environment (`replaceEnv`,
 * already built as the child's whole map and passed here as `replaced`) has them removed from that map. With nothing
 * to remove, it is exactly what the spawn path passed before: the replacement, the service's environment plus `env`,
 * or the service's environment itself. The service's process.env is never changed.
 */
export function childEnvironment(options: { env?: Record<string, string>; envRemove?: readonly string[] }, replaced?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    const remove = options.envRemove ?? [];
    if (replaced) {
        for (const name of remove) delete replaced[name];
        return replaced;
    }
    if (!remove.length) return options.env ? { ...process.env, ...options.env } : process.env;
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const name of remove) delete env[name];
    return Object.assign(env, options.env);
}
