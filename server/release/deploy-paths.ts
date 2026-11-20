import { resolve } from 'node:path';

/** Files a deployment keeps under one data root, all outside every release directory. */
export function deployPaths(dataRoot: string) {
    const directory = resolve(dataRoot, 'deployments');
    return {
        directory,
        /** Names the release whose tree runs deployments. */
        pin: resolve(dataRoot, 'controller-pin.json'),
        /** Present while a deployment needs a person; refuses every further deployment. */
        stop: resolve(directory, 'STOP.json'),
        controllerStore: resolve(directory, 'controller.sqlite'),
        controllerData: resolve(directory, 'controller-data'),
    };
}

/** One operation's own files beside its journal. */
export function operationPaths(dataRoot: string, operation: string) {
    const file = (suffix: string) => resolve(deployPaths(dataRoot).directory, `${operation}.${suffix}`);
    return { token: file('token'), priorPlist: file('prior.plist'), targetPlist: file('target.plist'), launch: file('launch.json'), outcome: file('outcome.json') };
}
