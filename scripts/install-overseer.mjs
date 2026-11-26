// Installs the Overseer launcher as a LaunchAgent: a person's step, never the runner's. It copies
// the committed bundle scripts/overseer-launch.mjs, byte for byte, into the runner root, so the
// installed launcher does not change when the checkout does, and writes
// ~/Library/LaunchAgents/com.jfusco.office-overseer.plist. Its own checks reuse the maintained
// launcher modules. Node built-ins only. See docs/overseer.md, Launcher.
//
//   node scripts/install-overseer.mjs [--print]
import { execFile } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { officeOrigin, passDeadline } from './overseer-launcher/configuration.mjs';
import { assertDirectoryOrAbsent, checkOwnedFile, ensurePrivateDirectory, publishDurable, readOwned } from './overseer-launcher/durable-files.mjs';
import { LIMITS } from './overseer-launcher/limits.mjs';
import { validPin } from './overseer-launcher/release-verification.mjs';
import { checkRunnerRoot, launcherPaths, physicalPath } from './overseer-launcher/runner-root.mjs';

export const LABEL = 'com.jfusco.office-overseer';
export const DEFAULT_DEADLINE_MS = 240_000;
const SCRIPT = fileURLToPath(import.meta.url);
const CHECKOUT = resolve(dirname(SCRIPT), '..'), LAUNCHER_SOURCE = resolve(dirname(SCRIPT), 'overseer-launch.mjs');

