// The trusted helper: the leader of one pass's process group. It waits to be authorized over its
// private channel, runs the pass, relays its phase markers and exit, and stays the leader until
// it is alone in the group, so whoever stops the group can still tell it is this attempt's.
import { spawn } from 'node:child_process';
import { isObject, message, UUID } from './field-checks.mjs';
import { LIMITS } from './limits.mjs';
import { defaultSystem, groupInventory } from './process-group.mjs';

const tail = (chunks, max) => Buffer.concat(chunks).subarray(-max).toString('utf8');

/** Sends to the launcher only while it is there: a launcher that died must never crash the helper before it has cleaned up. */
const send = payload => {
    if (!process.connected) return;
    try { process.send(payload); } catch { /* the launcher went away meanwhile */ }
};

/** Whether this process is the only member of its group left. */
async function alone(system) {
    const inventory = await groupInventory(system, process.pid);
    return inventory.ok && inventory.members.every(member => member.pid === process.pid);
}

export async function helperMain(id, system = defaultSystem()) {
    if (!UUID.test(id) || typeof process.send !== 'function') process.exit(2);
    let authorized = false, cleaning = false;
    const leaveWhenAlone = async () => {
        while (!(await alone(system))) await system.sleep(LIMITS.pollMs);
        process.exit(0);
    };
    // The launcher is gone: stop this group within bounds, staying its leader until the rest is gone.
    const cleanUp = async () => {
        if (cleaning) return;
        cleaning = true;
        try { process.kill(-process.pid, 'SIGTERM'); } catch { /* already gone */ }
        const until = system.monotonic() + LIMITS.termGraceMs;
        while (system.monotonic() < until && !(await alone(system))) await system.sleep(LIMITS.pollMs);
        if (!(await alone(system))) try { process.kill(-process.pid, 'SIGKILL'); } catch { /* already gone */ }
        process.exit(0);
    };
    process.on('SIGTERM', () => {
        if (cleaning) return;
        cleaning = true;
        void (async () => {
            const until = system.monotonic() + LIMITS.termGraceMs + LIMITS.absenceWaitMs;
            while (system.monotonic() < until && !(await alone(system))) await system.sleep(LIMITS.pollMs);
            process.exit(143);
        })();
    });
    process.on('disconnect', () => { if (!authorized) process.exit(0); else void cleanUp(); });
    process.on('message', received => {
        if (authorized || !isObject(received) || received.type !== 'authorize') return;
        authorized = true;
        const { directory, entry, env } = received;
        const phases = [], stdout = [], stderr = [];
        let outBytes = 0, errBytes = 0;
        const keep = (chunks, chunk, size) => { chunks.push(chunk); size += chunk.length; while (size > LIMITS.outputTail * 2 && chunks.length > 1) size -= chunks.shift().length; return size; };
        const report = extra => { send({ type: 'exit', phases, stdout: tail(stdout, LIMITS.outputTail), stderr: tail(stderr, LIMITS.outputTail), ...extra }); void leaveWhenAlone(); };
        let child;
        try { child = spawn(process.execPath, ['--import', 'tsx', entry, 'pass'], { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] }); }
        catch (error) { report({ code: null, signal: null, error: message(error) }); return; }
        child.stdout.on('data', chunk => { outBytes = keep(stdout, chunk, outBytes); });
        child.stderr.on('data', chunk => { errBytes = keep(stderr, chunk, errBytes); });
        child.on('message', marker => {
            if (isObject(marker) && marker.type === 'overseer-phase' && ['bootstrap', 'run'].includes(marker.phase) && !phases.includes(marker.phase)) {
                phases.push(marker.phase);
                send({ type: 'phase', phase: marker.phase });
            }
        });
        child.on('error', error => report({ code: null, signal: null, error: message(error) }));
        child.on('exit', (code, signal) => {
            // Drain what the pipes still hold, bounded: a descendant may keep them open.
            const closed = Promise.all([child.stdout, child.stderr].map(stream => new Promise(done => stream.once('close', done))));
            void Promise.race([closed, system.sleep(LIMITS.drainMs)]).then(() => report({ code, signal }));
        });
    });
    send({ type: 'ready' });
}
