import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { Evidence, StageResult, WorkApproach } from '../../../src/shared';
import { artifact } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import type { Execute } from './original-git';
import { originalGit } from './original-git';
import { indeterminate } from './release-marker-stop';
import type { VerifiedMapping } from './verify-reword';

/** History checks a project's corrections cannot go without; CMS pins both in its manifest (#617). */
const REQUIRED_HISTORY_CHECKS: Readonly<Record<string, readonly string[]>> = Object.freeze({ 'cms-field-vocabulary': Object.freeze(['lint:commit', 'release:preflight']) });

/** Package scripts that read commit history, so a message rewrite changes their result. */
const HISTORY_SENSITIVE: { script: string; args: (mapping: VerifiedMapping) => string[] }[] = [
    { script: 'lint:commit', args: mapping => ['--from', mapping.boundary, '--to', mapping.newHead] },
    { script: 'release:preflight', args: () => [] },
];
/** Scripts that also depend on commit history but that the harness cannot run read-only on the mapped SHA. */
const HISTORY_UNRUNNABLE = new Set(['release:dry']);

/** Manifest scripts a retained approach requires: named in its checks, and every script those run through the package manager. */
function requiredScripts(checks: readonly string[], scripts: Record<string, unknown>): Set<string> {
    const names = Object.keys(scripts).filter(name => typeof scripts[name] === 'string');
    const named = (text: string) => names.filter(name => new RegExp(`(^|[^\\w:.-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w:.-])`).test(text));
    const required = new Set<string>(), queue = checks.flatMap(named);
    while (queue.length) {
        const name = queue.shift()!;
        if (required.has(name)) continue;
        required.add(name);
        for (const run of (scripts[name] as string).matchAll(/\b(?:pnpm|npm|yarn)\s+(?:run\s+)?(?:--?[\w-]+\s+)*([\w:.-]+)/g))
            if (names.includes(run[1])) queue.push(run[1]);
    }
    return required;
}

/**
 * The checks evidence for the SHA the harness created (#617): a contained `checks` artifact bound to the confirmed new
 * HEAD. It records the refused and adopted SHAs, every original check artifact by identity and digest, the verified
 * mapping and its trees, and the marker verdict. Equal trees carry the original content checks forward with their
 * original SHA and provenance; every history-sensitive script the committed manifest declares runs fresh on the new
 * HEAD through the candidate's own runner. A check the retained approach requires whose result depends on history and
 * that the harness cannot run fresh is never carried forward: the correction stops. A missing original or a failed
 * check stops with the mapped checkout and pending record kept for reconciliation.
 */
export async function correctionChecks(store: Store, execute: Execute, root: string, pending: ReleaseMarkerReturn, original: StageResult,
    mapping: VerifiedMapping, verdict: { allowed: string[] }, retained?: WorkApproach | null): Promise<Evidence> {
    const stop = (diagnostic: string) => indeterminate(`required check: ${diagnostic}`, mapping.newHead, { correction: { refusedWorkId: pending.workId, refusedHead: mapping.refusedHead, mappedHead: mapping.newHead } });
    const carried = original.evidence.filter(evidence => evidence.kind === 'checks' && evidence.commit === original.commit).map(evidence => {
        try { const file = artifact(store, evidence.path); return { id: evidence.id, summary: evidence.summary, commit: evidence.commit, path: file.path, sha256: file.sha256, provenance: 'carried forward: every mapped tree is identical' }; }
        catch { throw stop(`original check evidence ${evidence.path} is missing or changed`); }
    });
    if (!carried.length) throw stop('the original implementation has no exact-commit check evidence to carry forward');
    if (mapping.mapping.at(-1)?.newHead !== mapping.newHead) throw stop('the verified mapping does not end at the adopted head');
    let scripts: Record<string, unknown> = {};
    try { scripts = JSON.parse(await originalGit(execute, pending.worktree)(['cat-file', 'blob', `${mapping.newHead}:package.json`])).scripts ?? {}; }
    catch { throw stop('the committed manifest at the adopted head is unreadable'); }
    const required = Object.hasOwn(REQUIRED_HISTORY_CHECKS, store.project.id) ? REQUIRED_HISTORY_CHECKS[store.project.id] : [];
    for (const script of required)
        if (typeof scripts[script] !== 'string' || !(scripts[script] as string).trim()) throw stop(`${script} is required for this project's corrections and is missing or unusable at ${mapping.newHead}`);
    // The approach the corrected head is accepted under: the retained implementation's own, else the job's.
    const uncredited = [...requiredScripts((original.approach ?? retained)?.checks ?? [], scripts)].filter(script => HISTORY_UNRUNNABLE.has(script));
    if (uncredited.length)
        throw stop(`${uncredited.join(', ')} depends on commit history and is required by the retained approach; its result at ${mapping.refusedHead} is not carried forward and the harness cannot run it on ${mapping.newHead}`);
    const fresh: { script: string; args: string[]; output: string }[] = [];
    for (const check of HISTORY_SENSITIVE.filter(item => typeof scripts[item.script] === 'string')) {
        const args = ['run', '--silent', check.script, ...check.args(mapping)];
        try { fresh.push({ script: check.script, args, output: (await execute('pnpm', args, { cwd: pending.worktree, timeout: 5 * 60000, readOnly: true })).slice(-8000) }); }
        catch (error) { throw stop(`${check.script} failed on ${mapping.newHead}: ${String(error).slice(0, 300)}`); }
    }
    const path = resolve(root, `release-marker-checks-${mapping.newHead}-${randomUUID()}.json`), at = store.clock.now().toISOString();
    writeFileSync(path, JSON.stringify({ version: 1, kind: 'checks', refusedHead: mapping.refusedHead, adoptedHead: mapping.newHead, boundary: mapping.boundary,
        mapping: mapping.mapping, carried, fresh, verdict: { allowed: verdict.allowed, offending: [] }, at }, null, 2), { flag: 'wx', mode: 0o600 });
    return { id: `release-marker-checks:${mapping.newHead}`, kind: 'checks', summary: `Harness checks for the reworded head ${mapping.newHead}: ${fresh.map(item => item.script).join(', ') || 'no history-sensitive script'} ran fresh; content checks carried forward on identical trees.`,
        path, commit: mapping.newHead, environment: 'Office release-marker correction', url: '', observedAt: at };
}
