import type { OfficeProject } from '../../src/shared';
import { Effects } from '../store/effects';
import { Store } from '../store/store';
import { deployPaths } from './deploy-paths';

/** The controller's own project: not one the Office delivers, so its store holds deployment effects only. */
export const DEPLOY_PROJECT: OfficeProject = { id: 'office-deploy', name: 'Office deployment', provider: 'github', repo: '/nonexistent/office-deploy', repository: 'JFusco/the-office', target: 'main' };

export type ControllerEffects = ReturnType<typeof controllerEffects>['effects'];

/** Effects persistence owned by the deployment controller, under `deployments/` and outside every project store. */
export function controllerEffects(dataRoot: string) {
    const paths = deployPaths(dataRoot), store = new Store(paths.controllerStore, DEPLOY_PROJECT, paths.controllerData);
    const effects = Object.assign(new Effects(store), { readIntent: (id: string) => store.getEffect<Record<string, unknown>>(id) });
    return { effects, close: () => store.db.close() };
}
