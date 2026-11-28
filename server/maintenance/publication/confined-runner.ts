import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { command } from '../../workers/process';
import type { CommandOptions } from '../../workers/spawn-command';

type Execute = typeof command;
const SANDBOX = '/usr/bin/sandbox-exec';

/**
 * The seatbelt profile candidate-defined commands run under before a maintenance draft is published (#612): no
 * network at all, no writes outside the private scratch and the standard streams, and no reads of Office data or the
 * operator's provider credentials. The same boundary as `command-registry.ts`'s subprocess scope, permissive for
 * reads so the repository's own toolchain resolves.
 */
export function confinedProfile(scratch: string, officeData: string, home = homedir()): string {
    const quoted = (path: string) => JSON.stringify(existsSync(path) ? realpathSync(path) : resolve(path));
    const secrets = [officeData, ...['.config/gh', '.ssh', '.netrc', '.git-credentials', '.codex'].map(path => resolve(home, path))];
    return `(version 1)(allow default)(deny network*)(deny file-write*)(allow file-write* (subpath ${quoted(scratch)}) (literal "/dev/null") (literal "/dev/stdout") (literal "/dev/stderr") (literal "/dev/tty") (regex #"^/dev/fd/"))(deny file-read* ${secrets.map(path => `(subpath ${quoted(path)})`).join(' ')})`;
}

/**
 * The injected confined runner `lintPRContent` uses for a maintenance draft: every command it starts (the
 * repository's `lint:pr` script and its commitlint configuration) runs inside the profile above, with the scratch as
 * its temporary directory. Without seatbelt the runner refuses, and the draft is held: candidate-defined checks never
 * run with the publisher's ambient authority (cutover blocker, not a fallback).
 */
export function confinedRunner(execute: Execute, scratch: string, officeData: string): Execute {
    return async (program: string, args: string[], options: CommandOptions = {}) => {
        if (process.platform !== 'darwin' || !existsSync(SANDBOX))
            throw new Error('Candidate-defined PR checks need the confined runner; seatbelt is unavailable here, so the draft is held');
        // The logical program keeps naming the command, so its own exit and rejection reports read as before.
        return execute(program, ['-p', confinedProfile(scratch, officeData), program, ...args], { ...options, executablePath: SANDBOX, env: { ...options.env, TMPDIR: scratch } });
    };
}
