/** What only the owner can do to get the Office going again, written so it can be followed without asking. */
export interface OwnerSteps {
    /** Why the Office is stopped, with the provider's own error when one was recorded. */
    why: string;
    /** The steps in order; `run` is the exact command to type, when a step has one. */
    steps: { text: string; run?: string }[];
    /** What shows it worked. */
    doneWhen: string;
}
