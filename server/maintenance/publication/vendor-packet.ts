import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';

type Execute = typeof command;
const WORKFLOW = 'vendor-doc-freshness.yml';
/** The CMS registrations a vendor finding is judged against, read from the checkout as files. */
const REGISTERED = ['sources/official-sources.json', 'sources/evidence-locators.json', 'sources.lock.json'];
const PROFILE_ROOTS = ['sources/profiles', 'profiles'];
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

function files(root: string, limit = 400): { path: string; sha256: string; bytes: number }[] {
    const found: { path: string; sha256: string; bytes: number }[] = [];
    const walk = (dir: string) => {
        for (const name of readdirSync(dir).sort()) {
            const path = resolve(dir, name), stat = lstatSync(path);
            if (stat.isSymbolicLink()) continue;
            if (stat.isDirectory()) walk(path);
            else if (stat.isFile() && found.length < limit) found.push({ path, sha256: sha256(path), bytes: stat.size });
        }
    };
    if (existsSync(root)) walk(root);
    return found;
}

const LISTED = 30, DAILY = 8;
type ListedRun = { databaseId: number; headSha: string; status: string; conclusion: string; createdAt: string; event: string };

/**
 * The evidence the weekly vendor review reads instead of fetching it (#612, FIND-020): the latest completed full
 * Vendor documentation freshness scan and the daily scans since the last completed review, downloaded by the
 * harness into the run's directory, plus the registered official sources, locators, lock and affected profiles in
 * the checkout with their digests. The confined reader can read these files; it cannot reach GitHub or the network.
 * The search for the full scan continues past the daily downloads, through every listed run, so newer daily scans
 * never hide it. What the harness could not cover is stated in `coverage`: daily scans beyond the download bound,
 * a run listing that ends inside the review interval, or no full scan found (the review blocks on missing scan
 * evidence).
 */
export async function vendorEvidencePacket(store: Store, execute: Execute, root: string, lastWeekly: string): Promise<Record<string, unknown>> {
    const { repo, repository, target } = store.project, options = { cwd: repo, timeout: 120000, readOnly: true };
    const runs = JSON.parse(await execute('gh', ['run', 'list', '--repo', repository, '--workflow', WORKFLOW, '--branch', target, '--limit', String(LISTED),
        '--json', 'databaseId,headSha,status,conclusion,createdAt,event'], options)) as ListedRun[];
    const completed = runs.filter(run => run.status === 'completed' && run.conclusion === 'success' && Number.isSafeInteger(run.databaseId) && /^[a-f0-9]{40}$/.test(run.headSha));
    const inInterval = (run: ListedRun) => !lastWeekly || run.createdAt.slice(0, 10) >= lastWeekly;
    const download = async (run: ListedRun) => {
        const directory = resolve(root, `vendor-scan-${run.databaseId}`);
        if (!existsSync(directory)) {
            mkdirSync(directory, { recursive: true, mode: 0o700 });
            await execute('gh', ['run', 'download', String(run.databaseId), '--repo', repository, '--name', `vendor-doc-freshness-${run.databaseId}`, '--dir', directory], options);
        }
        const saved = files(directory);
        return { entry: { run: run.databaseId, head: run.headSha, createdAt: run.createdAt, event: run.event, directory, files: saved },
            full: saved.some(file => relative(directory, file.path) === 'full.json' || file.path.endsWith('/full.json')) };
    };
    const scans: Record<string, unknown>[] = [], skipped: number[] = [];
    let full: Record<string, unknown> | null = null;
    for (const run of completed) {
        const daily = inInterval(run), observed = daily && scans.length < DAILY;
        if (!daily && full) break;
        // A daily scan beyond the bound is not an observation in the packet; it is still searched while no full scan is found.
        if (daily && !observed) skipped.push(run.databaseId);
        if (!observed && full) continue;
        const { entry, full: isFull } = await download(run);
        if (observed) scans.push(entry);
        if (!full && isFull) full = entry;
    }
    const gaps = [
        ...(skipped.length ? [`${skipped.length} more daily scan(s) since ${lastWeekly || 'the first listed run'} are not in the packet's observations (bound ${DAILY}): runs ${skipped.join(', ')}`] : []),
        ...(runs.length >= LISTED && runs.every(inInterval) ? [`the run listing (${LISTED} runs) ends inside the review interval; earlier daily scans since ${lastWeekly || 'the first run'} are not listed`] : []),
        ...(full ? [] : [`no completed full scan was found among the ${runs.length} listed run(s)`]),
    ];
    const head = (await execute('git', ['rev-parse', 'HEAD'], { cwd: repo, timeout: 30000, readOnly: true })).trim();
    const dirty = (await execute('git', ['status', '--porcelain=v1'], { cwd: repo, timeout: 30000, readOnly: true })).trim();
    return {
        repository, workflow: WORKFLOW, fullScan: full, scans, lastCompletedReview: lastWeekly || null,
        coverage: { complete: !gaps.length, gaps },
        checkout: { path: repo, head, dirty: !!dirty },
        registered: REGISTERED.filter(path => existsSync(resolve(repo, path))).map(path => ({ path: resolve(repo, path), sha256: sha256(resolve(repo, path)) })),
        profiles: PROFILE_ROOTS.flatMap(path => files(resolve(repo, path), 200)),
    };
}
