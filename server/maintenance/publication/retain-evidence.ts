import { createHash } from 'node:crypto';
import { copyFileSync, lstatSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { ownedPath } from '../../store/readback-evidence';
import { publicationOf } from './publication-state';
import type { Store } from '../../store/store';
import type { MaintenanceResult, MaintenanceRun, RetainedCheck, RetainedEvidence } from '../../../src/shared';

const LIMIT = 8 * 1024 * 1024;
const inside = (path: string, root: string) => { const suffix = relative(root, path); return !!suffix && suffix !== '..' && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix); };
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

/**
 * Copies each check output a versioned editor or QA worker reported from its private scratch into the run's own
 * directory, before the step yields, and saves the mapping from each reported check to its retained path and
 * digest, bound to the worker, candidate and head. The worker's saved result is left exactly as it returned it.
 * A reported output outside the scratch, a symbolic link or anything but a bounded regular file is refused.
 */
export function retainCheckEvidence(store: Store, run: MaintenanceRun, input: { step: number; stage: string; workerId: string; issue: number; branch: string; head: string; scratch: string; checks: NonNullable<MaintenanceResult['checks']> }): RetainedEvidence {
    const scratch = realpathSync(input.scratch), root = resolve(store.dataRoot, 'runs', run.id, 'evidence', String(input.step));
    mkdirSync(root, { recursive: true, mode: 0o700 });
    ownedPath(store, root);
    const checks: RetainedCheck[] = input.checks.map((check, index) => {
        if (!isAbsolute(check.path)) throw new Error(`Check output ${check.path} is not an absolute path in the assignment's scratch`);
        const stat = lstatSync(check.path, { throwIfNoEntry: false });
        if (!stat || stat.isSymbolicLink() || !stat.isFile() || stat.size > LIMIT) throw new Error(`Check output ${check.path} is not a bounded regular file`);
        const source = realpathSync(check.path);
        if (!inside(source, scratch)) throw new Error(`Check output ${check.path} lies outside the assignment's private scratch`);
        const path = resolve(root, `${index}-${basename(source)}`);
        copyFileSync(source, path, 1 /* COPYFILE_EXCL */);
        const digest = sha256(path);
        if (digest !== sha256(source)) throw new Error(`Check output ${check.path} changed while it was retained`);
        return { kind: check.kind || 'checks', commit: check.commit, url: check.url || '', summary: check.summary, source: check.path, path, sha256: digest };
    });
    const evidence: RetainedEvidence = { step: input.step, stage: input.stage, workerId: input.workerId, issue: input.issue, branch: input.branch, head: input.head, checks };
    const saved = publicationOf(run).evidence;
    if (saved.some(entry => entry.step === input.step)) throw new Error('Check evidence for this step was already retained; reconcile the original run');
    saved.push(evidence);
    return evidence;
}

/**
 * The retained checks a versioned gate may accept for one step, all or none: every entry retained for the step must
 * still be present under the run's root, unchanged since it was copied and reported for this head, and the step's
 * evidence must be bound to this candidate. One missing, changed or other-head entry fails the whole step, so a
 * valid output can never hide a broken one; the gates' command, browser and screenshot requirements apply only to a
 * completely valid set. A historical step has no retained mapping and keeps its original path gate.
 */
export function retainedChecks(store: Store, run: MaintenanceRun, step: number, binding: { issue: number; branch: string; head: string }): RetainedCheck[] {
    const matching = run.publication?.evidence.filter(entry => entry.step === step) || [];
    if (matching.length !== 1) return [];
    const [evidence] = matching;
    if (evidence.issue !== binding.issue || evidence.branch !== binding.branch || evidence.head !== binding.head || !evidence.checks.length) return [];
    const root = resolve(store.dataRoot, 'runs', run.id, 'evidence', String(step));
    const intact = evidence.checks.every(check => {
        try {
            const stat = lstatSync(check.path);
            return stat.isFile() && !stat.isSymbolicLink() && inside(check.path, root) && check.commit === binding.head && sha256(check.path) === check.sha256;
        } catch { return false; }
    });
    return intact ? evidence.checks : [];
}
