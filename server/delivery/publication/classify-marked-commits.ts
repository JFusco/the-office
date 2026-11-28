import { resolve } from 'node:path';
import type { ReleaseMarkerCommit } from '../../../src/contracts/release-marker';
import type { Store } from '../../store/store';
import { packInventory, resolveNpm, type Inventory } from './npm-inventory';
import { originalGit, type Execute, type WalkedCommit } from './original-git';
import { commitChanges, packageImpact } from './package-impact';
import { readReleasePolicy } from './release-marker-policy';
import { packagePaths } from './release-marker-paths';
import { indeterminate, ReleaseMarkerRefusal } from './release-marker-stop';
import { exportSnapshot, withMarkerScratch } from './shipped-paths';

/** Each marked commit's verdict. `indeterminate` is the first commit the Office could not decide. */
export interface Classification { allowed: string[]; offending: ReleaseMarkerCommit[]; indeterminate?: ReleaseMarkerRefusal }

export interface ClassifyInput {
    store: Pick<Store, 'dataRoot' | 'project'>;
    execute: Execute;
    jobId: string;
    worktree: string;
    /** The verified target commit whose release wiring decides what the marker means. */
    target: string;
    marked: WalkedCommit[];
    /** The Node the Office runs; npm is resolved beside it. */
    node?: string;
}

/**
 * Judge every marked commit on its own against its first parent: a later revert never erases an earlier package change.
 * The release policy is read at the verified target, never the candidate. Each required revision is exported and packed
 * once in private scratch, with lifecycle scripts disabled and nothing installed; the scratch is removed on every exit.
 */
export async function classifyMarkedCommits(input: ClassifyInput): Promise<Classification> {
    const { store, execute, jobId, worktree, marked } = input, git = originalGit(execute, worktree);
    await readReleasePolicy(git, input.target);
    const paths = packagePaths(store.project.id);
    return withMarkerScratch(store, jobId, async scratch => {
        const tool = await resolveNpm(execute, scratch, input.node);
        const packed = new Map<string, Promise<Inventory>>();
        const inventory = (revision: string) => {
            let saved = packed.get(revision);
            if (!saved) {
                const dir = resolve(scratch, `rev-${revision}`);
                saved = exportSnapshot(git, revision, dir, resolve(scratch, `index-${revision}`)).then(() => packInventory(execute, tool, dir, scratch, revision));
                packed.set(revision, saved);
            }
            return saved;
        };
        const result: Classification = { allowed: [], offending: [] };
        for (const commit of marked) {
            try {
                const parent = commit.parents[0];
                if (!parent) throw indeterminate(`incomplete coverage: marked commit ${commit.sha} has no parent to compare with`, commit.sha);
                const changes = await commitChanges(git, parent, commit.sha);
                const impact = packageImpact(changes, { parent: await inventory(parent), commit: await inventory(commit.sha) }, paths);
                if (impact.kind === 'package-change') result.offending.push({ sha: commit.sha, paths: impact.paths, inventoryPaths: impact.inventoryPaths });
                else if (impact.kind === 'unclassified') throw indeterminate(`unclassified paths in ${commit.sha}: ${impact.paths.slice(0, 8).join(', ')}`, commit.sha, { paths: impact.paths });
                else result.allowed.push(commit.sha);
            } catch (error) {
                if (!(error instanceof ReleaseMarkerRefusal)) throw indeterminate(`tool failure while classifying ${commit.sha}: ${String(error).slice(0, 300)}`, commit.sha);
                // A tool or coverage failure stops every later commit too; nothing after it is decided.
                if (!error.evidence.commit || /^(?:tool|unsupported)/.test(error.evidence.diagnostic ?? '')) { result.indeterminate = error; break; }
                result.indeterminate ??= error;
            }
        }
        return result;
    });
}
