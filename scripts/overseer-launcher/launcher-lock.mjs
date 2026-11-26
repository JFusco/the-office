// One launcher at a time: the ownership protocol of server/overseer/single-flight.ts
// acquirePassLock, with the launcher's own paths and its process identity.
import { closeSync, openSync, rmSync, unlinkSync } from 'node:fs';
import { checkOwnedFile, ensurePrivateDirectory, publishDurable, readOwned } from './durable-files.mjs';
import { boundedString, errorCode, exactKeys, isIso, isUuid, message } from './field-checks.mjs';
import { processIdentity } from './process-group.mjs';

function readOwner(paths) {
    let text;
    try { text = readOwned(paths.lock, 4096); } catch { return { unreadable: true }; }
    if (text === null) return { absent: true };
    try {
        const owner = JSON.parse(text);
        return exactKeys(owner, ['id', 'pid', 'start', 'at']) && isUuid(owner.id) && Number.isSafeInteger(owner.pid) && owner.pid > 0 && boundedString(owner.start, 40, 1) && isIso(owner.at) ? { owner } : { unreadable: true };
    } catch { return { unreadable: true }; }
}

/**
 * Takes the launcher lock, under a create-exclusive guard. A dead owner is reclaimed only on
 * ESRCH and an unchanged reread; a live, unreadable or inconclusive owner, or a guard left
 * behind, refuses. Returns a release function that removes only this owner's lock.
 */
export async function acquireLauncherLock(paths, system, id) {
    ensurePrivateDirectory(paths.control);
    // The owner record names this launcher's OS start time, so a person can tell it from a reused PID.
    const self = await processIdentity(system, process.pid);
    if (!self || !boundedString(self.start, 40, 1)) return { held: false, reason: 'this launcher’s own start time cannot be read; the lock is not taken' };
    try { checkOwnedFile(paths.guard); closeSync(openSync(paths.guard, 'wx', 0o600)); }
    catch (error) { return { held: false, reason: errorCode(error) === 'EEXIST' ? `${paths.guard} is left behind, or another launcher is taking the lock` : message(error) }; }
    try {
        const seen = readOwner(paths);
        if (seen.unreadable) return { held: false, reason: `${paths.lock} cannot be read; inspect it` };
        let reclaim = false;
        if (seen.owner) {
            let dead;
            try { system.kill(seen.owner.pid, 0); dead = false; } catch (error) { dead = errorCode(error) === 'ESRCH' ? true : null; }
            if (dead !== true) return { held: false, reason: dead === null ? `Cannot tell whether launcher PID ${seen.owner.pid} is alive` : `Launcher ${seen.owner.id} (PID ${seen.owner.pid}) holds the lock` };
            const again = readOwner(paths);
            if (!again.owner || JSON.stringify(again.owner) !== JSON.stringify(seen.owner)) return { held: false, reason: `${paths.lock} changed while it was read` };
            reclaim = true;
        }
        const owner = { id, pid: process.pid, start: self.start, at: system.now().toISOString() }, text = JSON.stringify(owner);
        if (!publishDurable(paths.lock, text, 0o600, { exclusive: !reclaim })) return { held: false, reason: `${paths.lock} appeared while it was taken` };
        return {
            held: true,
            release: () => {
                const current = readOwner(paths);
                if (current.owner && JSON.stringify(current.owner) === text) unlinkSync(paths.lock);
            },
        };
    } finally { rmSync(paths.guard, { force: true }); }
}
