/** What only the owner can do to get the Office going again, written so it can be followed without asking. */
export interface OwnerSteps {
    /** Why the Office is stopped, in the Office's own words. */
    why: string;
    /** The provider's own error, when one was recorded: secrets removed, one line. It can differ from one check to the next. */
    providerSaid?: string;
    /** The steps in order; `run` is the exact command to type, when a step has one. */
    steps: { text: string; run?: string }[];
    /** What shows it worked. */
    doneWhen: string;
}
