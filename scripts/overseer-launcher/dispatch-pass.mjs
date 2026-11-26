// One new pass, supervised: a helper started and registered before it may run anything, the pass
// authorized, its end, its deadline or a request to stop awaited, its group stopped and confirmed
// gone, and its outcome counted once.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { bounded, isObject, message, validPgid } from './field-checks.mjs';
import { attemptRecord, completeRecord, settle } from './launcher-state.mjs';
import { classify } from './pass-outcome.mjs';
import { groupInventory, helperCommandFits, processIdentity, probeGroup, stopGroup, waitAbsent } from './process-group.mjs';

/**
 * After a pass ends or must stop: a helper alone in its group is let leave by itself; any other
 * member starts the stop sequence at once. The launcher is the helper's parent, so a helper that
 * exits meanwhile lingers, unreaped, as a leader `ps` cannot name; `helperLeft(ms)` resolves
 * whether it has exited and been reaped, and only then does ESRCH settle the group.
 */
export async function stopOrWait(system, current, launcherFile, limits, helperLeft = async () => false) {
    if (probeGroup(system, current.pid, current.pgid) === 'absent') return { gone: true, observation: null };
    const inventory = await groupInventory(system, current.pgid);
    const lone = inventory.ok && inventory.members.every(member => member.pid === current.pid);
    if (lone && await waitAbsent(system, current, limits.absenceWaitMs, limits)) return { gone: true, observation: null };
    const stopped = await stopGroup(system, current, launcherFile, limits);
    if (!stopped.gone && await helperLeft(limits.absenceWaitMs) && await waitAbsent(system, current, limits.absenceWaitMs, limits)) return { gone: true, observation: null };
    return stopped;
}

function reportedOutcome(ended, officeData) {
    if (!ended) return { kind: 'exit', outcome: null, detail: 'the helper did not report the pass' };
    if (ended.error && ended.code === null) return { kind: 'startup', outcome: null, detail: bounded(ended.error) };
    const { kind, outcome, detail } = classify(ended, officeData);
    const diagnostic = detail ?? (kind === 'success' ? null : ended.stderr.trim().split('\n').at(-1) ?? null);
    return { kind, outcome, detail: bounded(diagnostic) || null };
}

