import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { JiraIssuePublisher } from '../cec/issue-publication';
export { jiraText } from '../cec/issue-publication';
/** Feature authority remains in publishFeature; this wrapper supplies provenance only. */
export class JiraFeaturePublisher extends JiraIssuePublisher {
    constructor(store: Store, feature: Feature, execute: typeof command = command) {
        super(store, { id: feature.id, sourceTicket: feature.sourceTicket, marker: itemId => 'office-feature-' + feature.id + '-item-' + itemId }, execute);
    }
}
