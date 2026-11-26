// Where the launcher may write: the protected Office roots, the runner root check, physical paths
// and the launcher's paths. The rules of server/overseer/runner-root.ts, on Node built-ins.
import { lstatSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { errorCode } from './field-checks.mjs';

const MARKERS = ['office-control.sqlite', 'controller-pin.json', 'deployments'];

/** Whether a path exists, without following a final link. Anything but a clear absence is inconclusive and refused. */
export function present(path) {
    try { lstatSync(path); return true; }
    catch (error) {
        if (errorCode(error) === 'ENOENT') return false;
        throw new Error(`Cannot tell whether ${path} exists (${errorCode(error) ?? 'unknown error'}); refusing it`);
    }
}

/** The physical form of a path that may not exist yet: its nearest existing ancestor through realpath, then the missing parts. */
export function physicalPath(path) {
    let existing = resolve(path);
    const missing = [];
    while (!present(existing)) {
        const parent = dirname(existing);
        if (parent === existing) throw new Error(`No part of ${path} exists`);
        missing.unshift(basename(existing));
        existing = parent;
    }
    try { return join(realpathSync(existing), ...missing); }
    catch (error) { throw new Error(`${existing} cannot be resolved (${errorCode(error) ?? 'unknown error'}); a dangling link is refused`); }
}

/** Path-component containment: `child` is `parent` or lies beneath it. */
export function within(child, parent) {
    const path = relative(parent, child);
    return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

const ancestry = path => {
    const chain = [path];
    for (let parent = dirname(path); parent !== chain.at(-1); parent = dirname(parent)) chain.push(parent);
    return chain;
};

/** Whether a launcher file is the installed copy, `<root>/code/launcher/overseer-launch.mjs`. */
export const isInstalledLauncher = launcherFile => basename(launcherFile) === 'overseer-launch.mjs' && basename(dirname(launcherFile)) === 'launcher' && basename(dirname(dirname(launcherFile))) === 'code';

/**
 * The Office data roots the runner root must stay clear of: the checkout's `.local` and the
 * effective `OFFICE_DATA_ROOT`. The installed copy is told both by its plist; a launcher run from
 * a checkout's `scripts/` derives that checkout's `.local` from where it sits.
 */
export function protectedRoots(env, launcherFile) {
    const installed = isInstalledLauncher(launcherFile);
    const checkoutData = env.OVERSEER_CHECKOUT_DATA_ROOT ?? (installed ? undefined : resolve(dirname(launcherFile), '..', '.local'));
    if (!checkoutData || !isAbsolute(checkoutData)) throw new Error('OVERSEER_CHECKOUT_DATA_ROOT must name the checkout’s .local, an absolute path');
    const officeData = env.OFFICE_DATA_ROOT ?? (installed ? undefined : checkoutData);
    if (!officeData || !isAbsolute(officeData)) throw new Error('OFFICE_DATA_ROOT must name the Office data root, an absolute path');
    return { checkoutData: physicalPath(checkoutData), officeData: physicalPath(officeData) };
}

/** Refuses a runner root that is relative, overlaps an Office data root, or lies beneath an Office marker. Returns its physical path. */
export function checkRunnerRoot(supplied, roots) {
    if (!supplied || !isAbsolute(supplied)) throw new Error('OVERSEER_ROOT must be an absolute path');
    const root = physicalPath(supplied);
    for (const office of [roots.checkoutData, roots.officeData])
        if (within(root, office) || within(office, root)) throw new Error(`The Overseer root ${root} overlaps the Office data root ${office}`);
    for (const directory of new Set([...ancestry(resolve(supplied)), ...ancestry(root)]))
        for (const marker of MARKERS)
            if (present(join(directory, marker))) throw new Error(`The Overseer root ${root} is at or inside an Office data root (${join(directory, marker)} exists)`);
    return root;
}

/** The launcher's paths under a checked root: the parts of server/overseer/config.ts runnerPaths it uses. */
export function launcherPaths(root) {
    const control = resolve(root, 'control'), state = resolve(root, 'state'), code = resolve(root, 'code'), logs = resolve(root, 'logs');
    return {
        root, control, state, code, logs, officeData: resolve(state, 'office-data'),
        lock: resolve(control, 'launcher.lock'), guard: resolve(control, 'launcher.lock.reclaim'),
        launcherState: resolve(state, 'launcher.json'), pin: resolve(code, 'pin.json'),
        launcherDir: resolve(code, 'launcher'), launcherCopy: resolve(code, 'launcher', 'overseer-launch.mjs'),
        stdoutLog: resolve(logs, 'launcher.out.log'), stderrLog: resolve(logs, 'launcher.err.log'),
    };
}
