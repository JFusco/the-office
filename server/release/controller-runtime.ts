import { setTimeout as sleep } from 'node:timers/promises';
import { resolve } from 'node:path';
import { DATA } from '../office/config';
import { PROJECTS, projectData } from '../office/projects';
import { command } from '../workers/process';
import type { StoreDatabase } from './backup-stores';
import { controllerEffects } from './controller-effects';
import { DEFAULT_TIMINGS, type DeployContext } from './deploy-context';
import type { DeployOutcome } from './deploy-facts';
import { deploy, resumeDeploy } from './deploy';
import { endHeldDeployment } from './end-held-deployment';
import { launchDomain } from './launchctl';
import { officeClient } from './service-http';
import { servicePlistPath } from './service-plist';

/** The machine a controller acts on. The default is the real one; tests supply their own. */
export interface ControllerMachine {
    dataRoot: string; execute: typeof command; request: typeof fetch; plistPath: string; domain: string;
    projects: StoreDatabase[]; archives: string[]; log: (line: string) => void;
}

function realMachine(): ControllerMachine {
    return {
        dataRoot: DATA, execute: command, request: fetch, plistPath: servicePlistPath(), domain: launchDomain(), log: console.log,
        projects: PROJECTS.map(project => ({ name: project.id, path: resolve(projectData(project), 'office.sqlite') })),
        archives: PROJECTS.map(project => resolve(projectData(project), 'archive')),
    };
}

function alive(pid: number): boolean {
    try { process.kill(pid, 0); return true; }
    catch (error) { return (error as NodeJS.ErrnoException).code !== 'ESRCH'; }
}

const option = (args: string[], flag: string) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const USAGE = 'controller: deploy COMMIT --operation ID --controller COMMIT | resume OPERATION | end OPERATION --operation ID';

/**
 * Wires a machine into a deployment: launchd, the service's plist, loopback HTTP on the port that
 * plist configures, and every configured store. Prints progress, then the outcome as its last line.
 * Returns the exit code: zero whenever an outcome was reached, whatever it is, because the launcher
 * reads the outcome and not the code. A malformed invocation touches nothing and returns 2.
 */
export async function runController(args: string[], machine: ControllerMachine = realMachine()): Promise<number> {
    const [verb, subject] = args, operation = option(args, '--operation'), controller = option(args, '--controller');
    const known = verb === 'deploy' ? !!(subject && operation && controller) : verb === 'resume' ? !!subject : verb === 'end' ? !!(subject && operation) : false;
    if (!known) { machine.log(USAGE); return 2; }
    const { dataRoot, execute, plistPath } = machine, idleMinutes = Number(option(args, '--idle-minutes'));
    const plist = JSON.parse(await execute('plutil', ['-convert', 'json', '-o', '-', plistPath], { readOnly: true, timeout: 30_000 }));
    const { effects, close } = controllerEffects(dataRoot);
    try {
        const ctx: DeployContext = {
            dataRoot, execute, effects, plistPath, domain: machine.domain,
            office: officeClient(`http://127.0.0.1:${Number(plist.EnvironmentVariables?.OFFICE_PORT || 4318)}`, machine.request),
            projects: machine.projects, databases: [...machine.projects, { name: 'office-control', path: resolve(dataRoot, 'office-control.sqlite') }], archives: machine.archives,
            timings: { ...DEFAULT_TIMINGS, ...(Number.isFinite(idleMinutes) && idleMinutes > 0 ? { idleDeadlineMs: idleMinutes * 60_000 } : {}) },
            now: () => new Date(), sleep: ms => sleep(ms).then(() => undefined), alive,
            observe: event => machine.log(JSON.stringify({ at: new Date().toISOString(), ...event })),
        };
        const outcome: DeployOutcome = verb === 'deploy' ? await deploy(ctx, { operation: operation!, target: subject, controller: controller! })
            : verb === 'resume' ? await resumeDeploy(ctx, subject) : await endHeldDeployment(ctx, { operation: operation!, owner: subject });
        machine.log(JSON.stringify(outcome));
        return 0;
    } finally { close(); }
}
