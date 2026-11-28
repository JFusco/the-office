'use strict';

/** A marker anywhere in the complete message excludes this commit from release work. */
function filterReleaseCommits(commits = []) {
  return commits.filter(commit => !String(commit.message || '').includes('[skip release]'));
}

module.exports = { filterReleaseCommits };
