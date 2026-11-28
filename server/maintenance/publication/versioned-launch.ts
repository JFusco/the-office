import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { checksPolicy, editorPolicy, readerPolicy, type MaintenanceCandidateBinding, type MaintenanceLaunchPolicy } from '../../workers/maintenance-launch';

export interface VersionedLaunch { policy: MaintenanceLaunchPolicy; scratch?: string; readOnly: boolean }

/** A fresh private scratch for one editor or checks assignment, outside Office data and every checkout. */
export function allocateScratch(root = resolve(tmpdir(), 'office-maintenance')): string {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    return mkdtempSync(resolve(root, 'assignment-'));
}

/**
 * The explicit launch policy each weekly CMS stage and Brain's diagnosis runs with under the #612 contract. Content
 * and review stages read; the proposal editor edits and commits only its owned candidate; independent QA runs checks
 * against the bound candidate. New content calls pass `readOnly: true`, so the historical profile mapping stays.
 */
export function stageLaunch(stage: string, repo: string, binding?: MaintenanceCandidateBinding, browser = false, scratchRoot?: string): VersionedLaunch {
    const scratch = () => { if (!binding) throw new Error(`${stage} needs its owned candidate`); return allocateScratch(scratchRoot); };
    switch (stage) {
        case 'vendor-review': case 'proposal-issue': case 'maintenance-blocker':
            return { policy: readerPolicy(repo), readOnly: true };
        case 'proposal-plan': case 'proposal-plan-review':
            return { policy: readerPolicy(binding?.worktree ?? repo), readOnly: true };
        case 'proposal-review': case 'draft-pr':
            if (!binding) throw new Error(`${stage} needs its owned candidate`);
            return { policy: readerPolicy(binding.worktree), readOnly: true };
        case 'proposal': {
            const owned = scratch();
            return { policy: editorPolicy(binding!), scratch: owned, readOnly: false };
        }
        case 'package-verification': case 'browser-verification': {
            const owned = scratch();
            return { policy: checksPolicy(binding!, browser), scratch: owned, readOnly: false };
        }
        default:
            throw new Error(`No #612 launch policy is defined for ${stage}`);
    }
}
