/**
 * The CMS release-suppression wiring the Office recognizes, as committed text. Both the stopped-base package
 * instruction (`recovery/stopped-base-package.ts`) and the release-marker policy read
 * (`release-marker-policy.ts`) look for exactly these; neither executes the files.
 */
export const RELEASE_ANALYZER_PATH = './scripts/semantic-release-analyzer.cjs';
/** The analyzer hands only filtered commits to the official commit analyzer. */
export const ANALYZER_FILTERS_COMMITS = 'commits: filterReleaseCommits(context.commits)';
/** The filter drops a commit whose complete message contains the marker, case-sensitively. */
export const FILTER_DROPS_MARKED = "commits.filter(commit => !String(commit.message || '').includes('[skip release]'))";
