import { IntakeBudget } from './launch-budget';
import type { Store } from '../../store/store';
import { collectionAllowed } from './collection-policy';
import type { SourceRegistry } from './registry';
import { publicUrl } from './public-url';

/** Created by the scheduler, never by model output or an HTTP request. */
export interface IntakeBinding { registry: SourceRegistry; sourceId: string; sourceDigest: string; homeProjectId: string; attempt: string }
export function assertIntakeBinding(store: Store, binding: IntakeBinding | undefined): void {
    if (!binding || binding.homeProjectId !== store.project.id) throw Error('intake-binding-home');
    const source = binding.registry.get(binding.sourceId);
    if (!source || source.homeProjectId !== binding.homeProjectId || source.sourceDigest !== binding.sourceDigest) throw Error('intake-binding-source');
    if (source.kind !== 'link' || !source.url || !publicUrl(source.url, [new URL(source.url).hostname]) || !collectionAllowed(binding.registry, store, { sourceId: source.id, sourceDigest: source.sourceDigest })) throw Error('public-source-binding');
    const budget = new IntakeBudget(binding.registry);
    if (budget.used() > budget.limit()) throw Error('intake-binding-launch-allowance');
}
