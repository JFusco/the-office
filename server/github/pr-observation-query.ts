/**
 * The monitor's open-PR inventory queries and their page sizes. A root page reads up to `PR_PAGE` open PRs, newest
 * created first, each with its first `REVIEW_PAGE` reviews and the first `CONTEXT_PAGE` check contexts of its head;
 * a child continuation reads up to `CHILD_PAGE` more of one PR's reviews or one commit's contexts. Every query
 * selects `rateLimit`, so each response states its own cost and balance. Sizes are the starting sizes the plan's
 * probe measures; GitHub's node limit is 500,000 per query.
 */
export const PR_PAGE = 20, REVIEW_PAGE = 10, CONTEXT_PAGE = 20, CHILD_PAGE = 50;
export const NODE_LIMIT = 500_000;
/** The most nodes a root page can ask for: each PR, its reviews, its one commit and that commit's contexts. */
export const rootNodes = PR_PAGE * (1 + REVIEW_PAGE + 1 + CONTEXT_PAGE);

const RATE = 'rateLimit{cost limit used remaining resetAt}';
const REVIEWS = 'totalCount pageInfo{hasNextPage endCursor} nodes{id state author{__typename login} commit{oid}}';
const CONTEXTS = 'totalCount checkRunCount statusContextCount pageInfo{hasNextPage endCursor} nodes{__typename ... on CheckRun{id name status conclusion url} ... on StatusContext{id context state targetUrl createdAt}}';

export const ROOT_QUERY = `query($owner:String!,$name:String!,$after:String){${RATE} repository(owner:$owner,name:$name){nameWithOwner pullRequests(states:[OPEN],first:${PR_PAGE},after:$after,orderBy:{field:CREATED_AT,direction:DESC}){totalCount pageInfo{hasNextPage endCursor} nodes{id number title url state isDraft body mergeable headRefOid baseRefName mergedAt author{__typename login} baseRepository{nameWithOwner} reviews(first:${REVIEW_PAGE}){${REVIEWS}} commits(last:1){nodes{commit{oid statusCheckRollup{contexts(first:${CONTEXT_PAGE}){${CONTEXTS}}}}}}}}}}`;
export const REVIEWS_QUERY = `query($owner:String!,$name:String!,$number:Int!,$after:String!){${RATE} repository(owner:$owner,name:$name){nameWithOwner pullRequest(number:$number){number headRefOid reviews(first:${CHILD_PAGE},after:$after){${REVIEWS}}}}}`;
/** By commit OID, never by ref: every page belongs to the head the root page captured, a deleted ref included. */
export const CONTEXTS_QUERY = `query($owner:String!,$name:String!,$oid:GitObjectID!,$after:String){${RATE} repository(owner:$owner,name:$name){nameWithOwner object(oid:$oid){__typename ... on Commit{oid statusCheckRollup{contexts(first:${CHILD_PAGE},after:$after){${CONTEXTS}}}}}}}`;
