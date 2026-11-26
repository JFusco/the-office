/**
 * Entry of the Overseer runner: one observe-only pass, then exit. It runs outside the Office
 * service and takes no scheduler claim (see docs/overseer.md, Runner).
 *
 * Its two static imports use Node built-ins only. The root and the Office URL are checked, and
 * `OFFICE_DATA_ROOT` is set to the runner's own folder, before any Office module loads, because
 * those modules capture the data root when they load.
 *
 * Exit codes: 0 a pass was recorded (its record is the last line of stdout), 1 the pass could not
 * be recorded, 2 a malformed invocation or an unsafe root (nothing written), 3 another pass holds
 * the runner (nothing written).
 */
import { officeUrl, type RunnerPaths } from './overseer/config';
import { requireRunnerRoot } from './overseer/runner-root';

const USAGE = 'overseer: pass (with OVERSEER_ROOT, an absolute path, and optionally OVERSEER_OFFICE_URL)';
/** Phase markers for the launcher's helper, when one runs this pass (scripts/overseer-launch.mjs). A pass run by hand has no channel, and the channel never keeps the pass alive. */
const mark = (phase: 'bootstrap' | 'run') => {
    if (!process.send) return;
    process.send({ type: 'overseer-phase', phase });
    process.channel?.unref();
};
let checked: { paths: RunnerPaths; office: string } | undefined;
try {
    if (process.argv[2] !== 'pass' || process.argv.length !== 3) throw new Error(USAGE);
    checked = { paths: requireRunnerRoot(process.env), office: officeUrl(process.env) };
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
}
if (checked) {
    process.env.OFFICE_DATA_ROOT = checked.paths.officeData;
    mark('bootstrap');
    const [{ officeDataRoot, realMachine }, { runPass }] = await Promise.all([import('./overseer/machine'), import('./overseer/pass')]);
    try {
        const machine = realMachine(checked.paths, checked.office);
        mark('run');
        const result = await runPass(machine);
        if (result.status === 'locked') {
            console.error(result.reason);
            process.exitCode = 3;
        } else console.log(JSON.stringify({ ...result.record, officeDataRoot }));
    } catch (error) {
        console.error(`The pass could not be recorded: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
    }
}
export {};
