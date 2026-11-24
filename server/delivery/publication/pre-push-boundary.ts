import { createHash } from 'node:crypto';

type PushIdentity = { pid: number; cwd: string; head: string; branch: string };
type Event = Record<string, unknown>;
type TraceRow = { event: Event; index: number };
type Invocation = { sid: string; start: TraceRow; command: TraceRow; end: TraceRow };

function exactCommand(argv: unknown, command: string, args: string[]): boolean {
    return Array.isArray(argv) && argv.length === args.length + 1 && typeof argv[0] === 'string' &&
        argv[0].split('/').at(-1) === command && args.every((arg, index) => argv[index + 1] === arg);
}

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

/** Join a traced HTTPS session to the exact child launch and exit reported by its parent. */
function transportChild(events: Event[], parent: string, parentExit: number, child: Invocation,
    childClass: string, program: string, args: string[], hook?: Event) {
    const childStarts = events.filter(row => row.sid === parent && row.event === 'child_start' && row !== hook);
    const launch = childStarts[0];
    const pid = /-P([a-f0-9]{8})$/.exec(child.sid);
    if (childStarts.length !== 1 || !pid || child.sid.slice(0, child.sid.lastIndexOf('/')) !== parent ||
        launch.child_class !== childClass || !Number.isSafeInteger(launch.child_id) || launch.use_shell !== false ||
        !exactCommand(launch.argv, program, args) || !exactCommand(child.start.event.argv, program, args) ||
        events.indexOf(launch) >= child.start.index)
        throw new Error('Native HTTPS transport launch does not match the original push');
    const exits = events.filter(row => row.sid === parent && row.event === 'child_exit' && row.child_id === launch.child_id);
    if (exits.length !== 1 || exits[0].pid !== Number.parseInt(pid[1], 16) ||
        events.indexOf(exits[0]) <= child.end.index || events.indexOf(exits[0]) >= parentExit)
        throw new Error('Native HTTPS transport did not settle in its original push');
    return events.indexOf(launch);
}

function retirementBoundary(events: Event[], sid: string, hook: Event, end: Event, remote: string) {
    const start = events.indexOf(hook), finish = events.indexOf(end);
    if (!Array.isArray(hook.argv) || hook.argv.length !== 3 || hook.argv[1] !== 'origin' || hook.argv[2] !== remote)
        throw new Error('The original hook remote does not match the current GitHub remote');
    const commands = new Map<string, TraceRow[]>();
    for (const [index, event] of events.entries()) {
        if (event.sid === sid || !['start', 'cmd_name', 'exit'].includes(String(event.event))) continue;
        if (typeof event.sid !== 'string' || !event.sid.startsWith(sid + '/'))
            throw new Error('Native Git trace contains an unrelated process');
        const rows = commands.get(event.sid) ?? [];
        rows.push({ event, index });
        commands.set(event.sid, rows);
    }
    const transport: Invocation[] = [];
    for (const [childSid, calls] of commands) {
        const [nestedStart, command, nestedEnd] = calls;
        if (calls.length !== 3 || nestedStart.event.event !== 'start' || command.event.event !== 'cmd_name' || nestedEnd.event.event !== 'exit')
            throw new Error('A nested Git command lacks a complete native trace');
        if (command.index < start && ['_run_dashed_', 'remote-curl'].includes(String(command.event.name))) {
            transport.push({ sid: childSid, start: nestedStart, command, end: nestedEnd });
            continue;
        }
        if (nestedStart.index <= start || nestedEnd.index >= finish || !localHookCommand(command.event.name, nestedStart.event.argv))
            throw new Error('A nested Git command may have reached another ref-update boundary');
    }
    const dashed = transport.find(call => call.command.event.name === '_run_dashed_');
    const curl = transport.find(call => call.command.event.name === 'remote-curl');
    if (transport.length !== 2 || !dashed || !curl)
        throw new Error('One native HTTPS transport chain is required');
    const pushExit = events.findIndex(row => row.sid === sid && row.event === 'exit');
    transportChild(events, sid, pushExit, dashed, 'remote-https', 'git', ['remote-https', 'origin', remote], hook);
    const curlLaunch = transportChild(events, dashed.sid, dashed.end.index, curl, 'dashed', 'git-remote-https', ['origin', remote]);
    if (curlLaunch <= dashed.command.index)
        throw new Error('Native HTTPS transport child launched outside the original discovery chain');
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