const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** The LaunchAgent: the copied launcher every 120 seconds, with only the environment it needs. */
export function renderPlist({ execPath, paths, environment }) {
    const variables = Object.entries(environment).map(([key, value]) => `<key>${xml(key)}</key><string>${xml(value)}</string>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${LABEL}</string>
<key>ProgramArguments</key><array><string>${xml(execPath)}</string><string>${xml(paths.launcherCopy)}</string></array>
<key>WorkingDirectory</key><string>${xml(paths.root)}</string>
<key>EnvironmentVariables</key><dict>${variables}</dict>
<key>StartInterval</key><integer>120</integer>
<key>RunAtLoad</key><true/>
<key>ProcessType</key><string>Background</string>
<key>ExitTimeOut</key><integer>30</integer>
<key>StandardOutPath</key><string>${xml(paths.stdoutLog)}</string>
<key>StandardErrorPath</key><string>${xml(paths.stderrLog)}</string>
</dict></plist>
`;
}

const defaultRun = (command, args) => new Promise(done => execFile(command, args, { timeout: 30_000, encoding: 'utf8', maxBuffer: 1024 * 1024 },
    (error, stdout, stderr) => done({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout: stdout ?? '', stderr: stderr ?? '' })));

/** An existing plist under the label must be this installation's: same label, the two-argument launcher layout, this root. */
async function existingPlist(run, plistPath, paths) {
    let stat;
    try { stat = lstatSync(plistPath); } catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${plistPath} is not a regular file; refusing to replace it`);
    const parsed = await run('/usr/bin/plutil', ['-convert', 'json', '-o', '-', plistPath]);
    let plist;
    try { plist = parsed.code === 0 ? JSON.parse(parsed.stdout) : null; } catch { plist = null; }
    if (!plist) throw new Error(`${plistPath} cannot be read; refusing to replace it`);
    const args = plist.ProgramArguments;
    if (plist.Label !== LABEL || !Array.isArray(args) || args.length !== 2 || args[1] !== paths.launcherCopy || plist.WorkingDirectory !== paths.root || plist.EnvironmentVariables?.OVERSEER_ROOT !== paths.root)
        throw new Error(`${plistPath} belongs to another installation; refusing to replace it`);
    return readFileSync(plistPath, 'utf8');
}

/**
 * Checks everything before writing anything, then writes the launcher copy (mode 0400), the
 * plist (0600) and the log files, and bootstraps the job. A job already loaded is left alone: if
 * its files match it is reported installed, otherwise it must be booted out first.
 */
export async function installOverseer(options = {}) {
    const { env = process.env, home = homedir(), platform = process.platform, uid = process.getuid?.(), run = defaultRun, execPath = process.execPath, launcherSource = LAUNCHER_SOURCE, checkout = CHECKOUT, print = false, log = console.log } = options;
    if (platform !== 'darwin') throw new Error('The Overseer launcher installs as a macOS LaunchAgent');
    if (!Number.isSafeInteger(uid)) throw new Error('Cannot tell the user ID for the launchd domain');
    const checkoutData = physicalPath(resolve(checkout, '.local'));
    const officeData = physicalPath(env.OFFICE_DATA_ROOT ? resolve(env.OFFICE_DATA_ROOT) : checkoutData);
    const root = checkRunnerRoot(env.OVERSEER_ROOT ?? resolve(home, 'Projects/the-office-overseer'), { checkoutData, officeData });
    const deadline = env.OVERSEER_PASS_DEADLINE_MS === undefined ? DEFAULT_DEADLINE_MS : passDeadline(env);
    const origin = officeOrigin(env), paths = launcherPaths(root);
    const pinText = readOwned(paths.pin, LIMITS.pinMaxBytes);
    if (pinText === null) throw new Error(`There is no runner pin at ${paths.pin}; run pnpm office overseer pin COMMIT first`);
    let pin;
    try { pin = JSON.parse(pinText); } catch { throw new Error('The runner pin is not JSON'); }
    if (!validPin(pin)) throw new Error('The runner pin is not a valid version 1 pin');
    const release = resolve(officeData, 'releases', pin.commit);
    if (physicalPath(pin.directory) !== release || physicalPath(release) !== release) throw new Error(`The pinned directory is not ${release}`);
    assertDirectoryOrAbsent(release);
    try { lstatSync(release); } catch { throw new Error(`The pinned release ${release} is missing`); }
    for (const directory of [paths.code, paths.launcherDir, paths.logs]) assertDirectoryOrAbsent(directory);
    for (const file of [paths.launcherCopy, paths.stdoutLog, paths.stderrLog]) checkOwnedFile(file);
    const plistDir = resolve(home, 'Library/LaunchAgents'), plistPath = resolve(plistDir, `${LABEL}.plist`);
    const environment = {
        OVERSEER_ROOT: root, OVERSEER_PASS_DEADLINE_MS: String(deadline), PATH: env.PATH || '/usr/bin:/bin',
        OVERSEER_CHECKOUT_DATA_ROOT: checkoutData, OFFICE_DATA_ROOT: officeData, ...(origin ? { OVERSEER_OFFICE_URL: origin } : {}),
    };
    const plist = renderPlist({ execPath, paths, environment }), launcherBytes = readFileSync(launcherSource);
    const existing = await existingPlist(run, plistPath, paths);
    const service = await run('/bin/launchctl', ['print', `gui/${uid}/${LABEL}`]);
    const missing = service.code !== 0 && /could not find service/i.test(`${service.stderr}\n${service.stdout}`);
    if (service.code !== 0 && !missing) throw new Error(`launchctl print could not tell whether ${LABEL} is loaded (exit ${service.code}); nothing was written`);
    if (service.code === 0) {
        const copy = (() => { try { return readOwned(paths.launcherCopy, 4 * 1024 * 1024); } catch { return null; } })();
        if (existing === plist && copy === launcherBytes.toString('utf8')) { log(`${LABEL} is already installed and loaded with these files`); return { status: 'already-installed', plistPath }; }
        throw new Error(`${LABEL} is loaded with other files; run launchctl bootout gui/${uid}/${LABEL} first, then install again`);
    }
    const actions = [`write ${paths.launcherCopy} (mode 0400)`, `write ${plistPath} (mode 0600)`, `create ${paths.stdoutLog} and ${paths.stderrLog}`, `launchctl bootstrap gui/${uid} ${plistPath}`];
    if (print) { log(plist); log(actions.map(action => `would ${action}`).join('\n')); return { status: 'printed', plistPath, plist }; }
    ensurePrivateDirectory(paths.logs);
    for (const file of [paths.stdoutLog, paths.stderrLog]) if (!checkOwnedFile(file)) publishDurable(file, '', 0o600, { exclusive: true });
    publishDurable(paths.launcherCopy, launcherBytes, 0o400);
    publishDurable(plistPath, plist, 0o600);
    const booted = await run('/bin/launchctl', ['bootstrap', `gui/${uid}`, plistPath]);
    if (booted.code !== 0) throw new Error(`launchctl bootstrap failed (exit ${booted.code}): ${String(booted.stderr).slice(0, 500)}. The launcher is at ${paths.launcherCopy} and the plist at ${plistPath}; install again to retry`);
    log(`${LABEL} installed and loaded: a pass every 120 seconds from ${pin.commit}`);
    return { status: 'installed', plistPath };
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT) {
    const extra = process.argv.slice(2).filter(arg => arg !== '--print');
    if (extra.length) { console.error('usage: node scripts/install-overseer.mjs [--print]'); process.exitCode = 2; }
    else try { await installOverseer({ print: process.argv.includes('--print') }); }
    catch (error) { console.error(`Not installed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
}
