import { readDescriptionHistory, type DescriptionHistory } from './description-history';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { PRMetadataRepair } from '../../../src/contracts/pr-metadata';

type Binding = PRMetadataRepair['binding'];

/** The same open pull request and description captured by the metadata binding. */
export function matchesBoundDescription(history: DescriptionHistory, b: Binding): boolean {
    return history.repository === b.repository && history.number === b.pr && history.url === b.url &&
        history.state === 'OPEN' && history.head === b.head && history.branch === b.branch && history.base === b.base &&
        history.title === b.before.title && history.body === b.before.body;
}

/** A stale refresh requires the bound description and revision, including when an edit restored the same text. */
export async function historyBeforeWrite(store: Store, execute: Execute, b: Binding): Promise<void> {
    if (!b.staleDescription) return;
    const h = await readDescriptionHistory(store, execute, b.pr);
    if (!matchesBoundDescription(h, b) || h.revision.sha256 !== b.staleDescription.revision.sha256)
        throw new Error('The pull request description changed after its stale-description proof; it will not be refreshed');
}
