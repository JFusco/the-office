/** The board route a harness-worded metadata park moves cards along and Joe resumes it from (`server/delivery/parking/card-resume-route.ts`). */
export interface MetadataParkRoute {
    project: string;
    field: string;
    /** The pickup lane, by its exact board name and option: the lane the instruction names. */
    pickup: { name: string; option: string };
    block: { id: string; name: string };
    /** The one In review lane a fresh review moves the issue card to. */
    review: { id: string; name: string };
    /** The issue's one card, and every card of the linked pull request. */
    issue: string;
    prs: string[];
    /** The account whose assignment the poll reads (`readAssignments`). */
    assignee: string;
}

/**
 * What a harness-worded metadata park was decided on and where its cards go, saved once before any provider
 * write (`server/delivery/parking/record-metadata-park.ts`). Parks saved before it existed have none.
 */
export interface MetadataParkBinding {
    /** Index of the saved `lead-pr` step, and a digest of its result. */
    step: number;
    resultSha256: string;
    /** The human delivery inputs the review read. */
    inputSha256: string;
    /** The pull request the review read, with a digest of its title and body. */
    pr: { number: number; url: string; head: string; branch: string; contentSha256: string };
    route: MetadataParkRoute;
    /** `job.boardUpdates.length` when the park was recorded: only the updates after it are this park's. */
    boardStart: number;
    /** Cards that already read in Block when the park first read the board: where they were, not a move by the Office. */
    observed: string[];
    /** Every required card, read back in Block before the decision comment was first sent. */
    verified?: { items: string[]; at: string };
}