export async function dispatch({ state, save, system, limits, paths, pinned, deadlineMs, origin, env, launcherFile, failed, isShuttingDown, setShutdown }) {
    const id = randomUUID(), started = system.now(), startedAt = started.toISOString(), clock0 = system.monotonic();
    const deadline = new Date(started.getTime() + deadlineMs).toISOString();
    let current = { id, commit: pinned.pin.commit, entry: pinned.entry, startedAt, deadline, phase: 'starting', pid: null, pgid: null, start: null, counted: null, observation: null };
    state = { ...state, current };
    save(state);
    const putCurrent = next => { current = next; state = { ...state, current }; save(state); };
    const finish = (kind, extra = {}) => {
        const at = system.now().toISOString();
        const next = current.counted ? completeRecord(state, id, { durationMs: Math.max(0, Date.parse(at) - Date.parse(startedAt)), ...extra }) : settle(state, attemptRecord(id, kind, startedAt, at, extra));
        save({ ...next, current: null });
        if (kind !== 'success' && kind !== 'locked') failed({ kind, id, ...extra });
        return 0;
    };
    let helper;
    try { helper = spawn(process.execPath, [launcherFile, '--group', id], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env: { PATH: env.PATH ?? '/usr/bin:/bin', HOME: env.HOME ?? '', LC_ALL: 'C' } }); }
    catch (error) { return finish('startup', { detail: bounded(`the helper could not start: ${message(error)}`) }); }
    let wake = null, phases = [], ended = null, spawnError = null, helperExited = false, ready = false, passExited = false, stopReason = null;
    const notify = () => { const fn = wake; wake = null; fn?.(); };
    // A stop asked for while the helper starts is honoured before anything is authorized.
    setShutdown(() => {
        if (!passExited && !ended) stopReason ??= 'interrupted';
        notify();
    });
    helper.on('error', error => { spawnError = error; notify(); });
    helper.on('message', received => {
        if (!isObject(received)) return;
        if (received.type === 'ready') ready = true;
        if (received.type === 'exited') passExited = true;
        if (received.type === 'phase' && ['bootstrap', 'run'].includes(received.phase) && !phases.includes(received.phase)) phases.push(received.phase);
        if (received.type === 'exit') ended = { code: Number.isSafeInteger(received.code) ? received.code : null, signal: typeof received.signal === 'string' ? received.signal : null, phases: [...phases], stdout: String(received.stdout ?? ''), stderr: String(received.stderr ?? ''), error: received.error ?? null };
        notify();
    });
    helper.on('exit', () => { helperExited = true; notify(); });
    const waitFor = (test, ms) => new Promise(done => {
        if (test()) return done(true);
        const timer = setTimeout(() => { wake = null; done(test()); }, Math.max(0, ms));
        const check = () => { if (test()) { clearTimeout(timer); done(true); } else wake = check; };
        wake = check;
    });
    // Registered before it may run anything: the helper's PID leads its own group, with this launcher file and attempt on its command line.
    await waitFor(() => ready || spawnError !== null || helperExited, 10_000);
    if (spawnError || !helper.pid) return finish('startup', { detail: bounded(`the helper could not start: ${message(spawnError ?? new Error('no PID'))}`) });
    const identity = await processIdentity(system, helper.pid);
    if (!ready || !identity || !validPgid(helper.pid, identity.pgid) || !helperCommandFits(identity.command, launcherFile, id)) {
        try { helper.kill('SIGKILL'); } catch { /* gone */ }
        return finish('startup', { detail: 'the helper could not be registered' });
    }
    try { putCurrent({ ...current, phase: 'registered', pid: helper.pid, pgid: helper.pid, start: identity.start }); }
    catch (error) { try { helper.kill('SIGKILL'); } catch { /* gone */ } throw error; }
    const passEnv = { OVERSEER_ROOT: paths.root, PATH: env.PATH ?? '/usr/bin:/bin', HOME: env.HOME ?? '', NODE_ENV: 'production', ...(origin ? { OVERSEER_OFFICE_URL: origin } : {}) };
    // The launcher never waits on the helper's channel once it is done with it.
    const letGo = () => { try { helper.disconnect(); } catch { /* already closed */ } helper.unref(); };
    const remaining = () => deadlineMs - (system.monotonic() - clock0);
    // Authorized only when no stop was asked for and the deadline, which counts startup, has not passed.
    if (isShuttingDown()) stopReason ??= 'interrupted';
    else if (remaining() <= 0) stopReason ??= 'hang';
    let saveError = null;
    try {
        // An unauthorized helper leaves as soon as its channel closes.
        if (stopReason) letGo();
        else helper.send({ type: 'authorize', directory: pinned.directory, entry: pinned.entry, env: passEnv });
        while (!passExited && !ended && !stopReason && !helperExited) {
            if (remaining() <= 0) { stopReason = 'hang'; break; }
            await waitFor(() => passExited || !!ended || !!stopReason || helperExited, remaining());
        }
        if (stopReason === 'hang') {
            // Counted before the first signal, so a launch that dies mid-cleanup cannot count it twice. A save
            // that fails still leaves the count in memory, and the group is stopped before the error is reported.
            state = settle(state, attemptRecord(id, 'hang', startedAt, system.now().toISOString(), { detail: `passed its ${deadlineMs} ms deadline` }));
            try { putCurrent({ ...current, counted: 'hang' }); } catch (error) { saveError = error; }
        }
        // A pass that exited before its deadline is not a hang: its helper drains its output within drainMs, then reports.
        if (passExited && !ended && !stopReason) await waitFor(() => !!ended || helperExited, limits.drainMs * 2);
        const helperLeft = ms => waitFor(() => helperExited, ms);
        const stopped = await stopOrWait(system, current, launcherFile, limits, helperLeft);
        const exit = ended ? { code: ended.code, signal: ended.signal } : null;
        const { kind: verdict, outcome, detail } = stopReason
            ? { kind: stopReason, outcome: null, detail: stopReason === 'interrupted' ? 'the launcher was asked to stop' : null }
            : reportedOutcome(ended, paths.officeData);
        if (!stopped.gone) {
            const kind = current.counted ?? (['success', 'locked', 'interrupted'].includes(verdict) ? 'orphan' : verdict);
            if (!current.counted) {
                state = settle(state, attemptRecord(id, kind, startedAt, system.now().toISOString(), {
                    exit, outcome, detail: kind === 'orphan' ? 'the pass’s group could not be confirmed gone' : detail,
                }));
            }
            try { putCurrent({ ...current, counted: kind, observation: stopped.observation }); } catch (error) { saveError ??= error; }
            failed({ kind, id, blocked: true, reason: stopped.observation?.reason ?? 'not confirmed gone' });
            if (saveError) throw saveError;
            return 0;
        }
        if (saveError) throw saveError;
        // A latched hang stays a hang, with its own detail, whatever the pass reported while it was stopped.
        if (verdict === 'hang') return finish('hang', { exit });
        return finish(verdict, { exit, outcome, detail });
    } finally { letGo(); }
}
