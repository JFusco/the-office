import { researchConfiguration } from './research-profile';
import type { ModelRoute } from '../telemetry/model-routes';

/** Keep native exec streaming; this change deliberately introduces no App Server. */
export function codexArguments(schemaPath: string, cwd: string, readOnly: boolean, route?: Pick<ModelRoute, 'model' | 'effort'>, research = false): string[] {
    const args = ['exec', '--json', '--skip-git-repo-check', '--color', 'never', '--output-schema', schemaPath, '--cd', cwd];
    // Exactly one model and one effort, so a run never silently inherits ~/.codex/config.toml.
    if (route) args.push('--model', route.model, '-c', `model_reasoning_effort="${route.effort}"`);
    if (research) return [...args, '--sandbox', 'read-only', ...researchConfiguration()];
    return readOnly ? [...args, '--sandbox', 'read-only', '-c', 'approval_policy="on-request"', '-c', 'approvals_reviewer="auto_review"'] : [...args, '--approve-for-me'];
}
