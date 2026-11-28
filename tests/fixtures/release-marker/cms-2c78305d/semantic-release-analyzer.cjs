'use strict';

const { filterReleaseCommits } = require('./release-commits.cjs');

async function analyzeCommits(pluginConfig, context) {
  const official = await import('@semantic-release/commit-analyzer');
  return official.analyzeCommits(pluginConfig, {
    ...context,
    commits: filterReleaseCommits(context.commits),
  });
}

module.exports = { analyzeCommits };
