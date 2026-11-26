/**
 * The monitor's open-PR inventory queries and their page sizes, the issue 533 gate's trial sizes, fixed here and
 * timed with these exact strings before the gate passes. A root page reads
 * up to `PR_PAGE` open PRs, newest created first, each with its first `REVIEW_PAGE` reviews and, on its last commit,
 * the head's statuses and its first `SUITE_PAGE` check suites with up to `RUN_PAGE` LATEST runs each. A child request
 * reads one head by OID (its statuses and first suite page), continues one head's suites by OID `SUITE_PAGE` at a time,
 * or continues one PR's reviews or one suite's LATEST runs by suite ID, `CHILD_PAGE` at a time. Every query selects `rateLimit`, so each response
 * states its own cost and balance. GitHub's node limit is 500,000 per query.
 */
export const PR_PAGE = 10, REVIEW_PAGE = 10, SUITE_PAGE = 10, RUN_PAGE = 50, CHILD_PAGE = 50;
export const NODE_LIMIT = 500_000;
/** REST's ref-level check runs cover a head's most recent 1,000 suites; past that no equivalent cursor slice is known. */
export const MAX_SUITES = 1000;
/** The most nodes a root page can ask for: each PR, its reviews, its one commit, and that commit's suites with their runs. */
export const rootNodes = PR_PAGE * (1 + REVIEW_PAGE + 1 + SUITE_PAGE * (1 + RUN_PAGE));

const RATE = 'rateLimit{cost limit used remaining resetAt}';
const REVIEWS = 'totalCount pageInfo{hasNextPage endCursor} nodes{id state author{__typename login} commit{oid}}';
const RUNS = 'totalCount pageInfo{hasNextPage endCursor} nodes{id databaseId name status conclusion permalink}';
const STATUS = 'status{contexts{id context state targetUrl createdAt}}';
/** A suite page: each suite's own commit and the first page of its LATEST runs, the selection REST's `filter=latest` makes. */
const suites = (first: number, after = '') => `checkSuites(first:${first}${after}){totalCount pageInfo{hasNextPage endCursor} nodes{id commit{oid} checkRuns(first:${RUN_PAGE},filterBy:{checkType:LATEST}){${RUNS}}}}`;

export const ROOT_QUERY = `query($owner:String!,$name:String!,$after:String){${RATE} repository(owner:$owner,name:$name){nameWithOwner pullRequests(states:[OPEN],first:${PR_PAGE},after:$after,orderBy:{field:CREATED_AT,direction:DESC}){totalCount pageInfo{hasNextPage endCursor} nodes{id number title url state isDraft body mergeable headRefOid baseRefName mergedAt author{__typename login} baseRepository{nameWithOwner} reviews(first:${REVIEW_PAGE}){${REVIEWS}} commits(last:1){nodes{commit{oid ${STATUS} ${suites(SUITE_PAGE)}}}}}}}}`;
export const REVIEWS_QUERY = `query($owner:String!,$name:String!,$number:Int!,$after:String!){${RATE} repository(owner:$owner,name:$name){nameWithOwner pullRequest(number:$number){number headRefOid reviews(first:${CHILD_PAGE},after:$after){${REVIEWS}}}}}`;
/** The head read by its captured OID when the root page lists no commit, or another one: a fork's or a deleted ref's head included. */
export const HEAD_QUERY = `query($owner:String!,$name:String!,$oid:GitObjectID!){${RATE} repository(owner:$owner,name:$name){nameWithOwner object(oid:$oid){__typename ... on Commit{oid ${STATUS} ${suites(SUITE_PAGE)}}}}}`;
/** By commit OID, never by ref: every suite page belongs to the head the root page captured. */
export const SUITES_QUERY = `query($owner:String!,$name:String!,$oid:GitObjectID!,$suiteAfter:String){${RATE} repository(owner:$owner,name:$name){nameWithOwner object(oid:$oid){__typename ... on Commit{oid ${suites(SUITE_PAGE, ',after:$suiteAfter')}}}}}`;
/** By suite node ID, with the suite's own commit and repository to check against the captured head. */
export const RUNS_QUERY = `query($id:ID!,$runAfter:String){${RATE} node(id:$id){__typename ... on CheckSuite{id commit{oid} repository{nameWithOwner} checkRuns(first:${CHILD_PAGE},after:$runAfter,filterBy:{checkType:LATEST}){${RUNS}}}}}`;
