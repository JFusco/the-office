import type { HandlerRules } from '../../../../server/incidents/repair/route-head';

/** What a handler's rule returns for the run it names. */
export const run = (id: string) => ({ work: { id } });

/** Handler rules that name nothing, with the ones a test sets. A real rule needs saved session evidence on disk; its own suite covers that. */
export const rules = (over: Partial<HandlerRules> = {}): HandlerRules => ({
    savedPrerequisite: () => false, savedPrerequisiteOriginal: () => { throw new Error('One exact completed original writer required'); }, implementation: () => undefined, validation: () => undefined, scopeRepair: () => undefined,
    publishedDraft: () => undefined, completedDraft: () => undefined, postConflictPreparation: () => undefined, preparation: () => undefined,
    boardPreflight: () => undefined, stoppedBaseUpdate: () => undefined, writerRestartPending: () => false, closeout: () => undefined,
    baseHandoffResolved: () => false, completedRun: () => false, continuationReview: () => undefined, ...over,
});
