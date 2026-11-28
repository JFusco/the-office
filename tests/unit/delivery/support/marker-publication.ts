import { execFileSync } from 'node:child_process';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { command } from '../../../../server/workers/process';
import { fakeGitHub } from './fake-github';
import { cmsPolicy, simulatedPack } from './marker-repo';

/** Git that stays local. Remote, push and fetch go to the synthetic provider; everything else runs against the real worktree. */
const PROVIDER_GIT = new Set(['remote', 'ls-remote', 'push', 'fetch']);
/** The service's npm, as the release-marker check resolves it beside the running Node. */
export const SERVICE_NPM = () => realpathSync(resolve(dirname(process.execPath), 'npm'));

const BASE_FILES = () => ({ ...cmsPolicy(), 'README.md': 'readme\n', 'OPERATING.md': 'operating\n', LICENSE: 'MIT\n', 'CHANGELOG.md': '# Changelog\n', 'SECURITY.md': 'security\n',
    'bin/cms-field-vocabulary.mjs': 'export {};\n', 'wiki/index.md': 'wiki\n', 'scripts/wiki/graph/data/graph.json': '{}\n' });

/**
 * A hands-off CMS candidate whose worktree is a real Git repository, published through the synthetic GitHub. The
 * remote target starts at the repository's base commit. `npm` answers the service npm with a model of npm's selection.
 */
export function markedPublication(options: { pack?: (cwd: string) => string; onDisk?: boolean } = {}) {
    const f = fakeGitHub(5, { onDisk: options.onDisk }), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'docs(wiki): reconcile', body: '## Summary\nReconcile.\n## Linked issue\nCloses #5\n' }));
    const worktree = job.worktree, env = { ...process.env, GIT_AUTHOR_NAME: 'Office Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Office Test', GIT_COMMITTER_EMAIL: 'test@example.com', GIT_CONFIG_NOSYSTEM: '1' };
    const git = (args: string[]) => execFileSync('git', args, { cwd: worktree, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    let tick = 0;
    const commit = (files: Record<string, string | null>, message: string) => {
        for (const [path, content] of Object.entries(files)) {
            const full = resolve(worktree, path);
            if (content === null) execFileSync('rm', ['-f', full]); else { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, content); }
        }
        git(['add', '-A']);
        const date = `2026-11-20T11:${String(++tick).padStart(2, '0')}:00Z`;
        execFileSync('git', ['commit', '-q', '--allow-empty', '-m', message], { cwd: worktree, env: { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
        return git(['rev-parse', 'HEAD']).trim();
    };
    git(['init', '-q', '-b', 'main']);
    git(['config', 'commit.gpgsign', 'false']);
    const base = commit(BASE_FILES(), 'chore(repo): base');
    git(['checkout', '-q', '-b', job.branch]);
    /** Make `head` the reviewed candidate the job publishes. */
    const at = (head: string) => { job.head = head; Object.assign(f.state.local, { head, branch: job.branch }); };
    Object.assign(job, { candidateBase: base });
    f.state.targetTip = base;
    const npm: { args: string[]; cwd: string }[] = [], local: string[][] = [], provider: string[] = [];
    let cli: string | undefined;
    try { cli = SERVICE_NPM(); } catch { cli = undefined; }
    const execute = async (program: string, args: string[], opts: any = {}): Promise<string> => {
        if (program === process.execPath && args[0] === cli) {
            npm.push({ args, cwd: opts.cwd });
            return args[1] === '--version' ? '11.9.0\n' : (options.pack ?? simulatedPack)(opts.cwd);
        }
        if (program === 'git' && !PROVIDER_GIT.has(args[0]) && opts.cwd && resolve(opts.cwd).startsWith(resolve(worktree))) { local.push(args); return command(program, args, opts); }
        provider.push(`${program} ${args.join(' ')}`);
        return f.execute(program, args, opts);
    };
    return { ...f, job, root, worktree, git, commit, base, at, execute, npm, local, provider };
}
