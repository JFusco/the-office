import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { GitHubIssuePublisher } from '../github/issue-publication';
/** Feature authority remains in publishFeature; this wrapper supplies provenance only. */
export class GitHubFeaturePublisher extends GitHubIssuePublisher {
    constructor(store: Store, feature: Feature, execute: typeof command = command) {
        super(store, { id: feature.id, sourceTicket: feature.sourceTicket, marker: itemId => 'office-feature-' + feature.id + '-item-' + itemId }, execute);
    }
}
