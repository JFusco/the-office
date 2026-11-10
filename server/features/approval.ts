import type { Store } from '../store/store';
import type { FeatureManifest } from '../../src/contracts/features';
import { command } from '../workers/process';
import { FeatureCommandSchema } from './feature-schema';
import { readReview } from './review-evidence';
import { compareBaseline } from './planning-baseline';
import { authorizeFeature } from './release/authorize';
export { assertRetainedItems } from './release/retained-items';

export async function approveFeature(store: Store, id: string, raw: unknown, validateManifest: (manifest: FeatureManifest) => Promise<void>, execute: typeof command = command, inspect = readReview, compare = compareBaseline) {
    const input = FeatureCommandSchema.parse(raw);
    if (input.action !== 'approve') throw new Error('Approve command required');
    return authorizeFeature(store, id, input, { kind: 'human', actor: 'Joe' }, () => {}, validateManifest, execute, inspect, compare);
}
