'use strict';

const conventionalCommits = {
  preset: 'conventionalcommits',
  presetConfig: {},
};

module.exports = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    [
      './scripts/semantic-release-analyzer.cjs',
      {
        ...conventionalCommits,
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          ...['build', 'chore', 'ci', 'docs', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'].map(
            (type) => ({ type, release: 'patch' }),
          ),
        ],
      },
    ],
    './scripts/semantic-release-notes.cjs',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ['@semantic-release/npm', { npmPublish: true }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'pnpm-lock.yaml'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        successCommentCondition: false,
        failCommentCondition: false,
        releasedLabels: false,
      },
    ],
  ],
};
