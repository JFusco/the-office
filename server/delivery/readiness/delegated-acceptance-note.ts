import { handsOff } from '../harness/scope';
import type { Store } from '../../store/store';

/**
 * On a hands-off project, tells the readiness review that acceptance a repository reserves for a
 * maintainer is its own to give. A repository may say that a maintainer accepts something before
 * merge (a reviewed source observation, for example); with nobody in the loop that stops every such
 * pull request for a person. Joe delegated it to the review on 2026-11-19.
 */
export function delegatedAcceptanceNote(store: Pick<Store, 'project'>): string {
    return handsOff(store)
        ? 'DELEGATED ACCEPTANCE: This is a hands-off project. Where the repository reserves an acceptance for a maintainer before merge (for example of a reviewed source or source-lock observation), Joe has delegated that acceptance to this review (Joe, 2026-11-19). Inspect the cited evidence at its recorded location and accept or reject each such item on that evidence, saying which in your result. Do not return a human hold only because a maintainer has not accepted it. A configured hold, a required human approval on the pull request and a decision the issue explicitly reserves for Joe still bind.'
        : '';
}
