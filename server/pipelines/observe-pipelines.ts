import type { PipelineStatus } from '../../src/contracts/pipelines';
import type { Store } from '../store/store';
import { sanitize } from '../office/security';
import { pipelineChanges, withHealth } from './pipeline-changes';

/**
 * Reads every pipeline of the project and records the ones that started failing or recovered.
 * A failed read keeps the last observed pipelines and their time, and says why.
 */
export async function observePipelines(store: Store, read: (known: readonly PipelineStatus[]) => Promise<PipelineStatus[]>, now = () => new Date().toISOString()): Promise<void> {
    const prior = store.state.pipelines;
    let items: PipelineStatus[];
    try { items = withHealth(prior?.items || [], await read(prior?.items || [])); }
    catch (error) {
        store.state.pipelines = { observedAt: prior?.observedAt || '', items: prior?.items || [], error: `Pipelines could not be read: ${sanitize(String(error))}` };
        store.save();
        return;
    }
    const changes = pipelineChanges(prior?.items || [], items);
    store.state.pipelines = { observedAt: now(), error: '', items };
    store.save();
    for (const { pipeline, to, run } of changes) {
        const where = run.branch ? ` on ${run.branch}` : '';
        store.emit(to === 'failing' ? 'pipeline-failing' : 'pipeline-recovered',
            to === 'failing' ? `${pipeline.name} started failing${where}: run ${run.id} ended ${run.result}. ${run.url}` : `${pipeline.name} is passing again${where}: run ${run.id}. ${run.url}`, 'pm');
    }
}
