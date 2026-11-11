import { IntakeBudget } from './launch-budget';
import type { Store } from '../../store/store';
import { IntakeLedger } from '../slack-intake/ledger';
import type { ReadTask } from '../slack-intake/contracts';
import { SlackReadAuthority } from '../slack-intake/read-authority';
import { collectionAllowed, collectionPolicy, readAuthority } from './collection-policy';
import type { SourceRegistry } from './registry';
import { publicUrl } from './public-url';

/** Created by the scheduler, never by model output or an HTTP request. */
export interface IntakeBinding { registry: SourceRegistry; sourceId: string; sourceDigest: string; homeProjectId: string; taskId?: string; attempt: string }
export function assertIntakeBinding(store: Store, binding: IntakeBinding | undefined, authority?: SlackReadAuthority): void {
    if (!binding || binding.homeProjectId !== store.project.id) throw Error('intake-binding-home');
    const source = binding.registry.get(binding.sourceId);
    if (!source || source.homeProjectId !== binding.homeProjectId || source.sourceDigest !== binding.sourceDigest) throw Error('intake-binding-source');
    if(source.kind==='link'){
        if(authority||binding.taskId||!source.url||!publicUrl(source.url,[new URL(source.url).hostname])||!collectionAllowed(binding.registry,store,{sourceId:source.id,sourceDigest:source.sourceDigest}))throw Error('public-source-binding');
        const budget=new IntakeBudget(binding.registry);if(budget.used()>budget.limit(source.id))throw Error('intake-binding-launch-allowance');return;
    }
    const policy = collectionPolicy(source);
    if (!collectionAllowed(binding.registry, store, policy)) throw Error('intake-binding-inactive');
    if (authority && !binding.taskId) throw Error('intake-binding-task-required');
    if (binding.taskId) {
        const task = new IntakeLedger(store, source).get<ReadTask>('task', binding.taskId);
        if (!task || task.sourceId !== source.id || task.sourceDigest !== source.sourceDigest || task.channel !== policy.channels[0].id
            || task.attempt !== binding.attempt || task.status !== 'running') throw Error('intake-binding-task');
    }
    const budget=new IntakeBudget(binding.registry);if(budget.used()>budget.limit(source.id))throw Error('intake-binding-launch-allowance');
    if (authority && JSON.stringify(SlackReadAuthority.parse(authority)) !== JSON.stringify(readAuthority(policy))) throw Error('intake-binding-authority');
}
