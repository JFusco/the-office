/**
 * Brain maintenance guidance for dependency updates. Pin Courier (self-hosted Renovate) opens
 * Brain's bump PRs and Renovate merges them itself once checks pass (Brain AGENTS.md step 7),
 * so a merge by pin-courier[bot] is an external merge, never unverified Office work
 * (the-office#43). The CMS vendor workflow and its maintenance-merge rules stay out of Brain.
 */
export const BRAIN_DEPENDENCY_MERGES = 'Do not use the CMS vendor workflow or its maintenance-merge rules. Pin Courier (pin-courier[bot], renovate/* branches) opens Brain dependency bump PRs and Renovate merges them itself once checks pass, per Brain AGENTS.md step 7: treat such a merge as an external merge, record it as observed in the ledger, and never re-merge, revert, re-verify it as Office work or report it as unverified Office effects.';
