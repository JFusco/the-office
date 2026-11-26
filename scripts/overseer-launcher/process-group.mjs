// Ownership of a pass's process group: probing it, listing its members, telling whether its
// leader is this attempt's helper, and stopping it within bounds. Nothing is signalled that
// cannot be identified; only ESRCH proves a group gone.
import { spawn } from 'node:child_process';
import { bounded, errorCode, MAX_PID, validPgid } from './field-checks.mjs';
import { LIMITS } from './limits.mjs';

/**
 * `/bin/ps` under LC_ALL=C, bounded in time and output. It runs in a session of its own (spawn
 * forwards `detached`; execFile does not), so a helper listing its group never finds its own ps
 * there, nor does anyone else. Exit 1 with no output is an empty listing.
 */
function listPs(args) {
    return new Promise(done => {
        let child;
        try { child = spawn('/bin/ps', args, { env: { LC_ALL: 'C', PATH: '/usr/bin:/bin' }, detached: true, stdio: ['ignore', 'pipe', 'ignore'] }); }
        catch { done({ ok: false, code: null, stdout: '', pid: null }); return; }
        let stdout = '', bytes = 0, over = false, settled = false;
        const finish = result => { if (settled) return; settled = true; clearTimeout(timer); done({ pid: child.pid ?? null, ...result }); };
        const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* gone */ } finish({ ok: false, code: null, stdout: '' }); }, LIMITS.psTimeoutMs);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', chunk => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > LIMITS.psMaxBytes) { over = true; try { child.kill('SIGKILL'); } catch { /* gone */ } }
            else stdout += chunk;
        });
        child.on('error', () => finish({ ok: false, code: null, stdout: '' }));
        child.on('close', code => finish(over ? { ok: false, code, stdout: '' } : { ok: code === 0 || (code === 1 && !stdout.trim()), code, stdout }));
    });
}

/** The real system: signals, `ps`, sleeping and the clocks. Tests replace parts of it. */
export const defaultSystem = () => ({
    kill: (pid, signal) => process.kill(pid, signal),
    ps: listPs,
    sleep: ms => new Promise(done => setTimeout(done, ms)),
    now: () => new Date(),
    monotonic: () => performance.now(),
});

/** Whether a process group is there: ESRCH proves it is not, a successful probe that it is, anything else is unknown. Never probes an invalid group. */
export function probeGroup(system, pid, pgid) {
    if (!validPgid(pid, pgid)) throw new Error(`Refusing to probe process group ${pgid}`);
    try { system.kill(-pgid, 0); return 'present'; }
    catch (error) { return errorCode(error) === 'ESRCH' ? 'absent' : 'unknown'; }
}

function signalGroup(system, pid, pgid, signal) {
    if (!validPgid(pid, pgid)) throw new Error(`Refusing to signal process group ${pgid}`);
    try { system.kill(-pgid, signal); return true; } catch (error) { return errorCode(error) === 'ESRCH'; }
}

const PS_LINE = /^\s*(\d+)\s+(\d+)\s+([A-Z][a-z]{2} [A-Z][a-z]{2} [ \d]\d \d\d:\d\d:\d\d \d{4})\s+(.*)$/;
const parse = line => { const match = PS_LINE.exec(line); return match && { pid: Number(match[1]), pgid: Number(match[2]), start: match[3].replace(/\s+/g, ' '), command: match[4] }; };

/** The members of a process group, as `ps` lists them under LC_ALL=C, with their full commands. */
export async function groupInventory(system, pgid) {
    if (!Number.isSafeInteger(pgid) || pgid < 2 || pgid > MAX_PID) return { ok: false, reason: `invalid process group ${pgid}`, members: [] };
    const result = await system.ps(['-o', 'pid=,pgid=,lstart=,command=', '-g', String(pgid)]);
    if (!result.ok) return { ok: false, reason: `ps exited ${result.code}`, members: [] };
    const members = [];
    for (const line of result.stdout.split('\n').filter(Boolean)) {
        const member = parse(line);
        if (!member) return { ok: false, reason: 'ps printed a line it should not', members: [] };
        // ps is never in the group it lists (it runs detached); its PID is left out regardless.
        if (member.pgid === pgid && member.pid !== result.pid) members.push(member);
    }
    if (members.length > LIMITS.members) return { ok: false, reason: `more than ${LIMITS.members} members`, members: members.slice(0, LIMITS.members) };
    return { ok: true, reason: '', members };
}

