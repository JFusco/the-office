import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import type { Feature, FeatureBaseline } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { digest, featureRoot } from './documents';
import { targetObservation } from './target-observation';
export class SourceChanged extends Error {}
export function scopePaths(paths: string[]): string[] {
    if (!paths.length || paths.some(p => !p || p.startsWith('/') || p.split('/').some(part => part === '..' || part === '.git') || p.includes('\0')))
        throw new Error('Planning scope must contain repository-relative files');
    return [...new Set([...paths, 'AGENTS.md', 'CLAUDE.md', ...paths.flatMap(p => p.split('/').slice(0, -1).flatMap((_, i) => ['AGENTS.md','CLAUDE.md'].map(name => p.split('/').slice(0, i + 1).join('/') + '/' + name)))])].sort();
}
async function tree(repo: string, sha: string, execute: typeof command) {
    const raw = await execute('git', ['ls-tree', '-rz', '--full-tree', sha], { cwd: repo, readOnly: true });
    const files: FeatureBaseline['files'] = {};
    for (const row of raw.split('\0').filter(Boolean)) {
        const match = /^(\d+) (blob|commit) ([a-f0-9]+)\t([\s\S]+)$/.exec(row);
        if (!match || match[2] !== 'blob') throw new Error('Planning baseline includes an unsupported tree entry');
        files[match[4]] = { digest: match[3], mode: Number(match[1]) };
    }
    return files;
}
export async function prepareBaseline(store: Store, feature: Feature, execute: typeof command = command): Promise<FeatureBaseline> {
    if (feature.baseline) return feature.baseline;
    const revision = feature.revision, target = await targetObservation(store, execute);
    const path = resolve(featureRoot(store, feature), 'baselines', target.sha + '-' + randomUUID());
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    await execute('git', ['clone', '--no-hardlinks', '--no-checkout', '--', store.project.repo, path]);
    await execute('git', ['fetch', '--no-tags', '--', target.remote, target.sha], { cwd: path });
    const files = await tree(path, target.sha, execute);
    for (const [name, file] of Object.entries(files)) if (file.mode === 120000) {
        const link = (await execute('git', ['cat-file', '-p', file.digest], { cwd: path, readOnly: true })).trimEnd();
        if (!resolve(dirname(resolve(path, name)), link).startsWith(path + sep)) throw new Error('Source symlink escapes the isolated planning baseline');
    }
    await execute('git', ['checkout', '--detach', target.sha], { cwd: path });
    const baseline = { repository: store.project.repository, remote: target.remote, ref: store.project.target, sha: target.sha, path, files, scope: [] };
    store.transaction(() => { if (feature.revision !== revision) throw new Error('Feature changed while its baseline was being prepared'); feature.baseline = baseline; });
    return baseline;
}
export async function compareBaseline(store: Store, baseline: FeatureBaseline, execute: typeof command = command) {
    if (!baseline.scope.length) throw new Error('Relevant source scope has not been recorded');
    const target = await targetObservation(store, execute);
    if (baseline.remote && target.remote !== baseline.remote) throw new SourceChanged('Configured source remote changed');
    await execute('git', ['fetch', '--no-tags', '--', target.remote, target.sha], { cwd: baseline.path });
    const current = await tree(baseline.path, target.sha, execute), paths = scopePaths(baseline.scope);
    if (paths.some(path => Object.keys({ ...baseline.files, ...current }).some(file => file.startsWith(path + '/'))))
        throw new Error('Planning scope must name files, not directories');
    const evidence = paths.map(path => ({ path, before: baseline.files[path] || null, after: current[path] || null }));
    if (evidence.some(e => JSON.stringify(e.before) !== JSON.stringify(e.after))) throw new SourceChanged('Relevant source or instructions changed; create a new planning baseline');
    return { observedSha: target.sha, comparisonDigest: digest(evidence) };
}
