import { createHash } from 'node:crypto';

type PushIdentity = { pid: number; cwd: string; head: string; branch: string };
type Event = Record<string, unknown>;
function localHookCommand(command: unknown, argv: unknown): boolean {
    if (!Array.isArray(argv) || typeof argv[0] !== 'string' || argv[0].split('/').at(-1) !== 'git' || argv[1] !== command)
        return false;
    const args = argv.slice(2);
    if (!args.every(arg => typeof arg === 'string')) return false;
    switch (command) {
        case 'describe':
        case 'log': return true;
        case 'init': return args.join(' ') === '-q';
        case 'config': return args.length === 2 && ['user.email', 'user.name'].includes(args[0]);
        case 'commit': return args.length === 4 && args.slice(0, 3).join(' ') === '--allow-empty -q -m';
        case 'tag': return args.length === 1 && /^v\d+\.\d+\.\d+$/.test(args[0]);
        case 'maintenance': return args.join(' ') === 'run --auto --quiet';
        default: return false;
    }
}

function retirementBoundary(events: Event[], sid: string, hook: Event, end: Event, remote: string) {
    const start = events.indexOf(hook), finish = events.indexOf(end);
    if (!Array.isArray(hook.argv) || hook.argv.length !== 3 || hook.argv[1] !== 'origin' || hook.argv[2] !== remote)
        throw new Error('The original hook remote does not match the current GitHub remote');
    const commands = new Map<unknown, { event: Event; index: number }[]>();
    for (const [index, event] of events.entries()) {
        if (event.sid === sid || !['start', 'cmd_name', 'exit'].includes(String(event.event))) continue;
        if (typeof event.sid !== 'string' || !event.sid.startsWith(sid + '/'))
            throw new Error('Native Git trace contains an unrelated process');
        const rows = commands.get(event.sid) ?? [];
        rows.push({ event, index });
        commands.set(event.sid, rows);
    }
    // Only the existing HTTPS discovery helper may communicate with the remote. Treat any
    // other nested Git command during the hook as a possible separate remote writer.
    for (const calls of commands.values()) {
        const [nestedStart, command, nestedEnd] = calls;
        if (calls.length !== 3 || nestedStart.event.event !== 'start' || command.event.event !== 'cmd_name' || nestedEnd.event.event !== 'exit')
            throw new Error('A nested Git command lacks a complete native trace');
        if (command.index < start && ['_run_dashed_', 'remote-curl'].includes(String(command.event.name))) continue;
        if (nestedStart.index <= start || nestedEnd.index >= finish || !localHookCommand(command.event.name, nestedStart.event.argv))
            throw new Error('A nested Git command may have reached another ref-update boundary');
    }
    if (events.slice(start + 1, finish).some(event => event.event === 'child_start' && !localHookCommand('maintenance', event.argv)))
        throw new Error('A native hook child requires separate reconciliation');
}
const one = (events: Event[], name: string) => {
    const matches = events.filter(event => event.event === name);
    if (matches.length !== 1) throw new Error(`One native ${name} event is required`);
    return matches[0];
};

/** Qualify only the top-level Git ref-update boundary. Hook side effects remain outside this proof. */
export function prePushRejection(trace: string, expected: PushIdentity, retirementRemote?: string) {
    if (!Number.isSafeInteger(expected.pid) || expected.pid < 1 || !/^[a-f0-9]{40}$/.test(expected.head) ||
        !expected.cwd.startsWith('/') || !expected.branch || /[\s:~^?*\[\\]|\.\.|@\{|\/$/.test(expected.branch))
        throw new Error('Exact native push identity is required');
    const events: Event[] = trace.trim().split('\n').map(line => {
        const value = JSON.parse(line);
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Malformed native Git trace');
        return value;
    });
    const starts = events.filter(event => event.event === 'start' && typeof event.sid === 'string' && !event.sid.includes('/'));
    if (starts.length !== 1) throw new Error('One top-level native Git invocation is required');
    const start = starts[0], sid = String(start.sid);
    if (!sid.endsWith(`-P${expected.pid.toString(16).padStart(8, '0')}`)) throw new Error('Native push PID changed');
    const root = events.filter(event => event.sid === sid);
    const argv = start.argv;
    if (!Array.isArray(argv) || argv.length !== 4 || typeof argv[0] !== 'string' || argv[0].split('/').at(-1) !== 'git' ||
        argv[1] !== 'push' || argv[2] !== 'origin' || argv[3] !== `${expected.head}:refs/heads/${expected.branch}`)
        throw new Error('Native Git command differs from the single recorded push');
    if (one(root, 'cmd_name').name !== 'push' || one(root, 'def_repo').worktree !== expected.cwd)
        throw new Error('Native push repository changed');
    const hooks = root.filter(event => event.event === 'child_start' && event.child_class === 'hook' && event.hook_name === 'pre-push');
    if (hooks.length !== 1 || !Number.isSafeInteger(hooks[0].child_id)) throw new Error('One native pre-push hook is required');
    const hook = hooks[0], exits = root.filter(event => event.event === 'child_exit' && event.child_id === hook.child_id);
    if (exits.length !== 1 || !Number.isSafeInteger(exits[0].code) || Number(exits[0].code) < 1)
        throw new Error('Native hook did not conclusively reject the push');
    const exit = one(root, 'exit'), settled = one(root, 'atexit');
    if (exit.code !== 1 || settled.code !== 1 || root.indexOf(hook) >= root.indexOf(exits[0]) ||
        root.indexOf(exits[0]) >= root.indexOf(exit) || root.indexOf(exit) >= root.indexOf(settled))
        throw new Error('Complete native rejection and settlement are required');
    // A Git invoked inside the hook may have attempted a separate write. Never broaden this boundary.
    if (retirementRemote) retirementBoundary(events, sid, hook, exits[0], retirementRemote);
    else if (events.some(event => event.sid !== sid && event.event === 'cmd_name' &&
        ['push', 'send-pack', 'update-ref', 'commit', 'merge', 'rebase'].includes(String(event.name))))
        throw new Error('A nested Git writer requires its own reconciliation');
    return Object.freeze({ kind: 'native-pre-push-rejected' as const, ...expected, sid,
        traceSha256: createHash('sha256').update(trace).digest('hex'), hookChildId: Number(hook.child_id),
        hookExitCode: Number(exits[0].code), gitExitCode: 1, refUpdateNotAttempted: true as const,
        hookSideEffectsReconciled: false as const });
}
