import { digest } from '../../store/readback-evidence';
import { isSha, type Git } from './original-git';
import { RELEASE_MARKER } from './release-marker-refusal';
import { indeterminate } from './release-marker-stop';
import { ANALYZER_FILTERS_COMMITS, FILTER_DROPS_MARKED, RELEASE_ANALYZER_PATH } from './release-wiring';

const CONFIG = '.releaserc.cjs', ANALYZER = 'scripts/semantic-release-analyzer.cjs', FILTER = 'scripts/release-commits.cjs';
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The analyzer is the first plugin semantic-release runs, in place of the official commit analyzer. */
const SELECTS_ANALYZER = new RegExp(`plugins\\s*:\\s*\\[\\s*\\[\\s*['"]${escape(RELEASE_ANALYZER_PATH)}['"]`);
/** The filter the analyzer applies is the one imported from the committed filter module. */
const IMPORTS_FILTER = /const\s*\{\s*filterReleaseCommits\s*\}\s*=\s*require\(\s*['"]\.\/release-commits\.cjs['"]\s*\)\s*;?/;
const EXPORTS_ANALYZER = /module\.exports\s*=\s*\{\s*analyzeCommits\s*\}/;
const EXPORTS_FILTER = /module\.exports\s*=\s*\{\s*filterReleaseCommits\s*\}/;
/** `return` and its expression on one line: JavaScript ends a return statement at a line terminator. */
const RETURN = 'return[^\\S\\n\\r\\u2028\\u2029]+';
/** The analyzer's whole body hands the official analyzer the filtered commits, as its one active return expression. */
const ACTIVE_ANALYZER = new RegExp('async\\s+function\\s+analyzeCommits\\s*\\(\\s*pluginConfig\\s*,\\s*context\\s*\\)\\s*\\{\\s*' +
    `const\\s+official\\s*=\\s*await\\s+import\\(\\s*['"]@semantic-release/commit-analyzer['"]\\s*\\)\\s*;?\\s*` +
    `${RETURN}official\\.analyzeCommits\\(\\s*pluginConfig\\s*,\\s*\\{\\s*\\.\\.\\.context\\s*,\\s*${escape(ANALYZER_FILTERS_COMMITS).replace(/ /g, '\\s*')}\\s*,?\\s*\\}\\s*\\)\\s*;?\\s*\\}`);
/** The exported filter's whole body is the reviewed predicate as its one active return expression. */
const ACTIVE_FILTER = new RegExp(`function\\s+filterReleaseCommits\\s*\\(\\s*commits\\s*=\\s*\\[\\s*\\]\\s*\\)\\s*\\{\\s*${RETURN}${escape(FILTER_DROPS_MARKED)}\\s*;?\\s*\\}`);
/**
 * Source with its comments removed; a string holding comment markers no longer matches and is treated as unknown. A
 * block comment spanning lines leaves a line break, as it does for JavaScript's return rule.
 */
const active = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, comment => /[\n\r\u2028\u2029]/.test(comment) ? '\n' : ' ').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
const count = (code: string, pattern: RegExp) => (code.match(pattern) ?? []).length;

/** What the target's release wiring was proven to drop, and digests of the exact files read. */
export interface ReleasePolicy { marker: string; target: string; sha256: Record<string, string> }

/**
 * Read the committed release wiring at the verified target commit, as data: nothing is required or executed. The
 * recognized shape is CMS's: `.releaserc.cjs` selects the local analyzer first and never the official analyzer
 * directly; the analyzer imports `filterReleaseCommits` from `./release-commits.cjs` and applies it to
 * `context.commits`; the filter drops a commit whose full message contains the literal marker, case-sensitively.
 * Anything else, including a marker mentioned only in a README, is unknown wiring and refuses as indeterminate.
 */
export async function readReleasePolicy(git: Git, target: string): Promise<ReleasePolicy> {
    if (!isSha(target)) throw indeterminate('the verified target commit is required to read the release policy');
    const read = async (path: string) => {
        try { return await git(['cat-file', 'blob', `${target}:${path}`]); }
        catch { throw indeterminate(`unknown release wiring: ${path} is not committed at target ${target}`); }
    };
    const [config, analyzer, filter] = [await read(CONFIG), await read(ANALYZER), await read(FILTER)];
    if (!SELECTS_ANALYZER.test(config) || config.includes('@semantic-release/commit-analyzer'))
        throw indeterminate(`unknown release wiring: ${CONFIG} at ${target} does not select ${RELEASE_ANALYZER_PATH} as its analyzer`);
    // Only the active analyzer counts: a call left in a comment is not the one semantic-release runs.
    const applied = active(analyzer);
    if (!IMPORTS_FILTER.test(applied) || !ACTIVE_ANALYZER.test(applied) || count(applied, /\bfunction\s+analyzeCommits\b/g) !== 1 ||
        count(applied, /\bfilterReleaseCommits\s*\(/g) !== 1 || !EXPORTS_ANALYZER.test(applied))
        throw indeterminate(`unknown release wiring: ${ANALYZER} at ${target} does not apply the committed filter to context.commits`);
    const code = active(filter);
    if (!ACTIVE_FILTER.test(code) || count(code, /\bfilterReleaseCommits\s*\(/g) !== 1 || !EXPORTS_FILTER.test(code))
        throw indeterminate(`unknown release wiring: ${FILTER} at ${target} does not drop the literal ${RELEASE_MARKER} from the full message`);
    return { marker: RELEASE_MARKER, target, sha256: { [CONFIG]: digest(config), [ANALYZER]: digest(analyzer), [FILTER]: digest(filter) } };
}