/** One process's group, start time and full command, or null. */
export async function processIdentity(system, pid) {
    const result = await system.ps(['-o', 'pid=,pgid=,lstart=,command=', '-p', String(pid)]);
    if (!result.ok) return null;
    const member = parse(result.stdout.split('\n').find(Boolean) ?? '');
    return member && member.pid === pid ? member : null;
}

/** A helper's command: exactly this launcher file in group mode, for exactly this attempt. */
export const helperCommandFits = (command, launcherFile, id) => command.endsWith(` ${launcherFile} --group ${id}`);

/** Whether the group is still the one this attempt started: its leader is this launcher's helper for this attempt, started when recorded. */
export function leaderMatches(inventory, current, launcherFile) {
    const leader = inventory.members.find(member => member.pid === current.pgid);
    return !!leader && leader.start === current.start && helperCommandFits(leader.command, launcherFile, current.id);
}

/** What is saved about a group that could not be settled: bounded members and why. */
export const observation = (at, reason, inventory) => ({
    at, reason: bounded(reason),
    members: (inventory?.members ?? []).slice(0, LIMITS.members).map(member => ({ pid: member.pid, pgid: member.pgid, start: member.start, command: member.command.slice(0, LIMITS.command) })),
});

/** Polls for ESRCH: whether the group is confirmed gone within `ms`. */
export async function waitAbsent(system, current, ms, limits = LIMITS) {
    const until = system.monotonic() + ms;
    for (;;) {
        if (probeGroup(system, current.pid, current.pgid) === 'absent') return true;
        if (system.monotonic() >= until) return false;
        await system.sleep(limits.pollMs);
    }
}

/** The group as it stands, before a signal: identified, already leaving (ps lists no one, so only ESRCH settles it), or not identifiable. */
async function identify(system, current, launcherFile, limits, context) {
    const inventory = await groupInventory(system, current.pgid);
    if (inventory.ok && !inventory.members.length)
        return await waitAbsent(system, current, limits.absenceWaitMs, limits) ? { gone: true } : { observation: observation(system.now().toISOString(), `${context}the group lists no members but is still there`, inventory) };
    if (inventory.ok && leaderMatches(inventory, current, launcherFile)) return { inventory };
    return { observation: observation(system.now().toISOString(), inventory.ok ? `${context}the group’s leader is not this attempt’s helper` : inventory.reason, inventory) };
}

/**
 * Stops one identified group: TERM, up to 10 s, identity rechecked, KILL, then up to 5 s for
 * ESRCH. Nothing is signalled whose leader does not match. Returns whether it is confirmed gone.
 */
export async function stopGroup(system, current, launcherFile, limits = LIMITS) {
    const { pid, pgid } = current;
    if (probeGroup(system, pid, pgid) === 'absent') return { gone: true, observation: null };
    let found = await identify(system, current, launcherFile, limits, '');
    if (found.gone) return { gone: true, observation: null };
    if (!found.inventory) return { gone: false, observation: found.observation };
    signalGroup(system, pid, pgid, 'SIGTERM');
    if (await waitAbsent(system, current, limits.termGraceMs, limits)) return { gone: true, observation: null };
    found = await identify(system, current, launcherFile, limits, 'after TERM ');
    if (found.gone) return { gone: true, observation: null };
    if (!found.inventory) return { gone: false, observation: found.observation };
    signalGroup(system, pid, pgid, 'SIGKILL');
    if (await waitAbsent(system, current, limits.absenceWaitMs, limits)) return { gone: true, observation: null };
    const state = probeGroup(system, pid, pgid);
    return { gone: false, observation: observation(system.now().toISOString(), state === 'unknown' ? 'the group cannot be probed' : 'the group is still there after KILL', await groupInventory(system, pgid)) };
}
