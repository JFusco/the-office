import type { CECBinding } from './local-config';
import type { PromptBinding } from './project-bindings-config';

/** The prompt text and values CEC has always had, as they were written into the delivery prompt. */
export function legacyCecPrompt(cec: CECBinding): PromptBinding {
    return {
        authority: 'Joe approved the Living Dev/QA/PM plan on 2026-10-27. This selected ticket pilot authorizes focused source fixes, required tests, existing-ticket formatting with Jira Ticket Creator, meaningful Dev/QA comments, PM transitions, a draft staging PR and later removal of draft status after the team-selected verification passes. Necessary paid LOWER-ENVIRONMENT provider generations and focused retests are authorized and must be counted. Preserve existing issue-specific holds. No merge, auto-completion, deployment/retry, infrastructure/pipeline-definition/credential changes, production writes, shared-data repair or unrelated cleanup.',
        preview: 'Use trusted COS root startup scripts with unique COS_DEV_PORT, dedicated DATABASE_URL/MIGRATION_DATABASE_URL local port and worktree-local .local/pg and storage. Never reuse a foreign DB or shared test data. Follow root env manifest; inherit approved development configuration securely without printing secrets. Record candidate HEAD, origin, health and cleanup ownership. If full app/live integrations cannot start, block. Do not substitute Storybook, static HTML or screenshots of unchanged staging.',
        htmlFallback: true,
        preflightStatuses: ['In Progress', 'Code Review', 'Ready for QA', 'QA', 'In Review'],
        // A copy of the whole legacy block, so the REPOSITORY line serializes exactly as before.
        repository: structuredClone(cec),
    };
}
