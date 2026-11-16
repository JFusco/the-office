/**
 * Recoveries that only describe the Office's own view of its surroundings: whether the list of
 * open chat sessions could be read, and whether a service's status check finished. Nothing reads
 * them to decide work, so they stay with Ellis and never ask a person. A confirmed logout has
 * its own follow-up for Joe, and work that needs a complete session inventory reports its own block.
 */
export function informationalRecovery(id: string): boolean {
    return id === 'session-visibility' || id.startsWith('probe:');
}
